/* MVB – Karten (MapLibre GL, OpenFreeMap): Liniennetz, Route, Störungskarte */
(function (M) {
  'use strict';
  const esc = M.esc;
  const FONT = ['Noto Sans Regular'];
  const FONT_B = ['Noto Sans Bold'];

  const maps = new Set();
  M.Maps = {
    ok: () => typeof window.maplibregl !== 'undefined',
    styleUrl: () => M.CONFIG.styles[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'],
    /** Karte anlegen. draw(map) wird nach jedem Laden des Stils aufgerufen (auch nach Hell/Dunkel-Wechsel). */
    create(el, o) {
      if (!this.ok()) { el.innerHTML = '<div class="empty">Die Karte konnte nicht geladen werden.</div>'; return null; }
      o = o || {};
      const map = new maplibregl.Map({
        container: el, style: this.styleUrl(), center: o.center || M.CONFIG.center, zoom: o.zoom || M.CONFIG.zoom,
        minZoom: 9.5, maxZoom: 18, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false,
        cooperativeGestures: !!o.cooperative
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map._draw = o.draw || null;
      map.on('style.load', () => { try { map._draw && map._draw(map); } catch (e) { console.error(e); } });
      map._markers = [];
      maps.add(map);
      el.classList.add('map-gestures');
      return map;
    },
    destroyAll() { maps.forEach((m) => { try { m.remove(); } catch (e) { /* weg */ } }); maps.clear(); },
    retheme() { maps.forEach((m) => { try { m.setStyle(this.styleUrl()); } catch (e) { /* egal */ } }); },
    clearMarkers(map) { (map._markers || []).forEach((m) => m.remove()); map._markers = []; },
    marker(map, lngLat, html, opts) {
      const el = M.h(html);
      const mk = new maplibregl.Marker(Object.assign({ element: el }, opts || {})).setLngLat(lngLat).addTo(map);
      map._markers.push(mk);
      return mk;
    },
    fit(map, coords, pad) {
      if (!coords || !coords.length) return;
      const b = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(b, { padding: pad || 50, maxZoom: 16, duration: 700 });
    },
    setData(map, id, fc) { const s = map.getSource(id); if (s) s.setData(fc); else map.addSource(id, { type: 'geojson', data: fc }); },
    rm(map, ids) { ids.forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); }); }
  };
  const fc = (features) => ({ type: 'FeatureCollection', features });
  const lineF = (coords, props) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: props || {} });
  const ptF = (c, props) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: props || {} });
  const casingColor = () => (document.documentElement.dataset.theme === 'dark' ? '#0F1412' : '#FFFFFF');

  /* =====================================================================
     Liniennetz (Ebene 1) – alle Linien in Linienfarbe, weiß umrandet (Muvit)
     ===================================================================== */
  M.Maps.network = function (map, st) {
    const d = M.Net.data;
    const feats = [];
    d.lines.forEach((l) => {
      const color = M.mapColor(l.line);
      const night = M.isNight(l.name);
      // je Richtung eine Variante reicht für die Darstellung
      l.variants.forEach((v, vi) => feats.push(lineF(v.geo, { id: l.id, mode: night ? 'night' : l.mode, name: l.name, color, vi })));
    });
    M.Maps.setData(map, 'net', fc(feats));
    const stops = Object.entries(d.stations).map(([id, s]) => {
      const ls = M.Net.linesAt(id);
      return ptF([s.lo, s.la], { id, name: s.n, tram: ls.some((l) => l.mode === 'tram' && !M.isNight(l.name)) ? 1 : 0, bus: ls.some((l) => l.mode === 'bus' && !M.isNight(l.name)) ? 1 : 0, night: ls.some((l) => M.isNight(l.name)) ? 1 : 0 });
    });
    M.Maps.setData(map, 'stops', fc(stops));
    if (!map.getLayer('net-case')) {
      map.addLayer({ id: 'net-case', type: 'line', source: 'net', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': casingColor(), 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 14, 8, 17, 13] } });
      map.addLayer({ id: 'net-line', type: 'line', source: 'net', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4.5, 17, 8], 'line-opacity': 1 } });
      map.addLayer({ id: 'stops-c', type: 'circle', source: 'stops', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.2, 14, 5, 17, 8], 'circle-color': '#FFFFFF', 'circle-stroke-color': '#1B1F1D', 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2] } });
      map.addLayer({ id: 'stops-l', type: 'symbol', source: 'stops', minzoom: 13.2, layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': document.documentElement.dataset.theme === 'dark' ? '#EEF3F0' : '#1B1F1D', 'text-halo-color': casingColor(), 'text-halo-width': 1.6 } });
      map.on('mouseenter', 'stops-c', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'stops-c', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'net-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'net-line', () => { map.getCanvas().style.cursor = ''; });
    }
    M.Maps.networkFilter(map, st);
  };
  /** Sichtbare Verkehrsmittel und hervorgehobene Linie */
  M.Maps.networkFilter = function (map, st) {
    if (!map.getLayer('net-line')) return;
    const modes = [];
    if (st.tram) modes.push('tram');
    if (st.bus) modes.push('bus');
    if (st.night) modes.push('night');
    const f = ['in', ['get', 'mode'], ['literal', modes]];
    map.setFilter('net-line', f); map.setFilter('net-case', f);
    const sf = ['any', st.tram ? ['==', ['get', 'tram'], 1] : false, st.bus ? ['==', ['get', 'bus'], 1] : false, st.night ? ['==', ['get', 'night'], 1] : false];
    map.setFilter('stops-c', sf); map.setFilter('stops-l', sf);
    const dimmed = st.dim || st.sel;
    const op = dimmed ? ['case', ['==', ['get', 'id'], st.sel || ''], 1, 0.13] : 1;
    map.setPaintProperty('net-line', 'line-opacity', op);
    map.setPaintProperty('net-case', 'line-opacity', dimmed ? ['case', ['==', ['get', 'id'], st.sel || ''], 1, 0.25] : 1);
    // ausgewählte Linie nach oben
    const on = ['==', ['get', 'id'], st.sel || ''];
    if (st.sel) map.setPaintProperty('net-line', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, ['case', on, 3.5, 2], 14, ['case', on, 6.5, 4.5], 17, ['case', on, 10, 8]]);
    else map.setPaintProperty('net-line', 'line-width', ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4.5, 17, 8]);
  };

  /** Popup einer Haltestelle */
  M.Maps.stopPopup = function (map, id, lngLat, actions) {
    const s = M.Net.station(id);
    const ls = M.Net.linesAt(id).map((l) => l.line);
    const html = '<div class="pop"><b>' + esc(s.n) + '</b>' + M.lineGroups(ls) +
      '<div class="btns">' + (actions || []).map((a, i) => '<button class="btn sm' + (i ? ' ghost' : '') + '" data-pa="' + i + '">' + esc(a.label) + '</button>').join('') + '</div></div>';
    const pop = new maplibregl.Popup({ closeButton: true, maxWidth: '300px', offset: 10 }).setLngLat(lngLat).setHTML(html).addTo(map);
    pop.getElement().addEventListener('click', (e) => {
      const b = e.target.closest('[data-pa]');
      if (!b) return;
      pop.remove();
      actions[+b.dataset.pa].fn(id);
    });
    return pop;
  };

  /* =====================================================================
     Route (Ebene 2) – Abschnitte in Linienfarben, Fußwege gepunktet
     ===================================================================== */
  M.Maps.route = function (map, r) {
    M.Maps.rm(map, ['rt-case', 'rt-line', 'rt-walk', 'rt-stops', 'rt-xfer']);
    if (map.getSource('rt')) map.removeSource('rt');
    if (map.getSource('rtp')) map.removeSource('rtp');
    M.Maps.clearMarkers(map);
    if (!r) return;
    const feats = [], pts = [];
    r.legs.forEach((lg, i) => {
      const coords = M.legCoords(lg);
      if (lg.type === 'ride') {
        const color = M.mapColor(lg.line);
        feats.push(lineF(coords, { kind: 'ride', color, i }));
        lg.stops.forEach((id, k) => { const s = M.Net.station(id); pts.push(ptF([s.lo, s.la], { dot: M.stopDot(color), color, end: k === 0 || k === lg.stops.length - 1 ? 1 : 0 })); });
      } else feats.push(lineF(coords, { kind: 'walk', i }));
    });
    map.addSource('rt', { type: 'geojson', data: fc(feats) });
    map.addSource('rtp', { type: 'geojson', data: fc(pts) });
    map.addLayer({ id: 'rt-case', type: 'line', source: 'rt', filter: ['==', ['get', 'kind'], 'ride'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 7, 15, 13] } });
    map.addLayer({ id: 'rt-line', type: 'line', source: 'rt', filter: ['==', ['get', 'kind'], 'ride'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4.5, 15, 9] } });
    map.addLayer({ id: 'rt-walk', type: 'line', source: 'rt', filter: ['==', ['get', 'kind'], 'walk'], layout: { 'line-cap': 'round' }, paint: { 'line-color': M.cssVar('--line-walk'), 'line-width': 4, 'line-dasharray': [0.1, 1.8] } });
    map.addLayer({ id: 'rt-stops', type: 'circle', source: 'rtp', paint: { 'circle-radius': ['case', ['==', ['get', 'end'], 1], 6.5, 3.6], 'circle-color': ['get', 'dot'], 'circle-stroke-color': ['get', 'color'], 'circle-stroke-width': ['case', ['==', ['get', 'end'], 1], 3, 0] } });
    const a = M.Net.station(r.legs[0].from), b = M.Net.station(r.legs[r.legs.length - 1].to);
    M.Maps.marker(map, [a.lo, a.la], '<div class="mk-pin">' + esc(a.n) + '</div>', { anchor: 'bottom', offset: [0, -10] });
    M.Maps.marker(map, [b.lo, b.la], '<div class="mk-pin b">' + esc(b.n) + '</div>', { anchor: 'bottom', offset: [0, -10] });
    r.legs.forEach((lg, i) => {
      if (i === 0 || lg.type !== 'ride') return;
      const s = M.Net.station(lg.from);
      M.Maps.marker(map, [s.lo, s.la], '<div class="mk-pin x">Umstieg ' + M.badges(lg.line, { sm: true }) + '</div>', { anchor: 'bottom', offset: [0, -10] });
    });
    M.Maps.fit(map, feats.flatMap((f) => f.geometry.coordinates), 60);
  };

  /* =====================================================================
     Störungskarte – gesperrter Abschnitt grau mit Kreuz, neuer Fahrweg eingezeichnet
     ===================================================================== */
  M.Maps.disruption = function (map, plan) {
    const theme = document.documentElement.dataset.theme === 'dark';
    // betroffene Linien im Hintergrund
    const bg = [];
    plan.lines.forEach((L) => L.variants.forEach((v) => bg.push(lineF(v.geo, { color: M.mapColor(L.line) }))));
    M.Maps.setData(map, 'd-bg', fc(bg));
    M.Maps.setData(map, 'd-closed', fc(plan.closed.map((c) => lineF(c.coords, {}))));
    M.Maps.setData(map, 'd-det', fc(plan.detours.map((c) => lineF(c.coords, { color: c.color || M.cssVar('--mvb-green'), label: c.label, off: c.off ? 1 : 0 }))));
    M.Maps.setData(map, 'd-st', fc((plan.stations || []).map((id) => { const s = M.Net.station(id); return ptF([s.lo, s.la], { name: s.n }); })));
    if (!map.getLayer('d-bg')) {
      map.addLayer({ id: 'd-bg-case', type: 'line', source: 'd-bg', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': casingColor(), 'line-width': 7 } });
      map.addLayer({ id: 'd-bg', type: 'line', source: 'd-bg', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
      // gesperrt: ausgegraut
      map.addLayer({ id: 'd-closed-case', type: 'line', source: 'd-closed', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': casingColor(), 'line-width': 12 } });
      map.addLayer({ id: 'd-closed', type: 'line', source: 'd-closed', layout: { 'line-join': 'round', 'line-cap': 'butt' }, paint: { 'line-color': M.cssVar('--line-closed'), 'line-width': 7, 'line-dasharray': [1.4, 0.9] } });
      // neuer Fahrweg
      map.addLayer({ id: 'd-det-case', type: 'line', source: 'd-det', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': 11, 'line-offset': ['*', ['get', 'off'], 11] } });
      map.addLayer({ id: 'd-det', type: 'line', source: 'd-det', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 6, 'line-dasharray': [2.2, 1.1], 'line-offset': ['*', ['get', 'off'], 11] } });
      map.addLayer({ id: 'd-det-l', type: 'symbol', source: 'd-det', layout: { 'symbol-placement': 'line', 'text-field': ['get', 'label'], 'text-font': FONT_B, 'text-size': 12, 'symbol-spacing': 280 }, paint: { 'text-color': theme ? '#EEF3F0' : '#1B1F1D', 'text-halo-color': casingColor(), 'text-halo-width': 2 } });
      map.addLayer({ id: 'd-st', type: 'circle', source: 'd-st', paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-color': '#1B1F1D', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'd-st-l', type: 'symbol', source: 'd-st', layout: { 'text-field': ['get', 'name'], 'text-font': FONT, 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': theme ? '#EEF3F0' : '#1B1F1D', 'text-halo-color': casingColor(), 'text-halo-width': 1.6 } });
    }
    M.Maps.clearMarkers(map);
    plan.cross.forEach((c) => M.Maps.marker(map, c, '<div class="mk-cross" title="Gesperrt"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></div>'));
    if (!map._fitted) { M.Maps.fit(map, plan.focus, 46); map._fitted = true; }
  };
})(window.MVB = window.MVB || {});
