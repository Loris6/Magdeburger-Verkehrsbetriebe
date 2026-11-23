/* MVB – Linien im Muvit-Stil: Verkehrsmittel-Zeichen + Liniennummer ([Tram][9], [Bus][73])
   und das Muvit-Statussystem (pünktlich, früher, leicht verspätet, verspätet, fällt aus).
   Die Farben kommen aus variables.css. */
(function (M) {
  'use strict';
  const esc = M.esc;

  const TRAMS = ['1', '2', '3', '4', '5', '6', '8', '9', '10', '13', '15'];
  M.isTramNo = (n) => TRAMS.includes(String(n));
  M.isNight = (n) => /^N\s?\d/i.test(String(n || ''));

  /** Linienfarbe wie in Muvit: Trams farbig, Busse dunkel, Nachtlinien dunkelblau, Ersatzverkehr rot */
  M.lineColor = function (name, mode) {
    const n = String(name || '').trim();
    if (M.isNight(n)) return M.cssVar('--line-night') || '#1E3264';
    if (mode === 'tram') return M.cssVar('--line-tram-' + n) || M.cssVar('--mode-tram');
    if (/^(SEV|EV)/i.test(n)) return M.cssVar('--line-sev');
    return M.cssVar('--line-bus') || '#3A3F37';
  };
  /** Farbe auf der Karte: Busse in Bus-Lila (wie Muvit), sonst Linienfarbe */
  M.mapColor = function (line) {
    if (!line) return M.cssVar('--line-walk');
    if (line.mode === 'bus' && !M.isNight(line.name) && !/^(SEV|EV)/i.test(line.name)) return M.cssVar('--line-bus-map');
    return M.lineColor(line.name, line.mode);
  };
  /** Text auf der Linie – Muvit: immer weiß */
  M.lineText = () => '#FFFFFF';
  /** Haltestellenpunkte: weiß, auf hellen Linien (z. B. Tram 3) schwarz */
  M.stopDot = function (hex) {
    const n = parseInt(String(hex || '#000').replace('#', ''), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] > 0.55 ? '#000000' : '#FFFFFF';
  };

  /** Linie aus Rohdaten: „Str 10“, „Bus 73“, „STR 9“, „9“ → { name, mode } */
  M.mkLine = function (raw, mode) {
    let n = String(raw || '').trim();
    let md = mode;
    if (/^(Str|STR|Tram|Straßenbahn)\b/i.test(n)) md = md || 'tram';
    if (/^Bus\b/i.test(n)) md = md || 'bus';
    n = n.replace(/^(STR|Str|Tram|TRAM|Straßenbahn|Bus|BUS)\s+/i, '').trim();
    if (!md || md === 'other') md = M.isTramNo(n) ? 'tram' : 'bus';
    if (md === 'tram' && M.isNight(n) && !['N2', 'N8'].includes(n)) md = 'tram';
    return { name: n || '?', mode: md };
  };

  const MODE_LABEL = { tram: 'Straßenbahn', bus: 'Bus' };
  /** Verkehrsmittel-Zeichen: „Tram“ (Quadrat, rot), „Bus“ (Kreis, lila) */
  M.modeBadge = function (mode, o) {
    o = o || {};
    const sz = o.sm ? ' sm' : o.lg ? ' lg' : '';
    if (mode === 'tram') return '<span class="bd m tram' + sz + '" title="Straßenbahn">Tram</span>';
    if (mode === 'bus') return '<span class="bd m bus' + sz + '" title="Bus">Bus</span>';
    return '';
  };
  /** Liniennummer: Tram eckig in Linienfarbe, Bus rund */
  M.lineBadge = function (line, o) {
    if (!line) return '';
    o = o || {};
    const sz = o.sm ? ' sm' : o.lg ? ' lg' : '';
    const round = line.mode === 'bus' ? ' round' : '';
    const bg = M.lineColor(line.name, line.mode);
    return '<span class="bd' + round + sz + '" style="background:' + bg + ';color:' + M.lineText(bg) + '" title="' + esc((MODE_LABEL[line.mode] || 'Linie') + ' ' + line.name) + '">' + esc(line.name) + '</span>';
  };
  /** Immer Verkehrsmittel-Zeichen + Linie: [Tram][9], [Bus][73] */
  M.badges = (line, o) => (line ? '<span class="bds">' + M.modeBadge(line.mode, o) + M.lineBadge(line, o) + '</span>' : '');
  /** Mehrere Linien gruppiert: [Tram] 1 2 9 · [Bus] 52 73 */
  M.lineGroups = function (lines, o) {
    o = Object.assign({ sm: true }, o || {});
    const groups = { tram: [], bus: [] };
    M.sortLines(lines).forEach((l) => { const g = groups[l.mode] || groups.bus; if (!g.some((x) => x.name === l.name)) g.push(l); });
    return ['tram', 'bus'].filter((k) => groups[k].length).map((k) => '<span class="bds">' + M.modeBadge(k, o) + groups[k].map((l) => M.lineBadge(l, o)).join('') + '</span>').join(' ');
  };
  const num = (n) => { const m = String(n).match(/\d+/); return m ? +m[0] : 999; };
  M.sortLines = (ls) => (ls || []).slice().sort((a, b) => (a.mode === b.mode ? 0 : a.mode === 'tram' ? -1 : 1) || (M.isNight(a.name) - M.isNight(b.name)) || num(a.name) - num(b.name) || String(a.name).localeCompare(b.name));

  /* ---------- Muvit-Statussystem ---------- */
  /** Farbe: grün pünktlich, blau früher, orange leicht verspätet (1–4 Min.), rot verspätet (ab 5) / fällt aus */
  M.delayCls = function (x) {
    if (x.cancelled) return 'c-red';
    if (!x.realtime || x.delay == null) return '';
    if (x.delay < 0) return 'c-blue';
    if (x.delay === 0) return 'c-green';
    return x.delay >= 5 ? 'c-red' : 'c-orange';
  };
  M.status = function (x) {
    if (x.cancelled) return { text: 'Fällt aus', cls: 'c-red' };
    if (!x.realtime || x.delay == null) return { text: 'Planmäßig', cls: 'c-gray' };
    if (x.delay < 0) return { text: 'Früher (' + x.delay + ' Min.)', cls: 'c-blue' };
    if (x.delay === 0) return { text: 'Pünktlich', cls: 'c-green' };
    if (x.delay < 5) return { text: 'Leicht verspätet (+' + x.delay + ' Min.)', cls: 'c-orange' };
    return { text: 'Verspätet (+' + x.delay + ' Min.)', cls: 'c-red' };
  };
  M.statusBadge = (x) => { const s = M.status(x); return '<span class="stbadge ' + s.cls + '">' + esc(s.text) + '</span>'; };
  /** Uhrzeit laut Plan (durchgestrichen) und die erwartete daneben */
  M.clock = function (planned, rt, x) {
    const p = M.fmtTime(planned || rt);
    if (!rt || !planned || Math.abs(M.toDate(rt) - M.toDate(planned)) < 30000) return '<span class="' + M.delayCls(x || {}) + '">' + p + '</span>';
    return '<span class="t-pl">' + p + '</span> <span class="' + M.delayCls(x || {}) + '">' + M.fmtTime(rt) + '</span>';
  };
  M.countdown = function (t) {
    const m = M.minsUntil(t);
    if (m <= 0) return 'Jetzt';
    if (m < 60) return 'in ' + m + ' Min.';
    return M.fmtTime(t);
  };
  M.LEGEND = '<div class="legend"><span class="stbadge c-green">Pünktlich</span><span class="stbadge c-blue">Früher</span><span class="stbadge c-orange">Leicht verspätet (1–4 Min.)</span><span class="stbadge c-red">Verspätet (ab 5 Min.) / fällt aus</span><span class="stbadge c-gray">Planmäßig (ohne Echtzeit)</span></div>';

  /** Linien in Texten als Zeichen darstellen: „Linie 9“ → [Tram][9], „Buslinien 52, N5 und N9“ → [Bus][52] [Bus][N5] [Bus][N9] */
  M.linesInText = function (text) {
    const out = [];
    const t = String(text || '');
    const re = /\b(Straßenbahnlinien?|Straßenbahn|Tramlinien?|Buslinien?|Nachtbuslinien?|Nachtlinien?|Linien?|Bus(?:se)?)\s+((?:N?\d{1,3}[a-z]?)(?:\s*(?:,|und|sowie|bzw\.|\/|&)\s*N?\d{1,3}[a-z]?)*)/gi;
    let m;
    while ((m = re.exec(t))) {
      const kw = m[1].toLowerCase();
      const nums = m[2].split(/\s*(?:,|und|sowie|bzw\.|\/|&)\s*/).map((s) => s.trim()).filter(Boolean);
      nums.forEach((n) => {
        if (+n > 999) return;
        let mode = /straßenbahn|tram/.test(kw) ? 'tram' : /bus/.test(kw) ? 'bus' : (M.isTramNo(n) || n === 'N2' || n === 'N8') ? 'tram' : 'bus';
        if (mode === 'tram' && !M.isTramNo(n) && !M.isNight(n)) mode = 'bus';
        if (!out.some((x) => x.name === n && x.mode === mode)) out.push({ name: n, mode });
      });
    }
    return M.sortLines(out);
  };
})(window.MVB = window.MVB || {});
