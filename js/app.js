// ===== LOGIQUE : affichage, filtres, recherche, variantes =====

const $ = id => document.getElementById(id);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();   // "patisserie" = "Pâtisseries"
const state = { category: 'menus', sub: 'matin' };
let searchTimer;

// Recherche tolérante aux fautes et aux accents
const searchable = menuItems.map(item => ({ item, name: norm(item.name), description: norm(item.description) }));
const fuse = new Fuse(searchable, { keys: ['name', 'description'], threshold: 0.3, ignoreLocation: true });

/* ---------- Navigation ---------- */
function buildNav() {
  $('catNav').innerHTML = CATEGORIES.map(c =>
    `<button class="cat-btn" data-cat="${c.id}" aria-pressed="false"><i class="fa-solid ${c.icon}"></i> ${c.label}</button>`).join('');
  $('subNav').innerHTML = SUBCATEGORIES.map(s =>
    `<button class="sub-btn" data-sub="${s.id}" aria-pressed="false">${s.label}</button>`).join('');
}

/* ---------- Carte d'un article ---------- */
function cardHTML(item) {
  const v = item.variants ? item.variants.opt1 : item;
  const toggle = item.variants
    ? `<div class="flex gap-3 mt-3 mb-1" data-vid="${item.id}">${['opt1', 'opt2'].map((o, k) =>
        `<button class="var-btn" data-opt="${o}" aria-pressed="${k === 0}">${VARIANT_LABELS[item.variantType][k]}</button>`).join('')}</div>`
    : '';
  return `
  <article class="menu-card bg-white rounded-2xl overflow-hidden shadow-sm border border-beige-dark flex flex-col h-full">
    <div class="relative h-48 overflow-hidden bg-beige-dark" data-zoom="${item.id}" role="button" tabindex="0" aria-label="Agrandir la photo : ${item.name}">
      <img id="img-${item.id}" ${v.image ? `src="${v.image}"` : ''} alt="${item.name}" loading="lazy"
           style="object-position:${v.imagePos || 'center'}"
           class="w-full h-full object-cover ${v.image ? '' : 'hidden'}">
      <div id="ph-${item.id}" class="${v.image ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center p-4 text-center text-xl font-extrabold text-crimson">${item.name}</div>
      ${item.badge ? `<div class="absolute top-3 right-3 bg-accentYellow text-crimson-dark text-xs font-bold px-2 py-1 rounded-md shadow">${item.badge}</div>` : ''}
    </div>
    <div class="p-5 flex flex-col flex-grow">
      <div class="flex justify-between items-start mb-1">
        <h3 class="text-lg font-bold text-crimson-dark leading-tight">${item.name}</h3>
        ${v.price ? `<span id="price-${item.id}" class="font-black text-crimson bg-beige-light px-2 py-1 rounded text-sm whitespace-nowrap ml-2">${v.price}</span>` : ''}
      </div>
      ${toggle}
      <p class="text-sm text-gray-500 flex-grow leading-relaxed mt-2">${item.description}</p>
    </div>
  </article>`;
}

// Affiche l'image, ou le nom du produit si elle est absente ou ne charge pas
function showImage(id, src, pos) {
  const img = $('img-' + id), ph = $('ph-' + id);
  if (!img || !ph) return;
  img.classList.toggle('hidden', !src);
  ph.classList.toggle('hidden', !!src);
  ph.classList.toggle('flex', !src);
  if (src) { img.src = src; img.style.objectPosition = pos || 'center'; }
}

/* ---------- Filtrage + affichage ---------- */
function render() {
  const q = norm($('searchInput').value.trim());
  const isMenus = state.category === 'menus' && !q;
  let items, title;

  if (q) {
    items = fuse.search(q).map(r => r.item.item);
    title = 'Résultats de recherche';
  } else if (state.category === 'signatures') {
    items = menuItems.filter(i => i.isSignature);
    title = CATEGORIES.find(c => c.id === 'signatures').title;
  } else if (state.category === 'menus') {
    items = menuItems.filter(i => i.category === 'menus' && i.subCategory === state.sub);
    title = SUBCATEGORIES.find(s => s.id === state.sub).title;
  } else {
    items = menuItems.filter(i => i.category === state.category);
    title = CATEGORIES.find(c => c.id === state.category).title;
  }

  document.querySelectorAll('.cat-btn').forEach(b => b.setAttribute('aria-pressed', !q && b.dataset.cat === state.category));
  document.querySelectorAll('.sub-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.sub === state.sub));
  $('subNav').classList.toggle('hidden', !isMenus);
  $('subNav').classList.toggle('flex', isMenus);

  $('currentCategoryTitle').textContent = title;
  $('itemCountBadge').textContent = `${items.length} ${items.length > 1 ? 'articles' : 'article'}`;
  $('menuGrid').innerHTML = items.map(cardHTML).join('');
  $('menuGrid').classList.toggle('hidden', !items.length);
  $('emptyState').classList.toggle('hidden', !!items.length);
}

/* ---------- Événements ---------- */
$('catNav').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  state.category = b.dataset.cat;
  $('searchInput').value = '';
  render();
});
$('subNav').addEventListener('click', e => {
  const b = e.target.closest('[data-sub]'); if (!b) return;
  state.sub = b.dataset.sub;
  render();
});
$('searchInput').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(render, 300); });

$('menuGrid').addEventListener('click', e => {               // Chaud/Froid, Crêpe/Gaufre
  const b = e.target.closest('.var-btn'); if (!b) return;
  const wrap = b.parentElement, id = wrap.dataset.vid;
  const v = menuItems.find(i => String(i.id) === id).variants[b.dataset.opt];
  wrap.querySelectorAll('.var-btn').forEach(x => x.setAttribute('aria-pressed', x === b));
  $('price-' + id).textContent = v.price;
  showImage(id, v.image, v.imagePos);
});
$('menuGrid').addEventListener('error', e => {                // image qui ne charge pas -> nom du produit
  if (e.target.tagName === 'IMG') showImage(e.target.id.replace('img-', ''), null);
}, true);

/* ---------- Agrandissement de la photo ---------- */
const lightbox = $('lightbox');
let lastFocus = null;
function openLightbox(id) {
  const img = $('img-' + id);
  if (!img || img.classList.contains('hidden')) return;          // pas de photo -> rien à agrandir
  const item = menuItems.find(i => String(i.id) === String(id));
  const price = $('price-' + id);
  $('lbImg').src = img.currentSrc || img.src;
  $('lbImg').alt = item.name;
  $('lbCap').innerHTML = `<div class="text-xl font-bold">${item.name}</div>` + (price ? `<div class="text-accentYellow font-bold">${price.textContent}</div>` : '');
  lastFocus = document.activeElement;
  lightbox.classList.remove('hidden'); lightbox.classList.add('flex');
  document.body.style.overflow = 'hidden';
  $('lbClose').focus();
}
function closeLightbox() {
  if (lightbox.classList.contains('hidden')) return;
  lightbox.classList.add('hidden'); lightbox.classList.remove('flex');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
$('menuGrid').addEventListener('click', e => { const z = e.target.closest('[data-zoom]'); if (z) openLightbox(z.dataset.zoom); });
$('menuGrid').addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-zoom]')) { e.preventDefault(); openLightbox(e.target.dataset.zoom); }
});
lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.closest('#lbClose')) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

$('persoBtn').addEventListener('click', () => {
  const open = $('perso').classList.toggle('open');
  $('persoBtn').setAttribute('aria-expanded', open);
});

buildNav();
render();