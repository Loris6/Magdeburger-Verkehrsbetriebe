/* MVB – Kern: Konfiguration, Hilfsfunktionen, Icons, Speicher */
(function (M) {
  'use strict';

  M.CONFIG = {
    name: 'MVB – Magdeburger Verkehrsbetriebe',
    tz: 'Europe/Berlin',
    center: [11.6339, 52.1316],          // Alter Markt
    zoom: 12.3,
    serviceBBox: { minLat: 52.02, maxLat: 52.235, minLon: 11.47, maxLon: 11.80 },
    // Neuigkeiten, Baustellen, Stellenangebote – direkt von der echten MVB-Seite (WordPress-Schnittstelle).
    // Fällt sie aus, nimmt die Seite den Stand aus data/news.json (wird per GitHub Action aktualisiert).
    wpBase: 'https://www.mvbnet.de/wp-json/wp/v2',
    wpCats: { baustellen: 11, verkehr: 12, news: 2, startseite: 100 },
    // Fahrplan & Echtzeit
    motisBase: 'https://api.transitous.org',
    // Muvit-Dienst (INSA-Echtzeit der MVB, Störungsmeldungen) – erlaubt Abfragen von loris6.github.io
    dienst: 'https://muvit-dienst.lorismziray01.workers.dev',
    // Karte
    styles: { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' },
    // Bewerbungen: Adresse eines Formular-Endpunkts (z. B. eigener Worker oder Formspree), der multipart/form-data annimmt.
    // Leer = Bewerbung bleibt auf dem Gerät (Vorschau-Modus), nichts verlässt die Seite.
    bewerbungEndpoint: '',
    refreshNewsMs: 5 * 60000
  };

  /* ---------- DOM ---------- */
  M.$ = (s, r) => (r || document).querySelector(s);
  M.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  M.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  M.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  M.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  M.decodeHtml = (s) => { const t = document.createElement('textarea'); t.innerHTML = String(s || ''); return t.value; };
  M.stripHtml = (s) => { const d = new DOMParser().parseFromString(String(s || ''), 'text/html'); return (d.body.textContent || '').replace(/\s+/g, ' ').trim(); };
  M.slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

  /* ---------- Speicher (sicher, auch ohne localStorage) ---------- */
  M.store = {
    get(k, d) { try { const v = localStorage.getItem('mvb.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mvb.' + k, JSON.stringify(v)); } catch (e) { /* egal */ } }
  };

  /* ---------- Netzwerk ---------- */
  const cache = new Map();
  M.getJSON = async function (url, o) {
    o = o || {};
    const hit = cache.get(url);
    if (o.ttl && hit && Date.now() - hit.t < o.ttl) return hit.v;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), o.timeout || 15000);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      const v = await r.json();
      if (o.ttl) cache.set(url, { t: Date.now(), v });
      return v;
    } finally { clearTimeout(timer); }
  };
  M.qs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(Array.isArray(v) ? v.join(',') : v)).join('&');

  /* ---------- Zeit ---------- */
  const tf = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  const df = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });
  const dlf = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
  M.toDate = (v) => (v instanceof Date ? v : v ? new Date(v) : null);
  M.fmtTime = (v) => (v ? tf.format(M.toDate(v)) : '');
  M.fmtDate = (v) => (v ? df.format(M.toDate(v)) : '');
  M.fmtDateLong = (v) => (v ? dlf.format(M.toDate(v)) : '');
  M.minsUntil = (v) => Math.round((M.toDate(v) - Date.now()) / 60000);
  M.fmtDur = (min) => { min = Math.round(min); if (min < 60) return min + ' Min.'; const h = Math.floor(min / 60), m = min % 60; return h + ' Std.' + (m ? ' ' + m + ' Min.' : ''); };
  M.delayMin = (rt, planned) => (rt && planned ? Math.round((M.toDate(rt) - M.toDate(planned)) / 60000) : null);

  /* ---------- Entfernung ---------- */
  M.dist = function (la1, lo1, la2, lo2) {
    const R = 6371000, r = Math.PI / 180;
    const dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r;
    const a = Math.sin(dla / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  /* ---------- Farben aus variables.css ---------- */
  M.cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- Toast ---------- */
  M.toast = function (msg) {
    const el = M.h('<div class="toast" role="status">' + M.esc(msg) + '</div>');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };

  /* ---------- Icons (gerade Linien, 24er Raster) ---------- */
  const P = {
    arrow: 'M4 12h15M13 6l6 6-6 6',
    arrowL: 'M20 12H5M11 6l-6 6 6 6',
    out: 'M7 17L17 7M8 7h9v9',
    search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5 5',
    menu: 'M4 7h16M4 12h16M4 17h10',
    close: 'M6 6l12 12M18 6L6 18',
    swap: 'M7 4v15M3 8l4-4 4 4M17 20V5M13 16l4 4 4-4',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
    alert: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.5',
    pin: 'M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    tram: 'M8 3h8M12 3v3M6 6h12a1 1 0 0 1 1 1v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1zM5 12h14M8 16h.5M15.5 16h.5M8 19l-2 2M16 19l2 2',
    bus: 'M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2zM4 11h16M7 17v3M17 17v3M7.5 14h1M15.5 14h1',
    ticket: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7zM14 5v14',
    user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21a8 8 0 0 1 16 0',
    building: 'M4 21V5l8-2v18M12 7h8v14M2 21h20M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2',
    briefcase: 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
    news: 'M4 5h13v14H6a2 2 0 0 1-2-2V5zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
    mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
    moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    down: 'M6 9l6 6 6-6',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
    check: 'M5 12l5 5 9-10',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
    cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    euro: 'M18 7a6 6 0 1 0 0 10M4 10h9M4 14h9',
    route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
    layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
    map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zM9 4v14M15 6v14',
    home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.5v.5',
    chat: 'M4 5h16v11H9l-5 4V5zM8 9h8M8 12h5',
    walk: 'M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 22l2-7 3 3v4M7 12l2-4 4-1 2 4 3 1M12 15l-1-5',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
    heart: 'M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20z',
    rocket: 'M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5M9 15l-3-3c1-4 4-8 11-9 0 7-5 10-9 11zM14.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM6 12H3l2-3h3M12 18v3l3-2v-3',
    download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    x: 'M6 6l12 12M18 6L6 18',
    live: 'M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.5 18.5a9 9 0 0 1 0-13M18.5 5.5a9 9 0 0 1 0 13',
    a11y: 'M12 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 8l7 1.5L19 8M12 9.5V14l-3 7M12 14l3 7'
  };
  M.icon = (name, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[name] || P.info) + '"/></svg>';

  /* ---------- Logo (eigene Wortmarke, keine Originaldatei) ---------- */
  M.LOGO = '<svg viewBox="0 0 120 48" role="img" aria-label="MVB"><rect x="0" y="0" width="120" height="48" rx="12" fill="var(--mvb-green)"/>' +
    '<path d="M10 37h100" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
    '<text x="60" y="31" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="800" font-size="25" letter-spacing="1.5" fill="#fff">MVB</text></svg>';

  /* ---------- Events ---------- */
  const ev = {};
  M.on = (n, f) => { (ev[n] = ev[n] || []).push(f); };
  M.emit = (n, d) => (ev[n] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } });
})(window.MVB = window.MVB || {});
