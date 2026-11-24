/* MVB – Seiten im BVG-Aufbau: Startseite, Störungsmeldungen, Neuigkeiten, Abos & Tickets, Service & Kontakt, Unternehmen, Netz, Konto */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;
  const P = (M.Pages = M.Pages || {});
  const localIso = (dt) => new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  M.localIso = localIso;
  const trimTo = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + ' …' : s; };

  /* Werbe-Kacheln (RelatedTeaser) mit Einblend-Animation */
  function relTeaser(head, cards, copy) {
    return '<div class="rel" data-rel><section class="rel__grid"><h2 class="rel__head">' + head + '</h2>' + cards.map((c) => {
      const ext = /^https?:/.test(c.href);
      const attrs = ' href="' + esc(c.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '');
      if (c.accent) return '<a class="rel__card rel__card--accent"' + attrs + '><div class="rel__inner"><div class="rel__top">' + esc(c.top) + '</div><div class="rel__text">' + esc(c.text) + '</div></div>' + icon('arrow', 'rel__arrow') + '</a>';
      const media = c.img ? '<figure class="rel__img"><img src="' + esc(c.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></figure>' : c.svg ? '<figure class="rel__img">' + c.svg + '</figure>' : '<div class="rel__icon">' + icon(c.ic || 'star') + '</div>';
      return '<a class="rel__card"' + attrs + '>' + media + '<div class="rel__top">' + esc(c.top) + '</div><div class="rel__text">' + esc(c.text) + '</div>' + icon(ext ? 'out' : 'arrow', 'rel__arrow') + '</a>';
    }).join('') + '</section>' + (copy ? '<div class="rel__copy"><span style="font-size:1.25rem">©</span><button class="btn btn--plain btn--sm" data-copy>Bildhinweise</button></div>' : '') + '</div>';
  }
  function armRel(root) {
    M.$$('[data-rel]', root).forEach((el) => {
      if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } }), { threshold: .15 });
      io.observe(el);
    });
    root.addEventListener('click', (e) => { if (e.target.closest('[data-copy]')) C.modal('Urheberhinweise', '<p style="font-size:1rem">Fotos: Magdeburger Verkehrsbetriebe (mvbnet.de). Grafiken: MVB.</p>'); });
  }
  M.relTeaser = relTeaser; M.armRel = armRel;

  /* =====================================================================
     Startseite
     ===================================================================== */
  P.home = {
    title: 'Startseite', nav: 'home',
    render(el) {
      el.innerHTML =
        '<div class="stage-wrap"><header class="stage g"><figure class="stage__fig"><div id="stageFig" style="height:100%">' + C.heroArt() + '</div><div class="stage__copy"><button class="copy-btn" aria-label="Bildhinweis" data-copy><span>©</span></button></div></figure>' +
        '<div class="stage__card" id="stageCard"><h2><div class="stage__top">Neu bei der MVB</div><div class="stage__h">Mobil in Magdeburg – mit Bahn und Bus.</div></h2><a class="btn stage__cta" href="#/verbindungen">' + icon('arrow') + 'Verbindung finden</a></div>' +
        '</header>' +
        '<div class="g g-home"><section class="cf cf--home"><form class="cf__form" id="planner" autocomplete="off">' +
        '<div class="cf__start" id="pFrom"></div><button type="button" class="cf__swap" id="pSwap" aria-label="Start und Ziel tauschen">' + icon('swap') + '</button><div class="cf__dest" id="pTo"></div>' +
        '<button class="btn btn--fill cf__submit" type="submit">Verbindung finden</button><a class="btn cf__map" href="#/verbindungen/karte" id="pMap"><span class="m-only">Detailsuche</span><span class="d-only">Planen mit Karte</span></a>' +
        '<div class="cf__fld cf__when"><label><select id="pWhen"><option value="now">Jetzt losfahren (' + M.fmtTime(new Date()) + ')</option><option value="dep">Abfahrt</option><option value="arr">Ankunft</option></select><span>Wann</span></label><div class="cf__fld-icon">' + icon('down') + '</div></div>' +
        '<button type="button" class="cf__more" id="pMore"><span class="cf__more-t"><b>Weitere Einstellungen</b>Barrierefreiheit und Verkehrsmittel</span><span class="cf__more-i">' + icon('gear') + '</span></button>' +
        '<div class="cf__fld cf__time" id="pTimeW" hidden><label><input type="datetime-local" id="pTime"><span>Datum und Uhrzeit</span></label></div>' +
        '</form></section></div></div>' +

        '<aside class="g g-home info"><div><div class="info__box"><div class="info__head"><span class="info__icon">' + M.ICON_I + '</span><h2>Wichtige Hinweise</h2></div><div class="rt" id="hints"><ul><li><div class="skel" style="width:70%"></div></li><li><div class="skel" style="width:55%"></div></li><li><div class="skel" style="width:62%"></div></li></ul></div></div></div></aside>' +

        '<div class="g fgi"><div class="dis"><h2 class="dis__h">Baumaßnahmen &amp; Störungen</h2><p>Die wichtigsten Störungsmeldungen auf einen Blick</p><ul class="dis__list" id="homeDis"><li><div class="spin"></div></li></ul>' +
        '<a class="btn btn--outline btn--sm btn--icon dis__all" href="#/stoerungen">' + icon('arrow') + 'Alle Baumaßnahmen &amp; Störungen</a></div>' +
        '<div class="itc"><h2 class="itc__title">Magdeburgs ÖPNV-Netz</h2><ul class="itc__list">' +
        itc('https://www.mvbnet.de/fahrinfo/netz_fahrplaene/', 'Download Netzpläne', 'Straßenbahn, Bus, Nacht, Fähre', 'net', true) +
        itc('#/netz', 'Digitale Linienverläufe', 'Alle Infos zu deiner Linie', 'lines') +
        itc('#/verbindungen/abfahrt', 'Stationsübersicht', 'Alle Haltestellen im Überblick', 'stops') + '</ul></div></div>' +

        '<div class="g g-home stack">' + relTeaser('Noch aktueller und es wäre Zukunft', [
          { accent: true, top: 'Hol dir das Abo, das zu dir passt!', text: 'Jetzt finden', href: '#/tickets' },
          { ic: 'rocket', top: 'MVB Karriere', text: 'Job gesucht? Hier entlang.', href: '#/karriere' },
          { ic: 'building', top: 'MVB Unternehmen', text: 'Infos, Pressemitteilungen & Bauprojekte', href: '#/unternehmen' },
          { svg: C.netArt('map'), top: 'Interaktive Karte', text: 'Alle Linien in ihren Farben', href: '#/verbindungen/karte', id: 'r4' },
          { ic: 'ticketS', top: 'Deutschlandticket', text: 'Alle wichtigen Infos hier', href: 'https://www.mvbnet.de/fahrkarten/deutschlandticket/', id: 'r5' },
          { ic: 'heart', top: 'Sozialticket', text: 'Mobil mit kleinem Budget', href: 'https://www.mvbnet.de/fahrkarten/sozialticket/', id: 'r6' },
          { ic: 'star', top: 'MVB-News', text: 'Aktuelles aus Magdeburg', href: '#/neuigkeiten', id: 'r7' },
          { ic: 'user', top: 'Ausbildung 2027', text: 'Starte deine Karriere bei der MVB', href: '#/karriere', id: 'r8' }
        ], true) +
        '<div class="press"><h2 class="press__h">MVB-News</h2><div class="press__grid" id="homeNews">' + '<div class="press__item"><div class="skel" style="width:30%"></div><div class="skel" style="width:90%;height:1.25rem"></div><div class="skel" style="width:70%;height:1.25rem"></div></div>'.repeat(3) + '</div>' +
        '<a class="btn btn--plain btn--icon press__all" href="#/neuigkeiten">' + icon('arrow') + 'Alle Meldungen im Überblick</a></div>' +
        '<div class="apps"><h2>MVB-Apps</h2><p>Verbindungen, Abfahrten und Tickets auf deinem Smartphone</p><div class="apps__grid">' +
        '<div class="ht"><div class="ht__content"><div class="ht__title"><span class="ht__thumb">' + appIcon('muvit') + '</span><h3>ÖPNV in Magdeburg in einer App</h3></div>' +
        '<p class="ht__text">Muvit zeigt dir Verbindungen mit Echtzeit, alle Abfahrten, die Live-Karte mit allen Straßenbahnen und Bussen und dein Deutschlandticket – alles in einer App.</p>' +
        '<a class="btn btn--fill btn--icon ht__btn" href="https://loris6.github.io/Muvit/" target="_blank" rel="noopener">' + icon('out') + 'Zur Muvit-App</a></div><figure class="ht__img">' + phoneArt() + '</figure></div>' +
        '<div class="mal"><ul>' + mac('ticket', 'MVB Handyticket', 'Optimal für den Ticketkauf', 'https://www.mvbnet.de/fahrkarten/handyticket/') + mac('muvit', 'Muvit', 'Optimal für eine umfangreiche Fahrplanauskunft mit Echtzeit.', 'https://loris6.github.io/Muvit/') +
        mac('map', 'Interaktive Netzkarte', 'Alle Linien, Routen mit Umstiegen und Live-Abfahrten', '#/verbindungen/karte') + '</ul><a class="btn btn--plain btn--icon" href="https://www.mvbnet.de/fahrkarten/handyticket/" target="_blank" rel="noopener">' + icon('arrow') + 'Alle Infos zu den Apps</a></div></div></div></div>';

      armRel(el);
      el.addEventListener('click', (e) => { if (e.target.closest('.copy-btn')) C.modal('Urheberhinweise', '<p style="font-size:1rem">Bühnenbild: Magdeburger Verkehrsbetriebe (mvbnet.de) bzw. MVB-Grafik.</p>'); });
      // Fahrplanauskunft
      const from = C.placeInput(M.$('#pFrom', el), { label: 'Start', addresses: true });
      const to = C.placeInput(M.$('#pTo', el), { label: 'Ziel', addresses: true });
      M.$('#pSwap', el).onclick = () => { const a = from.get(), b = to.get(), ai = from.input.value, bi = to.input.value; from.set(b); to.set(a); if (!b) from.input.value = bi; if (!a) to.input.value = ai; };
      M.$('#pWhen', el).onchange = (e) => { M.$('#pTimeW', el).hidden = e.target.value === 'now'; if (!M.$('#pTime', el).value) M.$('#pTime', el).value = localIso(new Date()); };
      M.$('#pMore', el).onclick = () => { location.hash = '#/verbindungen/verbindung'; };
      M.$('#pMap', el).onclick = (e) => { if (matchMedia('(max-width: 767px)').matches) { e.preventDefault(); location.hash = '#/verbindungen/verbindung'; } };
      M.$('#planner', el).onsubmit = async (e) => {
        e.preventDefault();
        const [a, b] = await Promise.all([from.resolve(), to.resolve()]);
        if (!a || !b) { M.toast('Bitte Start und Ziel eingeben.'); (a ? to : from).focus(); return; }
        M.store.set('lastQuery', { from: JSON.stringify(a), to: JSON.stringify(b), when: M.$('#pWhen', el).value, t: M.$('#pTime', el).value, opt: '' });
        location.hash = '#/verbindungen/verbindung?go=1';
      };

      // Inhalte von mvbnet.de
      M.News.load().then((list) => {
        const news = list.filter((n) => M.News.isNews(n));
        const hero = news.find((n) => n.img && n.cats.includes(M.CONFIG.wpCats.startseite)) || news.find((n) => n.img) || news[0];
        if (hero) {
          M.$('#stageCard', el).innerHTML = '<h2><div class="stage__top">Neu bei der MVB</div><div class="stage__h">' + esc(hero.title) + '</div></h2><a class="btn stage__cta" href="#/neuigkeiten/' + esc(hero.slug) + '">' + icon('arrow') + 'Mehr erfahren</a>';
          if (hero.img) M.$('#stageFig', el).innerHTML = '<img src="' + esc(hero.img.replace(/-\d+x\d+(\.\w+)$/, '$1')) + '" alt="" referrerpolicy="no-referrer">';
        }
        const hints = list.filter((n) => n.cats.includes(M.CONFIG.wpCats.startseite)).slice(0, 3);
        M.$('#hints', el).innerHTML = '<ul>' + (hints.length ? hints : list.slice(0, 3)).map((n) => {
          const t = n.title.split(/:\s|\s–\s/);
          return '<li><strong>' + esc(t[0]) + (t[1] ? ':' : '') + '</strong> ' + (t[1] ? esc(t.slice(1).join(' – ')) + ' – ' : '') + '<a href="#/neuigkeiten/' + esc(n.slug) + '">mehr erfahren</a></li>';
        }).join('') + '</ul>';
        M.$('#homeNews', el).innerHTML = news.slice(0, 3).map(pressItem).join('');
        // Bilder der neuesten Meldungen für die Kacheln
        const withImg = list.filter((n) => n.img);
        ['r5', 'r7'].forEach((id, i) => {
          const n = withImg[i + 1]; if (!n) return;
          const card = M.$$('.rel__card', el)[id === 'r5' ? 4 : 6];
          const ic = card && M.$('.rel__icon', card);
          if (ic) ic.outerHTML = '<figure class="rel__img"><img src="' + esc(n.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></figure>';
        });
      });
      C.allDisruptions().then((all) => {
        const box = M.$('#homeDis', el);
        if (!box) return;
        box.innerHTML = all.slice(0, 4).map(C.disItem).join('') || '<li class="dis__item">Zurzeit keine Meldungen.</li>';
        box.onclick = (e) => { const b = e.target.closest('[data-dis]'); if (b) C.openDisruption(all.find((x) => x.id === b.dataset.dis)); };
      });
    }
  };
  function itc(href, t, s, art, ext) {
    return '<li><a class="itc__item" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span class="itc__img">' + C.netArt(art) + '</span><span class="itc__mid"><strong>' + esc(t) + '</strong>' + esc(s) + '</span>' + icon(ext ? 'out' : 'arrow') + '</a></li>';
  }
  function mac(ic, t, d, href) {
    return '<li><a class="mac" href="' + href + '"' + (/^http/.test(href) ? ' target="_blank" rel="noopener"' : '') + '><span class="mac__icon">' + appIcon(ic) + '</span><span><h3>' + esc(t) + '</h3><span>' + esc(d) + '</span></span></a></li>';
  }
  function appIcon(kind) {
    const inner = kind === 'muvit' ? '<text x="20" y="25" text-anchor="middle" font-family="Rubik,Arial" font-weight="700" font-size="11" fill="#252525">Muvit</text>' :
      '<g transform="translate(8 6)" fill="none" stroke="#252525" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (kind === 'map' ? 'M2 5l7-3 6 3 7-3v17l-7 3-6-3-7 3zM9 2v17M15 5v17' : 'M3 4h18v6a2 2 0 0 0 0 4v6H3v-6a2 2 0 0 0 0-4zM14 4v16') + '"/></g>';
    return '<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="var(--mvb-green)"/>' + inner + '<rect x="9" y="31" width="22" height="6" rx="1.5" fill="#252525"/><text x="20" y="35.6" text-anchor="middle" font-family="Rubik,Arial" font-weight="700" font-size="5" fill="var(--mvb-green)">MVB</text></svg>';
  }
  function phoneArt() {
    return '<svg viewBox="0 0 240 240"><rect width="240" height="240" fill="#F3F3F3"/><rect x="60" y="12" width="120" height="240" rx="16" fill="#131418"/><g fill="none" stroke-width="5" stroke-linecap="round"><path d="M64 70c30 6 50 40 112 30" stroke="var(--line-tram-9)"/><path d="M64 120c40-6 60-40 112-62" stroke="var(--line-tram-1)"/><path d="M120 16v120" stroke="var(--line-tram-4)"/></g>' +
      '<rect x="64" y="140" width="112" height="100" rx="12" fill="#18191D"/><g font-family="Rubik,Arial" font-weight="700" font-size="8"><rect x="72" y="152" width="12" height="12" rx="2" fill="var(--mode-tram)"/><rect x="86" y="152" width="14" height="12" rx="2" fill="var(--line-tram-9)"/><text x="93" y="161" fill="#fff" text-anchor="middle">9</text><text x="104" y="161" fill="#fff">Reform</text><text x="170" y="161" fill="#86EA8C" text-anchor="end">2</text>' +
      '<rect x="72" y="172" width="12" height="12" rx="2" fill="var(--mode-tram)"/><rect x="86" y="172" width="14" height="12" rx="2" fill="var(--line-tram-4)"/><text x="93" y="181" fill="#fff" text-anchor="middle">4</text><text x="104" y="181" fill="#fff">Cracau</text><text x="170" y="181" fill="#7596AC" text-anchor="end">4</text>' +
      '<circle cx="78" cy="198" r="6" fill="var(--mode-bus)"/><rect x="86" y="192" width="16" height="12" rx="6" fill="var(--line-bus)"/><text x="94" y="201" fill="#fff" text-anchor="middle">73</text><text x="106" y="201" fill="#fff">Ottersleben</text><text x="170" y="201" fill="#E67A35" text-anchor="end">7</text></g></svg>';
  }
  function pressItem(n) {
    return '<article class="press__item"><time datetime="' + esc(n.date) + '">' + M.fmtDate(n.date) + '</time><a href="#/neuigkeiten/' + esc(n.slug) + '">' + esc(n.title) + '</a>' + icon('arrow', 'press__arrow') + '</article>';
  }

  /* =====================================================================
     Störungsmeldungen
     ===================================================================== */
  P.stoerungen = {
    title: 'Störungsmeldungen', nav: 'verbindungen',
    render(el) {
      el.innerHTML = C.crumbs([['Verbindungen', '#/verbindungen'], ['Störungsmeldungen']]) +
        '<div class="g g-normal lstage"><div><h1 class="srt__h1">Störungsmeldungen</h1><p class="srt__p">Baustellen, Umleitungen und Störungen bei Straßenbahn und Bus. Alle Meldungen von <a href="https://www.mvbnet.de/baustellen/" target="_blank" rel="noopener">mvbnet.de</a> und aus den Verkehrsmeldungen der MVB – jede mit Karte, Sperrung und neuem Fahrweg.</p></div></div>' +
        '<div class="g"><form class="dov-form wide" onsubmit="return false"><h2>Verkehrsmeldungen eingrenzen</h2><div class="dov-form__row">' +
        '<div class="combo"><input id="fLine" list="fLines" placeholder="Linie auswählen" autocomplete="off"><datalist id="fLines"></datalist></div>' +
        '<div class="sel"><label for="fKind">Störungsmeldungen filtern</label><select id="fKind"><option value="">Alle zeigen</option><option value="closed">Sperrungen</option><option value="detour">Umleitungen</option><option value="sev">Ersatzverkehr</option><option value="moved">Haltestelle verlegt</option></select><span class="sel__chev">' + icon('down') + '</span></div>' +
        '<div class="sel"><label for="fAge">Datum filtern</label><select id="fAge"><option value="60">Heute, ' + M.fmtDate(new Date()) + '</option><option value="14">Letzte 14 Tage</option><option value="365">Alle</option></select><span class="sel__chev">' + icon('down') + '</span></div></div></form>' +
        '<div class="dov"><div class="adv" id="fCount"><span>Lade Meldungen …</span></div><div id="dGroups"><div class="spin"></div></div></div></div>';
      let all = [];
      const draw = () => {
        const lineQ = M.$('#fLine', el).value.trim().toLowerCase().replace(/^(tram|bus|linie)\s*/, '');
        const kind = M.$('#fKind', el).value, age = +M.$('#fAge', el).value;
        const list = all.filter((x) => (!lineQ || x.lines.some((l) => l.name.toLowerCase() === lineQ)) && (!kind || x.kind.includes(kind)) && (Date.now() - new Date(x.date) < age * 864e5 || (x.until && new Date(x.until) > Date.now())));
        M.$('#fCount', el).innerHTML = '<p>Es wurden <strong>' + list.length + ' Ergebnisse</strong> gefunden.</p>';
        const groups = [['tram', 'Straßenbahn', list.filter((x) => x.lines.some((l) => l.mode === 'tram'))], ['bus', 'Bus', list.filter((x) => x.lines.some((l) => l.mode === 'bus'))], ['all', 'Allgemein', list.filter((x) => !x.lines.length)]];
        M.$('#dGroups', el).innerHTML = groups.filter((g) => g[2].length).map((g) => '<section class="dov__sec"><h2>' + (g[0] === 'all' ? '<span class="info__icon" style="width:2rem;height:2rem">' + icon('alert') + '</span>' : M.modeBadge(g[0], { lg: true })) + g[1] + '</h2><ul>' +
          g[2].map((x) => '<li class="nitem" data-id="' + esc(x.id) + '"><button class="nitem__trig" aria-expanded="false"><span><h3>' + (x.lines.length ? M.lineGroups(x.lines) + ' ' : '') + esc(x.title) + C.tags(x.kind) + '</h3>' +
            '<span class="nitem__date"><span>Von<time>' + icon('cal') + M.fmtDate(x.from || x.date) + '</time></span><span>' + (x.until ? 'Bis<time>' + icon('cal') + M.fmtDate(x.until) + '</time>' : 'Bis auf weiteres') + '</span></span></span><span class="nitem__chev">' + icon('down') + '</span></button><div class="nitem__body" hidden></div></li>').join('') + '</ul></section>').join('') || '<p class="empty">Keine Meldungen für diese Auswahl.</p>';
      };
      C.allDisruptions().then((list) => {
        all = list;
        const ls = M.sortLines([].concat(...all.map((x) => x.lines)).filter((l, i, a) => a.findIndex((m) => m.name === l.name && m.mode === l.mode) === i));
        M.$('#fLines', el).innerHTML = ls.map((l) => '<option value="' + (l.mode === 'tram' ? 'Tram ' : 'Bus ') + esc(l.name) + '">').join('');
        draw();
        const q = new URLSearchParams(location.hash.split('?')[1] || '');
        if (q.get('id')) { const a = M.$('.nitem[data-id="' + CSS.escape(q.get('id')) + '"] > button', el); if (a) a.click(); }
      });
      M.$('#fLine', el).oninput = M.debounce(draw, 150);
      ['#fKind', '#fAge'].forEach((s) => { M.$(s, el).onchange = draw; });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('.nitem__trig');
        if (!b) return;
        const it = b.parentElement, body = M.$('.nitem__body', it);
        const open = !it.classList.contains('open');
        it.classList.toggle('open', open); b.setAttribute('aria-expanded', open); body.hidden = !open;
        if (open && !body.innerHTML) { const x = all.find((y) => y.id === it.dataset.id); body.innerHTML = C.disBody(x); C.mountDisMap(M.$('.dmapbox', body), x); }
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
      el.innerHTML = C.crumbs([['Unternehmen', '#/unternehmen'], ['News']]) + C.stage('News', 'Alle Meldungen der Magdeburger Verkehrsbetriebe – automatisch von mvbnet.de übernommen.') +
        '<div class="g"><div><nav class="anav" aria-label="Filter"><ul id="nTabs"><li><a href="#" data-f="all" aria-current="page">' + icon('news') + 'Alle</a></li><li><a href="#" data-f="news">' + icon('star') + 'News</a></li><li><a href="#" data-f="work">' + icon('alert') + 'Baustellen &amp; Verkehr</a></li></ul></nav>' +
        '<div class="press__grid" id="nList"><div class="spin"></div></div><p id="nSrc" style="margin-top:2rem;font-size:.875rem;color:var(--grey-500)"></p></div></div>';
      const list = await M.News.load();
      let f = 'all';
      const draw = () => { M.$('#nList', el).innerHTML = list.filter((n) => f === 'all' || (f === 'news' ? M.News.isNews(n) : M.News.isWork(n))).map(pressItem).join('') || '<p class="empty">Keine Meldungen.</p>'; };
      draw();
      M.$('#nSrc', el).textContent = M.News.src === 'live' ? 'Live von mvbnet.de · aktualisiert um ' + M.fmtTime(new Date()) + ' Uhr' : 'Gespeicherter Stand (' + M.News.src.replace('snapshot ', '') + ')';
      M.$('#nTabs', el).onclick = (e) => { const b = e.target.closest('[data-f]'); if (!b) return; e.preventDefault(); f = b.dataset.f; M.$$('#nTabs a', el).forEach((x) => (x === b ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'))); draw(); };
    }
  };
  P.neuigkeit = {
    title: 'Neuigkeiten', nav: 'unternehmen',
    async render(el, args) {
      el.innerHTML = '<div class="g"><div class="spin"></div></div>';
      const n = await M.News.get(args[0]);
      if (!n) { el.innerHTML = C.crumbs([['News', '#/neuigkeiten'], ['Nicht gefunden']]) + '<div class="g"><p class="empty">Diese Meldung gibt es nicht (mehr).</p></div>'; return; }
      const work = M.News.isWork(n);
      el.innerHTML = C.crumbs([['Unternehmen', '#/unternehmen'], ['News', '#/neuigkeiten'], [n.title]]) +
        '<div class="g g-normal lstage"><header><div class="sg__h1w"><h1 class="sg__h1">' + esc(n.title) + '</h1></div><p class="sg__sub" style="font-size:1rem;font-weight:700">' + M.fmtDateLong(n.date) + (n.lines.length ? ' · ' + M.lineGroups(n.lines) : '') + ' ' + C.tags(n.kind) + '</p>' +
        (n.img && !work ? '<div class="sn__img" style="margin-top:1.5rem"><img src="' + esc(n.img.replace(/-\d+x\d+(\.\w+)$/, '$1')) + '" alt="" referrerpolicy="no-referrer"></div>' : '') + '</header></div>' +
        '<div class="g g-normal"><div>' + (work ? '<div class="dmapbox"></div>' : '') + '<div class="rt">' + C.cleanHtml(n.html) + '</div>' +
        '<p style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap"><a class="btn btn--outline btn--icon" href="' + esc(n.link) + '" target="_blank" rel="noopener">' + icon('out') + 'Originalmeldung auf mvbnet.de</a><a class="btn btn--plain btn--icon" href="#/neuigkeiten">' + icon('arrowL') + 'Alle Meldungen</a></p></div></div>';
      if (work) C.mountDisMap(M.$('.dmapbox', el), { slug: n.slug, id: 'n' + n.id, title: n.title, text: n.text, lines: n.lines });
    }
  };

  /* =====================================================================
     Abos & Tickets
     ===================================================================== */
  const money = (v) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  P.tickets = {
    title: 'Abos & Tickets', nav: 'tickets',
    render(el) {
      el.innerHTML = C.crumbs([['Abos & Tickets']]) + C.stage('Abos & Tickets', 'Nur was Kurzes, Unverbindliches oder doch für länger? Egal ob du spontan oder regelmäßig fährst, lieber digital oder klassisch unterwegs bist: Hier findest du alles, um günstig durch Magdeburg zu fahren.') +
        '<div class="g stack">' +
        C.teaserList('Abos', [
          { t: 'Deutschlandticket', d: 'Beliebig viele Fahrten innerhalb Deutschlands – ' + money(63) + ' im Monat', href: 'https://www.mvbnet.de/fahrkarten/deutschlandticket/', ic: 'abo', dark: true, badge: 'Abo' },
          { t: 'Alle Abos', d: 'z. B. Schülerticket, Jobticket, Semesterticket, Sozialticket', href: 'https://www.mvbnet.de/abo-uebersicht/', ic: 'abo', dark: true, badge: 'Abo' }]) +
        '<section class="cta tl"><h2>Abo kündigen</h2><div class="rt"><p>Wenn du dein <strong>Abo kündigen</strong> möchtest, kannst du das hier tun:</p></div><div class="cta__row"><a class="btn btn--outline btn--sm btn--icon" href="https://abo.mvbnet.de/" target="_blank" rel="noopener">' + icon('arrow') + 'Abo kündigen (mit Login)</a><a class="btn btn--outline btn--sm btn--icon" href="https://www.mvbnet.de/service/kontakte/" target="_blank" rel="noopener">' + icon('arrow') + 'Abo kündigen (ohne Login)</a></div></section>' +
        C.teaserList('Tickets', [
          { t: 'Eine Fahrt', d: 'Einzelfahrt ' + money(3.30) + ' (App ' + money(3.00) + '), Kurzstrecke ' + money(2.00), href: 'https://www.mvbnet.de/fahrkarten/', ic: 'ticketS' },
          { t: 'Mehrere Fahrten', d: '4-Fahrten-Karte, Kurzstrecken-Karte', href: 'https://www.mvbnet.de/fahrkarten/', ic: 'ticket' },
          { t: 'Ein Tag', d: '24-Stunden-Karte – Kinder fahren mit', href: 'https://www.mvbnet.de/fahrkarten/', ic: 'clock' },
          { t: 'Monatskarte (ohne Abovertrag)', d: 'Wochen- und Monatskarte, Schüler, Azubis', href: 'https://www.mvbnet.de/fahrkarten/', ic: 'cal' },
          { t: 'Für Touristen', d: '24-Stunden-Karte, Weihnachtsticket, Sondertickets', href: 'https://www.mvbnet.de/fahrkarten/sondertickets/', ic: 'globe' },
          { t: 'Für Fahrräder', d: 'Fahrradmitnahme in Straßenbahn und Bus', href: 'https://www.mvbnet.de/fahrinfo/befoerderungsbedingungen/', ic: 'bike' }],
          { bottom: ['Zu allen Tickets und Preisen', 'https://www.mvbnet.de/fahrkarten/'] }) +
        '</div>';
    }
  };

  /* =====================================================================
     Service & Kontakt
     ===================================================================== */
  P.service = {
    title: 'Service & Kontakt', nav: 'service',
    render(el) {
      el.innerHTML = C.crumbs([['Service & Kontakt']]) + C.stage('Service & Kontakt', 'Im Service- &amp; Kontaktbereich findest du alle relevanten Infos zu unseren wichtigsten Servicethemen. Und das bequem von deinem Sofa aus. Noch Fragen? Dann wende dich direkt an unser Service-Team.') +
        '<div class="g stack">' +
        C.teaserList('Häufige Themen', [
          { t: 'Abo', d: 'Abo verwalten oder kündigen, Kundennummer finden, Schülerticket verloren', href: 'https://abo.mvbnet.de/' },
          { t: 'Apps', d: 'Muvit-App, Handyticket, Hilfe zu Ticket-Kauf per App', href: 'https://www.mvbnet.de/fahrkarten/handyticket/' },
          { t: 'Kontakt', d: 'Hier findest du Antworten auf deine Fragen und die passenden Kontaktwege für dein Anliegen.', href: 'https://www.mvbnet.de/service/kontakte/' },
          { t: 'Verkaufsstellen & Kundencenter', d: 'Kundencenter, Verkaufsstellen und Automaten', href: 'https://www.mvbnet.de/service/verkaufsstellen/' },
          { t: 'Barrierefrei unterwegs', d: 'Mobilitätshelfer und FAQ', href: 'https://www.mvbnet.de/service/mobilitaetshelfer/' },
          { t: 'Fahren ohne Fahrausweis', d: 'Alle wichtigen Infos rund um das Thema Fahren ohne Fahrausweis, Ticketkontrolle und erhöhtes Beförderungsentgelt.', href: 'https://www.mvbnet.de/service/fahrkartenkontrolle/' }],
          { bottom: ['Alle Servicethemen', 'https://www.mvbnet.de/service/'] }) +
        C.teaserList('Weitere Servicethemen', [
          { t: 'Störungsmeldungen', href: '#/stoerungen' }, { t: 'Fundsachen', href: 'https://www.mvbnet.de/service/fundsachen/' },
          { t: 'Häufige Fragen', href: 'https://www.mvbnet.de/service/haeufige-fragen/' }, { t: 'Beförderungsbedingungen', href: 'https://www.mvbnet.de/fahrinfo/befoerderungsbedingungen/' },
          { t: 'Fahrzeugvermietung', href: 'https://www.mvbnet.de/service/fahrzeugvermietung/' }, { t: 'Verkehrsmittelwerbung', href: 'https://www.mvbnet.de/service/verkehrsmittelwerbung/' },
          { t: 'Schülerprojekte', href: 'https://www.mvbnet.de/service/schuelerprojekte/' }, { t: 'Neuigkeiten aus der MVB-Welt', href: '#/neuigkeiten' }], { std: true }) +
        relTeaser('Gut zu wissen', [
          { ic: 'map', top: 'Interaktive Karte', text: 'Alle Linien und Haltestellen', href: '#/verbindungen/karte' },
          { ic: 'clock', top: 'Abfahrten', text: 'Live an jeder Haltestelle', href: '#/verbindungen/abfahrt' },
          { ic: 'alert', top: 'Baustellen', text: 'Umleitungen mit Karte', href: '#/stoerungen' },
          { ic: 'news', top: 'Newsletter', text: 'Immer informiert bleiben', href: 'https://www.mvbnet.de/aktuelles/newsletter/' },
          { ic: 'ticketS', top: 'Handyticket', text: 'Tickets auf dem Smartphone', href: 'https://www.mvbnet.de/fahrkarten/handyticket/' },
          { ic: 'help', top: 'Häufige Fragen', text: 'Antworten auf einen Blick', href: 'https://www.mvbnet.de/service/haeufige-fragen/' }], true) +
        '</div>';
      armRel(el);
    }
  };

  /* =====================================================================
     Unternehmen
     ===================================================================== */
  P.unternehmen = {
    title: 'Unternehmen', nav: 'unternehmen',
    render(el) {
      el.innerHTML = C.crumbs([['Unternehmen']]) +
        '<div class="g"><div class="sn"><div class="sn__img">' + C.heroArt() + '</div><h1 class="sn__title"><span>Unternehmen</span><span>Die MVB bewegt</span><span style="margin-left:2.5rem">Magdeburg</span></h1></div></div>' +
        '<div class="g g-normal lstage"><div><h2 class="cta" style="margin-top:3rem"><span style="display:block;font-size:2rem;line-height:1.3;font-weight:700;margin-bottom:1.5rem">Die MVB bringt Magdeburg voran</span></h2><div class="rt"><p>Die Magdeburger Verkehrsbetriebe bringen die Landeshauptstadt mit Straßenbahn und Bus rund um die Uhr in Bewegung – modern, zuverlässig und klimafreundlich.</p></div></div></div>' +
        '<div class="g stack">' + C.teaserList('', [
          { t: 'Wir über uns', d: 'Unternehmensprofil, Geschichte und Verantwortung der MVB', href: 'https://www.mvbnet.de/unternehmen/unternehmensprofil/' },
          { t: 'Zahlen & Fakten', d: 'Linien, Fahrzeuge, Fahrgäste', href: 'https://www.mvbnet.de/unternehmen/zahlen-fakten/' },
          { t: 'Netzausbau', d: 'Bauprojekte für das Straßenbahnnetz, 2. Nord-Süd-Verbindung', href: 'https://www.mvbnet.de/unternehmen/netzausbau/' },
          { t: 'Presse', d: 'Pressemitteilungen, Pressefotos und Kontakt für Presse und Medien', href: 'https://www.mvbnet.de/presse/' },
          { t: 'Karriere bei der MVB', d: 'Jobsuche, Ausbildung und Bewerbung direkt hier', href: '#/karriere' },
          { t: 'News', d: 'Aktuelle Informationen zu Baustellen, Angeboten und Projekten', href: '#/neuigkeiten' }]) + '</div>';
    }
  };

  /* =====================================================================
     Netz & Linien
     ===================================================================== */
  P.netz = {
    title: 'Netz & Linien', nav: 'verbindungen',
    async render(el) {
      el.innerHTML = C.crumbs([['Verbindungen', '#/verbindungen'], ['Linienübersicht']]) + C.stage('Linienübersicht', 'Alle Straßenbahn- und Buslinien der MVB mit ihren Haltestellen. Ein Klick öffnet die Linie auf der interaktiven Karte.') + '<div class="g stack" id="nl"><div class="spin"></div></div>';
      const d = await M.Net.load();
      const grp = (title, ls) => (ls.length ? C.teaserList(title, ls.map((l) => ({ t: (l.mode === 'tram' ? 'Straßenbahn ' : 'Bus ') + l.name, d: l.variants.map((v) => v.to).filter((v, i, a) => a.indexOf(v) === i).join(' ↔ ') + ' · ' + l.variants[0].stops.length + ' Halte', href: '#/verbindungen/karte?linie=' + l.id, html: '<p style="margin-top:.5rem">' + M.badges(l.line, { lg: true }) + '</p>' }))) : '');
      M.$('#nl', el).innerHTML = grp('Straßenbahn', d.lines.filter((l) => l.mode === 'tram' && !M.isNight(l.name))) + grp('Bus', d.lines.filter((l) => l.mode === 'bus' && !M.isNight(l.name))) + grp('Nachtlinien', d.lines.filter((l) => M.isNight(l.name))) +
        '<p style="font-size:.875rem;color:var(--grey-500)">Quelle: ' + esc(d.source) + ' · Stand ' + M.fmtDate(d.generated) + '</p>';
    }
  };

  /* =====================================================================
     MVB-Konto (Anmeldung wie BVG-Formularseite, nur auf diesem Gerät)
     ===================================================================== */
  P.konto = {
    title: 'MVB-Konto', nav: 'konto',
    render(el, args, shellEl) {
      shellEl.classList.add('form-page');
      const u = M.store.get('user', null);
      if (u) {
        el.innerHTML = C.crumbs([['MVB-Konto']]) + C.stage('Hallo ' + u.name + '!', 'Dein MVB-Konto auf diesem Gerät.', 'user') + '<div class="g">' + C.teaserList('', [
          { t: 'Meine Haltestellen', d: M.store.get('recentStops', []).map((s) => s.name).slice(0, 3).join(', ') || 'Noch keine', href: '#/verbindungen/abfahrt' },
          { t: 'Abo verwalten', d: 'Im Aboportal der MVB', href: 'https://abo.mvbnet.de/' },
          { t: 'Meine Bewerbungen', d: M.store.get('bewerbungen', []).map((b) => b.job).slice(0, 2).join(', ') || 'Noch keine', href: '#/karriere' },
          { t: 'Abmelden', d: u.mail, href: '#/konto', attr: ' data-logout' }]) + '</div>';
        el.addEventListener('click', (e) => { if (e.target.closest('[data-logout]')) { e.preventDefault(); M.store.set('user', null); M.toast('Abgemeldet.'); P.konto.render(el, args, shellEl); } });
        return;
      }
      el.innerHTML = '<div class="g" style="margin-top:2rem"><div class="fb__main"><div class="fb__box"><div class="fb__logo">' + M.LOGO + '</div><p style="text-align:right;font-size:.875rem;margin-bottom:1rem"><u>Deutsch</u></p><h1>Anmeldung</h1>' +
        '<form id="login" novalidate><label class="fld"><span class="fld__in"><span>E-Mail</span><input type="email" name="mail" required autocomplete="email"></span></label>' +
        '<label class="fld"><span class="fld__in"><span>Passwort</span><input type="password" name="pw" required minlength="6" autocomplete="current-password"></span></label>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 1.5rem;font-size:1rem"><label class="chk"><input type="checkbox" name="keep"><span>Angemeldet bleiben</span></label><a href="#/konto" style="text-decoration:underline;font-size:.875rem">Passwort vergessen?</a></div>' +
        '<button class="btn btn--fill btn--lg btn--full" type="submit">Anmelden</button><button class="btn btn--grey btn--lg btn--full" type="button" id="reg" style="margin-top:1rem">Registrieren</button>' +
        '<p style="margin-top:1rem;font-size:.875rem;color:var(--grey-500);text-align:center">Dein Konto wird nur auf diesem Gerät gespeichert.</p></form>' +
        '<a class="btn btn--outline btn--sm btn--icon" href="#/" style="margin-top:1.5rem">' + icon('arrowL') + 'zurück ohne Anmeldung</a></div></div></div>';
      const f = M.$('#login', el);
      const go = (e) => { if (e) e.preventDefault(); if (!f.reportValidity()) return; const mail = f.mail.value.trim(); M.store.set('user', { mail, name: mail.split('@')[0] }); M.toast('Willkommen!'); P.konto.render(el, args, shellEl); };
      f.onsubmit = go; M.$('#reg', el).onclick = () => go();
    }
  };
})(window.MVB = window.MVB || {});
