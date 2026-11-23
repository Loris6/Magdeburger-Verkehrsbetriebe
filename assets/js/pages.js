/* MVB – Seiten: Startseite, Störungsmeldungen, Neuigkeiten, Tickets, Service, Unternehmen, Netz, Konto */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;
  const P = (M.Pages = M.Pages || {});

  /* =====================================================================
     Startseite
     ===================================================================== */
  P.home = {
    title: 'Startseite', nav: 'home',
    render(el) {
      el.innerHTML =
        '<section class="stage"><div class="stage__art">' + C.heroArt() + '</div>' +
        '<div class="stage__card" id="heroCard"><small>Neu bei der MVB</small><h2>Mobil in Magdeburg – mit Bahn und Bus.</h2><a class="btn white" href="#/verbindungen">' + icon('arrow') + 'Verbindung finden</a></div></section>' +
        '<div class="wrap"><form class="planner" id="planner" autocomplete="off">' +
        '<div class="planner__row"><div id="pFrom"></div><button type="button" class="swapbtn" id="pSwap" aria-label="Start und Ziel tauschen">' + icon('swap') + '</button><div id="pTo"></div>' +
        '<button class="btn" type="submit">Verbindung finden</button><a class="btn ghost" href="#/verbindungen/karte">Planen mit Karte</a></div>' +
        '<div class="planner__opts"><label><b>Wann</b><select id="pWhen"><option value="now">Jetzt losfahren (' + M.fmtTime(new Date()) + ')</option><option value="dep">Abfahrt um …</option><option value="arr">Ankunft um …</option></select></label>' +
        '<label id="pTimeL" hidden><b>Zeit</b><input type="datetime-local" id="pTime"></label>' +
        '<label><b>Weitere Einstellungen</b><select id="pOpt"><option value="">Alle Verkehrsmittel</option><option value="tram">Nur Straßenbahn</option><option value="bus">Nur Bus</option><option value="wc">Barrierefrei</option></select></label></div></form></div>' +

        '<div class="wrap"><section class="sec hints" id="hints"><h2><i>!</i>Wichtige Hinweise</h2><ul><li><div class="skel" style="width:70%"></div></li><li><div class="skel" style="width:55%"></div></li></ul></section>' +

        '<section class="sec grid2"><div><div class="sec__head"><div><h2>Baumaßnahmen &amp; Störungen</h2><p>Die wichtigsten Meldungen auf einen Blick</p></div></div><div class="dlist" id="homeDis"><div class="spin"></div></div>' +
        '<a class="more" href="#/stoerungen">' + icon('arrow') + 'Alle Baumaßnahmen &amp; Störungen</a></div>' +
        '<div><div class="sec__head"><h2>Magdeburgs ÖPNV-Netz</h2></div><div class="ntiles">' +
        ntile('#/verbindungen/karte', 'Interaktive Karte', 'Alle Bahn- und Buslinien, Route mit Umstiegen', 'map') +
        ntile('#/netz', 'Digitale Linienverläufe', 'Alle Infos zu deiner Linie', 'route') +
        ntile('#/verbindungen/abfahrt', 'Haltestellen & Abfahrten', 'Live-Abfahrten an jeder Haltestelle', 'clock') +
        ntile('https://www.mvbnet.de/fahrinfo/netz_fahrplaene/', 'Download Netzpläne', 'Straßenbahn, Bus, Nacht, Fähre (PDF)', 'download', true) +
        '</div></div></section>' +

        '<section class="sec promo"><div class="promo__lead">Noch aktueller<br>und es wäre<br>Zukunft.</div>' +
        '<a class="ptile green" href="#/tickets"><b style="font-size:20px">Hol dir das Abo, das zu dir passt!</b><small>Deutschlandticket &amp; marego-Abo</small>' + icon('arrow', 'go') + '</a>' +
        '<a class="ptile" href="#/karriere"><div><div class="ptile__ic">' + icon('rocket') + '</div><small>MVB Karriere</small><b>Job gesucht? Hier entlang.</b></div>' + icon('arrow', 'go') + '</a>' +
        '<a class="ptile" href="#/unternehmen"><div><div class="ptile__ic">' + icon('building') + '</div><small>MVB Unternehmen</small><b>Infos, Pressemitteilungen &amp; Bauprojekte</b></div>' + icon('arrow', 'go') + '</a></section>' +

        '<section class="sec"><div class="sec__head"><h2>MVB-News</h2></div><div class="news" id="homeNews">' + '<div class="skel" style="height:140px"></div>'.repeat(3) + '</div>' +
        '<a class="link" href="#/neuigkeiten" style="margin-top:22px">' + icon('arrow') + 'Alle Meldungen im Überblick</a></section>' +

        '<section class="sec"><div class="sec__head"><div><h2>MVB-Apps</h2><p>Verbindungen, Abfahrten und Tickets auf deinem Smartphone</p></div></div>' +
        '<div class="apps"><div><div class="apps__item" style="margin-bottom:14px"><i>' + icon('tram') + '</i><div><b>Muvit – ÖPNV in Magdeburg in einer App</b><span>Live-Karte, Verbindungen mit Echtzeit, Abfahrten und Deutschlandticket.</span></div></div>' +
        '<a class="btn" href="https://loris6.github.io/Muvit/" target="_blank" rel="noopener">' + icon('out') + 'Zur Muvit-App</a></div>' +
        '<div class="apps__phone"><div>' + phoneArt() + '</div></div>' +
        '<div class="apps__list"><a class="apps__item" href="https://www.mvbnet.de/fahrkarten/handyticket/" target="_blank" rel="noopener"><i>' + icon('ticket') + '</i><div><b>Handyticket</b><span>Tickets für Magdeburg direkt auf dem Handy</span></div></a>' +
        '<a class="apps__item" href="#/verbindungen"><i>' + icon('route') + '</i><div><b>Fahrplanauskunft</b><span>Verbindungen mit Verspätungen in Echtzeit</span></div></a>' +
        '<a class="apps__item" href="#/verbindungen/karte"><i>' + icon('map') + '</i><div><b>Interaktive Netzkarte</b><span>Alle Linien in ihren Farben – Route mit Umstiegen</span></div></a></div></div></section></div>';

      // Fahrplanauskunft
      const from = C.placeInput(M.$('#pFrom', el), { label: 'Start', placeholder: 'Start', addresses: true });
      const to = C.placeInput(M.$('#pTo', el), { label: 'Ziel', placeholder: 'Ziel', addresses: true });
      M.$('#pSwap', el).onclick = () => { const a = from.get(), b = to.get(), ai = from.input.value, bi = to.input.value; from.set(b); to.set(a); if (!b) from.input.value = bi; if (!a) to.input.value = ai; };
      M.$('#pWhen', el).onchange = (e) => { M.$('#pTimeL', el).hidden = e.target.value === 'now'; if (e.target.value !== 'now' && !M.$('#pTime', el).value) M.$('#pTime', el).value = localIso(new Date()); };
      M.$('#planner', el).onsubmit = async (e) => {
        e.preventDefault();
        const [a, b] = await Promise.all([from.resolve(), to.resolve()]);
        if (!a || !b) { M.toast('Bitte Start und Ziel eingeben.'); (a ? to : from).focus(); return; }
        const q = { from: JSON.stringify(a), to: JSON.stringify(b), when: M.$('#pWhen', el).value, t: M.$('#pTime', el).value, opt: M.$('#pOpt', el).value };
        M.store.set('lastQuery', q);
        location.hash = '#/verbindungen/verbindung?go=1';
      };

      // Inhalte von mvbnet.de
      M.News.load().then((list) => {
        const top = list.filter((n) => M.News.isNews(n));
        const hero = top.find((n) => n.cats.includes(M.CONFIG.wpCats.startseite)) || top[0];
        if (hero) M.$('#heroCard', el).innerHTML = '<small>Neu bei der MVB · ' + M.fmtDate(hero.date) + '</small><h2>' + esc(hero.title) + '</h2><a class="btn white" href="#/neuigkeiten/' + esc(hero.slug) + '">' + icon('arrow') + 'Mehr erfahren</a>';
        const hints = list.slice(0, 3);
        M.$('#hints ul', el).innerHTML = hints.length ? hints.map((n) => '<li><b>' + esc(n.title.split(/[:–-]/)[0].trim()) + '</b>: ' + esc(trimTo(n.excerpt || n.text, 120)) + ' <a href="#/neuigkeiten/' + esc(n.slug) + '">Mehr</a></li>').join('') : '<li>Keine Hinweise.</li>';
        M.$('#homeNews', el).innerHTML = top.slice(0, 3).map(newsCard).join('') || '<p class="muted">Keine Meldungen verfügbar.</p>';
      });
      C.allDisruptions().then((all) => {
        const box = M.$('#homeDis', el);
        if (!box) return;
        const list = all.slice(0, 5);
        P._dis = all;
        box.innerHTML = list.length ? list.map(C.disItem).join('') : '<p class="muted">Zurzeit keine Meldungen.</p>';
        box.onclick = (e) => { const b = e.target.closest('[data-dis]'); if (b) C.openDisruption(all.find((x) => x.id === b.dataset.dis)); };
      });
    }
  };
  function ntile(href, t, s, ic, ext) {
    return '<a class="ntile" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span class="ntile__pic">' + miniNet(ic) + '</span><span><b>' + esc(t) + '</b><span>' + esc(s) + '</span></span>' + icon(ext ? 'out' : 'arrow') + '</a>';
  }
  function miniNet(ic) {
    const c = ['--line-tram-1', '--line-tram-9', '--line-tram-4', '--line-tram-10'];
    if (ic === 'map') return '<svg viewBox="0 0 100 80"><g fill="none" stroke-width="5" stroke-linecap="round"><path d="M5 20 C30 22 40 50 95 45" stroke="var(' + c[0] + ')"/><path d="M8 60 C35 55 55 25 92 15" stroke="var(' + c[1] + ')"/><path d="M50 5 V75" stroke="var(' + c[2] + ')"/></g><g fill="#fff" stroke="#1B1F1D" stroke-width="2"><circle cx="50" cy="38" r="5"/><circle cx="25" cy="25" r="3.5"/><circle cx="78" cy="22" r="3.5"/></g></svg>';
    if (ic === 'route') return '<svg viewBox="0 0 100 80"><path d="M20 8 V72" stroke="var(--line-tram-9)" stroke-width="7" stroke-linecap="round"/><g fill="#fff" stroke="var(--line-tram-9)" stroke-width="3"><circle cx="20" cy="12" r="5"/><circle cx="20" cy="32" r="5"/><circle cx="20" cy="52" r="5"/><circle cx="20" cy="70" r="5"/></g><g fill="var(--text-mute)"><rect x="34" y="9" width="44" height="6" rx="3"/><rect x="34" y="29" width="36" height="6" rx="3"/><rect x="34" y="49" width="50" height="6" rx="3"/><rect x="34" y="67" width="30" height="6" rx="3"/></g></svg>';
    if (ic === 'clock') return '<svg viewBox="0 0 100 80"><rect x="10" y="10" width="80" height="60" rx="8" fill="#13241B"/><g font-family="Rubik,Arial" font-size="10" font-weight="700"><rect x="18" y="20" width="14" height="12" rx="2" fill="var(--line-tram-9)"/><text x="25" y="29.5" fill="#fff" text-anchor="middle">9</text><text x="38" y="30" fill="#FFB238">Reform</text><text x="82" y="30" fill="#86EA8C" text-anchor="end">2</text><rect x="18" y="42" width="14" height="12" rx="2" fill="var(--line-tram-4)"/><text x="25" y="51.5" fill="#fff" text-anchor="middle">4</text><text x="38" y="52" fill="#FFB238">Cracau</text><text x="82" y="52" fill="#F0954F" text-anchor="end">6</text></g></svg>';
    return '<svg viewBox="0 0 100 80"><rect x="22" y="8" width="56" height="64" rx="4" fill="#fff" stroke="var(--line-strong)" stroke-width="2"/><g fill="none" stroke-width="3"><path d="M30 25 H70" stroke="var(--line-tram-1)"/><path d="M30 35 C45 35 50 50 70 50" stroke="var(--line-tram-2)"/><path d="M50 15 V65" stroke="var(--line-tram-4)"/></g></svg>';
  }
  function phoneArt() {
    return '<svg viewBox="0 0 180 340" width="100%" height="100%"><rect width="180" height="340" fill="#131418"/><g fill="none" stroke-width="6" stroke-linecap="round" opacity=".9"><path d="M-10 90 C60 100 80 160 190 150" stroke="var(--line-tram-9)"/><path d="M-10 170 C70 160 100 110 190 80" stroke="var(--line-tram-1)"/><path d="M90 -10 V200" stroke="var(--line-tram-4)"/></g>' +
      '<rect x="0" y="200" width="180" height="140" rx="16" fill="#18191D"/><rect x="74" y="208" width="32" height="4" rx="2" fill="#47484B"/>' +
      '<g font-family="Rubik,Arial" font-weight="700" font-size="10"><rect x="14" y="226" width="16" height="16" rx="2" fill="var(--mode-tram)"/><text x="22" y="237" fill="#fff" font-size="5" text-anchor="middle">Tram</text><rect x="33" y="226" width="18" height="16" rx="3" fill="var(--line-tram-9)"/><text x="42" y="237.5" fill="#fff" text-anchor="middle">9</text><text x="58" y="238" fill="#fff">Reform</text><text x="166" y="238" fill="#86EA8C" text-anchor="end">2 Min.</text>' +
      '<rect x="14" y="256" width="16" height="16" rx="2" fill="var(--mode-tram)"/><text x="22" y="267" fill="#fff" font-size="5" text-anchor="middle">Tram</text><rect x="33" y="256" width="18" height="16" rx="3" fill="var(--line-tram-4)"/><text x="42" y="267.5" fill="#fff" text-anchor="middle">4</text><text x="58" y="268" fill="#fff">Cracau</text><text x="166" y="268" fill="#7596AC" text-anchor="end">4 Min.</text>' +
      '<circle cx="22" cy="294" r="8" fill="var(--mode-bus)"/><text x="22" y="296" fill="#fff" font-size="5" text-anchor="middle">Bus</text><rect x="33" y="286" width="20" height="16" rx="8" fill="var(--line-bus)"/><text x="43" y="297.5" fill="#fff" text-anchor="middle">73</text><text x="60" y="298" fill="#fff">Ottersleben</text><text x="166" y="298" fill="#E67A35" text-anchor="end">7 Min.</text></g></svg>';
  }
  const trimTo = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + ' …' : s; };
  const localIso = (dt) => new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  M.localIso = localIso;
  function newsCard(n) {
    return '<a class="ncard" href="#/neuigkeiten/' + esc(n.slug) + '"><time datetime="' + esc(n.date) + '">' + M.fmtDate(n.date) + '</time><b>' + esc(n.title) + '</b>' + (n.excerpt ? '<p>' + esc(trimTo(n.excerpt, 160)) + '</p>' : '') + icon('arrow', 'go') + '</a>';
  }

  /* =====================================================================
     Störungsmeldungen
     ===================================================================== */
  P.stoerungen = {
    title: 'Störungsmeldungen', nav: 'verbindungen',
    render(el) {
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Verbindungen', '#/verbindungen'], ['Störungsmeldungen']]) +
        C.phead('Störungsmeldungen', 'Baustellen, Umleitungen und Störungen bei Straßenbahn und Bus der MVB – direkt von <a href="https://www.mvbnet.de/baustellen/" target="_blank" rel="noopener">mvbnet.de</a> und aus den Verkehrsmeldungen, automatisch aktualisiert. Jede Meldung hat eine Karte mit Sperrung und neuem Fahrweg.') +
        '<h2 style="font-size:var(--fs-h3)">Verkehrsmeldungen eingrenzen</h2><div class="filterbar"><select class="inp" id="fLine"><option value="">Linie auswählen</option></select>' +
        '<select class="inp" id="fKind"><option value="">Alle Meldungen</option><option value="closed">Sperrungen</option><option value="detour">Umleitungen</option><option value="sev">Ersatzverkehr</option><option value="moved">Haltestelle verlegt</option></select>' +
        '<select class="inp" id="fAge"><option value="60">Letzte 60 Tage</option><option value="14">Letzte 14 Tage</option><option value="365">Alle</option></select></div>' +
        '<span class="count" id="fCount">Lade Meldungen …</span><div id="dGroups"><div class="spin"></div></div></div>';
      let all = [];
      const draw = () => {
        const line = M.$('#fLine', el).value, kind = M.$('#fKind', el).value, age = +M.$('#fAge', el).value;
        const list = all.filter((x) => (!line || x.lines.some((l) => l.mode + l.name === line)) && (!kind || x.kind.includes(kind)) && (Date.now() - new Date(x.date) < age * 864e5 || (x.until && new Date(x.until) > Date.now())));
        M.$('#fCount', el).textContent = 'Es wurden ' + list.length + ' Ergebnisse gefunden.';
        const groups = [['tram', 'Straßenbahn', list.filter((x) => x.lines.some((l) => l.mode === 'tram'))], ['bus', 'Bus', list.filter((x) => x.lines.some((l) => l.mode === 'bus'))], ['all', 'Allgemein', list.filter((x) => !x.lines.length)]];
        M.$('#dGroups', el).innerHTML = groups.filter((g) => g[2].length).map((g) => '<section class="dgroup"><h2>' + (g[0] === 'all' ? '<span class="ph-ic" style="width:34px;height:34px;border-radius:8px;background:var(--mvb-green);color:#fff;display:grid;place-items:center">' + icon('alert') + '</span>' : M.modeBadge(g[0], { lg: true })) + g[1] + '</h2>' +
          g[2].map((x) => '<div class="acc" data-id="' + esc(x.id) + '"><button aria-expanded="false"><div><div class="ditem__t">' + (x.lines.length ? M.lineGroups(x.lines) : '') + '<span>' + esc(x.title) + '</span>' + M.tagsHtml(x.kind) + '</div><div class="ditem__meta">' + icon('cal') + ' ' + (x.until ? 'Von ' + M.fmtDate(x.from) + ' bis ' + M.fmtDate(x.until) : 'Von ' + M.fmtDate(x.date) + ' · bis auf Weiteres') + '</div></div>' + icon('down') + '</button><div class="acc__body" hidden></div></div>').join('') + '</section>').join('') || '<p class="empty">Keine Meldungen für diese Auswahl.</p>';
      };
      C.allDisruptions().then((list) => {
        all = list;
        const ls = M.sortLines([].concat(...all.map((x) => x.lines)).filter((l, i, a) => a.findIndex((m) => m.name === l.name && m.mode === l.mode) === i));
        M.$('#fLine', el).insertAdjacentHTML('beforeend', ls.map((l) => '<option value="' + esc(l.mode + l.name) + '">' + (l.mode === 'tram' ? 'Straßenbahn ' : 'Bus ') + esc(l.name) + '</option>').join(''));
        draw();
        const q = new URLSearchParams(location.hash.split('?')[1] || '');
        if (q.get('id')) { const a = M.$('.acc[data-id="' + CSS.escape(q.get('id')) + '"] > button', el); if (a) { a.click(); setTimeout(() => a.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); } }
      });
      ['#fLine', '#fKind', '#fAge'].forEach((s) => { M.$(s, el).onchange = draw; });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('.acc > button');
        if (!b) return;
        const acc = b.parentElement, body = M.$('.acc__body', acc);
        const open = !acc.classList.contains('open');
        acc.classList.toggle('open', open); b.setAttribute('aria-expanded', open); body.hidden = !open;
        if (open && !body.innerHTML) {
          const x = all.find((y) => y.id === acc.dataset.id);
          body.innerHTML = C.disBody(x);
          C.mountDisMap(M.$('.dmapbox', body), x);
        }
      });
    }
  };

  /* =====================================================================
     Neuigkeiten
     ===================================================================== */
  P.neuigkeiten = {
    title: 'Neuigkeiten', nav: 'unternehmen',
    async render(el, args) {
      if (args[0]) return P.neuigkeit.render(el, args);
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Neuigkeiten']]) + C.phead('MVB-News', 'Alle Meldungen der Magdeburger Verkehrsbetriebe – automatisch von mvbnet.de übernommen.') +
        '<div class="tabs" id="nTabs"><button class="on" data-f="all">Alle</button><button data-f="news">News</button><button data-f="work">Baustellen &amp; Verkehr</button></div><div class="news" id="nList"><div class="spin"></div></div><p class="muted" id="nSrc" style="margin-top:20px;font-size:13px"></p></div>';
      const list = await M.News.load();
      let f = 'all';
      const draw = () => {
        const ls = list.filter((n) => f === 'all' || (f === 'news' ? M.News.isNews(n) : M.News.isWork(n)));
        M.$('#nList', el).innerHTML = ls.map((n) => newsCard(n)).join('') || '<p class="empty">Keine Meldungen.</p>';
      };
      draw();
      M.$('#nSrc', el).textContent = M.News.src === 'live' ? 'Live von mvbnet.de · aktualisiert ' + M.fmtTime(new Date()) + ' Uhr' : 'Gespeicherter Stand (' + M.News.src.replace('snapshot ', '') + ')';
      M.$('#nTabs', el).onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; f = b.dataset.f; M.$$('#nTabs button', el).forEach((x) => x.classList.toggle('on', x === b)); draw(); };
    }
  };
  P.neuigkeit = {
    title: 'Neuigkeiten', nav: 'unternehmen',
    async render(el, args) {
      el.innerHTML = '<div class="wrap"><div class="spin"></div></div>';
      const n = await M.News.get(args[0]);
      if (!n) { el.innerHTML = '<div class="wrap">' + C.crumbs([['Neuigkeiten', '#/neuigkeiten'], ['Nicht gefunden']]) + '<p class="empty">Diese Meldung gibt es nicht (mehr).</p></div>'; return; }
      const work = M.News.isWork(n);
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Neuigkeiten', '#/neuigkeiten'], [n.title]]) +
        '<article class="prose" style="max-width:900px"><p class="muted">' + M.fmtDateLong(n.date) + '</p><h1 style="font-size:clamp(26px,3.4vw,42px);margin:8px 0 14px">' + esc(n.title) + '</h1>' +
        (n.lines.length ? '<p>' + M.lineGroups(n.lines, { sm: false }) + ' ' + M.tagsHtml(n.kind) + '</p>' : '') +
        (work ? '<div class="dmapbox"></div>' : '') +
        (n.img && !work ? '<img src="' + esc(n.img) + '" alt="" referrerpolicy="no-referrer" style="width:100%;margin:10px 0 20px">' : '') +
        C.cleanHtml(n.html) + '<p style="margin-top:24px"><a class="link" href="' + esc(n.link) + '" target="_blank" rel="noopener">Originalmeldung auf mvbnet.de ' + icon('out') + '</a></p>' +
        '<a class="more" href="#/neuigkeiten">' + icon('arrowL') + 'Alle Meldungen</a></article></div>';
      if (work) C.mountDisMap(M.$('.dmapbox', el), { slug: n.slug, id: 'n' + n.id, title: n.title, text: n.text, lines: n.lines });
    }
  };

  /* =====================================================================
     Abos & Tickets (Tarife wie in Muvit)
     ===================================================================== */
  const TICKETS = [
    { ic: 'ticket', name: 'Einzelfahrt Magdeburg', zone: 'Preisstufe MD', price: 3.30, app: 3.00, child: 2.50, note: 'Eine Fahrt in eine Richtung im Stadtgebiet, Umsteigen inklusive. Per App ca. 10 % günstiger.', tags: ['Straßenbahn', 'Bus', 'Umsteigen inkl.'] },
    { ic: 'ticket', name: 'Kurzstrecke', zone: 'MVB', price: 2.00, app: 1.80, note: 'Für kurze Fahrten – Geltungsbereich laut MVB-Tarif.', tags: ['Kurze Wege'] },
    { ic: 'clock', name: '24-Stunden-Karte', zone: 'Preisstufe MD', price: null, note: 'Lohnt sich ab der 2. Fahrt, Kinder fahren mit.', tags: ['Ab 2. Fahrt günstiger', 'Kinder fahren mit'] },
    { ic: 'cal', name: 'Wochenkarte', zone: 'Preisstufe MD', price: null, note: 'Sieben Tage beliebig oft fahren im Stadtgebiet Magdeburg.', tags: ['7 Tage'] },
    { ic: 'cal', name: 'Monatskarte', zone: 'Preisstufe MD', price: null, note: 'Einen Monat beliebig oft fahren – ohne Abo.', tags: ['1 Monat', 'Ohne Abo'] },
    { ic: 'star', name: 'Deutschlandticket', zone: 'bundesweit', price: 63.00, unit: '/ Monat', note: 'Unbegrenzt im Nah- und Regionalverkehr in ganz Deutschland. Neuer Preis ab Januar 2027 – siehe MVB-News.', tags: ['Monatsabo', 'Ganz Deutschland'], hl: true },
    { ic: 'briefcase', name: 'Deutschlandticket Job', zone: 'bundesweit', price: null, note: 'Über den Arbeitgeber: mindestens 25 % Zuschuss plus 5 % Rabatt.', tags: ['Arbeitgeber-Zuschuss'] },
    { ic: 'user', name: 'Schülerticket', zone: 'Magdeburg', price: null, note: 'Für Schülerinnen und Schüler – Infos bei der MVB.', tags: ['Schule'] },
    { ic: 'heart', name: 'Sozialticket', zone: 'Magdeburg', price: null, note: 'Ermäßigte Monatskarte für Berechtigte.', tags: ['Ermäßigt'] }
  ];
  const money = (v) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  P.tickets = {
    title: 'Abos & Tickets', nav: 'tickets',
    render(el) {
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Abos & Tickets']]) + C.phead('Abos & Tickets', 'Alle Fahrkarten für Straßenbahn und Bus in Magdeburg – vom Einzelticket bis zum Deutschlandticket. Stand marego-Tarif 08/2026, ohne Gewähr.') +
        '<section><h2 style="margin-bottom:8px">Abo kündigen</h2><p class="muted">Wenn du dein <b>Abo kündigen</b> möchtest, kannst du das hier tun.</p><p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><a class="more" style="margin:0" href="https://abo.mvbnet.de/" target="_blank" rel="noopener">' + icon('arrow') + 'Abo verwalten (mit Login)</a><a class="more" style="margin:0" href="#/konto">' + icon('arrow') + 'MVB-Konto</a></p></section>' +
        '<section class="sec"><div class="sec__head"><h2>Tickets</h2></div><div class="tgrid">' + TICKETS.map((t) =>
          '<article class="tcard"' + (t.hl ? ' style="border-color:var(--mvb-green)"' : '') + '><div class="tcard__ic">' + icon(t.ic) + '</div><div><h3>' + esc(t.name) + '</h3><p>' + esc(t.note) + '</p>' +
          '<div class="price">' + (t.price != null ? '<span><b>' + money(t.price) + '</b> ' + esc(t.unit || '') + '</span>' : '<span class="muted">Preis siehe marego-Tarifauskunft</span>') + (t.app ? '<span>App: ' + money(t.app) + '</span>' : '') + (t.child ? '<span>Kind: ' + money(t.child) + '</span>' : '') + '</div>' +
          '<div class="tags">' + [t.zone].concat(t.tags).map((x) => '<span class="tag green">' + esc(x) + '</span>').join('') + '</div></div></article>').join('') + '</div>' +
        '<p style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="https://www.mvbnet.de/fahrkarten/" target="_blank" rel="noopener">' + icon('out') + 'Tickets bei der MVB</a><a class="btn ghost" href="https://www.marego-heimat.de/" target="_blank" rel="noopener">marego-Tarifauskunft</a></p></section></div>';
    }
  };

  /* =====================================================================
     Service & Kontakt
     ===================================================================== */
  P.service = {
    title: 'Service & Kontakt', nav: 'service',
    render(el) {
      const T = [
        ['Abo', 'Abo verwalten oder kündigen, Kundennummer finden, Schülerticket verloren', 'https://abo.mvbnet.de/'],
        ['Apps', 'Muvit-App, Handyticket, Hilfe zu Ticket-Kauf per App', '#/'],
        ['Kontakt', 'Kundencenter, Telefon und Anliegen an die MVB', 'https://www.mvbnet.de/service/kontakte/'],
        ['Verkaufsstellen & Kundencenter', 'Wo du Tickets und Beratung bekommst', 'https://www.mvbnet.de/service/verkaufsstellen/'],
        ['Fundsachen', 'Etwas in Bahn oder Bus verloren?', 'https://www.mvbnet.de/service/fundsachen/'],
        ['Fahrkartenkontrolle', 'Erhöhtes Beförderungsentgelt, Fragen zur Kontrolle', 'https://www.mvbnet.de/service/fahrkartenkontrolle/'],
        ['Mobilitätshelfer', 'Begleitung und Hilfe beim Fahren', 'https://www.mvbnet.de/service/mobilitaetshelfer/'],
        ['Häufige Fragen', 'Antworten auf die wichtigsten Fragen', 'https://www.mvbnet.de/service/haeufige-fragen/'],
        ['Störungsmeldungen', 'Baustellen, Umleitungen und Störungen mit Karte', '#/stoerungen']
      ];
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Service & Kontakt']]) + C.phead('Service & Kontakt', 'Im Service- und Kontaktbereich findest du alle Infos zu unseren wichtigsten Servicethemen. Bequem von deinem Sofa aus.') +
        '<h2 style="margin-bottom:18px">Häufige Themen</h2><div class="topics">' + T.map((t, i) => '<a class="topic' + (i === 8 ? ' hl' : '') + '" href="' + t[2] + '"' + (t[2].startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '><div><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div>' + icon(t[2].startsWith('http') ? 'out' : 'arrow') + '</a>').join('') + '</div></div>';
    }
  };

  /* =====================================================================
     Unternehmen
     ===================================================================== */
  P.unternehmen = {
    title: 'Unternehmen', nav: 'unternehmen',
    render(el) {
      const T = [
        ['Unternehmensprofil', 'Die MVB stellt sich vor', 'https://www.mvbnet.de/unternehmen/unternehmensprofil/'],
        ['Zahlen & Fakten', 'Linien, Fahrzeuge, Fahrgäste', 'https://www.mvbnet.de/unternehmen/zahlen-fakten/'],
        ['Netzausbau', 'Bauprojekte für das Straßenbahnnetz', 'https://www.mvbnet.de/unternehmen/netzausbau/'],
        ['Neuigkeiten', 'Alle MVB-News, automatisch aktualisiert', '#/neuigkeiten'],
        ['Karriere', 'Jobs, Ausbildung und Bewerbung direkt hier', '#/karriere'],
        ['Presse', 'Pressemitteilungen und Pressefotos', 'https://www.mvbnet.de/presse/'],
        ['Fahrgastbeirat', 'Die Stimme der Fahrgäste', 'https://www.mvbnet.de/unternehmen/fahrgastbeirat/']
      ];
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Unternehmen']]) + C.phead('Unternehmen', 'Die Magdeburger Verkehrsbetriebe bringen Magdeburg mit Straßenbahn und Bus in Bewegung – rund um die Uhr.') +
        '<div class="topics">' + T.map((t, i) => '<a class="topic' + (i === 4 ? ' hl' : '') + '" href="' + t[2] + '"' + (t[2].startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '><div><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div>' + icon(t[2].startsWith('http') ? 'out' : 'arrow') + '</a>').join('') + '</div>' +
        '<section class="sec"><div class="sec__head"><h2>Aktuelles aus dem Unternehmen</h2></div><div class="news" id="uNews"><div class="spin"></div></div></section></div>';
      M.News.load().then((l) => { const b = M.$('#uNews', el); if (b) b.innerHTML = l.filter((n) => M.News.isNews(n)).slice(0, 6).map(newsCard).join(''); });
    }
  };

  /* =====================================================================
     Netz & Linien
     ===================================================================== */
  P.netz = {
    title: 'Netz & Linien', nav: 'verbindungen',
    async render(el) {
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Verbindungen', '#/verbindungen'], ['Netz & Linien']]) + C.phead('Digitale Linienverläufe', 'Alle Straßenbahn- und Buslinien der MVB mit ihren Haltestellen. Ein Klick öffnet die Linie auf der interaktiven Karte.') + '<div id="nl"><div class="spin"></div></div>' +
        '<section class="sec"><h2 style="margin-bottom:14px">Netzpläne zum Herunterladen</h2><a class="btn" href="https://www.mvbnet.de/fahrinfo/netz_fahrplaene/" target="_blank" rel="noopener">' + icon('download') + 'Netz- und Fahrpläne bei der MVB</a></section></div>';
      const d = await M.Net.load();
      const grp = (title, ls) => ls.length ? '<h2 style="margin:24px 0 12px;font-size:var(--fs-h3)">' + title + '</h2><div class="topics">' + ls.map((l) =>
        '<a class="topic" href="#/verbindungen/karte?linie=' + l.id + '"><div><b style="display:flex;align-items:center;gap:10px">' + M.badges(l.line, { lg: true }) + ' ' + esc(l.variants[0].to) + '</b><span>' + esc(l.variants.map((v) => v.to).filter((v, i, a) => a.indexOf(v) === i).join(' ↔ ')) + ' · ' + l.variants[0].stops.length + ' Halte · ' + l.variants[0].times[l.variants[0].times.length - 1] + ' Min.</span></div>' + icon('arrow') + '</a>').join('') + '</div>' : '';
      M.$('#nl', el).innerHTML = grp('Straßenbahn', d.lines.filter((l) => l.mode === 'tram' && !M.isNight(l.name))) + grp('Bus', d.lines.filter((l) => l.mode === 'bus' && !M.isNight(l.name))) + grp('Nachtlinien', d.lines.filter((l) => M.isNight(l.name))) +
        '<p class="muted" style="font-size:13px;margin-top:16px">Quelle: ' + esc(d.source) + ' · Stand ' + M.fmtDate(d.generated) + '</p>';
    }
  };

  /* =====================================================================
     MVB-Konto (nur auf diesem Gerät)
     ===================================================================== */
  P.konto = {
    title: 'MVB-Konto', nav: 'konto',
    render(el) {
      const u = M.store.get('user', null);
      if (u) {
        el.innerHTML = '<div class="wrap">' + C.crumbs([['MVB-Konto']]) + C.phead('Hallo ' + u.name + '!', 'Dein MVB-Konto auf diesem Gerät.', 'user') +
          '<div class="topics"><a class="topic" href="#/verbindungen/abfahrt"><div><b>Meine Haltestellen</b><span>' + (M.store.get('recentStops', []).map((s) => s.name).slice(0, 3).join(', ') || 'Noch keine') + '</span></div>' + icon('arrow') + '</a>' +
          '<a class="topic" href="https://abo.mvbnet.de/" target="_blank" rel="noopener"><div><b>Abo verwalten</b><span>Im Aboportal der MVB</span></div>' + icon('out') + '</a>' +
          '<button class="topic" id="logout"><div><b>Abmelden</b><span>' + esc(u.mail) + '</span></div>' + icon('arrow') + '</button></div></div>';
        M.$('#logout', el).onclick = () => { M.store.set('user', null); M.toast('Abgemeldet.'); P.konto.render(el); };
        return;
      }
      el.innerHTML = '<div class="wrap"><div class="auth"><div style="width:120px;margin:0 auto">' + M.LOGO + '</div><h1 style="font-size:var(--fs-h2);margin-top:18px">Anmeldung</h1>' +
        '<form id="login"><label class="fitem"><span>E-Mail</span><input class="inp" type="email" name="mail" required autocomplete="email"></label><label class="fitem"><span>Passwort</span><input class="inp" type="password" name="pw" required minlength="6" autocomplete="current-password"></label>' +
        '<label class="check"><input type="checkbox" name="keep"><span>Angemeldet bleiben</span></label><button class="btn" type="submit">Anmelden</button><button class="btn ghost" type="button" id="reg">Registrieren</button>' +
        '<p class="muted" style="font-size:12.5px;text-align:center">Dein Konto wird nur auf diesem Gerät gespeichert.</p></form>' +
        '<a class="more" href="#/">' + icon('arrowL') + 'zurück ohne Anmeldung</a></div></div>';
      const f = M.$('#login', el);
      const go = (e) => { if (e) e.preventDefault(); if (!f.reportValidity()) return; const mail = f.mail.value.trim(); M.store.set('user', { mail, name: mail.split('@')[0] }); M.toast('Willkommen!'); P.konto.render(el); };
      f.onsubmit = go; M.$('#reg', el).onclick = () => go();
    }
  };
})(window.MVB = window.MVB || {});
