/* MVB – App: Router, Seitenwechsel-Animation, Kopfleiste, Menü, Dark Mode, Suche, Hilfe */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;

  const NAV = [['home', 'Startseite', '#/', 'home'], ['verbindungen', 'Verbindungen', '#/verbindungen', 'route'], ['tickets', 'Abos & Tickets', '#/tickets', 'ticket'], ['service', 'Service & Kontakt', '#/service', 'help'], ['konto', 'MVB-Konto', '#/konto', 'user'], ['unternehmen', 'Unternehmen', '#/unternehmen', 'building']];
  const MORE = [['stoerungen', 'Störungsmeldungen', '#/stoerungen', 'alert'], ['karte', 'Interaktive Karte', '#/verbindungen/karte', 'map'], ['neuigkeiten', 'Neuigkeiten', '#/neuigkeiten', 'news'], ['karriere', 'Karriere', '#/karriere', 'rocket'], ['netz', 'Netz & Linien', '#/netz', 'layers']];
  const ROUTES = { '': 'home', verbindungen: 'verbindungen', stoerungen: 'stoerungen', neuigkeiten: 'neuigkeiten', tickets: 'tickets', service: 'service', unternehmen: 'unternehmen', karriere: 'karriere', konto: 'konto', netz: 'netz' };

  /* ---------- Dark Mode ---------- */
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = () => {
    const pref = M.store.get('theme', null);
    const dark = pref ? pref === 'dark' : mq.matches;
    const was = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#0F1412' : M.cssVar('--mvb-green');
    M.$$('[data-theme-btn]').forEach((b) => { b.innerHTML = icon(dark ? 'sun' : 'moon') + (b.dataset.themeBtn === 'menu' ? (dark ? 'Heller Modus' : 'Dunkler Modus') : ''); b.setAttribute('aria-label', dark ? 'Heller Modus' : 'Dunkler Modus'); });
    if (was && was !== document.documentElement.dataset.theme) M.Maps.retheme();
  };
  mq.addEventListener && mq.addEventListener('change', applyTheme);
  const toggleTheme = () => { M.store.set('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); applyTheme(); };

  /* ---------- Kopf & Fuß ---------- */
  function shell() {
    M.$('#hd').innerHTML = '<div class="wrap"><div class="hd__bar"><a class="logo" href="#/" aria-label="MVB Startseite">' + M.LOGO + '<b>Magdeburger<br>Verkehrsbetriebe</b></a>' +
      '<nav class="nav" aria-label="Hauptnavigation">' + NAV.map((n) => '<a href="' + n[2] + '" data-nav="' + n[0] + '">' + esc(n[1]) + '</a>').join('') + '</nav>' +
      '<div class="hd__tools"><button class="icbtn" data-theme-btn="bar"></button><button class="icbtn" id="btnSearch" aria-label="Suche">' + icon('search') + '</button><button class="icbtn" id="btnMenu" aria-label="Menü" aria-expanded="false">' + icon('menu') + '</button></div></div>' +
      '<div class="menu" id="menu" hidden>' + NAV.concat(MORE).map((n) => '<a href="' + n[2] + '" data-nav="' + n[0] + '">' + icon(n[3]) + esc(n[1]) + '</a>').join('') + '<hr><button data-theme-btn="menu"></button></div></div>';
    M.$('#ft').innerHTML = '<div class="wrap"><div class="ft__grid">' +
      '<div><h3>Die MVB</h3><a href="#/unternehmen">Unternehmen</a><a href="#/neuigkeiten">News</a><a href="#/karriere">Karriere</a><a href="https://www.mvbnet.de/presse/" target="_blank" rel="noopener">Presse</a><a href="https://www.mvbnet.de/service/kontakte/" target="_blank" rel="noopener">Kontakt</a></div>' +
      '<div><h3>Verbindungen</h3><a href="#/verbindungen/verbindung">Fahrplanauskunft</a><a href="#/verbindungen/abfahrt">Abfahrten</a><a href="#/verbindungen/karte">Interaktive Karte</a><a href="#/stoerungen">Störungsmeldungen</a><a href="#/netz">Linienverläufe</a></div>' +
      '<div><h3>Tickets &amp; Abo</h3><a href="#/tickets">Tickets</a><a href="#/tickets">Deutschlandticket</a><a href="https://abo.mvbnet.de/" target="_blank" rel="noopener">Abo verwalten</a><a href="#/konto">MVB-Konto</a></div>' +
      '<div><h3>Service</h3><a href="#/service">Service &amp; Kontakt</a><a href="https://www.mvbnet.de/service/fundsachen/" target="_blank" rel="noopener">Fundsachen</a><a href="https://www.mvbnet.de/service/haeufige-fragen/" target="_blank" rel="noopener">Häufige Fragen</a><a href="https://loris6.github.io/Muvit/" target="_blank" rel="noopener">Muvit-App</a></div></div>' +
      '<div class="ft__legal"><span>Inhalte zu Neuigkeiten, Baustellen und Stellen: <a href="https://www.mvbnet.de/" target="_blank" rel="noopener">mvbnet.de</a> · Fahrplandaten: Transitous/DELFI · Karte: © OpenStreetMap, OpenFreeMap</span>' +
      '<span><a href="https://www.mvbnet.de/impressum/" target="_blank" rel="noopener">Impressum</a> · <a href="https://www.mvbnet.de/datenschutzbestimmungen/" target="_blank" rel="noopener">Datenschutz</a> · <a href="https://www.mvbnet.de/barrierefreiheitserklaerung/" target="_blank" rel="noopener">Barrierefreiheit</a></span></div></div>';
    const menu = M.$('#menu'), btn = M.$('#btnMenu');
    const setMenu = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); btn.innerHTML = icon(open ? 'close' : 'menu'); };
    btn.onclick = (e) => { e.stopPropagation(); setMenu(menu.hidden); };
    document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#menu')) setMenu(false); });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    M.$$('[data-theme-btn]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); toggleTheme(); }; });
    M.$('#btnSearch').onclick = openSearch;
    // Hilfe-Knopf
    const help = M.$('#help');
    help.innerHTML = '<div class="help__bubble"><span>Hast du Fragen?<br>Wir helfen gerne!</span><button aria-label="Ausblenden" id="helpX">' + icon('close') + '</button></div><button class="help__btn" id="helpBtn" aria-label="Hilfe">' + icon('chat') + '</button>';
    if (M.store.get('helpMin', false)) help.classList.add('min');
    M.$('#helpX').onclick = () => { help.classList.add('min'); M.store.set('helpMin', true); };
    M.$('#helpBtn').onclick = () => {
      C.modal('<h2 style="margin-right:40px">Wie können wir helfen?</h2><div class="topics" style="margin-top:18px">' +
        [['Verbindung suchen', '#/verbindungen/verbindung', 'route'], ['Abfahrten an meiner Haltestelle', '#/verbindungen/abfahrt', 'clock'], ['Störungen &amp; Umleitungen', '#/stoerungen', 'alert'], ['Tickets &amp; Preise', '#/tickets', 'ticket'], ['Jobs &amp; Bewerbung', '#/karriere', 'rocket'], ['Kontakt zur MVB', 'https://www.mvbnet.de/service/kontakte/', 'phone']]
          .map((t) => '<a class="topic" href="' + t[1] + '"' + (t[1].startsWith('http') ? ' target="_blank" rel="noopener"' : ' data-close') + '><div><b>' + t[0] + '</b></div>' + icon(t[2]) + '</a>').join('') + '</div>', { label: 'Hilfe' });
    };
  }

  /* ---------- Suche ---------- */
  function openSearch() {
    const box = C.modal('<h2 style="margin-right:40px">Suche</h2><div class="fld" style="margin-top:16px"><input type="search" id="sQ" placeholder="Haltestelle, Linie oder Thema" autocomplete="off" aria-label="Suchbegriff"></div><div id="sR" style="margin-top:14px"></div>', { label: 'Suche' });
    const q = M.$('#sQ', box), r = M.$('#sR', box);
    setTimeout(() => q.focus(), 50);
    const pages = NAV.concat(MORE);
    const run = M.debounce(async () => {
      const t = q.value.trim();
      if (!t) { r.innerHTML = ''; return; }
      await M.Net.load().catch(() => null);
      const nt = M.norm(t);
      const st = M.searchStations(t, 6);
      const ls = (M.Net.data ? M.Net.data.lines : []).filter((l) => l.name.toLowerCase() === t.toLowerCase().replace(/^(linie|tram|bus)\s*/, ''));
      const news = (M.News.list || []).filter((n) => M.norm(n.title).includes(nt)).slice(0, 5);
      const pg = pages.filter((p) => M.norm(p[1]).includes(nt));
      const sec = (title, html) => (html ? '<div class="mhead">' + title + '</div>' + html : '');
      r.innerHTML = sec('Linien', ls.map((l) => '<a class="ntile" data-close href="#/verbindungen/karte?linie=' + l.id + '">' + M.badges(l.line, { lg: true }) + '<span><b>' + (l.mode === 'tram' ? 'Straßenbahn ' : 'Bus ') + esc(l.name) + '</b><span>' + esc(l.variants.map((v) => v.to).filter((v, i, a) => a.indexOf(v) === i).join(' ↔ ')) + '</span></span>' + icon('arrow') + '</a>').join('')) +
        sec('Haltestellen', st.map((s) => '<a class="ntile" data-close href="#/verbindungen/abfahrt?halt=' + encodeURIComponent(s.id) + '">' + icon('tram') + '<span><b>' + esc(s.name) + '</b><span>' + M.lineGroups(M.Net.linesAt(s.id).map((l) => l.line)) + '</span></span>' + icon('arrow') + '</a>').join('')) +
        sec('Seiten', pg.map((p) => '<a class="ntile" data-close href="' + p[2] + '">' + icon(p[3]) + '<span><b>' + esc(p[1]) + '</b></span>' + icon('arrow') + '</a>').join('')) +
        sec('Neuigkeiten', news.map((n) => '<a class="ntile" data-close href="#/neuigkeiten/' + esc(n.slug) + '">' + icon('news') + '<span><b>' + esc(n.title) + '</b><span>' + M.fmtDate(n.date) + '</span></span>' + icon('arrow') + '</a>').join('')) || '<p class="empty">Nichts gefunden.</p>';
    }, 150);
    q.addEventListener('input', run);
    M.News.load().catch(() => null);
  }

  /* ---------- Seitenwechsel: Streifen fädeln ein → Thema → Streifen fädeln aus ---------- */
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LS = { busy: false, timers: [] };
  const HOLD = 1100;
  function playLoader(text, swap, splash) {
    const el = M.$('#loader');
    if (!el || reduced() || LS.busy) { swap(); return; }
    LS.busy = true;
    LS.timers.forEach(clearTimeout); LS.timers = [];
    M.$('[data-loader-name]', el).innerHTML = String(text).split('').map((ch, i) => '<span style="--i:' + i + '">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>').join('');
    el.className = 'loader'; el.hidden = false; void el.offsetWidth;
    el.classList.add(splash ? 'is-splash' : 'is-in');
    const at = (ms, fn) => LS.timers.push(setTimeout(fn, ms));
    const cover = splash ? 0 : 560;
    at(cover, () => { try { swap(); } finally { el.classList.add('is-loading'); } });
    at(cover + HOLD, () => { el.classList.add('is-out'); at(900, () => { el.hidden = true; el.className = 'loader'; LS.busy = false; }); });
  }

  /* ---------- Router ---------- */
  let cleanup = null, current = null;
  const parse = () => {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const segs = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { segs, key: ROUTES[segs[0] || ''] || 'home', query: query || '' };
  };
  const pageTitle = (r) => {
    const p = M.Pages[r.key];
    if (r.key === 'karriere' && r.segs[1] === 'bewerbung') return 'Bewerbung';
    if (r.key === 'verbindungen' && r.segs[1] === 'karte') return 'Interaktive Karte';
    return (p && p.title) || 'MVB';
  };
  function render(r) {
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* egal */ } }
    cleanup = null;
    M.Maps.destroyAll();
    if (C.closeModal && !M.$('#modal').hidden) C.closeModal();
    const page = M.Pages[r.key] || M.Pages.home;
    const app = M.$('#app');
    app.innerHTML = '';
    app.className = 'page-' + r.key;
    window.scrollTo(0, 0);
    try {
      const res = page.render(app, r.segs.slice(1));
      if (res && typeof res.then === 'function') res.then((c) => { if (typeof c === 'function') cleanup = c; }).catch((e) => console.error(e));
      else if (typeof res === 'function') cleanup = res;
    } catch (e) { console.error(e); app.innerHTML = '<div class="wrap"><p class="empty">Diese Seite konnte nicht geladen werden.</p></div>'; }
    M.$$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === (page.nav || r.key) || (a.dataset.nav === r.key)));
    document.title = (r.key === 'home' ? 'MVB – Magdeburger Verkehrsbetriebe' : pageTitle(r) + ' – MVB');
  }
  function route(first) {
    const r = parse();
    const prev = current;
    current = r;
    // gleicher Bereich, nur anderer Reiter/Filter: ohne Animation
    const sameArea = prev && prev.key === r.key && (r.key === 'verbindungen' || r.key === 'stoerungen' || (prev.segs.join('/') === r.segs.join('/')));
    if (first) { playLoader(pageTitle(r), () => render(r), true); return; }
    if (sameArea) { render(r); return; }
    playLoader(pageTitle(r), () => render(r));
  }

  /* ---------- Start ---------- */
  function start() {
    applyTheme();
    shell();
    applyTheme();
    window.addEventListener('hashchange', () => route(false));
    route(true);
    M.Net.load().catch(() => null);
    M.News.load().catch(() => null);
    // Neuigkeiten und Störungen automatisch aktualisieren
    let lastTop = null;
    setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const list = await M.News.load(true).catch(() => null);
      const top = list && list[0] && list[0].id + ':' + list.length;
      if (lastTop && top !== lastTop && current && (current.key === 'home' || (current.key === 'neuigkeiten' && !current.segs[1]) || current.key === 'stoerungen')) render(current);
      lastTop = top;
    }, M.CONFIG.refreshNewsMs);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.MVB = window.MVB || {});
