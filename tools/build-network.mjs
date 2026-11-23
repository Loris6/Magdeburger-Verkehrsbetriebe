#!/usr/bin/env node
/* MVB – Liniennetz aus echten Fahrplandaten bauen (Transitous / MOTIS 2, DELFI-Daten)
 *
 * Erzeugt data/network.json mit allen Straßenbahn- und Buslinien der MVB:
 *   stations: { id: { n: Name, la, lo } }          – Haltestellen (Bahnsteige zusammengefasst)
 *   lines:    [ { id, name, mode, color, variants: [ { to, stops: [ids], times: [Min.], geo: [[lon,lat]...] } ] } ]
 *
 * Aufruf: node tools/build-network.mjs [Datum JJJJ-MM-TT]
 * Läuft auch automatisch per GitHub Action (.github/workflows/daten.yml).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://api.transitous.org/api';
const BBOX = { min: '52.02,11.47', max: '52.235,11.80' };
const AGENCY = /Magdeburger Verkehrsbetriebe|^MVB/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'mvb-website-network-builder' } });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch (e) { /* nochmal */ }
    await sleep(800 * (i + 1));
  }
  return null;
}

/* Google-Polyline (Genauigkeit 6 bei MOTIS) */
function decode(str, precision = 6) {
  const f = 10 ** precision, out = [];
  let i = 0, lat = 0, lon = 0;
  while (i < str.length) {
    for (const k of [0, 1]) {
      let b, shift = 0, res = 0;
      do { b = str.charCodeAt(i++) - 63; res |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = res & 1 ? ~(res >> 1) : res >> 1;
      if (k === 0) lat += d; else lon += d;
    }
    out.push([+(lon / f).toFixed(5), +(lat / f).toFixed(5)]);
  }
  return out;
}
/* Linie vereinfachen (Douglas-Peucker, ca. 4 m) */
function simplify(pts, eps = 0.00004) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const stationId = (stopId) => String(stopId || '').replace(/^de-DELFI_/, '').replace(/^(de:\d+:\d+).*$/, '$1');
const cleanName = (n) => String(n || '').replace(/^Magdeburg,\s*/, '').trim();

const day = process.argv[2] || (() => {
  // nächster Dienstag (normaler Werktag) und der Samstag danach
  const d = new Date(); d.setUTCDate(d.getUTCDate() + ((9 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
})();
const sat = (() => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 4); return d.toISOString().slice(0, 10); })();

// Zeitfenster (UTC, Winterzeit = Ortszeit − 1 h): früh, Hauptverkehr, Mittag, Abend, Spätabend, Nacht
const WINDOWS = [];
for (const [d, hours] of [[day, ['04:00', '05:30', '07:00', '09:00', '12:00', '15:00', '18:00', '20:30', '22:00', '23:30']], [sat, ['00:30', '01:30', '02:30', '08:00', '13:00', '19:00']]]) {
  for (const h of hours) WINDOWS.push(d + 'T' + h + ':00Z');
}

async function main() {
  console.log('Stichtag', day, '/', sat, '·', WINDOWS.length, 'Zeitfenster');
  const cand = new Map(); // key route|from|to → tripId
  for (const t of WINDOWS) {
    const end = new Date(Date.parse(t) + 40 * 60000).toISOString().replace(/\.\d+Z$/, 'Z');
    const list = await get(`${BASE}/v1/map/trips?min=${BBOX.min}&max=${BBOX.max}&startTime=${t}&endTime=${end}&zoom=15`);
    let n = 0;
    for (const seg of list || []) {
      if (seg.mode !== 'TRAM' && seg.mode !== 'BUS') continue;
      for (const tr of seg.trips || []) {
        const name = String(tr.routeShortName || '').trim();
        if (!name) continue;
        const k = seg.mode + '|' + name + '|' + tr.tripId.split('_').pop();
        if (!cand.has(k)) { cand.set(k, { mode: seg.mode, name, tripId: tr.tripId }); n++; }
      }
    }
    console.log(t, 'Fahrten neu:', n);
    await sleep(300);
  }

  // Fahrtdetails laden (je Linie höchstens 40 Fahrten, damit alle Varianten dabei sind)
  const byLine = new Map();
  for (const c of cand.values()) {
    const k = c.mode + '|' + c.name;
    if (!byLine.has(k)) byLine.set(k, []);
    byLine.get(k).push(c);
  }
  const stations = {};
  const lines = new Map();
  const jobs = [];
  for (const [k, arr] of byLine) {
    // gleichmäßig verteilt auswählen
    const step = Math.max(1, Math.floor(arr.length / 40));
    for (let i = 0; i < arr.length; i += step) jobs.push(arr[i]);
  }
  console.log('Linien gefunden:', byLine.size, '· Fahrten zu laden:', jobs.length);

  let done = 0;
  const worker = async () => {
    while (jobs.length) {
      const c = jobs.shift();
      const d = await get(`${BASE}/v2/trip?tripId=${encodeURIComponent(c.tripId)}`);
      done++;
      if (done % 50 === 0) console.log('…', done);
      const leg = d && d.legs && d.legs[0];
      if (!leg || !AGENCY.test(leg.agencyName || '')) continue;
      const seq = [leg.from, ...(leg.intermediateStops || []), leg.to];
      const ids = [], times = [];
      const t0 = Date.parse(leg.from.scheduledDeparture || leg.from.departure || leg.startTime);
      for (const s of seq) {
        const id = stationId(s.stopId);
        if (!id) continue;
        if (!stations[id]) stations[id] = { n: cleanName(s.name), sid: String(s.stopId || ''), la: [], lo: [] };
        stations[id].la.push(s.lat); stations[id].lo.push(s.lon);
        if (ids[ids.length - 1] === id) continue;
        ids.push(id);
        const ts = Date.parse(s.scheduledArrival || s.arrival || s.scheduledDeparture || s.departure || leg.startTime);
        times.push(Math.max(0, Math.round((ts - t0) / 60000)));
      }
      if (ids.length < 2) continue;
      const key = c.mode + '|' + c.name;
      if (!lines.has(key)) lines.set(key, { name: c.name, mode: c.mode === 'TRAM' ? 'tram' : 'bus', color: leg.routeColor ? '#' + leg.routeColor.toUpperCase() : '', variants: new Map(), count: 0 });
      const L = lines.get(key);
      const vk = ids.join('>');
      const v = L.variants.get(vk);
      if (v) { v.n++; continue; }
      const geo = leg.legGeometry && leg.legGeometry.points ? simplify(decode(leg.legGeometry.points, leg.legGeometry.precision || 6)) : null;
      L.variants.set(vk, { to: cleanName(leg.headsign || leg.to.name), stops: ids, times, geo, n: 1 });
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));

  // Varianten reduzieren: Varianten, die vollständig in einer längeren derselben Richtung enthalten sind, fallen weg
  const contains = (big, small) => {
    const s = big.join('>') ; return big.length > small.length && ('>' + s + '>').includes('>' + small.join('>') + '>');
  };
  const out = [];
  for (const L of lines.values()) {
    let vars = Array.from(L.variants.values()).sort((a, b) => b.stops.length - a.stops.length || b.n - a.n);
    vars = vars.filter((v) => !vars.some((w) => w !== v && contains(w.stops, v.stops)));
    // seltene Kurzvarianten (z. B. Einsetzer) weglassen, wenn es häufige Hauptvarianten gibt
    const maxN = Math.max(...vars.map((v) => v.n));
    vars = vars.filter((v) => v.n >= Math.max(1, maxN * 0.08)).slice(0, 6);
    out.push({ id: (L.mode === 'tram' ? 't' : 'b') + L.name, name: L.name, mode: L.mode, color: L.color, variants: vars.map(({ n, ...v }) => v) });
  }
  const num = (n) => { const m = String(n).match(/\d+/); return m ? +m[0] : 999; };
  out.sort((a, b) => (a.mode === b.mode ? 0 : a.mode === 'tram' ? -1 : 1) || (/^N/.test(a.name) - /^N/.test(b.name)) || num(a.name) - num(b.name) || a.name.localeCompare(b.name));

  // nur Haltestellen behalten, die von MVB-Linien bedient werden; Koordinaten mitteln
  const used = new Set(out.flatMap((l) => l.variants.flatMap((v) => v.stops)));
  const st = {};
  for (const id of used) {
    const s = stations[id];
    const avg = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(5);
    st[id] = { n: s.n, la: avg(s.la), lo: avg(s.lo), s: s.sid };
  }

  const data = { generated: new Date().toISOString(), source: 'Transitous (MOTIS 2) · DELFI-Fahrplandaten', day, stations: st, lines: out };
  await mkdir(join(ROOT, 'data'), { recursive: true });
  await writeFile(join(ROOT, 'data', 'network.json'), JSON.stringify(data));
  console.log('Fertig:', out.length, 'Linien,', Object.keys(st).length, 'Haltestellen');
  console.log(out.map((l) => l.mode + ' ' + l.name + ' (' + l.variants.length + ')').join(', '));
}

main().catch((e) => { console.error(e); process.exit(1); });
