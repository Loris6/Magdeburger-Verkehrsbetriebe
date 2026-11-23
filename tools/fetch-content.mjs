#!/usr/bin/env node
/* MVB – Stand der echten MVB-Seite sichern (Neuigkeiten, Baustellen, Stellen)
 * Die Webseite lädt alles live von mvbnet.de. Diese Datei ist der Ersatz, falls die Schnittstelle
 * einmal nicht erreichbar ist. Läuft automatisch per GitHub Action (.github/workflows/daten.yml).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WP = 'https://www.mvbnet.de/wp-json/wp/v2';
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8220;|&#8222;|&#8221;/g, '"').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
const get = async (url) => { const r = await fetch(url, { headers: { 'User-Agent': 'mvb-website-content-snapshot' } }); if (!r.ok) throw new Error(url + ' → ' + r.status); return r.json(); };

const posts = await get(`${WP}/posts?per_page=40&_embed=wp:featuredmedia`);
const out = posts.map((p) => {
  const m = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
  return {
    id: p.id, slug: p.slug, date: p.date, modified: p.modified, link: p.link, title: strip(p.title.rendered),
    excerpt: strip(p.excerpt.rendered).replace(/\s*\[…\]/, ' …'), html: p.content.rendered, text: strip(p.content.rendered),
    img: (m && m.source_url) || '', cats: p.categories || []
  };
});
// Stellenangebote (einfach aufbereitet, die Seite liest sonst die Originalseite)
const jobs = [];
for (const [slug, kind] of [['stellenangebote', 'Stellenangebot'], ['ausbildung', 'Ausbildung']]) {
  try {
    const page = (await get(`${WP}/pages?slug=${slug}&_fields=content`))[0];
    const html = page ? page.content.rendered : '';
    // jedes Panel: Überschrift (h5) + Inhalt (panel-body)
    for (const chunk of html.split(/<div class="panel panel-default[^"]*">/).slice(1)) {
      const title = strip((chunk.match(/<h5[^>]*>([\s\S]*?)<\/h5>/) || [])[1] || '');
      const bi = chunk.indexOf('panel-body');
      if (!title || bi < 0) continue;
      let body = chunk.slice(chunk.indexOf('>', bi) + 1).replace(/(<\/div>\s*){2,}\s*$/, '');
      body = body.replace(/<a[^>]*>[\s\S]*?(?:Onlinebewerbung|bewerben)[\s\S]*?<\/a>/gi, '');
      const text = strip(body);
      jobs.push({ slug: title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80), title, kind, html: body, text, contact: '', phone: (text.match(/(0391[\s/\-]*[\d\s\-]{4,14}\d)/) || [''])[0], mail: (body.match(/[\w.\-]+@mvbnet\.de/) || [''])[0] });
    }
  } catch (e) { console.warn(e.message); }
}
await mkdir(join(ROOT, 'data'), { recursive: true });
await writeFile(join(ROOT, 'data', 'news.json'), JSON.stringify({ generated: new Date().toISOString(), source: 'mvbnet.de', posts: out, jobs }));
console.log('Gesichert:', out.length, 'Meldungen,', jobs.length, 'Stellen');
