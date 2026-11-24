/* MVB – App: Router, Seitenwechsel-Animation, Kopfleiste (wie BVG), Menü, Suche, Fußbereich, Hilfe, Dark Mode */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;

  const NAV = [['home', 'Startseite', '#/'], ['verbindungen', 'Verbindungen', '#/verbindungen'], ['tickets', 'Abos & Tickets', '#/tickets'], ['service', 'Service & Kontakt', '#/service'], ['konto', 'MVB-Konto', '#/konto'], ['unternehmen', 'Unternehmen', '#/unternehmen']];
  const MENU = [['home', 'Startseite', '#/', 'home'], ['verbindungen', 'Verbindungen', '#/verbindungen', 'map'], ['tickets', 'Abos & Tickets', '#/tickets', 'ticketS'], ['service', 'Service & Kontakt', '#/service', 'info'], ['konto', 'MVB-Konto', '#/konto', 'user'],
    ['unternehmen', 'Unternehmen', '#/unternehmen', 'heart'], ['netz', 'Netz & Linien', '#/netz', 'layers'], ['karriere', 'Karriere', '#/karriere', 'rocket'], ['neuigkeiten', 'Neuigkeiten', '#/neuigkeiten', 'news']];
  const ROUTES = { '': 'home', verbindungen: 'verbindungen', stoerungen: 'stoerungen', neuigkeiten: 'neuigkeiten', tickets: 'tickets', service: 'service', unternehmen: 'unternehmen', karriere: 'karriere', konto: 'konto', netz: 'netz' };

  /* ---------- Dark Mode ---------- */
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  function applyTheme() {
    const pref = M.store.get('theme', null);
    const dark = pref ? pref === 'dark' : mq.matches;
    const was = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#121614' : '#FFFFFF';
    M.$$('[data-theme-label]').forEach((el) => { el.textContent = dark ? 'Heller Modus' : 'Dunkler Modus'; });
    if (was && was !== document.documentElement.dataset.theme) M.Maps.retheme();
  }
  mq.addEventListener && mq.addEventListener('change', applyTheme);
  const toggleTheme = () => { M.store.set('theme', isDark() ? 'light' : 'dark'); applyTheme(); };

  /* ---------- Kopfleiste, Fuß, Hilfe ---------- */
  const SOCIAL = {
    Instagram: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#fff"/><rect x="11" y="11" width="18" height="18" rx="5" fill="none" stroke="#424242" stroke-width="2.2"/><circle cx="20" cy="20" r="4.2" fill="none" stroke="#424242" stroke-width="2.2"/><circle cx="25.2" cy="14.8" r="1.3" fill="#424242"/></svg>',
    Facebook: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#fff"/><path d="M21.6 31V21.4h3.2l.5-3.8h-3.7v-2.4c0-1.1.3-1.8 1.9-1.8h2v-3.4a26 26 0 0 0-2.9-.1c-2.9 0-4.8 1.7-4.8 5v2.7h-3.2v3.8h3.2V31z" fill="#424242"/></svg>',
    YouTube: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#fff"/><rect x="9" y="13" width="22" height="15" rx="4" fill="#424242"/><path d="M18 17.2v6.6l5.6-3.3z" fill="#fff"/></svg>'
  };
  function shell() {
    const hd = M.$('#hd');
    hd.innerHTML = '<div class="hd__nav"><div class="hd__bar"><a class="hd__logo" href="#/" aria-label="MVB Startseite">' + M.LOGO + '</a>' +
      '<nav class="hd__center" aria-label="Hauptnavigation">' + NAV.map((n) => '<a class="nav-item" href="' + n[2] + '" data-nav="' + n[0] + '"><span>' + esc(n[1]) + '</span></a>').join('') + '</nav>' +
      '<div class="hd__right"><button class="icon-btn" id="btnA11y" aria-label="Barrierefreiheit und Darstellung" aria-expanded="false">' + icon('a11y') + '</button>' +
      '<button class="icon-btn" id="btnSearch" aria-label="Suche">' + icon('search') + '</button>' +
      '<button class="icon-btn" id="btnMenu" aria-label="Menü" aria-expanded="false">' + icon('menu') + '</button></div></div>' +
      '<div class="menu" id="menu" hidden><nav class="menu__in">' + MENU.map((n) => '<a class="nav-item" href="' + n[2] + '" data-nav="' + n[0] + '">' + icon(n[3]) + '<span>' + esc(n[1]) + '</span></a>').join('') +
      '<hr><a class="nav-item" href="https://www.mvbnet.de/" target="_blank" rel="noopener">' + icon('globe') + '<span>mvbnet.de</span></a></nav></div>' +
      '<div class="menu" id="a11y" hidden><nav class="menu__in"><button class="nav-item" id="themeBtn">' + icon('moon') + '<span data-theme-label>Dunkler Modus</span></button>' +
      '<button class="nav-item" id="motionBtn">' + icon('eye') + '<span>Bewegungen reduzieren</span></button></nav></div></div>';
    const menu = M.$('#menu'), a11y = M.$('#a11y'), bMenu = M.$('#btnMenu'), bA11y = M.$('#btnA11y');
    const set = (pop, btn, open, ico) => { pop.hidden = !open; btn.setAttribute('aria-expanded', open); if (ico) btn.innerHTML = icon(open ? 'close' : ico); };
    bMenu.onclick = (e) => { e.stopPropagation(); set(a11y, bA11y, false); set(menu, bMenu, menu.hidden, 'menu'); };
    bA11y.onclick = (e) => { e.stopPropagation(); set(menu, bMenu, false, 'menu'); set(a11y, bA11y, a11y.hidden); };
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !e.target.closest('#menu')) set(menu, bMenu, false, 'menu');
      if (!a11y.hidden && !e.target.closest('#a11y')) set(a11y, bA11y, false);
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(menu, bMenu, false, 'menu'); });
    M.$('#themeBtn').onclick = (e) => { e.stopPropagation(); toggleTheme(); };
    M.$('#motionBtn').onclick = (e) => { e.stopPropagation(); const on = !M.store.get('reduce', false); M.store.set('reduce', on); M.toast(on ? 'Bewegungen werden reduziert.' : 'Animationen sind wieder an.'); };
    M.$('#btnSearch').onclick = openSearch;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(menu, bMenu, false, 'menu'); set(a11y, bA11y, false); } });

    // Kopfleiste beim Herunterscrollen ausblenden, beim Hochscrollen zeigen (wie BVG, ab 960 px)
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      const hide = y > lastY && y > 120 && menu.hidden && a11y.hidden;
      if (Math.abs(y - lastY) > 4) { hd.classList.toggle('is-hidden', hide); lastY = y; }
      if (y < 60) hd.classList.remove('is-hidden');
    }, { passive: true });

    const col = (title, href, links) => '<li><a href="' + href + '">' + esc(title) + '</a><ul>' + links.map((l) => '<li><a href="' + l[1] + '"' + (/^http/.test(l[1]) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[0]) + '</a></li>').join('') + '</ul></li>';
    M.$('#ft').innerHTML = '<div class="ft__wrap"><nav class="ft__links" aria-label="Fußnavigation"><ul>' +
      col('DIE MVB', '#/unternehmen', [['News', '#/neuigkeiten'], ['Presse', 'https://www.mvbnet.de/presse/'], ['Unternehmen', '#/unternehmen'], ['Karriere', '#/karriere'], ['Kontakt', 'https://www.mvbnet.de/service/kontakte/'], ['MVB-Konto', '#/konto'], ['Fahrgastbeirat', 'https://www.mvbnet.de/unternehmen/fahrgastbeirat/'], ['Hinweisgebersystem', 'https://www.mvbnet.de/hinweisgebersystem/']]) +
      col('Verbindungen', '#/verbindungen', [['Verbindungssuche', '#/verbindungen/verbindung'], ['Störungsmeldungen', '#/stoerungen'], ['Linienverläufe', '#/netz'], ['Haltestellen', '#/verbindungen/abfahrt'], ['Interaktive Karte', '#/verbindungen/karte']]) +
      col('Tickets & Tarife', '#/tickets', [['Preise', '#/tickets'], ['Tarifübersicht', 'https://www.marego-heimat.de/'], ['Handyticket', 'https://www.mvbnet.de/fahrkarten/handyticket/'], ['Sondertickets', 'https://www.mvbnet.de/fahrkarten/sondertickets/'], ['Tarifbestimmungen', 'https://www.mvbnet.de/fahrkarten/tarifbestimmungen/']]) +
      col('Abo', '#/tickets', [['Deutschlandticket', 'https://www.mvbnet.de/fahrkarten/deutschlandticket/'], ['Schülerticket', 'https://www.mvbnet.de/fahrkarten/schuelerticket/'], ['Jobticket', 'https://www.mvbnet.de/fahrkarten/jobticket/'], ['Semesterticket', 'https://www.mvbnet.de/fahrkarten/semesterticket/'], ['Sozialticket', 'https://www.mvbnet.de/fahrkarten/sozialticket/']]) +
      col('MVB Apps', '#/', [['Muvit-App', 'https://loris6.github.io/Muvit/'], ['Handyticket-App', 'https://www.mvbnet.de/fahrkarten/handyticket/']]) +
      col('MVB Websites', '#/', [['mvbnet.de', 'https://www.mvbnet.de/']]) +
      col('MVB Services', '#/service', [['Fundsachen', 'https://www.mvbnet.de/service/fundsachen/'], ['Verkaufsstellen', 'https://www.mvbnet.de/service/verkaufsstellen/'], ['Mobilitätshelfer', 'https://www.mvbnet.de/service/mobilitaetshelfer/'], ['Häufige Fragen', 'https://www.mvbnet.de/service/haeufige-fragen/']]) +
      '</ul></nav><div class="ft__social-wrap"><div class="ft__social"><b>Bleib mit uns in Verbindung</b><ul>' +
      Object.entries(SOCIAL).map(([k, v]) => '<li><a href="https://www.mvbnet.de/" target="_blank" rel="noopener" aria-label="' + k + '">' + v + '</a></li>').join('') + '</ul></div>' +
      '<div class="ft__lang"><a href="https://translate.google.com/translate?sl=de&tl=en&u=' + encodeURIComponent(location.href.split('#')[0]) + '" target="_blank" rel="noopener">' + icon('globe') + 'English</a></div></div>' +
      '<div class="meta"><small>© ' + new Date().getFullYear() + ' Magdeburger Verkehrsbetriebe</small><nav aria-label="Rechtliches">' +
      [['Impressum', 'impressum/'], ['Datenschutz', 'datenschutzbestimmungen/'], ['AGB', 'allgemeine-geschaftsbedingungen/'], ['Beförderungsbedingungen', 'fahrinfo/befoerderungsbedingungen/'], ['Tarifbestimmungen', 'fahrkarten/tarifbestimmungen/'], ['Erklärung Barrierefreiheit', 'barrierefreiheitserklaerung/']]
        .map((l) => '<a href="https://www.mvbnet.de/' + l[1] + '" target="_blank" rel="noopener">' + l[0] + '</a>').join('') + '</nav></div></div>';

    // Hilfe-Knopf mit Sprechblase
    const help = M.$('#help');
    help.innerHTML = (M.store.get('coachOff', false) ? '' : '<div class="coach" id="coach"><span>Hast du Fragen?<br>Wir helfen gerne!</span><button aria-label="Schließen" id="coachX">' + icon('close') + '</button></div>') +
      '<button class="chat-fab" id="chatFab" aria-label="Hilfe öffnen">' + icon('chat') + '</button>';
    const cx = M.$('#coachX'); if (cx) cx.onclick = () => { M.$('#coach').remove(); M.store.set('coachOff', true); };
    M.$('#chatFab').onclick = () => {
      C.modal('Wie können wir helfen?', '<div class="tl tl--std"><ul>' + [['Verbindung suchen', '#/verbindungen/verbindung'], ['Abfahrten an meiner Haltestelle', '#/verbindungen/abfahrt'], ['Störungen & Umleitungen', '#/stoerungen'], ['Tickets & Preise', '#/tickets'], ['Jobs & Bewerbung', '#/karriere'], ['Kontakt zur MVB', 'https://www.mvbnet.de/service/kontakte/']]
        .map((t) => '<li><a class="tl__item" href="' + t[1] + '"' + (/^http/.test(t[1]) ? ' target="_blank" rel="noopener"' : ' data-close') + '><div class="tl__inner"><div class="tl__txt"><h3>' + esc(t[0]) + '</h3></div></div>' + icon('arrow', 'tl__arrow') + '</a></li>').join('') + '</ul></div>');
    };
  }

  /* ---------- Suche (wie BVG: Dialog über der Kopfleiste) ---------- */
  function openSearch() {
    const wrap = M.h('<div><div class="backdrop" data-x></div><div class="search" role="dialog" aria-label="Suche"><div class="search__box"><a class="hd__logo" href="#/" data-x>' + M.LOGO + '</a>' +
      '<label class="search__fld"><span>Suchbegriff</span><input type="search" id="sQ" autocomplete="off"></label><button class="btn btn--plain search__close" data-x>Schließen ' + icon('close') + '</button></div><div class="search__res" id="sR"></div></div></div>');
    document.body.appendChild(wrap);
    const q = M.$('#sQ', wrap), r = M.$('#sR', wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target.closest('[data-x]') || e.target.closest('.search__item')) close(); });
    setTimeout(() => q.focus(), 30);
    const pages = MENU.concat([['stoerungen', 'Störungsmeldungen', '#/stoerungen', 'alert'], ['karte', 'Interaktive Karte', '#/verbindungen/karte', 'map']]);
    const run = M.debounce(async () => {
      const t = q.value.trim();
      if (!t) { r.innerHTML = ''; return; }
      await M.Net.load().catch(() => null);
      const nt = M.norm(t);
      const st = M.searchStations(t, 6);
      const ls = (M.Net.data ? M.Net.data.lines : []).filter((l) => l.name.toLowerCase() === t.toLowerCase().replace(/^(linie|tram|bus)\s*/, ''));
      const news = (M.News.list || []).filter((n) => M.norm(n.title).includes(nt)).slice(0, 5);
      const pg = pages.filter((p) => M.norm(p[1]).includes(nt));
      const sec = (title, html) => (html ? '<div class="search__head">' + title + '</div>' + html : '');
      r.innerHTML = sec('Linien', ls.map((l) => '<a class="search__item" href="#/verbindungen/karte?linie=' + l.id + '">' + M.badges(l.line) + '<span>' + (l.mode === 'tram' ? 'Straßenbahn ' : 'Bus ') + esc(l.name) + '<small>' + esc(l.variants.map((v) => v.to).filter((v, i, a) => a.indexOf(v) === i).join(' ↔ ')) + '</small></span></a>').join('')) +
        sec('Haltestellen', st.map((s) => '<a class="search__item" href="#/verbindungen/abfahrt?halt=' + encodeURIComponent(s.id) + '">' + icon('pin') + '<span>' + esc(s.name) + '<small>' + M.lineGroups(M.Net.linesAt(s.id).map((l) => l.line)) + '</small></span></a>').join('')) +
        sec('Seiten', pg.map((p) => '<a class="search__item" href="' + p[2] + '">' + icon(p[3]) + '<span>' + esc(p[1]) + '</span></a>').join('')) +
        sec('Neuigkeiten', news.map((n) => '<a class="search__item" href="#/neuigkeiten/' + esc(n.slug) + '">' + icon('news') + '<span>' + esc(n.title) + '<small>' + M.fmtDate(n.date) + '</small></span></a>').join('')) || '<p class="empty">Nichts gefunden.</p>';
    }, 150);
    q.addEventListener('input', run);
    M.News.load().catch(() => null);
  }

  /* ---------- Seitenwechsel: Streifen fädeln ein → Thema → Streifen fädeln aus ---------- */
  const reduced = () => M.store.get('reduce', false) || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LS = { busy: false, timers: [] };
  const HOLD = 1100;
  function playLoader(text, swap, splash) {
    const el = M.$('#loader');
    if (!el || reduced() || LS.busy) { el && (el.hidden = true); swap(); return; }
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
    if (r.key === 'karriere' && r.segs[1] === 'bewerbung') return 'Bewerbung';
    if (r.key === 'verbindungen' && r.segs[1] === 'karte') return 'Interaktive Karte';
    const p = M.Pages[r.key];
    return (p && p.title) || 'MVB';
  };
  function render(r) {
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { /* egal */ } }
    cleanup = null;
    M.Maps.destroyAll();
    if (C.closeModal) C.closeModal();
    const page = M.Pages[r.key] || M.Pages.home;
    const app = M.$('#app');
    const shellEl = M.$('#page');
    app.innerHTML = '';
    shellEl.className = 'page' + (r.key === 'home' ? ' page--home' : '');
    window.scrollTo(0, 0);
    M.$('#hd').classList.remove('is-hidden');
    try {
      const res = page.render(app, r.segs.slice(1), shellEl);
      if (res && typeof res.then === 'function') res.then((c) => { if (typeof c === 'function') cleanup = c; }).catch((e) => console.error(e));
      else if (typeof res === 'function') cleanup = res;
    } catch (e) { console.error(e); app.innerHTML = '<div class="g"><p class="empty">Diese Seite konnte nicht geladen werden.</p></div>'; }
    const navKey = page.nav || r.key;
    M.$$('[data-nav]').forEach((a) => { if (a.dataset.nav === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = r.key === 'home' ? 'MVB – Magdeburger Verkehrsbetriebe' : pageTitle(r) + ' | MVB';
  }
  function route(first) {
    const r = parse();
    const prev = current;
    current = r;
    const sameArea = prev && prev.key === r.key && (r.key === 'verbindungen' || r.key === 'stoerungen' || prev.segs.join('/') === r.segs.join('/'));
    if (first) { playLoader(pageTitle(r), () => render(r), true); return; }
    if (sameArea) { render(r); return; }
    playLoader(pageTitle(r), () => render(r));
  }

  function start() {
    applyTheme();
    shell();
    applyTheme();
    addEventListener('hashchange', () => route(false));
    route(true);
    M.Net.load().catch(() => null);
    M.News.load().catch(() => null);
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
