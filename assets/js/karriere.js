/* MVB – Karriere: Stellenangebote (live von mvbnet.de), Stellenseite und Bewerbung direkt auf dieser Seite */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;
  const P = (M.Pages = M.Pages || {});

  const catOf = (j) => /fahr|bus|straßenbahn|aushilfs/i.test(j.title) ? ['Fahrdienst', 'bus'] : /gleis|elektron|mechatron|schweiß|technik|technolog/i.test(j.title) ? ['Technik & Handwerk', 'gear'] : /kauf|rechnung|vergabe|prozess|werkstudent|trainee|verkehrssteuerung/i.test(j.title) ? ['Verwaltung & Planung', 'briefcase'] : ['MVB', 'building'];

  P.karriere = {
    title: 'Karriere', nav: 'karriere',
    async render(el, args) {
      if (args[0] === 'job') return P.job.render(el, args.slice(1));
      if (args[0] === 'bewerbung') return P.bewerbung.render(el, args.slice(1));
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Karriere']]) + C.phead('Karriere bei der MVB', 'Ob im Fahrdienst, in der Technik oder in der Verwaltung: Bei uns findest du einen sicheren Arbeitsplatz mit Perspektive. Bewirb dich direkt hier – ohne Umweg über andere Seiten.') +
        '<p style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="#jobs">Zu den Jobs</a><a class="btn ghost" href="#/karriere/bewerbung/initiativ">Initiativbewerbung</a></p>' +
        '<section class="sec"><div class="topics">' +
        '<div class="topic"><div><b>Benefits &amp; Bezahlung (TV-N LSA)</b><span>30 Tage Urlaub, freie Tage an Heiligabend und Silvester, kostenloser ÖPNV, Jobticket, betriebliche Altersvorsorge</span></div>' + icon('star') + '</div>' +
        '<div class="topic"><div><b>Ausbildung</b><span>Fachkraft im Fahrbetrieb, Kfz-Mechatroniker, Gleisbauer, Industriekaufleute u. v. m. – mit Übernahme-Garantie</span></div>' + icon('rocket') + '</div>' +
        '<div class="topic hl"><div><b>Bewerbung in 5 Schritten</b><span>Daten, Qualifikation, Zeugnisse (Vorder- und Rückseite), Motivation – fertig.</span></div>' + icon('check') + '</div></div></section>' +
        '<section class="sec" id="jobs"><div class="sec__head"><h2>Aktuelle Stellen</h2><span class="muted" id="jSrc" style="font-size:13px"></span></div><div id="jList"><div class="spin"></div></div></section></div>';
      M.$('a[href="#jobs"]', el).onclick = (e) => { e.preventDefault(); M.$('#jobs', el).scrollIntoView({ behavior: 'smooth' }); };
      const list = await M.Jobs.load();
      const grp = {};
      list.forEach((j) => { const k = j.kind === 'Ausbildung' ? 'Ausbildung' : catOf(j)[0]; (grp[k] = grp[k] || []).push(j); });
      M.$('#jSrc', el).textContent = list.length ? list.length + ' Angebote · live von mvbnet.de' : '';
      M.$('#jList', el).innerHTML = Object.keys(grp).length ? Object.entries(grp).map(([k, js]) => '<h3 style="display:flex;align-items:center;gap:12px;margin:26px 0 14px;font-size:clamp(20px,2vw,26px)"><span class="ph-ic" style="width:40px;height:40px;border-radius:10px;background:var(--mvb-green);color:#fff;display:grid;place-items:center">' + icon(k === 'Ausbildung' ? 'rocket' : catOf(js[0])[1]) + '</span>' + esc(k) + '</h3><div class="jobs">' +
        js.map((j) => '<a class="jcard" href="#/karriere/job/' + esc(j.kind === 'Ausbildung' ? 'a-' : 's-') + esc(j.slug) + '"><small>' + esc(j.kind) + '</small><b>' + esc(j.title) + '</b>' + icon('arrow', 'go') + '</a>').join('') + '</div>').join('') : '<p class="empty">Zurzeit konnten keine Stellen geladen werden. <a href="#/karriere/bewerbung/initiativ">Initiativ bewerben</a></p>';
    }
  };

  async function findJob(key) {
    const list = await M.Jobs.load();
    const kind = key.startsWith('a-') ? 'Ausbildung' : 'Stellenangebot';
    const slug = key.replace(/^[as]-/, '');
    return list.find((j) => j.slug === slug && j.kind === kind) || list.find((j) => j.slug === slug) || null;
  }

  P.job = {
    title: 'Karriere', nav: 'karriere',
    async render(el, args) {
      el.innerHTML = '<div class="wrap"><div class="spin"></div></div>';
      const j = await findJob(args[0] || '');
      if (!j) { el.innerHTML = '<div class="wrap">' + C.crumbs([['Karriere', '#/karriere'], ['Stelle']]) + '<p class="empty">Diese Stelle ist nicht mehr ausgeschrieben.</p></div>'; return; }
      const cat = j.kind === 'Ausbildung' ? ['Ausbildung', 'rocket'] : catOf(j);
      el.innerHTML = '<div class="wrap">' + C.crumbs([['Karriere', '#/karriere'], ['Jobsuche', '#/karriere'], [j.title]]) +
        '<div class="jhero"><div><h3 style="display:flex;align-items:center;gap:10px;margin:10px 0 14px"><span style="width:30px;height:30px;border-radius:7px;background:var(--mvb-green);color:#fff;display:grid;place-items:center">' + icon(cat[1]) + '</span>' + esc(cat[0]) + '</h3>' +
        '<small class="muted">' + esc(j.kind) + '</small><h1 style="font-size:clamp(26px,3.2vw,40px);margin:6px 0 0">' + esc(j.title) + '</h1>' +
        '<ul class="jfacts"><li>' + icon('pin') + 'Magdeburger Verkehrsbetriebe GmbH &amp; Co. KG · Magdeburg</li><li>' + icon('euro') + 'Bezahlung nach TV-N LSA</li><li>' + icon('cal') + (j.kind === 'Ausbildung' ? 'Ausbildungsstart 1. September 2027' : 'Ab sofort') + '</li><li>' + icon('clock') + 'Vollzeit' + (j.kind === 'Ausbildung' ? ' · Übernahme-Garantie' : '') + '</li></ul>' +
        '<a class="btn" href="#/karriere/bewerbung/' + esc(args[0]) + '">Jetzt bewerben</a>' +
        '<article class="prose" style="margin-top:34px">' + C.cleanHtml(j.html) + '</article>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:24px;padding-top:20px;border-top:1px solid var(--line)"><span>Wir freuen uns auf dich und deine Bewerbung!</span><a class="btn" href="#/karriere/bewerbung/' + esc(args[0]) + '">Jetzt bewerben</a></div></div>' +
        '<aside class="contact"><h3><i>' + icon('phone') + '</i>Deine Ansprechperson</h3>' + (j.contact ? '<p><b>' + esc(j.contact) + '</b>' + (j.phone ? '<br>' + esc(j.phone) : '') + '</p>' : '<p>Personalabteilung der MVB</p>') +
        (j.mail ? '<a class="btn ghost sm" style="width:100%" href="mailto:' + esc(j.mail) + '">' + icon('mail') + esc(j.mail) + '</a>' : '') + '</aside></div></div>';
    }
  };

  /* =====================================================================
     Bewerbungs-Korridor – alles auf dieser Seite
     ===================================================================== */
  const STEPS = [['daten', 'Persönliche Daten'], ['quali', 'Qualifikation'], ['unterlagen', 'Unterlagen'], ['motivation', 'Motivation'], ['pruefen', 'Prüfen & Absenden']];
  const DOCS = [
    { k: 'cv', t: 'Lebenslauf', req: true, group: 'Lebenslauf' },
    { k: 'z1v', t: 'Zeugnis 1 – Vorderseite', req: true, group: 'Zeugnis 1 (letztes Schulzeugnis)' },
    { k: 'z1r', t: 'Zeugnis 1 – Rückseite', req: true, group: 'Zeugnis 1 (letztes Schulzeugnis)' },
    { k: 'z2v', t: 'Zeugnis 2 – Vorderseite', req: false, group: 'Zeugnis 2 (Abschluss- oder Arbeitszeugnis)' },
    { k: 'z2r', t: 'Zeugnis 2 – Rückseite', req: false, group: 'Zeugnis 2 (Abschluss- oder Arbeitszeugnis)' },
    { k: 'fs', t: 'Führerschein (Vorder- und Rückseite)', req: false, group: 'Weitere Nachweise' },
    { k: 'more', t: 'Zertifikate / Sonstiges', req: false, group: 'Weitere Nachweise' }
  ];
  const MAX = 10 * 1024 * 1024;

  P.bewerbung = {
    title: 'Bewerbung', nav: 'karriere',
    async render(el, args) {
      const key = args[0] || 'initiativ';
      const job = key === 'initiativ' ? null : await findJob(key);
      const jobTitle = job ? job.title : 'Initiativbewerbung';
      const draftKey = 'bewerbung.' + key;
      const S = Object.assign({ step: 0, f: {} }, M.store.get(draftKey, {}));
      S.files = {};
      S.step = Math.min(S.step || 0, STEPS.length - 1);

      el.innerHTML = '<div class="wrap">' + C.crumbs([['Karriere', '#/karriere'], job ? [job.title, '#/karriere/job/' + key] : ['Initiativbewerbung', '#/karriere'], ['Bewerbung']]) +
        C.phead('Deine Bewerbung', esc(jobTitle) + ' – in fünf Schritten direkt hier bei der MVB. Dein Entwurf wird auf diesem Gerät zwischengespeichert.') +
        '<div class="apply"><ol class="steps" id="bSteps"></ol><div><div class="progress"><span id="bProg"></span></div><form id="bForm" novalidate></form></div></div></div>';
      const form = M.$('#bForm', el);
      const save = () => M.store.set(draftKey, { step: S.step, f: S.f });

      const field = (name, label, o) => {
        o = o || {};
        const v = S.f[name] != null ? S.f[name] : o.value || '';
        const req = o.req ? ' <em>*</em>' : '';
        let input;
        if (o.type === 'select') input = '<select class="inp" name="' + name + '"' + (o.req ? ' required' : '') + '><option value="">Bitte wählen</option>' + o.opts.map((x) => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
        else if (o.type === 'textarea') input = '<textarea class="inp" name="' + name + '"' + (o.req ? ' required' : '') + (o.min ? ' minlength="' + o.min + '"' : '') + ' placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea>';
        else input = '<input class="inp" type="' + (o.type || 'text') + '" name="' + name + '" value="' + esc(v) + '"' + (o.req ? ' required' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.pattern ? ' pattern="' + o.pattern + '"' : '') + (o.max ? ' max="' + o.max + '"' : '') + ' placeholder="' + esc(o.ph || '') + '">';
        return '<label class="fitem' + (o.full ? ' full' : '') + '"><span>' + esc(label) + req + '</span>' + input + (o.hint ? '<small class="muted">' + esc(o.hint) + '</small>' : '') + '<span class="err"></span></label>';
      };

      const VIEWS = {
        daten: () => '<div class="panel"><h2>Persönliche Daten</h2><p>Mit <em style="color:var(--st-late);font-style:normal">*</em> markierte Felder sind Pflichtfelder.</p><div class="fgrid">' +
          '<div class="fitem full"><span>Anrede <em>*</em></span><div class="radio-row">' + ['Frau', 'Herr', 'Divers', 'Keine Angabe'].map((x) => '<label><input type="radio" name="anrede" value="' + x + '"' + (S.f.anrede === x ? ' checked' : '') + ' required>' + x + '</label>').join('') + '</div><span class="err"></span></div>' +
          field('vorname', 'Vorname', { req: true, auto: 'given-name' }) + field('nachname', 'Nachname', { req: true, auto: 'family-name' }) +
          field('geburt', 'Geburtsdatum', { req: true, type: 'date', max: new Date().toISOString().slice(0, 10) }) + field('nation', 'Staatsangehörigkeit', { auto: 'off', ph: 'z. B. deutsch' }) +
          field('mail', 'E-Mail', { req: true, type: 'email', auto: 'email' }) + field('tel', 'Telefon', { req: true, type: 'tel', auto: 'tel', ph: '0170 1234567' }) +
          field('strasse', 'Straße und Hausnummer', { req: true, auto: 'street-address', full: true }) +
          field('plz', 'PLZ', { req: true, auto: 'postal-code', pattern: '[0-9]{5}', ph: '39104' }) + field('ort', 'Ort', { req: true, auto: 'address-level2', ph: 'Magdeburg' }) + '</div></div>',
        quali: () => '<div class="panel"><h2>Qualifikation</h2><p>Erzähl uns, was du mitbringst.</p><div class="fgrid">' +
          field('abschluss', 'Höchster Schulabschluss', { req: true, type: 'select', opts: ['Hauptschulabschluss', 'Realschulabschluss', 'Fachhochschulreife', 'Abitur', 'Abgeschlossene Berufsausbildung', 'Studium', 'Noch in der Schule'] }) +
          field('schule', 'Schule / Hochschule', { ph: 'Name und Ort' }) + field('jahr', 'Abschlussjahr', { type: 'number', ph: '2026' }) +
          field('eintritt', 'Frühester Eintrittstermin', { req: true, type: 'date' }) +
          '<div class="fitem full"><span>Führerschein</span><div class="radio-row">' + ['Keiner', 'B', 'BE', 'C/CE', 'D/DE'].map((x) => '<label><input type="checkbox" name="fs_' + x + '"' + (S.f['fs_' + x] ? ' checked' : '') + '>' + x + '</label>').join('') + '</div></div>' +
          field('erfahrung', 'Berufserfahrung', { type: 'textarea', full: true, ph: 'Stationen, Praktika, Nebenjobs …' }) +
          field('quelle', 'Wie bist du auf uns aufmerksam geworden?', { type: 'select', opts: ['MVB-Webseite', 'Social Media', 'Job-Messe', 'Freunde / Familie', 'Werbung in Bahn oder Bus', 'Sonstiges'], full: true }) + '</div></div>',
        unterlagen: () => {
          const groups = [];
          DOCS.forEach((d) => { let g = groups.find((x) => x.t === d.group); if (!g) { g = { t: d.group, list: [] }; groups.push(g); } g.list.push(d); });
          return '<div class="panel"><h2>Unterlagen</h2><p>PDF, JPG oder PNG, je Datei höchstens 10 MB. Bei Zeugnissen bitte <b>Vorder- und Rückseite</b> einzeln hochladen.</p>' +
            groups.map((g) => '<h3 class="uptitle">' + icon('file') + esc(g.t) + '</h3><div class="ups">' + g.list.map((d) => upBox(d)).join('') + '</div>').join('') + '</div>';
        },
        motivation: () => '<div class="panel"><h2>Motivation</h2><p>Warum möchtest du zur MVB? Schreib es hier hinein oder lade dein Anschreiben hoch.</p><div class="fgrid">' +
          field('motiv', 'Motivationsschreiben', { type: 'textarea', full: true, min: 200, ph: 'Liebes Team der MVB, …', hint: 'Mindestens 200 Zeichen – oder unten ein Anschreiben hochladen.' }) +
          '<div class="fitem full"><span class="muted" id="motivCount" style="font-weight:500;font-size:13px"></span></div>' +
          '<div class="full"><div class="ups">' + upBox({ k: 'anschreiben', t: 'Anschreiben (optional, statt Text)', req: false }) + '</div></div>' +
          field('staerken', 'Deine drei größten Stärken', { full: true, ph: 'z. B. zuverlässig, teamfähig, ruhig in Stresssituationen' }) + '</div></div>',
        pruefen: () => {
          const fs = ['Keiner', 'B', 'BE', 'C/CE', 'D/DE'].filter((x) => S.f['fs_' + x]).join(', ') || '–';
          const row = (k, v) => '<dt>' + esc(k) + '</dt><dd>' + esc(v || '–') + '</dd>';
          return '<div class="panel review"><h2>Prüfen &amp; Absenden</h2><p>Bitte prüfe deine Angaben.</p>' +
            '<h3>Persönliche Daten <button type="button" class="btn ghost sm" data-go="0">Ändern</button></h3><dl>' + row('Name', [S.f.anrede, S.f.vorname, S.f.nachname].filter(Boolean).join(' ')) + row('Geburtsdatum', S.f.geburt ? M.fmtDate(S.f.geburt) : '') + row('E-Mail', S.f.mail) + row('Telefon', S.f.tel) + row('Adresse', [S.f.strasse, [S.f.plz, S.f.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ')) + '</dl>' +
            '<h3>Qualifikation <button type="button" class="btn ghost sm" data-go="1">Ändern</button></h3><dl>' + row('Abschluss', S.f.abschluss) + row('Schule', [S.f.schule, S.f.jahr].filter(Boolean).join(' · ')) + row('Eintritt ab', S.f.eintritt ? M.fmtDate(S.f.eintritt) : '') + row('Führerschein', fs) + '</dl>' +
            '<h3>Unterlagen <button type="button" class="btn ghost sm" data-go="2">Ändern</button></h3><dl>' + DOCS.concat([{ k: 'anschreiben', t: 'Anschreiben' }]).map((d) => row(d.t, S.files[d.k] ? S.files[d.k].name + ' (' + Math.round(S.files[d.k].size / 1024) + ' KB)' : (d.req ? 'fehlt' : '–'))).join('') + '</dl>' +
            '<h3>Motivation <button type="button" class="btn ghost sm" data-go="3">Ändern</button></h3><p style="white-space:pre-wrap;font-size:14.5px;color:var(--text-soft);margin-bottom:16px">' + esc((S.f.motiv || (S.files.anschreiben ? 'Anschreiben hochgeladen.' : '–')).slice(0, 600)) + (S.f.motiv && S.f.motiv.length > 600 ? ' …' : '') + '</p>' +
            '<label class="check"><input type="checkbox" name="ds" required' + (S.f.ds ? ' checked' : '') + '><span>Ich habe die <a href="https://www.mvbnet.de/datenschutzbestimmungen/" target="_blank" rel="noopener">Datenschutzhinweise</a> gelesen und bin mit der Verarbeitung meiner Daten zum Zweck der Bewerbung einverstanden. <em style="color:var(--st-late);font-style:normal">*</em></span></label>' +
            '<label class="check" style="margin-top:10px"><input type="checkbox" name="wahr" required' + (S.f.wahr ? ' checked' : '') + '><span>Meine Angaben sind vollständig und wahrheitsgemäß. <em style="color:var(--st-late);font-style:normal">*</em></span></label>' +
            '<p class="err" id="sendErr" style="color:var(--st-late);margin-top:10px"></p></div>';
        }
      };
      function upBox(d) {
        const f = S.files[d.k];
        return '<label class="upbox' + (f ? ' has' : '') + '" data-up="' + d.k + '">' + (f && f.preview ? '<img class="prev" src="' + f.preview + '" alt="">' : '') +
          '<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label="' + esc(d.t) + '">' + icon(f ? 'check' : 'upload') +
          '<b>' + esc(d.t) + (d.req ? ' <em style="color:var(--st-late);font-style:normal">*</em>' : '') + '</b><small>' + (f ? esc(f.name) + ' · ' + Math.round(f.size / 1024) + ' KB' : 'Datei auswählen oder hierher ziehen') + '</small>' +
          (f ? '<button type="button" class="btn ghost sm rm" data-rm="' + d.k + '">' + icon('trash') + 'Entfernen</button>' : '') + '</label>';
      }

      function draw() {
        M.$('#bSteps', el).innerHTML = STEPS.map((s, i) => '<li class="' + (i === S.step ? 'on' : i < S.step ? 'done' : '') + '" data-go="' + i + '"><i>' + (i < S.step ? '✓' : i + 1) + '</i><span>' + s[1] + '</span></li>').join('');
        M.$('#bProg', el).style.width = ((S.step + 1) / STEPS.length * 100) + '%';
        form.innerHTML = VIEWS[STEPS[S.step][0]]() + '<div class="navrow">' + (S.step ? '<button type="button" class="btn ghost" data-nav="-1">' + icon('arrowL') + 'Zurück</button>' : '<a class="btn ghost" href="' + (job ? '#/karriere/job/' + key : '#/karriere') + '">' + icon('arrowL') + 'Zur Stelle</a>') +
          (S.step < STEPS.length - 1 ? '<button type="submit" class="btn">Weiter' + icon('arrow') + '</button>' : '<button type="submit" class="btn">' + icon('check') + 'Bewerbung absenden</button>') + '</div>';
        const m = form.motiv;
        if (m) { const upd = () => { M.$('#motivCount', el).textContent = m.value.length + ' Zeichen' + (m.value.length < 200 ? ' (noch ' + (200 - m.value.length) + ')' : ' ✓'); }; m.addEventListener('input', upd); upd(); }
        window.scrollTo({ top: Math.max(0, M.$('.apply', el).offsetTop - 110), behavior: 'smooth' });
      }
      function collect() {
        new FormData(form).forEach((v, k) => { if (typeof v === 'string') S.f[k] = v; });
        M.$$('input[type=checkbox]', form).forEach((c) => { S.f[c.name] = c.checked; });
        save();
      }
      function validate() {
        let ok = true;
        M.$$('.fitem', form).forEach((w) => w.classList.remove('bad'));
        M.$$('[required]', form).forEach((inp) => {
          const w = inp.closest('.fitem') || inp.closest('.check');
          let bad = false;
          if (inp.type === 'radio') bad = !form.querySelector('input[name="' + inp.name + '"]:checked');
          else if (inp.type === 'checkbox') bad = !inp.checked;
          else bad = !inp.checkValidity();
          if (bad) { ok = false; if (w) { w.classList.add('bad'); const e = M.$('.err', w); if (e) e.textContent = inp.type === 'email' ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : inp.name === 'plz' ? 'Bitte eine fünfstellige PLZ eingeben.' : 'Bitte ausfüllen.'; } }
        });
        if (STEPS[S.step][0] === 'daten' && S.f.geburt) {
          const age = (Date.now() - new Date(S.f.geburt)) / (365.25 * 864e5);
          if (age < 14) { ok = false; const w = form.geburt.closest('.fitem'); w.classList.add('bad'); M.$('.err', w).textContent = 'Du musst mindestens 14 Jahre alt sein.'; }
        }
        if (STEPS[S.step][0] === 'unterlagen') {
          const miss = DOCS.filter((d) => d.req && !S.files[d.k]);
          if (miss.length) { ok = false; M.toast('Bitte noch hochladen: ' + miss.map((d) => d.t).join(', ')); miss.forEach((d) => M.$('[data-up="' + d.k + '"]', form).style.borderColor = 'var(--st-late)'); }
        }
        if (STEPS[S.step][0] === 'motivation' && (S.f.motiv || '').trim().length < 200 && !S.files.anschreiben) {
          ok = false; const w = form.motiv.closest('.fitem'); w.classList.add('bad'); M.$('.err', w).textContent = 'Bitte mindestens 200 Zeichen schreiben oder ein Anschreiben hochladen.';
        }
        if (!ok) { const first = M.$('.bad', form); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return ok;
      }
      async function send() {
        const btn = M.$('button[type=submit]', form);
        btn.disabled = true; btn.innerHTML = '<span class="spin" style="width:18px;height:18px;margin:0;border-width:2px"></span> Wird gesendet …';
        const ref = 'MVB-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const fd = new FormData();
        fd.append('stelle', jobTitle); fd.append('referenz', ref);
        Object.entries(S.f).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? (v ? 'ja' : 'nein') : v));
        Object.entries(S.files).forEach(([k, f]) => fd.append(k, f.file, f.name));
        let mode = 'local';
        if (M.CONFIG.bewerbungEndpoint) {
          try {
            const r = await fetch(M.CONFIG.bewerbungEndpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            mode = 'sent';
          } catch (e) {
            btn.disabled = false; btn.innerHTML = icon('check') + 'Bewerbung absenden';
            M.$('#sendErr', el).textContent = 'Senden fehlgeschlagen. Bitte versuche es später erneut.';
            return;
          }
        }
        M.store.set(draftKey, null);
        const sent = M.store.get('bewerbungen', []);
        sent.unshift({ ref, job: jobTitle, date: new Date().toISOString(), mode });
        M.store.set('bewerbungen', sent.slice(0, 20));
        M.$('.apply', el).innerHTML = '<div class="panel done-box" style="grid-column:1/-1"><div class="ok">' + icon('check') + '</div><h2>Vielen Dank, ' + esc(S.f.vorname || '') + '!</h2>' +
          '<p style="margin:10px auto 6px;max-width:560px;color:var(--text-soft)">Deine Bewerbung als <b>' + esc(jobTitle) + '</b> ' + (mode === 'sent' ? 'ist bei uns eingegangen.' : 'ist vollständig.') + ' Deine Referenznummer: <b>' + ref + '</b></p>' +
          (mode === 'local' ? '<p class="muted" style="font-size:13px;max-width:560px;margin:0 auto">Vorschau-Modus: Es ist noch kein Empfänger für Bewerbungen eingerichtet (CONFIG.bewerbungEndpoint). Deine Daten haben dieses Gerät nicht verlassen.</p>' : '<p class="muted" style="font-size:13px">Wir melden uns per E-Mail bei dir.</p>') +
          '<p style="margin-top:22px"><a class="btn" href="#/karriere">Weitere Stellen ansehen</a></p></div>';
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        collect();
        if (!validate()) return;
        if (S.step < STEPS.length - 1) { S.step++; save(); draw(); } else send();
      });
      el.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-nav]');
        if (nav) { collect(); S.step = Math.max(0, S.step + +nav.dataset.nav); save(); draw(); return; }
        const go = e.target.closest('[data-go]');
        if (go) { const to = +go.dataset.go; if (to <= S.step || to === S.step + 1) { collect(); if (to > S.step && !validate()) return; S.step = to; save(); draw(); } return; }
        const rm = e.target.closest('[data-rm]');
        if (rm) { e.preventDefault(); const f = S.files[rm.dataset.rm]; if (f && f.preview) URL.revokeObjectURL(f.preview); delete S.files[rm.dataset.rm]; collect(); draw(); }
      });
      const addFile = (k, file) => {
        if (!file) return;
        if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { M.toast('Nur PDF, JPG oder PNG.'); return; }
        if (file.size > MAX) { M.toast('Die Datei ist größer als 10 MB.'); return; }
        S.files[k] = { file, name: file.name, size: file.size, preview: /^image\//.test(file.type) ? URL.createObjectURL(file) : '' };
        collect(); draw();
      };
      form.addEventListener('change', (e) => {
        const up = e.target.closest('[data-up]');
        if (up && e.target.type === 'file') addFile(up.dataset.up, e.target.files[0]);
        else collect();
      });
      ['dragenter', 'dragover'].forEach((t) => form.addEventListener(t, (e) => { const up = e.target.closest('[data-up]'); if (up) { e.preventDefault(); up.classList.add('drag'); } }));
      ['dragleave', 'drop'].forEach((t) => form.addEventListener(t, (e) => { const up = e.target.closest('[data-up]'); if (up) { e.preventDefault(); up.classList.remove('drag'); if (t === 'drop') addFile(up.dataset.up, e.dataTransfer.files[0]); } }));
      form.addEventListener('input', M.debounce(collect, 400));
      // Dateien gehen beim Neuladen verloren – dann zurück zu den Unterlagen
      if (S.step > 2) S.step = 2;
      draw();
    }
  };
})(window.MVB = window.MVB || {});
