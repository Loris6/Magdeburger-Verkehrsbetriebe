/* MVB – Fahrplan & Echtzeit
   Verbindungen: Transitous (MOTIS 2). Abfahrten: MVB-Echtzeit (INSA) über den Muvit-Dienst, sonst Transitous. */
(function (M) {
  'use strict';
  const C = () => M.CONFIG;
  const LN = (n) => String(n || '').replace(/^Magdeburg,\s*/, '').replace(/^Magdeburg\s+Hbf$/, 'Hauptbahnhof').trim();
  const d = (v) => (v ? new Date(v) : null);

  function modeOf(m) {
    if (m === 'TRAM') return 'tram';
    if (m === 'BUS' || m === 'COACH') return 'bus';
    if (m === 'WALK') return 'walk';
    if (m === 'SUBURBAN') return 'sbahn';
    if (/RAIL|LONG_DISTANCE/.test(m || '')) return 'rail';
    return 'other';
  }
  const lineOf = (o) => {
    const mode = modeOf(o.mode);
    const name = String(o.displayName || o.routeShortName || '').replace(/^(STR|Str|Tram)\s+/, '').replace(/^Bus\s+/, '');
    return { name, mode: mode === 'tram' || mode === 'bus' ? mode : mode, raw: o.routeShortName || '' };
  };

  async function motis(path, params, versions, o) {
    let err;
    for (const v of versions) {
      try { return await M.getJSON(C().motisBase + '/api/' + v + path + '?' + M.qs(params), o); } catch (e) { err = e; if (e.status !== 404) throw e; }
    }
    throw err;
  }

  M.Transit = {
    /** Orte & Adressen im Bediengebiet (für Eingaben, die keine Haltestelle sind) */
    async geocode(text) {
      const B = C().serviceBBox;
      try {
        const r = await motis('/geocode', { text, language: 'de', numResults: 10, place: '52.1316,11.6392', placeBias: 5 }, ['v1'], { ttl: 60000, timeout: 10000 });
        return (r || []).filter((m) => m.lat >= B.minLat && m.lat <= B.maxLat && m.lon >= B.minLon && m.lon <= B.maxLon).map((m) => ({
          id: m.id, name: LN(m.type === 'ADDRESS' ? (m.street || m.name) + (m.houseNumber ? ' ' + m.houseNumber : '') : m.name),
          lat: m.lat, lon: m.lon, type: m.type === 'STOP' ? 'stop' : m.type === 'ADDRESS' ? 'address' : 'poi', motis: true
        }));
      } catch (e) { return []; }
    },

    /** Verbindungen */
    async plan(q) {
      const place = (p) => (p.motisId ? p.motisId : p.lat.toFixed(6) + ',' + p.lon.toFixed(6));
      const params = {
        fromPlace: place(q.from), toPlace: place(q.to), time: q.time ? q.time.toISOString() : null, arriveBy: q.arriveBy ? true : null,
        numItineraries: 6, language: 'de', pedestrianProfile: q.wheelchair ? 'WHEELCHAIR' : null,
        transitModes: q.modes && q.modes.length ? q.modes.map((m) => (m === 'tram' ? 'TRAM' : m === 'bus' ? 'BUS' : 'RAIL')).concat(q.modes.includes('rail') ? ['REGIONAL_RAIL', 'SUBURBAN'] : []) : null,
        pageCursor: q.cursor || null
      };
      const r = await motis('/plan', params, ['v5', 'v4', 'v1'], { ttl: 20000, timeout: 25000 });
      const list = (r.itineraries || []).map((it) => {
        const legs = (it.legs || []).map((l) => {
          const walk = l.mode === 'WALK';
          const ev = (p, kind) => {
            const time = kind === 'dep' ? (p.departure || l.startTime) : (p.arrival || l.endTime);
            const planned = kind === 'dep' ? (p.scheduledDeparture || l.scheduledStartTime) : (p.scheduledArrival || l.scheduledEndTime);
            return { name: LN(p.name), lat: p.lat, lon: p.lon, time: d(time || planned), planned: d(planned || time), delay: l.realTime ? M.delayMin(time, planned) : null, track: p.track || p.scheduledTrack || '', cancelled: !!p.cancelled };
          };
          return {
            walk, mode: modeOf(l.mode), line: walk ? null : lineOf(l), headsign: LN(l.headsign || ''),
            from: ev(l.from, 'dep'), to: ev(l.to, 'arr'), duration: (l.duration || 0) / 60, distance: l.distance || 0,
            stops: (l.intermediateStops || []).map((p) => ({ name: LN(p.name), time: d(p.arrival || p.departure), planned: d(p.scheduledArrival || p.scheduledDeparture) })),
            realtime: !!l.realTime, cancelled: !!l.cancelled, routeColor: l.routeColor ? '#' + l.routeColor : '',
            alerts: (l.alerts || []).map((a) => a.headerText || a.descriptionText).filter(Boolean).slice(0, 3)
          };
        }).filter((l) => !(l.walk && l.duration < 1 && l.distance < 40));
        const first = legs[0], last = legs[legs.length - 1];
        return {
          dep: d(it.startTime), arr: d(it.endTime), depPlanned: first && first.from.planned, arrPlanned: last && last.to.planned,
          duration: (it.duration || 0) / 60, transfers: it.transfers != null ? it.transfers : Math.max(0, legs.filter((l) => !l.walk).length - 1), legs
        };
      }).filter((x) => x.legs.length);
      return { list, next: r.nextPageCursor, prev: r.previousPageCursor };
    },

    /** Abfahrten an einer Haltestelle (Station aus dem Liniennetz) */
    async departures(st, o) {
      o = o || {};
      // 1) MVB-Echtzeit (INSA) über den Muvit-Dienst
      const num = String(st.id || '').split(':').pop();
      if (num && C().dienst) {
        try {
          const r = await M.getJSON(C().dienst + '/nv/departures?' + M.qs({ stop: num, duration: o.duration || 90, when: o.time ? o.time.toISOString() : null }), { ttl: 15000, timeout: 12000 });
          const list = (r.departures || []).map((x) => {
            const line = M.mkLine(x.line && x.line.name, x.line && x.line.product === 'tram' ? 'tram' : x.line && x.line.product === 'bus' ? 'bus' : null);
            return {
              line, headsign: LN(x.direction || ''), time: d(x.when || x.plannedWhen), planned: d(x.plannedWhen || x.when),
              delay: x.delay != null ? Math.round(x.delay / 60) : null, realtime: x.delay != null, cancelled: !!x.cancelled,
              platform: x.platform || x.plannedPlatform || '', notes: (x.remarks || []).filter((m) => m.type === 'warning' || (m.type === 'hint' && !/^(MVB|OPERATOR)$/.test(m.text) && m.code !== 'OPERATOR' && m.code !== 'bf')).map((m) => m.summary || m.text).filter(Boolean).slice(0, 2),
              tripId: x.tripId
            };
          }).filter((x) => x.line.mode === 'tram' || x.line.mode === 'bus');
          if (list.length || r.departures) return { list, src: 'MVB-Echtzeit (INSA)' };
        } catch (e) { /* weiter mit Transitous */ }
      }
      // 2) Transitous
      const params = { n: 50, language: 'de', time: o.time ? o.time.toISOString() : null };
      if (st.s) { params.stopId = st.s; params.radius = 120; } else { params.center = st.lat.toFixed(6) + ',' + st.lon.toFixed(6); params.radius = 150; }
      const r = await motis('/stoptimes', params, ['v5', 'v4', 'v1'], { ttl: 15000, timeout: 15000 });
      const list = (r.stopTimes || []).map((x) => {
        const p = x.place || {};
        const planned = p.scheduledDeparture || p.scheduledArrival, rt = p.departure || p.arrival || planned;
        return { line: lineOf(x), headsign: LN(x.headsign || ''), time: d(rt), planned: d(planned), delay: x.realTime ? M.delayMin(rt, planned) : null, realtime: !!x.realTime, cancelled: !!x.cancelled, platform: p.track || '', notes: [] };
      }).filter((x) => x.line.mode === 'tram' || x.line.mode === 'bus');
      return { list, src: 'Transitous' };
    },

    /** Nächste Abfahrt einer bestimmten Linie Richtung … ab Zeitpunkt (für die Karte) */
    async nextOf(st, line, headsign, after) {
      try {
        const r = await this.departures(st, { duration: 120, time: after > new Date() ? new Date(after.getTime() - 60000) : null });
        const hs = M.norm(headsign);
        const cand = r.list.filter((x) => x.line.name === line.name && !x.cancelled && x.time >= after);
        const dir = cand.filter((x) => { const n = M.norm(x.headsign); return n && hs && (n.includes(hs.split(' ')[0]) || hs.includes(n.split(' ')[0])); });
        return (dir[0] || cand[0]) || null;
      } catch (e) { return null; }
    }
  };
})(window.MVB = window.MVB || {});
