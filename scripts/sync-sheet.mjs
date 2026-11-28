// Club Café — génère js/snapshot.js à partir des feuilles Google Sheets publiées.
// Usage : node scripts/sync-sheet.mjs
// Test hors ligne : SHEET_PRODUITS_FILE=... SHEET_CATEGORIES_FILE=... node scripts/sync-sheet.mjs
// La logique de lecture est la même que dans js/sheet.js (garder les deux synchronisés).
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URLS = {
  produits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfNz9WTLf1ZzA63Yawyij2rVQssk4kboHjfGgAUKJjYPiQHckvznIgc0kan5tg8nhs166jgb2iIhqi/pub?output=csv',
  categories: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgJZJBa-CoaEU5b8Z5JGu7EVHcn5e_3koc_3T7ZjLu1CZLF7gc2suVD1zA6E7csnR3RkY9usbVRgj/pub?output=csv'
};

// photo + productFallbacks viennent de data.js (images de secours)
const ctx = vm.createContext({});
const { photo, productFallbacks } = vm.runInContext(
  readFileSync(path.join(root, 'js/data.js'), 'utf8') + '\n;({ photo, productFallbacks })', ctx);

async function load(envFile, url) {
  if (process.env[envFile]) return readFileSync(process.env[envFile], 'utf8');
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' : ' + url);
  return res.text();
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}
function toObjects(rows) {
  if (!rows.length) return [];
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => { if (h) o[h] = r[i] === undefined ? '' : r[i]; });
    return o;
  });
}
const text = v => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
const isTrue = v => /^(oui|yes|true|vrai|1|x)$/i.test(text(v));
const slug = v => {
  const s = text(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return /^[a-z0-9_-]{1,40}$/.test(s) ? s : '';
};
function cleanUrl(v) {
  const u = text(v);
  if (!u || /["'<>`\\\s]/.test(u)) return '';
  return /^(https?:\/\/|images\/|\.\/images\/|data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,])/i.test(u) ? u : '';
}

function readCategories(csv) {
  const list = [], seen = new Set();
  for (const r of toObjects(parseCSV(csv))) {
    const id = slug(r.id), name = text(r.name);
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    list.push({ id, name, icon: text(r.icon) });
  }
  return list;
}

function readProducts(csv) {
  const rows = parseCSV(csv);
  if (!rows.length) throw new Error('feuille produits vide');
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  if (!head.includes('id') || !head.includes('name') || !head.includes('cat')) throw new Error('colonnes id / cat / name introuvables');
  const out = { menuItems: [], offers: [], items: [] }, seen = new Set();
  for (const r of toObjects(rows)) {
    const id = /^\d{1,9}$/.test(text(r.id)) ? parseInt(text(r.id), 10) : 0;
    const cat = slug(r.cat), name = text(r.name);
    if (!id || !cat || !name || seen.has(id)) continue;
    seen.add(id);
    const desc = text(r.desc);
    const p = { id, cat, name, price: text(r.price) || 'Prix en café', desc, detail: text(r.detail) || desc, img: cleanUrl(r.img), extra: text(r.extra) };
    // colonne « pair » : ids des produits suggérés, ex. 300,305,412
    const pair = text(r.pair).split(/[\s,;|]+/).map(n => parseInt(n, 10)).filter(n => n > 0 && n !== id);
    if (pair.length) p.pair = pair.slice(0, 6);
    if (isTrue(r.featured)) p.featured = true;
    if (cat === 'offres') {
      p.badge = text(r.badge) || 'OFFRE';
      p.second = cleanUrl(r.second) || p.img;
      if (isTrue(r.official)) p.official = true;
      out.offers.push(p);
    } else if (cat === 'menus') {
      out.menuItems.push(p);
    } else {
      p.fallbackImg = productFallbacks[cat] || photo.capp;
      if (!p.img) p.img = p.fallbackImg;
      else if (/^data:/i.test(p.img)) p.fallbackImg = p.img;
      out.items.push(p);
    }
  }
  if (out.menuItems.length + out.offers.length + out.items.length === 0) throw new Error('aucun produit valide');
  return out;
}

const [prodCsv, catCsv] = await Promise.all([
  load('SHEET_PRODUITS_FILE', URLS.produits),
  load('SHEET_CATEGORIES_FILE', URLS.categories)
]);
const data = readProducts(prodCsv);
let cats = readCategories(catCsv);
const known = new Set(cats.map(c => c.id));
for (const p of [...data.menuItems, ...data.offers, ...data.items]) {
  if (!known.has(p.cat)) { known.add(p.cat); cats.push({ id: p.cat, name: p.cat, icon: '' }); }
}
if (!cats.length) throw new Error('aucune catégorie');

const out = '// Fichier généré par scripts/sync-sheet.mjs — ne pas modifier à la main.\n' +
  'window.CC_SNAPSHOT = ' + JSON.stringify({ cats, ...data }).replace(/</g, '\\u003c') + ';\n';
const file = path.join(root, 'js/snapshot.js');
let old = '';
try { old = readFileSync(file, 'utf8'); } catch {}
if (old !== out) { writeFileSync(file, out); console.log('js/snapshot.js mis à jour'); }
else console.log('aucun changement');
