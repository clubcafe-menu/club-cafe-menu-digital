// Club Café — menu lu depuis Google Sheets.
// Les produits et les catégories viennent de deux feuilles Google publiées au format CSV.
// Si la lecture échoue (hors ligne, lien cassé, feuille vide), le site garde les données de data.js
// ou la dernière version de la feuille mémorisée sur l'appareil. Pour désactiver : ajouter ?nosheet à l'adresse.
(() => {
  'use strict';

  const SHEETS = window.CC_SHEETS || {
    produits: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfNz9WTLf1ZzA63Yawyij2rVQssk4kboHjfGgAUKJjYPiQHckvznIgc0kan5tg8nhs166jgb2iIhqi/pub?output=csv',
    categories: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbgJZJBa-CoaEU5b8Z5JGu7EVHcn5e_3koc_3T7ZjLu1CZLF7gc2suVD1zA6E7csnR3RkY9usbVRgj/pub?output=csv'
  };
  const CACHE_KEY = 'ccSheetCache.v2';
  const TIMEOUT_MS = 8000;

  if (/[?&]nosheet\b/.test(location.search)) return;
  if (typeof cats === 'undefined' || typeof items === 'undefined' || typeof menuItems === 'undefined' || typeof offers === 'undefined') return;

  window.ccSheetStatus = { source: 'data.js', error: null };

  // ---------- CSV ----------
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

  // ---------- nettoyage ----------
  const text = v => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  const isTrue = v => /^(oui|yes|true|vrai|1|x)$/i.test(text(v));
  // identifiant : accents retirés (crêpes → crepes), minuscules, espaces → tirets ; le même traitement s'applique aux deux feuilles
  const slug = v => {
    const s = text(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
    let skipped = 0;
    for (const r of toObjects(rows)) {
      const id = /^\d{1,9}$/.test(text(r.id)) ? parseInt(text(r.id), 10) : 0;
      const cat = slug(r.cat), name = text(r.name);
      if (!id || !cat || !name || seen.has(id)) { skipped++; continue; }
      seen.add(id);
      const desc = text(r.desc);
      const p = {
        id, cat, name,
        price: text(r.price) || 'Prix en café',
        desc,
        detail: text(r.detail) || desc,
        img: cleanUrl(r.img),
        extra: text(r.extra)
      };
      // colonne « pair » : ids des produits suggérés, ex. 300,305,412
      const pair = text(r.pair).split(/[\s,;|]+/).map(n => parseInt(n, 10)).filter(n => n > 0 && n !== id);
      if (pair.length) p.pair = pair.slice(0, 6);
      if (isTrue(r.featured)) p.featured = true;   // colonne « featured » = oui → produit affiché dans « À découvrir »
      if (cat === 'offres') {
        p.badge = text(r.badge) || 'OFFRE';
        p.second = cleanUrl(r.second) || p.img;
        if (isTrue(r.official)) p.official = true;
        out.offers.push(p);
      } else if (cat === 'menus') {
        out.menuItems.push(p);
      } else {
        p.fallbackImg = (typeof productFallbacks !== 'undefined' && productFallbacks[cat]) || photo.capp;
        if (!p.img) p.img = p.fallbackImg;
        else if (/^data:/i.test(p.img)) p.fallbackImg = p.img;   // dessin intégré : il sert aussi de secours
        out.items.push(p);
      }
    }
    if (skipped) console.warn('[sheet] lignes ignorées (id manquant, doublon ou nom vide) :', skipped);
    if (out.menuItems.length + out.offers.length + out.items.length === 0) throw new Error('aucun produit valide');
    return out;
  }

  // ---------- application des données ----------
  const replace = (arr, next) => { arr.length = 0; Array.prototype.push.apply(arr, next); };
  const snapshot = () => JSON.stringify({ cats, menuItems, offers, items });

  function apply(d) {
    replace(cats, d.cats);
    replace(menuItems, d.menuItems);
    replace(offers, d.offers);
    replace(items, d.items);
    // une catégorie utilisée par un produit mais absente de la feuille « categories » est ajoutée
    const known = new Set(cats.map(c => c.id));
    [...menuItems, ...offers, ...items].forEach(p => {
      if (!known.has(p.cat)) { known.add(p.cat); cats.push({ id: p.cat, name: p.cat, icon: '' }); console.warn('[sheet] catégorie absente de la feuille categories :', p.cat); }
    });
  }

  function readCache() {
    try {
      const d = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (d && Array.isArray(d.cats) && Array.isArray(d.menuItems) && Array.isArray(d.offers) && Array.isArray(d.items) && d.menuItems.length + d.offers.length + d.items.length > 0) return d;
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ cats, menuItems, offers, items, time: Date.now() })); } catch (e) { /* ignore */ }
  }

  function whenReady(fn) {
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn, { once: true });
  }

  function refreshUI() {
    try {
      const all = () => [...items, ...menuItems, ...offers];
      // app.js garde une liste unique de tous les produits (favoris, suggestions, recherche, compteurs) : on la remet à jour
      if (typeof ccAll !== 'undefined') { ccAll.length = 0; Array.prototype.push.apply(ccAll, [...menuItems, ...items, ...offers]); }
      const id = typeof current !== 'undefined' && current ? current.id : null;
      current = all().find(p => p.id === id) || items[0] || menuItems[0] || offers[0];
      if (!cats.some(c => c.id === selected)) selected = cats[0] ? cats[0].id : selected;
      renderChips();
      renderProducts();
      if (typeof window.ccRenderFeatured === 'function') window.ccRenderFeatured();
      if (current) showItem(current);
    } catch (e) { console.error('[sheet] rafraîchissement impossible', e); }
  }

  async function fetchText(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } finally { clearTimeout(timer); }
  }

  // 1) version mémorisée sur l'appareil : appliquée tout de suite, avant l'affichage
  const cached = readCache();
  if (cached) { apply(cached); window.ccSheetStatus.source = 'cache'; }
  else {
    // première visite : instantané généré par scripts/sync-sheet.mjs (évite d'attendre Google Sheets)
    const snap = window.CC_SNAPSHOT;
    if (snap && Array.isArray(snap.cats) && Array.isArray(snap.menuItems) && Array.isArray(snap.offers) && Array.isArray(snap.items) && snap.menuItems.length + snap.offers.length + snap.items.length > 0) {
      apply(snap); window.ccSheetStatus.source = 'snapshot';
    }
  }
  let applied = snapshot();

  // 2) version à jour depuis Google Sheets
  Promise.allSettled([fetchText(SHEETS.produits), fetchText(SHEETS.categories)]).then(([prod, cat]) => {
    let next;
    try {
      if (prod.status !== 'fulfilled') throw prod.reason;
      const p = readProducts(prod.value);
      let c = cats.map(x => ({ ...x }));
      if (cat.status === 'fulfilled') {
        const parsed = readCategories(cat.value);
        if (parsed.length) c = parsed;
      }
      next = { cats: c, ...p };
    } catch (e) {
      window.ccSheetStatus.error = String(e && e.message || e);
      console.warn('[sheet] lecture impossible, données conservées :', window.ccSheetStatus.error);
      return;
    }
    apply(next);
    window.ccSheetStatus.source = 'sheet';
    const fresh = snapshot();
    writeCache();
    if (fresh !== applied) { applied = fresh; whenReady(refreshUI); }
  });
})();
