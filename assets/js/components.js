/* MVB – gemeinsame Bausteine: Haltestellen-Eingabe, Meldungen, Modal, Seitenkopf */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon;
  const C = (M.C = {});

  C.crumbs = (items) => '<nav class="crumbs" aria-label="Brotkrumen"><a href="#/">Startseite</a>' + items.map((it, i) => ' › ' + (i === items.length - 1 ? '<b>' + esc(it[0]) + '</b>' : '<a href="' + it[1] + '">' + esc(it[0]) + '</a>')).join('') + '</nav>';
  C.phead = (title, lead, ic) => '<header class="phead' + (ic ? ' with-ic' : '') + '"><h1>' + (ic ? '<span class="ph-ic">' + icon(ic) + '</span>' : '') + esc(title) + '</h1>' + (lead ? '<p>' + lead + '</p>' : '') + '</header>';

  /* ---------- Haltestellen-/Ort-Eingabe mit Vorschlägen ---------- */
  C.placeInput = function (wrap, o) {
    o = o || {};
    wrap.classList.add('fld', 'has-lbl');
    wrap.innerHTML = '<span class="lbl">' + esc(o.label || 'Haltestelle') + '</span><input type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(o.placeholder || 'Haltestelle eingeben') + '" aria-label="' + esc(o.label || 'Haltestelle') + '"><div class="sugg" hidden role="listbox"></div>';
    const inp = M.$('input', wrap), box = M.$('.sugg', wrap);
    let value = null, items = [], act = -1, seq = 0;
    const render = (list, extra) => {
      items = list;
      act = -1;
      if (!list.length && !extra) { box.hidden = true; return; }
      box.innerHTML = (extra || '') + list.map((p, i) => '<button type="button" data-i="' + i + '">' + icon(p.type === 'address' ? 'pin' : p.type === 'poi' ? 'star' : 'tram') + '<span>' + esc(p.name) + '</span>' +
        (p.id && M.Net.data && M.Net.data.stations[p.id] ? '<span class="s-lines">' + M.lineGroups(M.Net.linesAt(p.id).map((l) => l.line)) + '</span>' : '') + '</button>').join('');
      box.hidden = false;
    };
    const recent = () => M.store.get('recentStops', []).filter((p) => p && p.name).slice(0, 5);
    const showRecent = () => { const r = recent(); if (r.length && !inp.value.trim()) render(r, '<div class="s-head">Zuletzt gesucht</div>'); };
    const search = M.debounce(async () => {
      const q = inp.value.trim();
      const my = ++seq;
      if (q.length < 2) { showRecent(); if (!q) box.hidden = !recent().length; return; }
      await M.Net.load().catch(() => null);
      const loc = M.searchStations(q, 8).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, type: 'stop' }));
      if (my !== seq) return;
      render(loc);
      if (o.addresses && q.length >= 3) {
        const geo = await M.Transit.geocode(q);
        if (my !== seq || value || document.activeElement !== inp) return;
        const extra = geo.filter((g) => g.type !== 'stop' && !loc.some((l) => l.name === g.name)).slice(0, 5);
        render(loc.concat(extra));
      }
    }, 140);
    const pick = (p) => {
      seq++; value = p; inp.value = p.name; box.hidden = true;
      if (p.type === 'stop') M.store.set('recentStops', [p].concat(recent().filter((x) => x.name !== p.name)).slice(0, 8));
      o.onPick && o.onPick(p);
    };
    inp.addEventListener('input', () => { value = null; search(); });
    inp.addEventListener('focus', () => { if (!inp.value.trim()) showRecent(); else search(); });
    inp.addEventListener('keydown', (e) => {
      const bs = M.$$('button', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs.forEach((b, i) => b.classList.toggle('act', i === act)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items.length) pick(items[Math.max(0, act)]); else o.onEnter && o.onEnter(); }
      else if (e.key === 'Escape') box.hidden = true;
    });
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) pick(items[+b.dataset.i]); });
    inp.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 120));
    return {
      get: () => value,
      set: (p) => { value = p; inp.value = p ? p.name : ''; },
      async resolve() {
        if (value) return value;
        const q = inp.value.trim();
        if (!q) return null;
        await M.Net.load().catch(() => null);
        const s = M.searchStations(q, 1)[0];
        if (s) { value = { id: s.id, name: s.name, lat: s.lat, lon: s.lon, type: 'stop' }; inp.value = s.name; return value; }
        const g = (await M.Transit.geocode(q))[0];
        if (g) { value = g; inp.value = g.name; }
        return value;
      },
      focus: () => inp.focus(),
      input: inp
    };
  };

  /* ---------- Modal ---------- */
  C.modal = function (html, o) {
    o = o || {};
    const root = M.$('#modal');
    root.innerHTML = '<div class="modal__box" role="dialog" aria-modal="true"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '><button class="icbtn modal__x" data-close aria-label="Schließen">' + icon('close') + '</button>' + html + '</div>';
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const close = () => {
      root.hidden = true; root.innerHTML = ''; document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      o.onClose && o.onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    root.onclick = (e) => { if (e.target === root || e.target.closest('[data-close]')) close(); };
    C.closeModal = close;
    return M.$('.modal__box', root);
  };

  /* ---------- HTML der MVB-Seite sicher übernehmen ---------- */
  C.cleanHtml = function (html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed, form, input, button, noscript, link, meta').forEach((x) => x.remove());
    doc.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((a) => {
        const n = a.name.toLowerCase();
        if (n.startsWith('on') || n === 'style' || n === 'class' || n === 'id' || n === 'srcset' || n === 'sizes') el.removeAttribute(a.name);
        if ((n === 'href' || n === 'src') && /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
      if (el.tagName === 'IMG') { el.setAttribute('loading', 'lazy'); el.setAttribute('referrerpolicy', 'no-referrer'); }
    });
    // Shortcode-Reste („[/kt_box]-->“) entfernen
    return doc.body.innerHTML.replace(/\[\/?[a-z_]+[^\]]*\]\s*(-->)?/gi, '');
  };

  /* ---------- Meldungen (Baustellen & Störungen) ---------- */
  /** Alle Meldungen: Baustellen-Beiträge der MVB + Störungsmeldungen (INSA) */
  C.allDisruptions = async function () {
    const [news, rem] = await Promise.all([M.News.load().catch(() => []), M.Remarks.load()]);
    const work = news.filter((n) => M.News.isWork(n)).map((n) => ({
      id: 'n' + n.id, slug: n.slug, title: n.title, text: n.text, html: n.html, date: n.date, from: n.date, lines: n.lines, kind: n.kind, link: n.link, src: 'mvb', news: n
    }));
    return work.concat(rem.map((r) => Object.assign({ date: r.modified || r.from }, r))).sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  C.disItem = function (x) {
    return '<button class="ditem" data-dis="' + esc(x.id) + '"><div><div class="ditem__t">' + (x.lines.length ? M.lineGroups(x.lines) : '<span class="bds">' + icon('alert') + '</span>') + '<span>' + esc(x.title) + '</span></div>' +
      '<div class="ditem__tags">' + M.tagsHtml(x.kind) + '</div><div class="ditem__meta">' + (x.until ? 'Von ' + M.fmtDate(x.from) + ' bis ' + M.fmtDate(x.until) : 'Meldung vom ' + M.fmtDate(x.date)) + (x.src === 'insa' ? ' · Verkehrsmeldung' : ' · mvbnet.de') + '</div></div>' + icon('info', 'info') + '</button>';
  };
  /** Inhalt einer Meldung inkl. interaktiver Störungskarte */
  C.disBody = function (x) {
    return '<div class="ditem__tags" style="margin-bottom:10px">' + M.tagsHtml(x.kind) + '</div>' +
      '<p class="muted" style="font-size:14px;margin-bottom:8px">' + icon('cal') + ' ' + (x.until ? 'Von ' + M.fmtDate(x.from) + ' bis ' + M.fmtDate(x.until) : 'Veröffentlicht am ' + M.fmtDate(x.date)) + '</p>' +
      '<div class="dmapbox"></div>' +
      '<div class="prose">' + (x.html ? C.cleanHtml(x.html) : '<p>' + esc(x.text) + '</p>' + (x.stops && x.stops.length ? '<p><b>Betroffene Haltestellen:</b> ' + esc(x.stops.join(', ')) + '</p>' : '')) + '</div>' +
      (x.link ? '<p style="margin-top:14px;font-size:14px"><a class="link" href="' + esc(x.link) + '" target="_blank" rel="noopener">Originalmeldung auf mvbnet.de ' + icon('out') + '</a></p>' : '');
  };
  /** Störungskarte in einen Behälter zeichnen */
  C.mountDisMap = async function (box, x) {
    if (!box) return;
    box.innerHTML = '<div class="spin"></div>';
    let plan;
    try { plan = await M.disruptionPlan(x); } catch (e) { plan = null; }
    if (!plan || (!plan.closed.length && !plan.lines.length && !(plan.stations || []).length)) { box.innerHTML = ''; return; }
    const det = plan.detours[0];
    box.innerHTML = '<div class="dlegend">' +
      (plan.closed.length ? '<span><i class="closed"></i>Gesperrter Abschnitt</span><span><i class="cross"></i>Sperrung</span>' : '') +
      (plan.detours.length ? '<span><i class="det" style="--c:' + esc(det.color) + '"></i>' + esc(plan.sev ? 'Ersatzverkehr / neuer Fahrweg' : 'Neuer Fahrweg (Umleitung)') + '</span>' : '') +
      (plan.lines.length ? '<span>Betroffen: ' + M.lineGroups(plan.lines.map((l) => l.line)) + '</span>' : '') + '</div>' +
      '<div class="dmap"><div class="map"></div></div>' +
      (plan.closed.length && !plan.manual ? '<p class="muted" style="font-size:12.5px;margin:-6px 0 14px">Karte automatisch aus der Meldung erstellt (Haltestellen, Straßen und Linien im Text). Maßgeblich ist der Text der MVB.</p>' : '');
    M.Maps.create(M.$('.map', box), { center: plan.focus[0], zoom: 14, draw: (map) => M.Maps.disruption(map, plan), cooperative: false });
  };
  C.openDisruption = function (x) {
    const box = C.modal('<h2 style="font-size:var(--fs-h3);margin-right:40px">Details zur Baumaßnahme oder Störung</h2>' +
      '<div class="ditem__t" style="margin:14px 0 8px;font-size:17px">' + M.lineGroups(x.lines, { sm: false }) + '<span>' + esc(x.title) + '</span></div>' + C.disBody(x), { label: x.title });
    C.mountDisMap(M.$('.dmapbox', box), x);
  };

  /* ---------- Hero-Grafik: Magdeburg mit Dom, Elbe und Straßenbahn ---------- */
  C.heroArt = function () {
    return '<svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mvb-green-800)"/><stop offset=".6" stop-color="var(--mvb-green-700)"/><stop offset="1" stop-color="var(--mvb-green)"/></linearGradient>' +
      '<linearGradient id="tram" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6ECE8"/></linearGradient>' +
      '<radialGradient id="glow" cx=".72" cy=".25" r=".6"><stop offset="0" stop-color="#2ED47A" stop-opacity=".55"/><stop offset="1" stop-color="#2ED47A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="700" fill="url(#sky)"/><rect width="1600" height="700" fill="url(#glow)"/>' +
      // Linien im Hintergrund (Liniennetz-Motiv)
      '<g fill="none" stroke-width="10" stroke-linecap="round" opacity=".28">' +
      '<path d="M-20 140 C 300 160, 420 300, 700 300 S 1200 180, 1640 220" stroke="var(--line-tram-1)"/>' +
      '<path d="M-20 220 C 260 230, 480 360, 760 350 S 1180 260, 1640 300" stroke="var(--line-tram-9)"/>' +
      '<path d="M-20 300 C 300 320, 520 420, 820 400 S 1240 330, 1640 380" stroke="var(--line-tram-4)"/>' +
      '<path d="M-20 80 C 380 100, 560 240, 860 240 S 1300 120, 1640 150" stroke="var(--line-tram-10)"/></g>' +
      // Skyline mit Dom
      '<g fill="#003D1E" opacity=".55">' +
      '<path d="M0 470 L0 420 L60 420 L60 400 L120 400 L120 430 L190 430 L190 380 L230 380 L230 410 L300 410 L300 440 L360 440 L360 395 L420 395 L420 430 L500 430 L500 470 Z"/>' +
      '<path d="M1040 470 L1040 300 L1052 300 L1060 180 L1068 300 L1080 300 L1080 330 L1150 330 L1150 300 L1162 300 L1170 180 L1178 300 L1190 300 L1190 470 Z"/>' +
      '<path d="M1080 330 L1150 330 L1150 470 L1080 470 Z M960 470 L960 390 L1040 360 L1040 470 Z M1190 360 L1290 390 L1290 470 L1190 470 Z"/>' +
      '<path d="M1290 470 L1290 420 L1360 420 L1360 395 L1420 395 L1420 430 L1500 430 L1500 405 L1600 405 L1600 470 Z"/></g>' +
      // Elbe
      '<path d="M0 470 L1600 470 L1600 520 L0 520 Z" fill="#00552A" opacity=".55"/>' +
      '<g stroke="#6CCB8F" stroke-width="3" opacity=".35" stroke-linecap="round"><path d="M80 492 h120M380 500 h160M760 488 h90M1100 502 h150M1380 494 h110"/></g>' +
      // Gleis
      '<rect x="0" y="600" width="1600" height="100" fill="#00381C" opacity=".75"/>' +
      '<rect x="0" y="606" width="1600" height="6" fill="#9FB8A8" opacity=".7"/><rect x="0" y="626" width="1600" height="5" fill="#9FB8A8" opacity=".5"/>' +
      '<path d="M0 548 H1600" stroke="#C9D6CE" stroke-width="2" opacity=".45"/>' +
      // Straßenbahn (moderner Niederflurwagen, 5 Module)
      '<g transform="translate(330 470)">' +
      '<path d="M0 36 Q0 8 30 6 L900 6 Q960 8 990 50 L1010 110 Q1012 128 994 128 L10 128 Q0 128 0 116 Z" fill="url(#tram)"/>' +
      '<path d="M0 100 L1008 100 L1012 112 L0 112 Z" fill="var(--mvb-green)"/>' +
      '<path d="M0 22 L940 22" stroke="var(--mvb-green)" stroke-width="6"/>' +
      '<g fill="#173226">' +
      '<rect x="24" y="34" width="120" height="50" rx="7"/><rect x="214" y="34" width="150" height="50" rx="7"/><rect x="434" y="34" width="150" height="50" rx="7"/><rect x="654" y="34" width="150" height="50" rx="7"/>' +
      '<path d="M874 34 L944 34 Q972 40 988 84 L874 84 Z"/></g>' +
      '<g fill="#2D4A3C"><rect x="160" y="34" width="38" height="78" rx="4"/><rect x="380" y="34" width="38" height="78" rx="4"/><rect x="600" y="34" width="38" height="78" rx="4"/><rect x="820" y="34" width="38" height="78" rx="4"/></g>' +
      '<g stroke="#FFFFFF" stroke-width="2" opacity=".35"><path d="M179 34v78M399 34v78M619 34v78M839 34v78"/></g>' +
      '<rect x="900" y="12" width="64" height="16" rx="3" fill="#0B1A13"/><text x="932" y="25" text-anchor="middle" font-family="Rubik, Arial" font-weight="700" font-size="12" fill="#FFB238">9 Reform</text>' +
      '<g stroke="#5E6B64" stroke-width="3" fill="none"><path d="M560 6 L540 -40 L640 -40 M600 -40 L590 -60 L700 -60"/></g>' +
      '<g fill="#1E2421"><circle cx="90" cy="132" r="13"/><circle cx="300" cy="132" r="13"/><circle cx="720" cy="132" r="13"/><circle cx="930" cy="132" r="13"/></g>' +
      '<circle cx="996" cy="98" r="5" fill="#FFF6C9"/></g>' +
      '<path d="M0 410 H1600" stroke="#5E6B64" stroke-width="2" opacity=".5"/>' +
      '</svg>';
  };
})(window.MVB = window.MVB || {});
