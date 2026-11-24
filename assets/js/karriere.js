/* MVB – Karriere: Stellenangebote (live von mvbnet.de), Stellenseite und Bewerbung direkt auf dieser Seite */
(function (M) {
  'use strict';
  const esc = M.esc, icon = M.icon, C = M.C;
  const P = (M.Pages = M.Pages || {});

  const catOf = (j) => /fahr|bus|straßenbahn|aushilfs/i.test(j.title) ? ['Fahrdienst', 'bus'] : /gleis|elektron|mechatron|schweiß|technik|technolog/i.test(j.title) ? ['Technik & Handwerk', 'gear'] : /kauf|rechnung|vergabe|prozess|werkstudent|trainee|verkehrssteuerung/i.test(j.title) ? ['Verwaltung & Planung', 'briefcase'] : ['MVB', 'building'];

  P.karriere = {
    title: 'Karriere', nav: 'karriere',
    async render(el, args, shellEl) {
      if (args[0] === 'job') return P.job.render(el, args.slice(1), shellEl);
      if (args[0] === 'bewerbung') return P.bewerbung.render(el, args.slice(1), shellEl);
      el.innerHTML = C.crumbs([['Karriere']]) +
        '<div class="g"><div class="sn"><div class="sn__img">' + C.heroArt() + '</div><h1 class="sn__title"><span>Unsere Jobs –</span><span>so vielfältig wie Magdeburg</span></h1></div></div>' +
        '<div class="g g-normal lstage" style="margin-top:3rem"><div><div class="rt"><p>Als einer der größten Arbeitgeber der Stadt bietet dir die MVB nicht nur spannende Jobs, sondern auch attraktive Arbeitsbedingungen. Ob im Fahrdienst, in der Technik oder in der Verwaltung: Bei uns findest du einen sicheren Arbeitsplatz mit Perspektive. Starte jetzt deine Karriere bei der MVB – und bewirb dich direkt hier.</p></div>' +
        '<a class="btn btn--fill btn--lg" href="#jobs" style="margin-top:2rem">Zu den Jobs</a></div></div>' +
        '<div class="g stack"><section class="tl tl--hl tl--cols-2" style="grid-column:2/14"><ul style="max-width:39.5rem">' +
        [['Benefits & Bezahlung (TV-N LSA)', '30 Tage Urlaub, Heiligabend & Silvester frei, kostenloser ÖPNV, Jobticket, Altersvorsorge u. v. m.', 'https://www.mvbnet.de/karriere/stellenangebote/'],
          ['Job-Events', 'Bei unseren Info-Abenden erfährst du alles über Einstieg, Berufe und Benefits.', 'https://www.mvbnet.de/karriere/ausbildung/'],
          ['Berufserfahrene', 'Fahrdienst, Technik & Handwerk, kaufmännische Berufe, Verkehrsplanung', '#jobs'],
          ['Schüler*innen', 'Ausbildung, Schülerpraktikum, Infos für Schulen', '#jobs'],
          ['Trainees', 'Voraussetzungen und Bewerbung', '#jobs'],
          ['Initiativbewerbung', 'Nichts Passendes dabei? Bewirb dich einfach so.', '#/karriere/bewerbung/initiativ']]
          .map((t) => '<li><a class="tl__item" href="' + t[2] + '"' + (/^http/.test(t[2]) ? ' target="_blank" rel="noopener"' : '') + '><div class="tl__inner"><div class="tl__txt"><h3>' + esc(t[0]) + ' </h3><p>' + esc(t[1]) + '</p></div></div>' + icon('arrow', 'tl__arrow') + '</a></li>').join('') + '</ul></section>' +
        '<section id="jobs" style="grid-column:2/14"><h2 style="font-size:2.5rem;line-height:1.3;font-weight:700;margin-bottom:2.5rem">Aktuelle Stellen</h2><div id="jList"><div class="spin"></div></div><p id="jSrc" style="margin-top:1.5rem;font-size:.875rem;color:var(--grey-500)"></p></section></div>';
      M.$$('a[href="#jobs"]', el).forEach((a) => { a.onclick = (e) => { e.preventDefault(); M.$('#jobs', el).scrollIntoView({ behavior: 'smooth' }); }; });
      const list = await M.Jobs.load();
      const grp = {};
      list.forEach((j) => { const k = j.kind === 'Ausbildung' ? 'Ausbildung' : catOf(j)[0]; (grp[k] = grp[k] || []).push(j); });
      M.$('#jSrc', el).textContent = list.length ? list.length + ' Angebote · live von mvbnet.de' : '';
      M.$('#jList', el).innerHTML = Object.keys(grp).length ? '<div style="display:grid;gap:3rem">' + Object.entries(grp).map(([k, js]) => '<section style="display:grid;gap:1.25rem"><h3 class="hwi" style="font-size:1.5rem;font-weight:700;line-height:1.3;gap:1rem"><i style="width:2rem;height:2rem">' + icon(k === 'Ausbildung' ? 'rocket' : catOf(js[0])[1]) + '</i>' + esc(k) + '</h3>' +
        '<ul style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))">' + js.map((j) => '<li><a class="itc__item" style="min-height:4rem;padding:.25rem 1rem;border-radius:.75rem" href="#/karriere/job/' + (j.kind === 'Ausbildung' ? 'a-' : 's-') + esc(j.slug) + '"><span style="font-size:1rem;font-weight:700;line-height:1.3;flex:1">' + esc(j.title) + '</span>' + icon('arrow') + '</a></li>').join('') + '</ul></section>').join('') + '</div>'
        : '<p class="empty">Zurzeit konnten keine Stellen geladen werden. <a href="#/karriere/bewerbung/initiativ">Initiativ bewerben</a></p>';
    }
  };

  async function findJob(key) {
    const list = await M.Jobs.load();
    const kind = key.startsWith('a-') ? 'Ausbildung' : 'Stellenangebot';
    const slug = key.replace(/^[as]-/, '');
    return list.find((j) => j.slug === slug && j.kind === kind) || list.find((j) => j.slug === slug) || null;
  }
  /** Abschnitte der Stellenbeschreibung (aus dem Text der MVB-Seite) */
  function jobSections(html) {
    const doc = new DOMParser().parseFromString(C.cleanHtml(html), 'text/html');
    const out = [];
    let cur = { h: 'Unternehmensbeschreibung', html: '' };
    [...doc.body.childNodes].forEach((n) => {
      const t = (n.textContent || '').trim();
      const head = /^(Das bieten wir( Ihnen| dir)?|Das erwartet (Sie|dich)|Das bringen Sie mit|Was du mitbringen solltest|Deine Möglichkeiten|Was du bei uns lernen kannst|Wie lange und wo|Noch Fragen\?|Interessiert\?|Dein Profil|Deine Aufgaben|Ihre Aufgaben|Sie bringen mit)[:\s]*$/i.exec(t);
      if (head && t.length < 60) { if (cur.html.trim()) out.push(cur); cur = { h: t.replace(/:$/, ''), html: '' }; return; }
      if (/^(Leidenschaft|Sie wollen mit)/.test(t)) return;
      cur.html += n.outerHTML || (t ? '<p>' + esc(t) + '</p>' : '');
    });
    if (cur.html.trim()) out.push(cur);
    return out;
  }

  P.job = {
    title: 'Karriere', nav: 'karriere',
    async render(el, args, shellEl) {
      el.innerHTML = '<div class="g"><div class="spin"></div></div>';
      const j = await findJob(args[0] || '');
      if (!j) { el.innerHTML = C.crumbs([['Karriere', '#/karriere'], ['Stelle']], true) + '<div class="g"><p class="empty">Diese Stelle ist nicht mehr ausgeschrieben.</p></div>'; return; }
      shellEl.classList.add('job-page');
      const cat = j.kind === 'Ausbildung' ? ['Ausbildung', 'rocket'] : catOf(j);
      const secs = jobSections(j.html);
      const facts = [['pin', 'Magdeburger Verkehrsbetriebe GmbH & Co. KG · Magdeburg'], ['euro', j.kind === 'Ausbildung' ? 'Ausbildungsvergütung nach TV-N LSA' : 'Bezahlung nach TV-N LSA'],
        ['cal', j.kind === 'Ausbildung' ? 'Übernahme nach erfolgreicher Ausbildung' : '30 Tage Urlaub, Heiligabend und Silvester frei'], ['clock', j.kind === 'Ausbildung' ? 'Ausbildungsstart 1. September 2027' : 'Vollzeit, ab sofort']];
      el.innerHTML = C.crumbs([['Karriere', '#/karriere'], ['Jobsuche', '#/karriere'], [j.title]], true) +
        '<div class="g job"><div class="job__main"><div class="job__box"><div class="job__cat hwi"><i>' + icon(cat[1]) + '</i><strong>' + esc(cat[0]) + '</strong></div>' +
        '<h1 class="job__h1"><em>' + esc(j.kind) + '</em><span>' + esc(j.title) + '</span></h1><ul class="job__facts">' + facts.map((f) => '<li>' + icon(f[0]) + '<span>' + esc(f[1]) + '</span></li>').join('') + '</ul>' +
        '<a class="btn btn--fill job__apply" href="#/karriere/bewerbung/' + esc(args[0]) + '">Jetzt bewerben</a></div>' +
        '<div class="job__box">' + secs.map((x, i) => '<h2 class="job__h2">' + esc(x.h) + '</h2><div class="job__sec' + (i === 0 || /bieten/i.test(x.h) ? ' checks' : '') + '">' + x.html + '</div>').join('') +
        '<div class="job__foot"><span>Wir freuen uns auf dich und deine Bewerbung!</span><a class="btn btn--fill" href="#/karriere/bewerbung/' + esc(args[0]) + '">Jetzt bewerben</a></div></div></div>' +
        '<aside class="job__side"><address class="job__box job__contact"><h2 class="hwi"><i>' + icon('phone') + '</i><span>Deine Ansprechperson</span></h2><div class="job__people"><article><h3>' + esc(j.contact || 'Personalabteilung der MVB') + '</h3>' + (j.phone ? '<a href="tel:' + esc(j.phone.replace(/\s/g, '')) + '">' + esc(j.phone) + '</a>' : '') + '</article></div>' +
        (j.mail ? '<a class="btn btn--outline btn--icon" href="mailto:' + esc(j.mail) + '">' + icon('mail') + esc(j.mail) + '</a>' : '<a class="btn btn--outline btn--icon" href="https://www.mvbnet.de/karriere/stellenangebote/" target="_blank" rel="noopener">' + icon('mail') + 'Kontakt</a>') + '</address></aside></div>';
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
    async render(el, args, shellEl) {
      const key = args[0] || 'initiativ';
      const job = key === 'initiativ' ? null : await findJob(key);
      const jobTitle = job ? job.title : 'Initiativbewerbung';
      const draftKey = 'bewerbung.' + key;
      const S = Object.assign({ step: 0, f: {} }, M.store.get(draftKey, {}));
      S.files = {};
      S.step = Math.min(S.step || 0, STEPS.length - 1);

      shellEl.classList.add('form-page');
      el.innerHTML = C.crumbs([['Karriere', '#/karriere'], job ? [job.title, '#/karriere/job/' + key] : ['Initiativbewerbung', '#/karriere'], ['Bewerbung']], true) +
        '<div class="g" style="margin-top:2rem"><div class="fb__main"><div class="fb__box apply"><h1 style="text-align:left;margin-bottom:.5rem">Deine Bewerbung</h1><p class="step-p">' + esc(jobTitle) + ' – in fünf Schritten direkt hier bei der MVB. Dein Entwurf wird auf diesem Gerät zwischengespeichert.</p>' +
        '<ol class="steps" id="bSteps"></ol><div class="prog"><span id="bProg"></span></div><form id="bForm" novalidate></form></div></div></div>';
      const form = M.$('#bForm', el);
      const save = () => M.store.set(draftKey, { step: S.step, f: S.f });

      const field = (name, label, o) => {
        o = o || {};
        const v = S.f[name] != null ? S.f[name] : o.value || '';
        const req = o.req ? ' <em>*</em>' : '';
        let input;
        if (o.type === 'select') input = '<select name="' + name + '"' + (o.req ? ' required' : '') + '><option value="">Bitte wählen</option>' + o.opts.map((x) => '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>';
        else if (o.type === 'textarea') input = '<textarea name="' + name + '"' + (o.req ? ' required' : '') + (o.min ? ' minlength="' + o.min + '"' : '') + ' placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea>';
        else input = '<input type="' + (o.type || 'text') + '" name="' + name + '" value="' + esc(v) + '"' + (o.req ? ' required' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.pattern ? ' pattern="' + o.pattern + '"' : '') + (o.max ? ' max="' + o.max + '"' : '') + ' placeholder="' + esc(o.ph || '') + '">';
        return '<label class="fld' + (o.full ? ' full' : '') + '"><span class="fld__in"><span>' + esc(label) + req + '</span>' + input + '</span>' + (o.hint ? '<small class="fld__hint">' + esc(o.hint) + '</small>' : '') + '<span class="fld__err"></span></label>';
      };

      const VIEWS = {
        daten: () => '<h2 class="step-h">Persönliche Daten</h2><p class="step-p">Mit * markierte Felder sind Pflichtfelder.</p><div class="fgrid">' +
          '<div class="fld full"><span class="rad-label">Anrede *</span><div class="rad">' + ['Frau', 'Herr', 'Divers', 'Keine Angabe'].map((x) => '<label><input type="radio" name="anrede" value="' + x + '"' + (S.f.anrede === x ? ' checked' : '') + ' required>' + x + '</label>').join('') + '</div><span class="fld__err"></span></div>' +
          field('vorname', 'Vorname', { req: true, auto: 'given-name' }) + field('nachname', 'Nachname', { req: true, auto: 'family-name' }) +
          field('geburt', 'Geburtsdatum', { req: true, type: 'date', max: new Date().toISOString().slice(0, 10) }) + field('nation', 'Staatsangehörigkeit', { auto: 'off', ph: 'z. B. deutsch' }) +
          field('mail', 'E-Mail', { req: true, type: 'email', auto: 'email' }) + field('tel', 'Telefon', { req: true, type: 'tel', auto: 'tel', ph: '0170 1234567' }) +
          field('strasse', 'Straße und Hausnummer', { req: true, auto: 'street-address', full: true }) +
          field('plz', 'PLZ', { req: true, auto: 'postal-code', pattern: '[0-9]{5}', ph: '39104' }) + field('ort', 'Ort', { req: true, auto: 'address-level2', ph: 'Magdeburg' }) + '</div>',
        quali: () => '<h2 class="step-h">Qualifikation</h2><p class="step-p">Erzähl uns, was du mitbringst.</p><div class="fgrid">' +
          field('abschluss', 'Höchster Schulabschluss', { req: true, type: 'select', opts: ['Hauptschulabschluss', 'Realschulabschluss', 'Fachhochschulreife', 'Abitur', 'Abgeschlossene Berufsausbildung', 'Studium', 'Noch in der Schule'] }) +
          field('schule', 'Schule / Hochschule', { ph: 'Name und Ort' }) + field('jahr', 'Abschlussjahr', { type: 'number', ph: '2026' }) +
          field('eintritt', 'Frühester Eintrittstermin', { req: true, type: 'date' }) +
          '<div class="fld full"><span class="rad-label">Führerschein</span><div class="rad">' + ['Keiner', 'B', 'BE', 'C/CE', 'D/DE'].map((x) => '<label><input type="checkbox" name="fs_' + x + '"' + (S.f['fs_' + x] ? ' checked' : '') + '>' + x + '</label>').join('') + '</div></div>' +
          field('erfahrung', 'Berufserfahrung', { type: 'textarea', full: true, ph: 'Stationen, Praktika, Nebenjobs …' }) +
          field('quelle', 'Wie bist du auf uns aufmerksam geworden?', { type: 'select', opts: ['MVB-Webseite', 'Social Media', 'Job-Messe', 'Freunde / Familie', 'Werbung in Bahn oder Bus', 'Sonstiges'], full: true }) + '</div>',
        unterlagen: () => {
          const groups = [];
          DOCS.forEach((d) => { let g = groups.find((x) => x.t === d.group); if (!g) { g = { t: d.group, list: [] }; groups.push(g); } g.list.push(d); });
          return '<h2 class="step-h">Unterlagen</h2><p class="step-p">PDF, JPG oder PNG, je Datei höchstens 10 MB. Bei Zeugnissen bitte <b>Vorder- und Rückseite</b> einzeln hochladen.</p>' +
            groups.map((g) => '<h3 class="ups-h">' + icon('file') + esc(g.t) + '</h3><div class="ups">' + g.list.map((d) => upBox(d)).join('') + '</div>').join('');
        },
        motivation: () => '<h2 class="step-h">Motivation</h2><p class="step-p">Warum möchtest du zur MVB? Schreib es hier hinein oder lade dein Anschreiben hoch.</p><div class="fgrid">' +
          field('motiv', 'Motivationsschreiben', { type: 'textarea', full: true, min: 200, ph: 'Liebes Team der MVB, …', hint: 'Mindestens 200 Zeichen – oder unten ein Anschreiben hochladen.' }) +
          '<div class="full" id="motivCount" style="font-size:.875rem;color:var(--grey-500)"></div>' +
          '<div class="full"><div class="ups">' + upBox({ k: 'anschreiben', t: 'Anschreiben (optional, statt Text)', req: false }) + '</div></div>' +
          field('staerken', 'Deine drei größten Stärken', { full: true, ph: 'z. B. zuverlässig, teamfähig, ruhig in Stresssituationen' }) + '</div>',
        pruefen: () => {
          const fs = ['Keiner', 'B', 'BE', 'C/CE', 'D/DE'].filter((x) => S.f['fs_' + x]).join(', ') || '–';
          const row = (k, v) => '<dt>' + esc(k) + '</dt><dd>' + esc(v || '–') + '</dd>';
          return '<div class="review"><h2 class="step-h">Prüfen &amp; Absenden</h2><p class="step-p">Bitte prüfe deine Angaben.</p>' +
            '<h3>Persönliche Daten <button type="button" class="btn btn--outline btn--sm" data-go="0">Ändern</button></h3><dl>' + row('Name', [S.f.anrede, S.f.vorname, S.f.nachname].filter(Boolean).join(' ')) + row('Geburtsdatum', S.f.geburt ? M.fmtDate(S.f.geburt) : '') + row('E-Mail', S.f.mail) + row('Telefon', S.f.tel) + row('Adresse', [S.f.strasse, [S.f.plz, S.f.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ')) + '</dl>' +
            '<h3>Qualifikation <button type="button" class="btn btn--outline btn--sm" data-go="1">Ändern</button></h3><dl>' + row('Abschluss', S.f.abschluss) + row('Schule', [S.f.schule, S.f.jahr].filter(Boolean).join(' · ')) + row('Eintritt ab', S.f.eintritt ? M.fmtDate(S.f.eintritt) : '') + row('Führerschein', fs) + '</dl>' +
            '<h3>Unterlagen <button type="button" class="btn btn--outline btn--sm" data-go="2">Ändern</button></h3><dl>' + DOCS.concat([{ k: 'anschreiben', t: 'Anschreiben' }]).map((d) => row(d.t, S.files[d.k] ? S.files[d.k].name + ' (' + Math.round(S.files[d.k].size / 1024) + ' KB)' : (d.req ? 'fehlt' : '–'))).join('') + '</dl>' +
            '<h3>Motivation <button type="button" class="btn btn--outline btn--sm" data-go="3">Ändern</button></h3><p style="white-space:pre-wrap;font-size:1rem;color:var(--grey-500);margin-bottom:1.5rem">' + esc((S.f.motiv || (S.files.anschreiben ? 'Anschreiben hochgeladen.' : '–')).slice(0, 600)) + (S.f.motiv && S.f.motiv.length > 600 ? ' …' : '') + '</p>' +
            '<label class="chk fld"><input type="checkbox" name="ds" required' + (S.f.ds ? ' checked' : '') + '><span>Ich habe die <a href="https://www.mvbnet.de/datenschutzbestimmungen/" target="_blank" rel="noopener">Datenschutzhinweise</a> gelesen und bin mit der Verarbeitung meiner Daten zum Zweck der Bewerbung einverstanden. *</span></label>' +
            '<label class="chk fld" style="margin-top:1rem"><input type="checkbox" name="wahr" required' + (S.f.wahr ? ' checked' : '') + '><span>Meine Angaben sind vollständig und wahrheitsgemäß. *</span></label>' +
            '<p class="fld__err" id="sendErr"></p></div>';
        }
      };
      function upBox(d) {
        const f = S.files[d.k];
        return '<label class="up' + (f ? ' has' : '') + '" data-up="' + d.k + '">' + (f && f.preview ? '<img class="prev" src="' + f.preview + '" alt="">' : '') +
          '<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label="' + esc(d.t) + '">' + icon(f ? 'check' : 'upload') +
          '<b>' + esc(d.t) + (d.req ? ' *' : '') + '</b><small>' + (f ? esc(f.name) + ' · ' + Math.round(f.size / 1024) + ' KB' : 'Datei auswählen oder hierher ziehen') + '</small>' +
          (f ? '<button type="button" class="btn btn--outline btn--sm btn--icon rm" data-rm="' + d.k + '">' + icon('trash') + 'Entfernen</button>' : '') + '</label>';
      }

      function draw() {
        M.$('#bSteps', el).innerHTML = STEPS.map((s, i) => '<li class="' + (i === S.step ? 'on' : i < S.step ? 'done' : '') + '" data-go="' + i + '"><i>' + (i < S.step ? '✓' : i + 1) + '</i><span>' + s[1] + '</span></li>').join('');
        M.$('#bProg', el).style.width = ((S.step + 1) / STEPS.length * 100) + '%';
        form.innerHTML = VIEWS[STEPS[S.step][0]]() + '<div class="navrow">' + (S.step ? '<button type="button" class="btn btn--outline btn--icon" data-nav="-1">' + icon('arrowL') + 'Zurück</button>' : '<a class="btn btn--outline btn--icon" href="' + (job ? '#/karriere/job/' + key : '#/karriere') + '">' + icon('arrowL') + 'Zur Stelle</a>') +
          (S.step < STEPS.length - 1 ? '<button type="submit" class="btn btn--fill">Weiter' + icon('arrow') + '</button>' : '<button type="submit" class="btn btn--fill btn--icon">' + icon('check') + 'Bewerbung absenden</button>') + '</div>';
        const m = form.motiv;
        if (m) { const upd = () => { M.$('#motivCount', el).textContent = m.value.length + ' Zeichen' + (m.value.length < 200 ? ' (noch ' + (200 - m.value.length) + ')' : ' ✓'); }; m.addEventListener('input', upd); upd(); }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      function collect() {
        new FormData(form).forEach((v, k) => { if (typeof v === 'string') S.f[k] = v; });
        M.$$('input[type=checkbox]', form).forEach((c) => { S.f[c.name] = c.checked; });
        save();
      }
      function validate() {
        let ok = true;
        M.$$('.fld', form).forEach((w) => w.classList.remove('bad'));
        M.$$('[required]', form).forEach((inp) => {
          const w = inp.closest('.fld');
          let bad = false;
          if (inp.type === 'radio') bad = !form.querySelector('input[name="' + inp.name + '"]:checked');
          else if (inp.type === 'checkbox') bad = !inp.checked;
          else bad = !inp.checkValidity();
          if (bad) { ok = false; if (w) { w.classList.add('bad'); const e = M.$('.fld__err', w); if (e) e.textContent = inp.type === 'email' ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : inp.name === 'plz' ? 'Bitte eine fünfstellige PLZ eingeben.' : 'Bitte ausfüllen.'; } }
        });
        if (STEPS[S.step][0] === 'daten' && S.f.geburt) {
          const age = (Date.now() - new Date(S.f.geburt)) / (365.25 * 864e5);
          if (age < 14) { ok = false; const w = form.geburt.closest('.fld'); w.classList.add('bad'); M.$('.fld__err', w).textContent = 'Du musst mindestens 14 Jahre alt sein.'; }
        }
        if (STEPS[S.step][0] === 'unterlagen') {
          const miss = DOCS.filter((d) => d.req && !S.files[d.k]);
          if (miss.length) { ok = false; M.toast('Bitte noch hochladen: ' + miss.map((d) => d.t).join(', ')); miss.forEach((d) => M.$('[data-up="' + d.k + '"]', form).style.borderColor = 'var(--st-late)'); }
        }
        if (STEPS[S.step][0] === 'motivation' && (S.f.motiv || '').trim().length < 200 && !S.files.anschreiben) {
          ok = false; const w = form.motiv.closest('.fld'); w.classList.add('bad'); M.$('.fld__err', w).textContent = 'Bitte mindestens 200 Zeichen schreiben oder ein Anschreiben hochladen.';
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
        M.$('.apply', el).innerHTML = '<div class="done"><div class="done__ok">' + icon('check') + '</div><h1>Vielen Dank, ' + esc(S.f.vorname || '') + '!</h1>' +
          '<p class="step-p">Deine Bewerbung als <b>' + esc(jobTitle) + '</b> ' + (mode === 'sent' ? 'ist bei uns eingegangen.' : 'ist vollständig.') + ' Deine Referenznummer: <b>' + ref + '</b></p>' +
          (mode === 'local' ? '<p class="note" style="text-align:left">Vorschau-Modus: Es ist noch kein Empfänger für Bewerbungen eingerichtet (CONFIG.bewerbungEndpoint). Deine Daten haben dieses Gerät nicht verlassen.</p>' : '<p class="step-p">Wir melden uns per E-Mail bei dir.</p>') +
          '<p style="margin-top:2rem"><a class="btn btn--fill" href="#/karriere">Weitere Stellen ansehen</a></p></div>';
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
