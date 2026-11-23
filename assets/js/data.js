/* MVB – Daten: Liniennetz (data/network.json), Haltestellensuche, Routenberechnung,
   Neuigkeiten & Baustellen (live von mvbnet.de), Stellenangebote, Störungsmeldungen. */
(function (M) {
  'use strict';

  /* =====================================================================
     Liniennetz
     ===================================================================== */
  let netP = null;
  M.Net = {
    data: null,
    load() {
      if (!netP) {
        netP = M.getJSON('data/network.json', { timeout: 20000 }).then((d) => {
          d.lines.forEach((l) => {
            l.line = { name: l.name, mode: l.mode };
            l.variants.forEach((v) => { if (!v.geo || v.geo.length < 2) v.geo = v.stops.map((id) => [d.stations[id].lo, d.stations[id].la]); });
          });
          // Linien je Haltestelle
          d.byStation = {};
          d.lines.forEach((l) => l.variants.forEach((v) => v.stops.forEach((id) => {
            const a = d.byStation[id] || (d.byStation[id] = []);
            if (!a.includes(l)) a.push(l);
          })));
          // Haltestellen mit gleichem Namen (z. B. „S-Bahnhof Neustadt (Tram)“ und „(Bus)“) gehören zusammen
          d.baseName = (n) => String(n).replace(/\s*\((Tram|Bus|Tram\/Bus|Ersatzhalt|Straßenbahn)\)\s*$/i, '').trim();
          this.data = d;
          return d;
        }).catch((e) => { netP = null; throw e; });
      }
      return netP;
    },
    station(id) { return this.data && this.data.stations[id]; },
    linesAt(id) { return (this.data && this.data.byStation[id]) || []; },
    lineById(id) { return this.data && this.data.lines.find((l) => l.id === id); },
    findLine(name, mode) { return this.data && this.data.lines.find((l) => l.name === String(name) && (!mode || l.mode === mode)); }
  };

  /* ---------- Haltestellensuche (lokal, sofort) ---------- */
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
    .replace(/strasse\b/g, 'str').replace(/str\./g, 'str').replace(/[^a-z0-9]+/g, ' ').trim();
  M.norm = norm;
  M.searchStations = function (q, limit) {
    const d = M.Net.data;
    if (!d) return [];
    const nq = norm(q);
    if (!nq) return [];
    const words = nq.split(' ');
    const res = [];
    for (const [id, s] of Object.entries(d.stations)) {
      const nn = norm(s.n);
      if (!words.every((w) => nn.includes(w))) continue;
      let score = nn.startsWith(nq) ? 0 : nn.split(' ').some((w) => w.startsWith(words[0])) ? 1 : 2;
      score += nn.length / 100;
      res.push({ id, name: s.n, lat: s.la, lon: s.lo, score });
    }
    return res.sort((a, b) => a.score - b.score).slice(0, limit || 10);
  };

  /* =====================================================================
     Routenberechnung (schnellster Weg mit Umstiegen und Fußwegen)
     ===================================================================== */
  const WALK_MAX = 420;          // m: Umstieg zu Fuß zwischen nahen Haltestellen
  const WALK_SPEED = 75;         // m/Min.
  const XFER = 3;                // Min. Zuschlag pro Umstieg (Wartezeit/Puffer)
  let graph = null;
  function buildGraph(d) {
    const adj = {};
    const add = (a, e) => (adj[a] || (adj[a] = [])).push(e);
    d.lines.forEach((l) => l.variants.forEach((v, vi) => {
      for (let i = 0; i < v.stops.length - 1; i++) {
        const dt = Math.max(1, (v.times[i + 1] || 0) - (v.times[i] || 0));
        add(v.stops[i], { to: v.stops[i + 1], line: l.id, vi, i, t: dt });
      }
    }));
    const ids = Object.keys(d.stations);
    for (let i = 0; i < ids.length; i++) {
      const a = d.stations[ids[i]];
      for (let j = i + 1; j < ids.length; j++) {
        const b = d.stations[ids[j]];
        if (Math.abs(a.la - b.la) > 0.005 || Math.abs(a.lo - b.lo) > 0.008) continue;
        const m = M.dist(a.la, a.lo, b.la, b.lo);
        if (m > WALK_MAX) continue;
        const t = Math.max(1, Math.round(m * 1.25 / WALK_SPEED));
        add(ids[i], { to: ids[j], walk: true, t, m: Math.round(m * 1.25) });
        add(ids[j], { to: ids[i], walk: true, t, m: Math.round(m * 1.25) });
      }
    }
    return adj;
  }
  /** Kleine Prioritätswarteschlange */
  function Heap() { this.a = []; }
  Heap.prototype.push = function (x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].c <= a[i].c) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } };
  Heap.prototype.pop = function () { const a = this.a; const top = a[0]; const last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l].c < a[m].c) m = l; if (r < a.length && a[r].c < a[m].c) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; };

  /**
   * Schnellster Weg von Haltestelle A nach B.
   * o.modes: ['tram','bus'] erlaubt; o.night: Nachtlinien zulassen; o.block: Set gesperrter Kanten „a>b“
   * Ergebnis: { total, legs: [ { type:'ride', line, from, to, stops:[ids], vi, t } | { type:'walk', from, to, t, m } ] }
   */
  M.route = function (fromId, toId, o) {
    o = o || {};
    const d = M.Net.data;
    if (!d || !fromId || !toId || fromId === toId) return null;
    if (!graph) graph = buildGraph(d);
    const modes = o.modes || ['tram', 'bus'];
    const night = !!o.night;
    const allowed = (lid) => {
      const l = M.Net.lineById(lid);
      if (!l || !modes.includes(l.mode)) return false;
      return night ? true : !M.isNight(l.name);
    };
    const key = (s, l) => s + '|' + (l || '');
    const best = new Map(), prev = new Map();
    const h = new Heap();
    h.push({ c: 0, s: fromId, l: null, k: key(fromId, null) });
    best.set(key(fromId, null), 0);
    let goal = null;
    while (h.a.length) {
      const cur = h.pop();
      if (cur.c > (best.get(cur.k) ?? Infinity)) continue;
      if (cur.s === toId) { goal = cur; break; }
      for (const e of graph[cur.s] || []) {
        if (o.block && o.block.has(cur.s + '>' + e.to)) continue;
        let c, l;
        if (e.walk) {
          if (cur.l === 'walk') continue; // nicht zweimal hintereinander laufen
          c = cur.c + e.t + (cur.l ? 1 : 0); l = 'walk';
        } else {
          if (!allowed(e.line)) continue;
          const board = cur.l !== e.line;
          c = cur.c + e.t + (board ? (cur.l && cur.l !== 'walk' ? XFER + 1 : cur.l === 'walk' ? XFER : 0) : 0);
          l = e.line;
        }
        const k = key(e.to, l);
        if (c < (best.get(k) ?? Infinity)) { best.set(k, c); prev.set(k, { k: cur.k, e, s: cur.s }); h.push({ c, s: e.to, l, k }); }
      }
    }
    if (!goal) return null;
    // Weg zurückverfolgen
    const steps = [];
    let k = goal.k;
    while (prev.has(k)) { const p = prev.get(k); steps.unshift({ from: p.s, e: p.e }); k = p.k; }
    const legs = [];
    steps.forEach((st) => {
      const last = legs[legs.length - 1];
      if (st.e.walk) { legs.push({ type: 'walk', from: st.from, to: st.e.to, t: st.e.t, m: st.e.m }); return; }
      if (last && last.type === 'ride' && last.lineId === st.e.line) {
        last.to = st.e.to; last.stops.push(st.e.to); last.t += st.e.t; last.segs.push({ vi: st.e.vi, i: st.e.i });
      } else {
        const L = M.Net.lineById(st.e.line);
        legs.push({ type: 'ride', lineId: st.e.line, line: L.line, from: st.from, to: st.e.to, stops: [st.from, st.e.to], t: st.e.t, vi: st.e.vi, segs: [{ vi: st.e.vi, i: st.e.i }] });
      }
    });
    legs.forEach((lg) => {
      if (lg.type !== 'ride') return;
      const L = M.Net.lineById(lg.lineId);
      const v = L.variants[lg.vi];
      lg.headsign = v.to;
      // Richtung: Endhalt der benutzten Variante
      const vs = lg.segs.map((s) => s.vi);
      lg.vi = vs.sort((a, b) => vs.filter((x) => x === b).length - vs.filter((x) => x === a).length)[0];
      lg.headsign = L.variants[lg.vi].to;
    });
    const rides = legs.filter((l) => l.type === 'ride');
    return { total: Math.round(goal.c), legs, transfers: Math.max(0, rides.length - 1) };
  };

  /** Teilstück einer Variante (Geometrie) zwischen zwei Haltestellen */
  M.slice = function (lineId, vi, fromId, toId) {
    const L = M.Net.lineById(lineId);
    const v = L && L.variants[vi];
    const a = M.Net.station(fromId), b = M.Net.station(toId);
    if (!v || !a || !b) return [];
    const near = (pt, from) => { let bi = from || 0, bd = Infinity; for (let i = from || 0; i < v.geo.length; i++) { const dd = (v.geo[i][0] - pt.lo) ** 2 + (v.geo[i][1] - pt.la) ** 2; if (dd < bd) { bd = dd; bi = i; } } return bi; };
    const i1 = near(a), i2 = near(b, i1);
    const seg = v.geo.slice(i1, i2 + 1);
    seg.unshift([a.lo, a.la]); seg.push([b.lo, b.la]);
    return seg;
  };

  /** Geometrie einer Fahrt aus der Routenberechnung (Abschnitt für Abschnitt, auch über Varianten hinweg) */
  M.legCoords = function (lg) {
    if (lg.type !== 'ride') { const a = M.Net.station(lg.from), b = M.Net.station(lg.to); return [[a.lo, a.la], [b.lo, b.la]]; }
    const L = M.Net.lineById(lg.lineId);
    const out = [];
    // gleiche Variante zusammenhängend schneiden (genauer und schneller)
    let i = 0;
    while (i < lg.segs.length) {
      const vi = lg.segs[i].vi; let j = i;
      while (j + 1 < lg.segs.length && lg.segs[j + 1].vi === vi && lg.segs[j + 1].i === lg.segs[j].i + 1) j++;
      const v = L.variants[vi];
      out.push(...M.slice(lg.lineId, vi, v.stops[lg.segs[i].i], v.stops[lg.segs[j].i + 1]));
      i = j + 1;
    }
    return out;
  };

  /* =====================================================================
     Neuigkeiten & Baustellen (WordPress der MVB)
     ===================================================================== */
  const C = () => M.CONFIG;
  function nPost(p) {
    const media = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
    const img = media && (media.media_details && media.media_details.sizes && (media.media_details.sizes.medium_large || media.media_details.sizes.large || media.media_details.sizes.medium) || {}).source_url || (media && media.source_url) || '';
    const title = M.decodeHtml(M.stripHtml(p.title && p.title.rendered));
    const text = M.stripHtml(p.content && p.content.rendered);
    return {
      id: p.id, slug: p.slug, date: p.date, modified: p.modified, link: p.link, title,
      excerpt: M.stripHtml(p.excerpt && p.excerpt.rendered).replace(/\s*\[…\]|\s*\[&hellip;\]/g, ' …'),
      html: (p.content && p.content.rendered) || '', text, img, cats: p.categories || []
    };
  }
  let newsP = null, newsT = 0;
  M.News = {
    list: [], src: '',
    async load(force) {
      if (newsP && !force && Date.now() - newsT < C().refreshNewsMs) return newsP;
      newsT = Date.now();
      newsP = (async () => {
        try {
          const raw = await M.getJSON(C().wpBase + '/posts?' + M.qs({ per_page: 40, _embed: 'wp:featuredmedia', _fields: 'id,slug,date,modified,link,title,excerpt,content,categories,_links,_embedded' }), { timeout: 12000 });
          this.list = raw.map(nPost); this.src = 'live';
        } catch (e) {
          const snap = await M.getJSON('data/news.json', { timeout: 10000 }).catch(() => null);
          this.list = snap && snap.posts ? snap.posts : []; this.src = snap ? 'snapshot ' + (snap.generated || '') : 'none';
        }
        this.list.forEach((n) => { n.lines = M.linesInText(n.title + ' ' + n.text); n.kind = M.kindOf(n); });
        M.emit('news', this.list);
        return this.list;
      })();
      return newsP;
    },
    async get(idOrSlug) {
      await this.load();
      let n = this.list.find((x) => String(x.id) === String(idOrSlug) || x.slug === idOrSlug);
      if (n) return n;
      try {
        const raw = await M.getJSON(C().wpBase + '/posts?' + M.qs(/^\d+$/.test(idOrSlug) ? { include: idOrSlug, _embed: 'wp:featuredmedia' } : { slug: idOrSlug, _embed: 'wp:featuredmedia' }), { timeout: 12000 });
        if (raw && raw[0]) { n = nPost(raw[0]); n.lines = M.linesInText(n.title + ' ' + n.text); n.kind = M.kindOf(n); return n; }
      } catch (e) { /* nichts */ }
      return null;
    },
    isWork(n) { return n.cats.includes(C().wpCats.baustellen) || n.cats.includes(C().wpCats.verkehr) || /Umleitung|umgeleitet|Sperrung|gesperrt|Ersatzverkehr|Busse statt Bahnen|Baustelle|Bauarbeiten|Havarie/i.test(n.title); },
    isNews(n) { return !this.isWork(n); }
  };
  /** Art einer Meldung: Tags wie im BVG-Vorbild */
  M.kindOf = function (n) {
    const t = (n.title || '') + ' ' + (n.text || n.summary || '');
    const tags = [];
    if (/Ersatzverkehr|Busse statt Bahnen|\bSEV\b|Schienenersatz/i.test(t)) tags.push('sev');
    if (/Umleitung|umgeleitet|fahren veränd|Linienänderung|weichen aus/i.test(t)) tags.push('detour');
    if (/gesperrt|Sperrung|Vollsperrung|Havarie/i.test(t)) tags.push('closed');
    if (/Haltestelle verlegt|Ersatzhalt|verlegt/i.test(t)) tags.push('moved');
    if (/wieder freigegeben|fahren wieder|regulär/i.test(t)) tags.push('ok');
    return tags;
  };
  M.TAG_LABEL = { sev: ['Ersatzverkehr', 'sev'], detour: ['Umleitung', ''], closed: ['Sperrung', 'closed'], moved: ['Haltestelle verlegt', ''], ok: ['Wieder regulär', 'green'] };
  M.tagsHtml = (kinds) => (kinds || []).map((k) => '<span class="tag ' + M.TAG_LABEL[k][1] + '">' + M.TAG_LABEL[k][0] + '</span>').join('');

  /* ---------- Störungsmeldungen der MVB (INSA über den Muvit-Dienst) ---------- */
  M.Remarks = {
    async load() {
      try {
        const r = await M.getJSON(C().dienst + '/nv/remarks', { ttl: 120000, timeout: 12000 });
        return (r.remarks || []).map((x) => ({
          id: 'r' + x.id, title: x.summary || 'Hinweis', text: x.text || '', from: x.validFrom, until: x.validUntil, modified: x.modified,
          lines: M.sortLines((x.lines || []).map((l) => M.mkLine(l.name, l.product === 'tram' ? 'tram' : l.product === 'bus' ? 'bus' : null))),
          stops: (x.stops || []).map((s) => String(s).replace(/^Magdeburg,\s*/, '')), kind: M.kindOf({ title: x.summary, text: x.text }), src: 'insa'
        }));
      } catch (e) { return []; }
    }
  };

  /* =====================================================================
     Stellenangebote & Ausbildung (Seiten der MVB, live)
     ===================================================================== */
  function parsePanels(html, kind) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = [];
    doc.querySelectorAll('.panel').forEach((p) => {
      const head = p.querySelector('.panel-heading');
      const body = p.querySelector('.panel-body') || p.querySelector('.panel-collapse');
      const title = head ? head.textContent.replace(/\s+/g, ' ').trim() : '';
      if (!title || !body) return;
      body.querySelectorAll('script, style, form, iframe').forEach((x) => x.remove());
      // „Zur Onlinebewerbung“ führt hier zur eigenen Bewerbung auf dieser Seite
      body.querySelectorAll('a').forEach((a) => { if (/bewerb/i.test(a.textContent) || /smartrecruiters|bewerbung|recruit/i.test(a.href)) a.remove(); });
      const text = body.textContent.replace(/\s+/g, ' ').trim();
      const contact = (text.match(/(?:Noch Fragen\?|Bei Fragen)[^.]*?(Melanie Schlüter|Joann Apolinarski|Jessica Lücke|Elisa Kämpfe|[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+)/) || [])[1] || '';
      const phone = (text.match(/(0391[\s/\-]*[\d\s\-]{4,14}\d)/) || [])[1] || '';
      const mail = (body.innerHTML.match(/[\w.\-]+@mvbnet\.de/) || [])[0] || '';
      out.push({ slug: M.slug(title), title, kind, html: body.innerHTML, text, contact, phone, mail });
    });
    return out;
  }
  let jobsP = null;
  M.Jobs = {
    load() {
      if (jobsP) return jobsP;
      jobsP = (async () => {
        const page = async (slug) => {
          try { const r = await M.getJSON(C().wpBase + '/pages?' + M.qs({ slug, _fields: 'content' }), { timeout: 12000 }); return r && r[0] ? r[0].content.rendered : ''; } catch (e) { return ''; }
        };
        const [jobs, ausb] = await Promise.all([page('stellenangebote'), page('ausbildung')]);
        let list = [];
        if (jobs || ausb) {
          list = parsePanels(jobs, 'Stellenangebot').concat(parsePanels(ausb, 'Ausbildung').filter((j) => !/praktikum/i.test(j.title) || true));
        } else {
          const snap = await M.getJSON('data/news.json', { timeout: 10000 }).catch(() => null);
          list = (snap && snap.jobs) || [];
        }
        // doppelte Titel entfernen
        const seen = new Set();
        return list.filter((j) => { const k = j.kind + j.slug; if (seen.has(k)) return false; seen.add(k); return true; });
      })().catch(() => []);
      return jobsP;
    }
  };

  /* =====================================================================
     Störungskarte: Sperrung + Umleitung aus dem Meldungstext ableiten
     ===================================================================== */
  let overridesP = null;
  const overrides = () => (overridesP || (overridesP = M.getJSON('data/umleitungen.json', { timeout: 8000 }).catch(() => ({})))) ;
  /** Haltestellen, die im Text vorkommen (inkl. „Lübecker Straße“ ↔ „Lübecker Str.“) */
  function stationsInText(text) {
    const d = M.Net.data;
    const nt = ' ' + norm(text) + ' ';
    const found = [];
    const seenBase = new Set();
    Object.entries(d.stations).forEach(([id, s]) => {
      const base = norm(d.baseName(s.n));
      if (base.length < 5) return;
      const idx = nt.indexOf(' ' + base + ' ');
      if (idx < 0) return;
      found.push({ id, idx, base, s });
      seenBase.add(base);
    });
    return found.sort((a, b) => a.idx - b.idx);
  }
  /** Straßennamen im Text („Lübecker Straße“, „Olvenstedter Graseweg“, „Breiter Weg“) */
  function streetsInText(text) {
    const re = /([A-ZÄÖÜ][a-zäöüß\-]+(?:\s[A-ZÄÖÜ][a-zäöüß\-]+)?(?:straße|strasse|str\.|weg|allee|platz|ring|chaussee|brücke|damm|graseweg)|(?:[A-ZÄÖÜ][a-zäöüß]+er|Breiter|Großer|Neuer|Alter)\s(?:Straße|Weg|Platz|Ring|Markt|Graseweg|Chaussee|Brücke|Damm|Allee))/g;
    const out = new Set();
    let m;
    while ((m = re.exec(text))) out.add(m[1]);
    return Array.from(out);
  }
  /**
   * Plan für die Störungskarte:
   *  { lines:[lineObj], closed:[{coords, lineId}], cross:[[lon,lat]], detours:[{coords, color, label}], focus:[[lon,lat]...] }
   */
  M.disruptionPlan = async function (item) {
    const d = await M.Net.load();
    const ov = await overrides();
    const key = item.slug || item.id;
    const text = (item.title || '') + '. ' + (item.text || '');
    const lines = (item.lines && item.lines.length ? item.lines : M.linesInText(text))
      .map((l) => M.Net.findLine(l.name, l.mode) || M.Net.findLine(l.name)).filter(Boolean);
    const plan = { lines, closed: [], cross: [], detours: [], focus: [], sev: /Ersatzverkehr|Busse statt Bahnen|\bSEV\b/i.test(text) };
    const o = ov && ov[key];
    if (o) {
      plan.manual = true;
      (o.closed || []).forEach((c) => plan.closed.push({ coords: c }));
      (o.cross || []).forEach((c) => plan.cross.push(c));
      (o.detour || o.detours || []).forEach((c) => plan.detours.push({ coords: c.coords || c, label: c.label || 'Umleitung', color: c.color || '' }));
      plan.focus = [].concat(...plan.closed.map((c) => c.coords), ...plan.detours.map((c) => c.coords));
      return plan;
    }
    const all = Object.entries(d.stations);
    const baseOf = (id) => norm(d.baseName(d.stations[id].n));
    // Haltestelle, deren Name am Anfang des Textstücks steht (längster Treffer)
    const matchAt = (frag) => {
      const ns = norm(frag);
      let best = null;
      all.forEach(([id, x]) => { const bn = norm(d.baseName(x.n)); if (bn.length >= 4 && (ns === bn || ns.startsWith(bn + ' ')) && (!best || bn.length > best.bn.length)) best = { id, bn }; });
      return best;
    };
    const sameBase = (id) => all.filter(([x]) => baseOf(x) === baseOf(id)).map(([x]) => x);
    const CLOSE_RE = /keine|nicht|gesperrt|Sperrung|unterbrochen|entfällt|entfallen|Ersatzverkehr|Busse statt|umgeleitet|Umleitung|Bauarbeiten|Havarie/i;
    // 1) „zwischen X und Y“ in Sätzen, die eine Sperrung beschreiben
    const pairs = [];
    const re = /zwischen\s+(?:den\s+Haltestellen\s+|der\s+Haltestelle\s+|dem\s+)?([^.;:!?]{3,90})/gi;
    let m;
    while ((m = re.exec(text)) && pairs.length < 2) {
      const sStart = Math.max(text.lastIndexOf('.', m.index), text.lastIndexOf('\n', m.index)) + 1;
      const sEnd = text.indexOf('.', m.index + m[0].length);
      const sentence = text.slice(sStart, sEnd < 0 ? undefined : sEnd);
      if (!CLOSE_RE.test(sentence) || /weiter als|fährt im (Norden|Süden|Westen|Osten)/i.test(sentence)) continue;
      const rest = m[1], k = rest.search(/\s+(?:und|bis)\s+/);
      if (k < 0) continue;
      const A = matchAt(rest.slice(0, k));
      const B = matchAt(rest.slice(k).replace(/^\s+(?:und|bis)\s+(?:zur\s+|zum\s+|der\s+|dem\s+)?(?:Haltestelle\s+)?/i, ''));
      if (A && B && A.bn !== B.bn) pairs.push([A.id, B.id]);
    }
    const st = [];
    const block = new Set();
    const cand = lines.length ? lines : d.lines;
    const closeBetween = (L, v, vi, a, b) => {
      if (b - a > 15 || b <= a) return;
      for (let i = a; i < b; i++) block.add(v.stops[i] + '>' + v.stops[i + 1]);
      const coords = M.slice(L.id, vi, v.stops[a], v.stops[b]);
      if (coords.length > 1) plan.closed.push({ coords, lineId: L.id, from: v.stops[a], to: v.stops[b], vi });
    };
    if (pairs.length) {
      pairs.forEach(([pa, pb]) => {
        const A = new Set(sameBase(pa)), B = new Set(sameBase(pb));
        [pa, pb].forEach((id) => st.push({ id, s: d.stations[id] }));
        cand.forEach((L) => L.variants.forEach((v, vi) => {
          const ia = v.stops.findIndex((x) => A.has(x)), ib = v.stops.findIndex((x) => B.has(x));
          if (ia < 0 || ib < 0) return;
          closeBetween(L, v, vi, Math.min(ia, ib), Math.max(ia, ib));
        }));
      });
      // Die Linie fährt laut Fahrplan schon die Umleitung: gesperrten Abschnitt direkt zwischen den Haltestellen zeichnen
      if (!plan.closed.length) pairs.forEach(([pa, pb]) => {
        const a = d.stations[pa], b = d.stations[pb];
        if (M.dist(a.la, a.lo, b.la, b.lo) > 3000) return;
        plan.closed.push({ coords: [[a.lo, a.la], [b.lo, b.la]], lineId: lines[0] ? lines[0].id : null, from: pa, to: pb, direct: true });
      });
    }
    if (!plan.closed.length) {
      // 2) Straße/Haltestellen aus Titel und erstem Absatz
      const head = (item.title || '') + '. ' + String(item.text || '').slice(0, 420);
      stationsInText(head).forEach((x) => st.push(x));
      const streets = streetsInText(head).map(norm);
      all.forEach(([id, x]) => {
        const nn = norm(x.n);
        if (streets.some((y) => y.length > 6 && (nn.includes(y) || y.includes(nn))) && !st.some((z) => z.id === id)) st.push({ id, s: x });
      });
      const ids = new Set(st.map((x) => x.id));
      const used = lines.length ? lines : d.lines.filter((l) => l.variants.some((v) => v.stops.filter((x) => ids.has(x)).length >= 2));
      used.forEach((L) => L.variants.forEach((v, vi) => {
        const idx = v.stops.map((x, i) => (ids.has(x) ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return;
        let a = idx[0], b = idx[idx.length - 1];
        if (a === b) { a = Math.max(0, a - 1); b = Math.min(v.stops.length - 1, b + 1); }
        if (b - a > 8) b = a + 8;
        closeBetween(L, v, vi, a, b);
      }));
      // 3) nur eine Straße genannt (z. B. „Brenneckestraße gesperrt“): Straße orten und den nächsten Linienabschnitt sperren
      if (!plan.closed.length && streets.length && M.Transit) {
        const names = streetsInText(head);
        for (const nm of names.slice(0, 2)) {
          const gs = (await M.Transit.geocode(nm + ', Magdeburg')).filter((x) => x.type === 'address' || x.type === 'poi').slice(0, 4);
          for (const g of gs) {
          const segDist = (p, a, b) => {
            const kx = 68000, ky = 111000;
            const ax = (a.lo - p.lon) * kx, ay = (a.la - p.lat) * ky, bx = (b.lo - p.lon) * kx, by = (b.la - p.lat) * ky;
            const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l2));
            return Math.hypot(ax + t * dx, ay + t * dy);
          };
          let hit = 0;
          (lines.length ? lines : d.lines.filter((l) => !M.isNight(l.name) || /Nacht|N\d/.test(text))).forEach((L) => L.variants.forEach((v, vi) => {
            let bi = -1, bd = 1e9;
            for (let i = 0; i < v.stops.length - 1; i++) { const dd = segDist(g, d.stations[v.stops[i]], d.stations[v.stops[i + 1]]); if (dd < bd) { bd = dd; bi = i; } }
            if (bi >= 0 && bd < (lines.length ? 700 : 350)) { closeBetween(L, v, vi, bi, bi + 1); hit++; }
          }));
          if (hit) { plan.cross.push([g.lon, g.lat]); plan.where = nm; break; }
          }
          if (plan.where) break;
        }
      }
    }
    // je Strecke nur eine Richtung zeichnen
    plan.closed = plan.closed.filter((c, i, arr) => !arr.slice(0, i).some((o2) => (o2.from === c.to && o2.to === c.from) || (o2.from === c.from && o2.to === c.to)));
    // Kreuz in der Mitte jedes gesperrten Abschnitts (Richtungen zusammengefasst)
    if (!plan.where) plan.closed.forEach((c) => {
      const mid = c.coords.length === 2 ? [(c.coords[0][0] + c.coords[1][0]) / 2, (c.coords[0][1] + c.coords[1][1]) / 2] : c.coords[Math.floor(c.coords.length / 2)];
      if (!plan.cross.some((x) => Math.abs(x[0] - mid[0]) < 0.006 && Math.abs(x[1] - mid[1]) < 0.004)) plan.cross.push(mid);
    });
    // neuer Fahrweg: schnellster Weg zwischen den Enden des gesperrten Abschnitts ohne die gesperrten Kanten
    const doneDet = new Set();
    plan.closed.forEach((c) => {
      if (!c.lineId) return;
      const L = M.Net.lineById(c.lineId);
      const k = [baseOf(c.from), baseOf(c.to)].sort().join('|') + (plan.sev ? 'sev' : L.id);
      if (doneDet.has(k)) return; doneDet.add(k);
      if (plan.sev && L.mode === 'tram') { plan.detours.push({ coords: c.coords, lineId: L.id, label: 'Ersatzverkehr (Bus)', color: M.cssVar('--line-sev'), off: 1 }); return; }
      const r = M.route(c.from, c.to, { modes: plan.sev ? ['bus'] : [L.mode, 'bus'], night: true, block });
      if (!r) return;
      const coords = [];
      r.legs.forEach((lg) => coords.push(...M.legCoords(lg)));
      if (coords.length > 1) plan.detours.push({ coords, lineId: L.id, label: plan.sev ? 'Ersatzverkehr' : 'Umleitung ' + (L.mode === 'tram' ? 'Tram ' : 'Bus ') + L.name, color: plan.sev ? M.cssVar('--line-sev') : M.lineColor(L.name, L.mode) });
    });
    plan.focus = [].concat(...plan.closed.map((c) => c.coords), ...plan.detours.map((c) => c.coords));
    if (!plan.focus.length) st.forEach((x) => plan.focus.push([x.s.lo, x.s.la]));
    if (!plan.focus.length) lines.forEach((L) => plan.focus.push(...L.variants[0].geo));
    plan.stations = st.slice(0, 12).map((x) => x.id);
    return plan;
  };
})(window.MVB = window.MVB || {});
