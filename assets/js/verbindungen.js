/* MVB – Verbindungen: Reiter „Verbindung“, „Abfahrt“ und „Interaktive Karte“ */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;
  const P = (M.Pages = M.Pages || {});

  const TABS = [['verbindung', 'Verbindung', 'route'], ['abfahrt', 'Abfahrt', 'clock'], ['karte', 'Interaktive Karte', 'map']];

  const HEAD = {
    verbindung: ['Routenplanung im Detail', 'Verbindungen mit Echtzeit, Verspätungen und Gleisen – von Haltestelle, Adresse oder deinem Standort.'],
    abfahrt: ['Abfahrten', 'Live-Abfahrten an jeder Haltestelle der MVB mit Verfrühung und Verspätung.'],
    karte: ['Interaktive Karte', 'Ebene 1 zeigt das komplette Liniennetz, Ebene 2 berechnet den schnellsten Weg mit allen Umstiegen in den Linienfarben.']
  };
  P.verbindungen = {
    title: 'Verbindungen', nav: 'verbindungen',
    render(el, args) {
      if (!TABS.some((t) => t[0] === args[0])) {
        // Übersicht wie bei der BVG
        el.innerHTML = C.crumbs([['Verbindungen']]) + C.stage('Verbindungen', 'Routenplaner, Liniennetz, Abfahrten und aktuelle Meldungen – hier gibt’s das A und O, um von A nach B zu kommen. Natürlich barrierefrei.') +
          '<div class="g stack">' + C.teaserList('', [
            { t: 'Verbindungssuche', d: 'Finde die einfachste und schnellste Route zum Ziel.', href: '#/verbindungen/verbindung' },
            { t: 'Abfahrten', d: 'Live-Abfahrten an deiner Haltestelle mit Verspätungen.', href: '#/verbindungen/abfahrt' },
            { t: 'Störungen und Baumaßnahmen', d: 'Umleitungen, Sperrungen und Ersatzverkehr bei Straßenbahn und Bus – mit Karte.', href: '#/stoerungen' },
            { t: 'Interaktive Karte', d: 'Das komplette Liniennetz der MVB und Routen mit Umstiegen in den Linienfarben.', href: '#/verbindungen/karte' }]) +
          C.teaserList('', [
            { t: 'Alle Linien', d: 'Alle Streckenverläufe & Haltestellen der Straßenbahn- und Buslinien.', href: '#/netz' },
            { t: 'Alle Haltestellen', d: 'Alle Haltestellen von Straßenbahn und Bus im Überblick.', href: '#/verbindungen/abfahrt' },
            { t: 'Barrierefrei unterwegs', d: 'Alle Infos zum Thema barrierefreies Reisen mit der MVB.', href: 'https://www.mvbnet.de/service/mobilitaetshelfer/' },
            { t: 'Netz- und Fahrpläne', d: 'Liniennetzpläne und Fahrpläne zum Herunterladen.', href: 'https://www.mvbnet.de/fahrinfo/netz_fahrplaene/' }], { std: true }) + '</div>';
        return;
      }
      const tab = args[0];
      el.innerHTML = C.crumbs([['Verbindungen', '#/verbindungen'], [TABS.find((t) => t[0] === tab)[1]]]) +
        '<div class="g g-normal lstage"><div><h1 class="srt__h1">' + esc(HEAD[tab][0]) + '</h1><p class="srt__p">' + esc(HEAD[tab][1]) + '</p></div></div>' +
        '<div class="g"><div><nav class="anav" aria-label="Verbindungen"><ul>' + TABS.map((t) => '<li><a href="#/verbindungen/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + icon(t[2]) + '<span>' + t[1] + '</span></a></li>').join('') + '</ul></nav>' +
        '<div id="tabBody"></div></div></div>';
      return TAB[tab](M.$('#tabBody', el));
    }
  };
  const TAB = {};

  /* =====================================================================
     Verbindung
     ===================================================================== */
  TAB.verbindung = function (box) {
    box.innerHTML = '<section class="cf"><form class="cf__form" id="vForm" autocomplete="off"><div class="cf__start" id="vFrom"></div><button type="button" class="cf__swap" id="vSwap" aria-label="Start und Ziel tauschen">' + icon('swap') + '</button><div class="cf__dest" id="vTo"></div>' +
      '<button class="btn btn--fill cf__submit" type="submit">Verbindung finden</button><button class="btn cf__map" type="button" id="vLoc">Mein Standort</button>' +
      '<div class="cf__fld cf__when"><label><select id="vWhen"><option value="now">Jetzt losfahren</option><option value="dep">Abfahrt</option><option value="arr">Ankunft</option></select><span>Wann</span></label><div class="cf__fld-icon">' + icon('down') + '</div></div>' +
      '<div class="cf__fld cf__more" style="padding:0;border:0"><label style="width:100%"><select id="vOpt"><option value="">Alle Verkehrsmittel (auch Züge)</option><option value="tram,bus">Nur Straßenbahn &amp; Bus</option><option value="tram">Nur Straßenbahn</option><option value="bus">Nur Bus</option></select><span>Weitere Einstellungen</span></label><div class="cf__fld-icon">' + icon('gear') + '</div></div>' +
      '<div class="cf__fld cf__time" id="vTimeL" hidden><label><input type="datetime-local" id="vTime"><span>Datum und Uhrzeit</span></label></div>' +
      '<label class="chk" style="grid-column:3;margin-top:1rem"><input type="checkbox" id="vWc"><span>Barrierefrei (stufenlose Wege)</span></label></form></section>' +
      M.LEGEND + '<div id="vRes" class="res"></div>';
    const from = C.placeInput(M.$('#vFrom', box), { label: 'Start', addresses: true });
    const to = C.placeInput(M.$('#vTo', box), { label: 'Ziel', addresses: true });
    M.$('#vSwap', box).onclick = () => { const a = from.get(), b = to.get(); from.set(b); to.set(a); };
    M.$('#vWhen', box).onchange = (e) => { M.$('#vTimeL', box).hidden = e.target.value === 'now'; if (!M.$('#vTime', box).value) M.$('#vTime', box).value = M.localIso(new Date()); };
    M.$('#vLoc', box).onclick = () => {
      if (!navigator.geolocation) return M.toast('Standort nicht verfügbar.');
      navigator.geolocation.getCurrentPosition((p) => { from.set({ name: 'Mein Standort', lat: p.coords.latitude, lon: p.coords.longitude, type: 'address' }); }, () => M.toast('Standort nicht freigegeben.'), { timeout: 10000 });
    };
    let cursor = null, last = null;
    const run = async (cur) => {
      const [a, b] = await Promise.all([from.resolve(), to.resolve()]);
      if (!a || !b) { M.toast('Bitte Start und Ziel eingeben.'); return; }
      const when = M.$('#vWhen', box).value, t = M.$('#vTime', box).value, opt = M.$('#vOpt', box).value;
      const q = { from: placeQ(a), to: placeQ(b), time: when !== 'now' && t ? new Date(t) : null, arriveBy: when === 'arr', wheelchair: M.$('#vWc', box).checked, modes: opt ? opt.split(',') : null, cursor: cur || null };
      const res = M.$('#vRes', box);
      if (!cur) res.innerHTML = '<div class="spin"></div>';
      try {
        const r = await M.Transit.plan(q);
        last = r; cursor = r;
        renderResults(res, r, { a, b, append: cur });
      } catch (e) {
        res.innerHTML = '<div class="note note--warn">' + icon('alert') + '<div>Die Fahrplanauskunft ist gerade nicht erreichbar. Bitte versuche es gleich noch einmal.</div></div>';
      }
    };
    M.$('#vForm', box).onsubmit = (e) => { e.preventDefault(); run(); };
    box.addEventListener('click', (e) => {
      const mv = e.target.closest('[data-page]');
      if (mv && cursor) { run(mv.dataset.page === 'next' ? cursor.next : cursor.prev); return; }
      const top = e.target.closest('.itin__top');
      if (top) { const det = top.nextElementSibling; det.hidden = !det.hidden; top.setAttribute('aria-expanded', !det.hidden); }
      const more = e.target.closest('.tl2__more');
      if (more) { const ul = more.nextElementSibling; ul.hidden = !ul.hidden; more.textContent = ul.hidden ? more.dataset.t : 'Zwischenhalte ausblenden'; }
    });
    // von der Startseite übernommen
    const lq = M.store.get('lastQuery', null);
    if (lq && /go=1/.test(location.hash)) {
      try { from.set(JSON.parse(lq.from)); to.set(JSON.parse(lq.to)); } catch (e) { /* egal */ }
      M.$('#vWhen', box).value = lq.when || 'now';
      if (lq.when !== 'now') { M.$('#vTimeL', box).hidden = false; M.$('#vTime', box).value = lq.t; }
      if (lq.opt === 'wc') M.$('#vWc', box).checked = true; else if (lq.opt) M.$('#vOpt', box).value = lq.opt;
      run();
    }
  };
  const placeQ = (p) => ({ name: p.name, lat: p.lat, lon: p.lon, motisId: p.id && M.Net.data && M.Net.data.stations[p.id] && M.Net.data.stations[p.id].s ? M.Net.data.stations[p.id].s : (p.motis && p.type === 'stop' ? p.id : null) });

  function legBadge(l) {
    if (!l.line) return '';
    if (l.mode === 'tram' || l.mode === 'bus') return M.badges(l.line, { sm: true });
    const bg = l.mode === 'sbahn' ? '#408335' : l.routeColor && l.routeColor.length === 7 ? l.routeColor : '#878C96';
    return '<span class="bds"><span class="bd sm" style="background:' + bg + '">' + esc(l.line.raw || l.line.name) + '</span></span>';
  }
  function legColor(l) {
    if (l.walk) return '';
    if (l.mode === 'tram' || l.mode === 'bus') return M.mapColor(l.line);
    return l.mode === 'sbahn' ? '#408335' : '#878C96';
  }
  function renderResults(res, r, ctx) {
    if (!r.list.length) { res.innerHTML = '<p class="empty">Keine Verbindung gefunden.</p>'; return; }
    const fastest = Math.min(...r.list.map((x) => x.duration));
    const fewest = Math.min(...r.list.map((x) => x.transfers));
    const html = r.list.map((it) => {
      const flags = [];
      if (it.duration === fastest) flags.push('Schnellste');
      if (it.transfers === fewest && r.list.filter((x) => x.transfers === fewest).length < r.list.length) flags.push('Wenigste Umstiege');
      const firstT = it.legs.find((l) => !l.walk);
      const depX = firstT ? { delay: firstT.from.delay, realtime: firstT.realtime, cancelled: firstT.cancelled } : {};
      const lastT = [...it.legs].reverse().find((l) => !l.walk);
      const arrX = lastT ? { delay: lastT.to.delay, realtime: lastT.realtime, cancelled: lastT.cancelled } : {};
      const total = it.legs.reduce((s, l) => s + Math.max(1, l.duration), 0);
      return '<article class="itin"><div class="itin__top" role="button" tabindex="0" aria-expanded="false"><div>' +
        '<div class="itin__times">' + M.clock(it.depPlanned, it.dep, depX) + ' – ' + M.clock(it.arrPlanned, it.arr, arrX) + '<small>' + M.fmtDur(it.duration) + ' · ' + (it.transfers ? it.transfers + ' Umstieg' + (it.transfers > 1 ? 'e' : '') : 'direkt') + '</small></div>' +
        '<div class="itin__badges">' + it.legs.filter((l) => !l.walk).map(legBadge).join(icon('arrow', 'arr')) + (firstT ? ' <span style="color:var(--grey-500)" style="font-size:13px">ab ' + esc(firstT.from.name) + '</span>' : '') + '</div></div>' +
        '<div style="display:grid;gap:6px;justify-items:end">' + flags.map((f) => '<span class="itin__flag">' + f + '</span>').join('') + (firstT ? M.statusBadge(depX) : '') + '</div>' +
        '<div class="itin__bar">' + it.legs.map((l) => '<i class="' + (l.walk ? 'walk' : '') + '" style="flex:' + Math.max(1, l.duration) / total + ';' + (l.walk ? '' : 'background:' + legColor(l)) + '"></i>').join('') + '</div></div>' +
        '<div class="itin__det" hidden>' + timeline(it) + '</div></article>';
    }).join('');
    res.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><button class="btn btn--outline btn--sm btn--icon" data-page="prev">' + icon('arrowL') + 'Früher</button><button class="btn btn--outline btn--sm" data-page="next">Später' + icon('arrow') + '</button></div>' + html;
  }
  function timeline(it) {
    return '<div class="tl2">' + it.legs.map((l, i) => {
      const c = legColor(l);
      const x = { delay: l.from.delay, realtime: l.realtime, cancelled: l.cancelled };
      if (l.walk) {
        return '<div class="tl2__leg walk"><div class="tl2__time">' + M.fmtTime(l.from.time) + '</div><div class="tl2__rail"><span class="tl2__dot"></span></div><div class="tl2__body"><div class="tl2__stop">' + esc(l.from.name) + '</div><div class="tl2__walk">' + icon('walk') + 'Fußweg ' + Math.max(1, Math.round(l.duration)) + ' Min.' + (l.distance ? ' (' + Math.round(l.distance) + ' m)' : '') + '</div></div></div>';
      }
      const st = M.status(x);
      return '<div class="tl2__leg" style="--c:' + c + '"><div class="tl2__time">' + M.clock(l.from.planned, l.from.time, x) + '</div><div class="tl2__rail"><span class="tl2__dot"></span></div><div class="tl2__body"><div class="tl2__stop">' + esc(l.from.name) + (l.from.track ? ' <span class="bstg">Bstg. ' + esc(l.from.track) + '</span>' : '') + '</div>' +
        '<div class="tl2__line">' + legBadge(l) + '<span>Richtung ' + esc(l.headsign || l.to.name) + '</span><span class="stbadge ' + st.cls + '">' + esc(st.text) + '</span></div>' +
        (l.stops.length ? '<button class="tl2__more" data-t="' + l.stops.length + ' Zwischenhalt' + (l.stops.length > 1 ? 'e' : '') + ' · ' + Math.round(l.duration) + ' Min.">' + l.stops.length + ' Zwischenhalt' + (l.stops.length > 1 ? 'e' : '') + ' · ' + Math.round(l.duration) + ' Min.</button><ul class="tl2__mid" hidden>' + l.stops.map((s) => '<li>' + M.fmtTime(s.time || s.planned) + ' · ' + esc(s.name) + '</li>').join('') + '</ul>' : '') +
        l.alerts.map((a) => '<div class="note warn" style="margin-top:8px;font-size:13px">' + icon('alert') + '<div>' + esc(a) + '</div></div>').join('') + '</div></div>' +
        (i === it.legs.length - 1 || it.legs[i + 1].walk ? '<div class="tl2__leg' + (i === it.legs.length - 1 ? ' last' : '') + '" style="--c:' + c + '"><div class="tl2__time">' + M.clock(l.to.planned, l.to.time, { delay: l.to.delay, realtime: l.realtime }) + '</div><div class="tl2__rail"><span class="tl2__dot"></span></div><div class="tl2__body"><div class="tl2__stop">' + esc(l.to.name) + '</div></div></div>' : '');
    }).join('') + (it.legs[it.legs.length - 1].walk ? '<div class="tl2__leg last"><div class="tl2__time">' + M.fmtTime(it.arr) + '</div><div class="tl2__rail"><span class="tl2__dot"></span></div><div class="tl2__body"><div class="tl2__stop">' + esc(it.legs[it.legs.length - 1].to.name) + '</div></div></div>' : '') + '</div>';
  }

  /* =====================================================================
     Abfahrt
     ===================================================================== */
  TAB.abfahrt = function (box) {
    box.innerHTML = '<section class="cf"><form class="cf__form" onsubmit="return false" style="grid-template-columns:minmax(0,1fr) 15rem;column-gap:1.25rem"><div id="aStop"></div><button class="btn cf__map" type="button" id="aNear" style="grid-column:2">' + icon('pin') + 'In der Nähe</button></form></section>' +
      '<div class="chips" id="aF"><button class="chip on" data-m="">Alle</button><button class="chip" data-m="tram">' + M.modeBadge('tram', { sm: true }) + 'Straßenbahn</button><button class="chip" data-m="bus">' + M.modeBadge('bus', { sm: true }) + 'Bus</button></div>' +
      M.LEGEND + '<div id="aBoard"><p class="empty">Wähle eine Haltestelle, um die nächsten Abfahrten in Echtzeit zu sehen.</p></div>';
    let cur = null, mode = '', timer = null, data = null;
    const inp = C.placeInput(M.$('#aStop', box), { label: 'Haltestelle', onPick: (p) => load(p) });
    const draw = () => {
      const b = M.$('#aBoard', box);
      if (!data || !b) return;
      const list = data.list.filter((x) => !mode || x.line.mode === mode).slice(0, 30);
      b.innerHTML = '<div class="board"><div class="board__head"><div><b>' + esc(cur.name) + '</b><br><small>' + M.lineGroups(M.Net.linesAt(cur.id).map((l) => l.line)) + '</small></div><small>' + icon('live') + ' ' + esc(data.src) + ' · ' + M.fmtTime(new Date()) + ' Uhr</small></div>' +
        (list.length ? list.map((x) => {
          const st = M.status(x);
          return '<div class="dep">' + M.badges(x.line) + '<div class="dep__dir' + (x.cancelled ? ' cxl' : '') + '">' + esc(x.headsign) + '</div><div class="dep__when ' + M.delayCls(x) + '">' + (x.cancelled ? 'Fällt aus' : esc(M.countdown(x.time))) + '<small>' + M.clock(x.planned, x.time, x) + '</small></div>' +
            '<div class="dep__sub">' + (x.platform ? '<span class="bstg">Bstg. ' + esc(x.platform) + '</span>' : '') + '<span class="' + st.cls + '">' + esc(st.text) + '</span>' + (x.notes || []).map((n) => '<span>' + icon('alert') + ' ' + esc(n) + '</span>').join('') + '</div></div>';
        }).join('') : '<p class="empty">In den nächsten 90 Minuten keine Abfahrten.</p>') + '</div>';
    };
    const load = async (p) => {
      cur = p;
      await M.Net.load();
      const st = M.Net.station(p.id) || {};
      M.$('#aBoard', box).innerHTML = '<div class="spin"></div>';
      try { data = await M.Transit.departures({ id: p.id, s: st.s, lat: p.lat, lon: p.lon }); draw(); } catch (e) { M.$('#aBoard', box).innerHTML = '<div class="note note--warn">' + icon('alert') + '<div>Abfahrten gerade nicht verfügbar.</div></div>'; }
      clearInterval(timer);
      timer = setInterval(async () => { if (!document.body.contains(box)) return clearInterval(timer); try { data = await M.Transit.departures({ id: p.id, s: st.s, lat: p.lat, lon: p.lon }); draw(); } catch (e) { /* nächster Versuch */ } }, 30000);
    };
    M.$('#aF', box).onclick = (e) => { const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; M.$$('#aF .chip', box).forEach((x) => x.classList.toggle('on', x === b)); draw(); };
    M.$('#aNear', box).onclick = () => {
      if (!navigator.geolocation) return M.toast('Standort nicht verfügbar.');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const d = await M.Net.load();
        let best = null, bd = Infinity;
        Object.entries(d.stations).forEach(([id, s]) => { const m = M.dist(pos.coords.latitude, pos.coords.longitude, s.la, s.lo); if (m < bd) { bd = m; best = { id, name: s.n, lat: s.la, lon: s.lo, type: 'stop' }; } });
        if (best) { inp.set(best); load(best); M.toast('Nächste Haltestelle: ' + best.name + ' (' + Math.round(bd) + ' m)'); }
      }, () => M.toast('Standort nicht freigegeben.'), { timeout: 10000 });
    };
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    if (q.get('halt')) M.Net.load().then((d) => { const s = d.stations[q.get('halt')]; if (s) { const p = { id: q.get('halt'), name: s.n, lat: s.la, lon: s.lo, type: 'stop' }; inp.set(p); load(p); } });
    return () => clearInterval(timer);
  };

  /* =====================================================================
     Interaktive Karte – Ebene 1: Liniennetz · Ebene 2: Route berechnen
     ===================================================================== */
  TAB.karte = function (box) {
    box.innerHTML = '<div class="mapwrap"><aside class="mapside"><div class="mapside__head"><div class="levels" role="tablist"><button class="on" data-lv="1">Ebene 1<small>Liniennetz</small></button><button data-lv="2">Ebene 2<small>Route berechnen</small></button></div><div id="kHead"></div></div><div class="mapside__body" id="kBody"><div class="spin"></div></div></aside><div class="map" id="kMap"></div></div>';
    const st = { lv: 1, tram: true, bus: false, night: false, sel: null, dir: 0, a: null, b: null, route: null };
    let map = null, pickA = null, pickB = null, seq = 0;
    const head = M.$('#kHead', box), body = M.$('#kBody', box);

    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    if (q.get('linie')) { st.sel = q.get('linie'); }

    M.Net.load().then((d) => {
      if (st.sel) { const L = M.Net.lineById(st.sel); if (L) { st.tram = L.mode === 'tram' && !M.isNight(L.name); st.bus = L.mode === 'bus' && !M.isNight(L.name); st.night = M.isNight(L.name); } }
      map = M.Maps.create(M.$('#kMap', box), { draw: (m) => { M.Maps.network(m, st); if (st.lv === 2 && st.route) M.Maps.route(m, st.route); if (st.sel && st.lv === 1) focusLine(); } });
      if (!map) return;
      map.on('click', 'stops-c', (e) => {
        const f = e.features[0];
        const id = f.properties.id;
        const acts = st.lv === 2
          ? [{ label: 'Start', fn: (x) => setPoint('a', x) }, { label: 'Ziel', fn: (x) => setPoint('b', x) }, { label: 'Abfahrten', fn: (x) => { location.hash = '#/verbindungen/abfahrt?halt=' + encodeURIComponent(x); } }]
          : [{ label: 'Von hier', fn: (x) => { switchLv(2); setPoint('a', x); } }, { label: 'Nach hier', fn: (x) => { switchLv(2); setPoint('b', x); } }, { label: 'Abfahrten', fn: (x) => { location.hash = '#/verbindungen/abfahrt?halt=' + encodeURIComponent(x); } }];
        M.Maps.stopPopup(map, id, e.lngLat, acts);
        e.preventDefault();
      });
      map.on('click', 'net-line', (e) => {
        if (st.lv !== 1 || e.defaultPrevented) return;
        const f = e.features[0];
        selectLine(f.properties.id === st.sel ? null : f.properties.id);
      });
      renderSide();
    }).catch(() => { body.innerHTML = '<div class="note note--warn">' + icon('alert') + '<div>Das Liniennetz konnte nicht geladen werden.</div></div>'; });

    function switchLv(lv) {
      st.lv = lv;
      M.$$('.levels button', box).forEach((b) => b.classList.toggle('on', +b.dataset.lv === lv));
      if (lv === 1) { M.Maps.route(map, null); st.dim = false; } else { st.sel = null; st.dim = !!st.route; if (st.route) M.Maps.route(map, st.route); }
      M.Maps.networkFilter(map, st);
      renderSide();
    }
    M.$('.levels', box).onclick = (e) => { const b = e.target.closest('[data-lv]'); if (b && map) switchLv(+b.dataset.lv); };

    function renderSide() {
      const d = M.Net.data;
      if (st.lv === 1) {
        head.innerHTML = '<div class="chips" style="margin:0"><button class="chip' + (st.tram ? ' on' : '') + '" data-mode="tram">' + M.modeBadge('tram', { sm: true }) + 'Straßenbahn</button><button class="chip' + (st.bus ? ' on' : '') + '" data-mode="bus">' + M.modeBadge('bus', { sm: true }) + 'Bus</button><button class="chip' + (st.night ? ' on' : '') + '" data-mode="night"><span class="bd sm" style="background:var(--line-night)">N</span>Nacht</button></div>';
        const grp = (t, ls) => (ls.length ? '<div class="mhead">' + t + '</div><div class="linegrid">' + ls.map((l) => '<button data-line="' + l.id + '" class="' + (st.sel === l.id ? 'on' : st.sel ? 'dim' : '') + '" title="' + esc((l.mode === 'tram' ? 'Straßenbahn ' : 'Bus ') + l.name) + '">' + M.badges(l.line) + '</button>').join('') + '</div>' : '');
        let html = '';
        if (st.tram) html += grp('Straßenbahn', d.lines.filter((l) => l.mode === 'tram' && !M.isNight(l.name)));
        if (st.bus) html += grp('Bus', d.lines.filter((l) => l.mode === 'bus' && !M.isNight(l.name)));
        if (st.night) html += grp('Nachtlinien', d.lines.filter((l) => M.isNight(l.name)));
        if (!html) html = '<p style="color:var(--grey-500)">Wähle oben Straßenbahn, Bus oder Nacht.</p>';
        if (st.sel) {
          const L = M.Net.lineById(st.sel);
          const vs = L.variants;
          const v = vs[Math.min(st.dir, vs.length - 1)];
          const c = M.mapColor(L.line);
          html = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' + M.badges(L.line, { lg: true }) + '<b style="font-size:17px">Richtung ' + esc(v.to) + '</b></div>' +
            (vs.length > 1 ? '<div class="chips" style="margin:.5rem 0">' + vs.map((x, i) => '<button class="chip' + (i === st.dir ? ' on' : '') + '" data-dir="' + i + '">→ ' + esc(x.to) + '</button>').join('') + '</div>' : '') +
            '<p style="color:var(--grey-500)" style="font-size:13px">' + v.stops.length + ' Haltestellen · ca. ' + v.times[v.times.length - 1] + ' Min.</p>' +
            '<ul class="stoplist" style="--c:' + c + '">' + v.stops.map((id, i) => '<li data-stop="' + id + '">' + esc(M.Net.station(id).n) + ' <small>' + (i ? '+' + v.times[i] + ' Min.' : '') + '</small></li>').join('') + '</ul>' +
            '<button class="btn btn--outline btn--sm btn--icon" data-clear style="margin-top:1rem">' + icon('arrowL') + 'Alle Linien</button>' + html.replace(/^/, '<div class="mhead" style="margin-top:20px">Andere Linie</div>');
        } else html = '<p style="color:var(--grey-500)" style="font-size:13.5px;margin-bottom:6px">Komplettes Liniennetz der MVB. Linie antippen, um ihren Verlauf zu sehen – oder eine Haltestelle auf der Karte für „Von hier / Nach hier“.</p>' + html;
        body.innerHTML = html;
        return;
      }
      // Ebene 2
      head.innerHTML = '<div class="pickrow"><span class="pin a">A</span><div id="kA"></div><span></span></div><div class="pickrow"><span class="pin b">B</span><div id="kB"></div><button class="cf__swap" style="width:2.5rem;height:2.5rem" id="kSwap" aria-label="Tauschen">' + icon('swap') + '</button></div>' +
        '<label class="chk" style="font-size:.875rem"><input type="checkbox" id="kNight"' + (st.night2 ? ' checked' : '') + '><span>Nachtlinien einbeziehen</span></label>';
      pickA = C.placeInput(M.$('#kA', box), { label: 'Start', onPick: (p) => setPoint('a', p.id) });
      pickB = C.placeInput(M.$('#kB', box), { label: 'Ziel', onPick: (p) => setPoint('b', p.id) });
      if (st.a) pickA.set({ id: st.a, name: M.Net.station(st.a).n });
      if (st.b) pickB.set({ id: st.b, name: M.Net.station(st.b).n });
      M.$('#kSwap', box).onclick = () => { [st.a, st.b] = [st.b, st.a]; renderSide(); calc(); };
      M.$('#kNight', box).onchange = (e) => { st.night2 = e.target.checked; calc(); };
      if (!st.route) body.innerHTML = '<p style="color:var(--grey-500)" style="font-size:14px">Wähle Start und Ziel – oben eintippen oder auf der Karte eine Haltestelle antippen. Berechnet wird der schnellste Weg mit allen Umstiegen; jeder Abschnitt erscheint in seiner Linienfarbe.</p>';
    }
    function setPoint(k, id) {
      st[k] = id;
      if (st.lv !== 2) switchLv(2);
      const p = { id, name: M.Net.station(id).n };
      (k === 'a' ? pickA : pickB) && (k === 'a' ? pickA : pickB).set(p);
      calc();
    }
    async function calc() {
      if (!st.a || !st.b) return;
      const hr = new Date().getHours();
      const r = M.route(st.a, st.b, { night: st.night2 || hr < 4 || hr >= 23 });
      st.route = r; st.dim = !!r;
      M.Maps.networkFilter(map, st);
      M.Maps.route(map, r);
      if (!r) { body.innerHTML = '<p class="empty">Keine Verbindung im Netz gefunden.</p>'; return; }
      const my = ++seq;
      const rides = r.legs.filter((l) => l.type === 'ride');
      body.innerHTML = '<div class="rsum"><span style="color:var(--grey-500)" style="font-size:13px">Schnellster Weg</span><b>ca. ' + M.fmtDur(r.total) + '</b><span style="font-size:13.5px">' + (r.transfers ? r.transfers + ' Umstieg' + (r.transfers > 1 ? 'e' : '') : 'ohne Umstieg') + ' · ' + rides.map((l) => M.badges(l.line, { sm: true })).join(' ' + icon('arrow', 'arr') + ' ') + '</span></div>' +
        r.legs.map((lg, i) => {
          if (lg.type === 'walk') return '<div class="rleg walk"><i></i><div><div class="rleg__t">' + icon('walk') + 'Fußweg · ' + lg.t + ' Min. (' + lg.m + ' m)</div><div class="rleg__s">' + esc(M.Net.station(lg.from).n) + ' → ' + esc(M.Net.station(lg.to).n) + '</div></div></div>';
          return '<div class="rleg" style="--c:' + M.mapColor(lg.line) + '"><i></i><div><div class="rleg__t">' + M.badges(lg.line, { sm: true }) + '<span>' + esc(M.Net.station(lg.from).n) + '</span>' + icon('arrow', 'arr') + '<span>' + esc(M.Net.station(lg.to).n) + '</span></div>' +
            '<div class="rleg__s">Richtung ' + esc(lg.headsign) + ' · ' + (lg.stops.length - 1) + ' Halt' + (lg.stops.length > 2 ? 'e' : '') + ' · ca. ' + lg.t + ' Min.</div><div class="rleg__live" data-leg="' + i + '"><span class="skel" style="display:block;width:60%"></span></div></div></div>';
        }).join('') +
        '<p style="color:var(--grey-500)" style="font-size:12px;margin-top:12px">Fahrzeiten laut Fahrplan; nächste erreichbare Abfahrt live (MVB-Echtzeit).</p>';
      // nächste erreichbare Abfahrten nacheinander (Anschluss berücksichtigen)
      let t = new Date();
      for (let i = 0; i < r.legs.length; i++) {
        const lg = r.legs[i];
        if (my !== seq) return;
        if (lg.type === 'walk') { t = new Date(t.getTime() + lg.t * 60000); continue; }
        const s = M.Net.station(lg.from);
        const dep = await M.Transit.nextOf({ id: lg.from, s: s.s, lat: s.la, lon: s.lo }, lg.line, lg.headsign, new Date(t.getTime() + (i ? 60000 : 0)));
        if (my !== seq) return;
        const el = M.$('[data-leg="' + i + '"]', body);
        if (!el) return;
        if (dep) {
          const stt = M.status(dep);
          el.innerHTML = (i ? 'Nächste erreichbare Fahrt: ' : 'Nächste Abfahrt: ') + '<b class="' + M.delayCls(dep) + '">' + M.fmtTime(dep.time) + '</b>' + (dep.delay ? ' <span class="t-pl">' + M.fmtTime(dep.planned) + '</span>' : '') + ' · <span class="' + stt.cls + '">' + esc(stt.text) + '</span>' + (dep.platform ? ' · <span class="bstg">Bstg. ' + esc(dep.platform) + '</span>' : '');
          t = new Date(dep.time.getTime() + lg.t * 60000);
        } else {
          el.innerHTML = '<span style="color:var(--grey-500)">Keine Live-Abfahrt gefunden</span>';
          t = new Date(t.getTime() + (lg.t + 5) * 60000);
        }
      }
    }
    function selectLine(id) {
      st.sel = id; st.dir = 0; st.dim = false;
      M.Maps.networkFilter(map, st);
      renderSide();
      if (id) focusLine();
    }
    function focusLine() {
      const L = M.Net.lineById(st.sel);
      if (L && map) M.Maps.fit(map, L.variants[Math.min(st.dir, L.variants.length - 1)].geo, 40);
    }
    head.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      st[b.dataset.mode] = !st[b.dataset.mode];
      if (st.sel) { const L = M.Net.lineById(st.sel); const k = M.isNight(L.name) ? 'night' : L.mode; if (!st[k]) st.sel = null; }
      M.Maps.networkFilter(map, st);
      renderSide();
    });
    body.addEventListener('click', (e) => {
      const l = e.target.closest('[data-line]');
      if (l) { selectLine(l.dataset.line === st.sel ? null : l.dataset.line); return; }
      const dr = e.target.closest('[data-dir]');
      if (dr) { st.dir = +dr.dataset.dir; renderSide(); focusLine(); return; }
      if (e.target.closest('[data-clear]')) { selectLine(null); return; }
      const s = e.target.closest('[data-stop]');
      if (s && map) { const p = M.Net.station(s.dataset.stop); map.flyTo({ center: [p.lo, p.la], zoom: 15.5 }); M.Maps.stopPopup(map, s.dataset.stop, [p.lo, p.la], [{ label: 'Von hier', fn: (x) => { switchLv(2); setPoint('a', x); } }, { label: 'Nach hier', fn: (x) => { switchLv(2); setPoint('b', x); } }]); }
    });
    return () => { try { map && map.remove(); } catch (e) { /* weg */ } };
  };
})(window.MVB = window.MVB || {});
