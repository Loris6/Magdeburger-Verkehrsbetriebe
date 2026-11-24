/* MVB – gemeinsame Bausteine im BVG-Aufbau: Brotkrumen, Seitenkopf, Kachel-Listen, Eingaben mit Vorschlägen, Modal, Meldungen */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon;
  const C = (M.C = {});

  /* ---------- Brotkrumen + Seitenkopf ---------- */
  C.crumbs = (items, wide) => '<div class="g ' + (wide ? '' : 'g-normal') + '"><nav class="crumbs" aria-label="Brotkrumen"><ol><li><a href="#/">Startseite</a></li>' +
    items.map((it, i) => '<li>' + (i === items.length - 1 || !it[1] ? esc(it[0]) : '<a href="' + it[1] + '">' + esc(it[0]) + '</a>') + '</li>').join('') + '</ol></nav></div>';
  C.stage = (title, sub, ic) => '<div class="g lstage"><header><div class="sg__h1w">' + (ic ? '<span class="sg__icon">' + icon(ic) + '</span>' : '') + '<h1 class="sg__h1">' + esc(title) + '</h1></div>' + (sub ? '<p class="sg__sub">' + sub + '</p>' : '') + '</header></div>';

  /* ---------- Kachel-Liste (TeaserList) ---------- */
  // items: [{ t, d, href, ic, dark, badge }]
  C.teaserList = function (title, items, o) {
    o = o || {};
    const kind = o.std ? 'tl--std' : 'tl--hl';
    return '<section class="tl ' + kind + ' tl--cols-2">' + (title ? '<h2>' + esc(title) + '</h2>' : '') + '<ul>' + items.map((it) => {
      const ext = /^https?:/.test(it.href || '');
      const lead = it.ic ? '<span class="tl__icon' + (it.dark ? ' tl__icon--dark' : '') + '">' + (it.badge ? esc(it.badge) : icon(it.ic)) + '</span>' : '';
      return '<li><a class="tl__item" href="' + esc(it.href || '#') + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + (it.attr || '') + '><div class="tl__inner' + (lead ? ' centered' : '') + '">' + lead +
        '<div class="tl__txt"><h3>' + esc(it.t) + ' </h3>' + (it.d ? '<p>' + esc(it.d) + '</p>' : '') + (it.html || '') + '</div></div>' + icon('arrow', 'tl__arrow') + '</a></li>';
    }).join('') + '</ul>' + (o.bottom ? '<a class="btn btn--fill tl__bottom" href="' + esc(o.bottom[1]) + '">' + esc(o.bottom[0]) + '</a>' : '') + '</section>';
  };

  /* ---------- Haltestellen-/Ort-Eingabe mit Vorschlägen (BVG-Eingabefeld) ---------- */
  C.placeInput = function (wrap, o) {
    o = o || {};
    wrap.classList.add('cf__input');
    wrap.innerHTML = '<input type="text" autocomplete="off" spellcheck="false" aria-label="' + esc(o.label || 'Haltestelle') + '" placeholder=" "><span class="cf__label">' + esc(o.label || 'Haltestelle') + '</span><div class="sugg" hidden role="listbox"></div>';
    const inp = M.$('input', wrap), box = M.$('.sugg', wrap);
    let value = null, items = [], act = -1, seq = 0;
    const mark = () => wrap.classList.toggle('has-value', !!inp.value);
    const recent = () => M.store.get('recentStops', []).filter((p) => p && p.name).slice(0, 5);
    const render = (list, head, foot) => {
      items = list; act = -1;
      if (!list.length && !foot) { box.hidden = true; return; }
      box.innerHTML = '<div class="sugg__sec">' + (head ? '<div class="sugg__head">' + esc(head) + '</div>' : '') + list.map((p, i) => '<button type="button" class="sugg__item" data-i="' + i + '">' + icon(p.type === 'address' ? 'pin' : p.type === 'poi' ? 'star' : head === 'Meine letzten Anfragen' ? 'clock' : 'pin') + '<span>' + esc(p.name) + '</span>' +
        (p.id && M.Net.data && M.Net.data.stations[p.id] ? '<span class="sugg__lines">' + M.lineGroups(M.Net.linesAt(p.id).map((l) => l.line)) + '</span>' : '') + '</button>').join('') + '</div>' + (foot || '');
      box.hidden = false;
    };
    const showRecent = () => {
      const r = recent();
      render(r, r.length ? 'Meine letzten Anfragen' : '', '<button type="button" class="sugg__fav" data-fav>' + icon('heart') + 'Favoriten verwalten</button>');
    };
    const search = M.debounce(async () => {
      const q = inp.value.trim();
      const my = ++seq;
      if (q.length < 2) { showRecent(); return; }
      await M.Net.load().catch(() => null);
      if (my !== seq) return;
      const loc = M.searchStations(q, 8).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, type: 'stop' }));
      render(loc, 'Haltestellen');
      if (o.addresses && q.length >= 3) {
        const geo = await M.Transit.geocode(q);
        if (my !== seq || value || document.activeElement !== inp) return;
        const extra = geo.filter((g) => g.type !== 'stop' && !loc.some((l) => l.name === g.name)).slice(0, 5);
        render(loc.concat(extra), 'Vorschläge');
      }
    }, 140);
    const pick = (p) => {
      seq++; value = p; inp.value = p.name; box.hidden = true; mark();
      if (p.type === 'stop') M.store.set('recentStops', [p].concat(recent().filter((x) => x.name !== p.name)).slice(0, 8));
      o.onPick && o.onPick(p);
    };
    inp.addEventListener('input', () => { value = null; mark(); search(); });
    inp.addEventListener('focus', () => { if (!inp.value.trim()) showRecent(); else search(); });
    inp.addEventListener('keydown', (e) => {
      const bs = M.$$('.sugg__item', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!bs.length) return; act = (act + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length; bs.forEach((b, i) => b.classList.toggle('act', i === act)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items.length && !box.hidden) pick(items[Math.max(0, act)]); else o.onEnter && o.onEnter(); }
      else if (e.key === 'Escape') box.hidden = true;
    });
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (b) { pick(items[+b.dataset.i]); return; }
      if (e.target.closest('[data-fav]')) { box.hidden = true; location.hash = '#/konto'; }
    });
    inp.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 120));
    return {
      get: () => value,
      set: (p) => { value = p; inp.value = p ? p.name : ''; mark(); },
      async resolve() {
        if (value) return value;
        const q = inp.value.trim();
        if (!q) return null;
        await M.Net.load().catch(() => null);
        const s = M.searchStations(q, 1)[0];
        if (s) { value = { id: s.id, name: s.name, lat: s.lat, lon: s.lon, type: 'stop' }; inp.value = s.name; mark(); return value; }
        const g = (await M.Transit.geocode(q))[0];
        if (g) { value = g; inp.value = g.name; mark(); }
        return value;
      },
      focus: () => inp.focus(),
      input: inp
    };
  };

  /* ---------- Modal (BVG-Dialog) ---------- */
  C.modal = function (title, html, o) {
    o = o || {};
    const root = M.$('#modal');
    root.innerHTML = '<div class="modal"><div class="modal__box" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><header class="modal__head"><h2>' + esc(title) + '</h2><button class="btn btn--plain btn--sm" data-close aria-label="Schließen">' + icon('close') + '</button></header><div class="modal__body">' + html + '</div></div></div>';
    document.documentElement.style.overflow = 'hidden';
    const close = () => { root.innerHTML = ''; document.documentElement.style.overflow = ''; document.removeEventListener('keydown', onKey); C.closeModal = null; o.onClose && o.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    M.$('.modal', root).addEventListener('click', (e) => { if (e.target.classList.contains('modal') || e.target.closest('[data-close]')) close(); });
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
        if (n.startsWith('on') || n === 'style' || n === 'class' || n === 'id' || n === 'srcset' || n === 'sizes' || n === 'width' || n === 'height') el.removeAttribute(a.name);
        if ((n === 'href' || n === 'src') && /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
      if (el.tagName === 'IMG') { el.setAttribute('loading', 'lazy'); el.setAttribute('referrerpolicy', 'no-referrer'); }
    });
    return doc.body.innerHTML.replace(/\[\/?[a-z_]+[^\]]*\]\s*(-->)?/gi, '');
  };

  /* ---------- Meldungen (Baustellen & Störungen) ---------- */
  const TAGCLS = { sev: 'tag--info', detour: 'tag--info', closed: 'tag--warn', moved: 'tag--info', ok: 'tag--success' };
  C.tags = (kinds) => (kinds || []).map((k) => '<span class="tag ' + (TAGCLS[k] || '') + '">' + esc(M.TAG_LABEL[k][0]) + '</span>').join('');
  C.allDisruptions = async function () {
    const [news, rem] = await Promise.all([M.News.load().catch(() => []), M.Remarks.load()]);
    const work = news.filter((n) => M.News.isWork(n)).map((n) => ({ id: 'n' + n.id, slug: n.slug, title: n.title, text: n.text, html: n.html, date: n.date, from: n.date, lines: n.lines, kind: n.kind, link: n.link, src: 'mvb' }));
    return work.concat(rem.map((r) => Object.assign({ date: r.modified || r.from }, r))).sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  /** Zeile wie „Baumaßnahmen & Störungen“ auf der BVG-Startseite */
  C.disItem = (x) => '<li><button class="dis__item" data-dis="' + esc(x.id) + '"><span>' + (x.lines.length ? '<span class="dis__lines">' + M.lineGroups(x.lines) + '</span>' : '') +
    '<span class="dis__stops">' + esc(x.title) + '</span><span class="dis__tags">' + C.tags(x.kind).replace(/<\/span>(?=<span|$)/g, '</span>') + '</span></span><span class="dis__btn">' + icon('info') + '</span></button></li>';
  C.disBody = function (x) {
    return '<p style="font-size:1rem;margin-bottom:.75rem">' + C.tags(x.kind) + '</p><p class="nitem__date" style="margin-bottom:1rem">Von <time>' + icon('cal') + M.fmtDate(x.from || x.date) + '</time>' + (x.until ? ' Bis <time>' + icon('cal') + M.fmtDate(x.until) + '</time>' : ' Bis auf weiteres') + '</p>' +
      '<div class="dmapbox"></div><div class="rt">' + (x.html ? C.cleanHtml(x.html) : '<p>' + esc(x.text) + '</p>' + (x.stops && x.stops.length ? '<p><b>Betroffene Haltestellen:</b> ' + esc(x.stops.join(', ')) + '</p>' : '')) + '</div>' +
      (x.link ? '<p style="margin-top:1.5rem"><a class="btn btn--outline btn--sm btn--icon" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + icon('out') + 'Originalmeldung auf mvbnet.de</a></p>' : '');
  };
  C.mountDisMap = async function (box, x) {
    if (!box) return;
    box.innerHTML = '<div class="spin"></div>';
    let plan;
    try { plan = await M.disruptionPlan(x); } catch (e) { plan = null; }
    if (!plan || (!plan.closed.length && !plan.lines.length && !(plan.stations || []).length)) { box.innerHTML = ''; return; }
    const det = plan.detours[0];
    box.innerHTML = '<div class="dlegend">' + (plan.closed.length ? '<span><i class="closed"></i>Gesperrter Abschnitt</span><span><i class="cross"></i>Sperrung</span>' : '') +
      (det ? '<span><i class="det" style="--c:' + esc(det.color) + '"></i>' + (plan.sev ? 'Ersatzverkehr / neuer Fahrweg' : 'Neuer Fahrweg (Umleitung)') + '</span>' : '') +
      (plan.lines.length ? '<span>Betroffen: ' + M.lineGroups(plan.lines.map((l) => l.line)) + '</span>' : '') + '</div><div class="dmap"><div class="map"></div></div>';
    M.Maps.create(M.$('.map', box), { center: plan.focus[0], zoom: 14, draw: (map) => M.Maps.disruption(map, plan) });
  };
  C.openDisruption = function (x) {
    const box = C.modal('Details zur Baumaßnahme oder Störung', '<h3 class="nitem__trig" style="padding:0 0 .5rem;display:block"><span style="font-size:1rem;font-weight:700;line-height:2">' + (x.lines.length ? M.lineGroups(x.lines) + ' ' : '') + esc(x.title) + '</span></h3>' + C.disBody(x));
    C.mountDisMap(M.$('.dmapbox', box), x);
  };

  /* ---------- Bilder (MVB-Grafiken, falls kein Foto vorhanden ist) ---------- */
  C.heroArt = function () {
    return '<svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3B4"/><stop offset="1" stop-color="#E9F5EE"/></linearGradient></defs>' +
      '<rect width="1600" height="700" fill="url(#hsky)"/>' +
      '<g fill="#7FB394" opacity=".75"><path d="M1040 520V300h12l8-120 8 120h12v30h70v-30h12l8-120 8 120h12v220z"/><path d="M960 520V390l80-30v160zM1190 360l100 30v130h-100z"/><path d="M0 520v-60h70v-30h80v40h90v-40h70v90zM1290 520v-60h70v-25h70v35h90v-30h80v80z"/></g>' +
      '<rect y="520" width="1600" height="60" fill="#5E9C7A" opacity=".6"/><rect y="600" width="1600" height="100" fill="#3F5F4D"/><rect y="606" width="1600" height="6" fill="#B9C9BF"/>' +
      '<g transform="translate(330 470)"><path d="M0 36Q0 8 30 6h870q60 2 90 44l20 60q2 18-16 18H10Q0 128 0 116z" fill="#fff"/><path d="M0 100h1008l4 12H0z" fill="#00A04B"/><path d="M0 22h940" stroke="#00A04B" stroke-width="6"/>' +
      '<g fill="#1F3A2D"><rect x="24" y="34" width="120" height="50" rx="7"/><rect x="214" y="34" width="150" height="50" rx="7"/><rect x="434" y="34" width="150" height="50" rx="7"/><rect x="654" y="34" width="150" height="50" rx="7"/><path d="M874 34h70q28 6 44 50H874z"/></g>' +
      '<g fill="#3A5446"><rect x="160" y="34" width="38" height="78" rx="4"/><rect x="380" y="34" width="38" height="78" rx="4"/><rect x="600" y="34" width="38" height="78" rx="4"/><rect x="820" y="34" width="38" height="78" rx="4"/></g>' +
      '<rect x="900" y="12" width="64" height="16" rx="3" fill="#0B1A13"/><text x="932" y="25" text-anchor="middle" font-family="Arial" font-weight="700" font-size="12" fill="#FFB238">9 Reform</text>' +
      '<g fill="#252525"><circle cx="90" cy="132" r="13"/><circle cx="300" cy="132" r="13"/><circle cx="720" cy="132" r="13"/><circle cx="930" cy="132" r="13"/></g></g></svg>';
  };
  /** kleine Netz-Grafik für Kacheln */
  C.netArt = function (kind) {
    if (kind === 'lines') return '<svg viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/><path d="M22 8v64" stroke="var(--line-tram-9)" stroke-width="4"/><g fill="#fff" stroke="var(--line-tram-9)" stroke-width="2"><circle cx="22" cy="14" r="3.5"/><circle cx="22" cy="30" r="3.5"/><circle cx="22" cy="46" r="3.5"/><circle cx="22" cy="62" r="3.5"/></g><g fill="#9A9A9A"><rect x="32" y="12" width="34" height="4" rx="2"/><rect x="32" y="28" width="26" height="4" rx="2"/><rect x="32" y="44" width="38" height="4" rx="2"/><rect x="32" y="60" width="22" height="4" rx="2"/></g></svg>';
    if (kind === 'stops') return '<svg viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/><rect x="10" y="10" width="12" height="12" rx="2" fill="var(--mvb-green)"/><g fill="#9A9A9A"><rect x="10" y="32" width="36" height="4" rx="2"/><rect x="10" y="46" width="30" height="4" rx="2"/><rect x="10" y="60" width="40" height="4" rx="2"/></g><rect x="54" y="30" width="8" height="8" rx="2" fill="var(--line-tram-1)"/><circle cx="66" cy="48" r="4" fill="var(--mode-bus)"/><rect x="54" y="58" width="8" height="8" rx="2" fill="var(--line-tram-4)"/></svg>';
    if (kind === 'map') return '<svg viewBox="0 0 80 80"><rect width="80" height="80" fill="#F3F3F3"/><g fill="none" stroke-width="4" stroke-linecap="round"><path d="M4 22c20 2 28 26 72 22" stroke="var(--line-tram-1)"/><path d="M6 62c22-6 36-34 70-46" stroke="var(--line-tram-9)"/><path d="M40 4v72" stroke="var(--line-tram-4)"/><path d="M4 40h72" stroke="var(--line-tram-10)"/></g><g fill="#fff" stroke="#252525" stroke-width="1.5"><circle cx="40" cy="38" r="4"/><circle cx="22" cy="26" r="3"/><circle cx="62" cy="24" r="3"/></g></svg>';
    return '<svg viewBox="0 0 80 80"><rect width="80" height="80" fill="#fff"/><g fill="none" stroke-width="3"><path d="M8 26h64" stroke="var(--line-tram-1)"/><path d="M8 40c20 0 24 20 64 20" stroke="var(--line-tram-2)"/><path d="M40 8v64" stroke="var(--line-tram-4)"/><path d="M8 66C30 50 50 20 72 12" stroke="var(--line-tram-9)"/></g></svg>';
  };
})(window.MVB = window.MVB || {});
