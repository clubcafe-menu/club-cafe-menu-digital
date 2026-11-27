const ccMobileQuery = window.matchMedia('all'); // une seule colonne sur tous les écrans : la fiche produit s'ouvre toujours en fenêtre
let selected = 'menus',
  current = items[0];
const chips = document.getElementById('chips'),
  products = document.getElementById('products'),
  search = document.getElementById('search');
function safe(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
const ccDefaultCatIcon = '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="2"/>';
const catPaths = {
  menus: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  offres: '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/>',
  cafes: '<path d="M3 9h14v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM17 10h2a3 3 0 0 1 0 6h-2M2 22h19M7 6c-3-3 3-3 0-5M12 6c-3-3 3-3 0-5"/>',
  chaus: '<path d="M3 9h14v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM17 10h2a3 3 0 0 1 0 6h-2M2 22h19M7 6c-3-3 3-3 0-5M12 6c-3-3 3-3 0-5"/>',
  gourmands: '<path d="M4 7h16l-3 15H7L4 7ZM14 7l3-5h4M5 12h14"/><rect x="8" y="14" width="4" height="4" rx=".7" transform="rotate(-12 10 16)"/><rect x="13" y="17" width="3" height="3" rx=".5"/>',
  froids: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M6 5h12M6 19h12M10 3.5h4M6 15c4-7 8-7 12-4M6 17c4-7 8-7 12-4"/>',
  matin: '<path d="M3 16c1-8 6-12 12-11 4 1 6 4 6 8-1 5-7 8-12 7-3 0-5-2-6-4ZM9 9l3 3M15 7l2 4M6 14l4 2"/>',
  sales: '<path d="M3 11 12 4l9 7-9 9-9-9ZM6 13h12M9 16h6"/>',
  desserts: '<path d="M4 12c0-3 3-5 8-5s8 2 8 5v7H4v-7ZM4 13h16M8 4v3M12 3v4M16 4v3"/>',
  crêpes: '<path d="M12 22 2 6Q12-2 22 6L12 22Z M4 9Q12 3 20 9 M7 11l2 1m5-3 2 1m-5 5 1 1"/>',
};
function renderChips() {
  chips.innerHTML = cats
    .map(
      (c) =>
        `<button type="button" class="chip ${selected === c.id ? 'active' : ''}" data-cat="${c.id}" aria-pressed="${selected === c.id}"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24">${catPaths[c.id] || ccDefaultCatIcon}</svg></span><span>${safe(c.name)}</span></button>`,
    )
    .join('');
  chips.querySelectorAll('button').forEach(
    (b) =>
      (b.onclick = () => {
        ccResetFilters();
        selected = b.dataset.cat;
        renderChips();
        renderProducts();
        const active = chips.querySelector('.active');
        if (active)
          active.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center',
          });
      }),
  );
}
function ccCards(list) {
  return list
    .map((p, i) =>
      p.cat === 'offres'
        ? `<button class="product offer-card" data-id="${p.id}" aria-label="Découvrir ${safe(p.name)}"><span class="offer-badge">✦ ${safe(p.badge)}</span><div class="offer-photos"><img src="${p.img}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="144" height="144" onerror="this.onerror=null;this.src='${photo.capp}'"><img src="${p.second}" alt="" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="144" height="144" onerror="this.onerror=null;this.src='${photo.capp}'"></div><h3>${safe(p.name)}</h3><p>${safe(p.desc)}</p><span class="offer-bottom"><span class="price">${safe(p.price)}</span><span class="offer-view" aria-hidden="true">↗</span></span><span class="offer-disclaimer">${p.official ? 'Offre officielle · Prix en café' : 'Prix fictif · Démonstration'}</span></button>`
        : `<button class="product" data-id="${p.id}" aria-label="Voir ${safe(p.name)}"><img src="${p.img}" alt="${safe(p.name)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="180" height="180" onerror="this.onerror=null;this.src='${p.fallbackImg || photo.capp}'"><span class="product-label">${p.cat === 'menus' ? 'Formule' : p.cat === 'cafes' ? 'Café' : p.cat === 'desserts' ? 'Pause sucrée' : p.cat === 'froids' ? 'Boisson fraîche' : 'À découvrir'}</span><h3>${safe(p.name)}</h3><p>${safe(p.desc)}</p><span class="price">${safe(p.price)}</span><span class="view" aria-hidden="true">↗</span></button>`,
    )
    .join('');
}
function ccNormalize(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
function renderProducts() {
  let q = ccNormalize(search.value);
  let source =
    selected === 'menus' ? menuItems : selected === 'offres' ? offers : items.filter((p) => p.cat === selected);
  let globalFilter = window.ccReady && window.ccFilterMatch && ccFilter !== 'all';
  let matches = (p) => !q || q.split(/\s+/).every((w) => ccNormalize(p.name + ' ' + p.desc).includes(w));
  let grouped = !!q || globalFilter;
  let list = (
    grouped ? [...menuItems, ...items, ...offers].filter((p) => !globalFilter || window.ccFilterMatch(p)) : source
  ).filter(matches);
  document.getElementById('listTitle').textContent =
    selected === 'menus' ? 'Les menus' : cats.find((c) => c.id === selected).name;
  document.querySelector('.eyebrow').textContent =
    selected === 'offres'
      ? 'Offres gourmandes'
      : selected === 'menus'
        ? 'Formules issues de la carte Club Café'
        : 'Faites-vous plaisir';
  document.querySelector('.headingNote').textContent = '';
  const title = document.getElementById('listTitle');
  if (globalFilter) title.textContent = 'Résultats : ' + ccFilters.find((f) => f[0] === ccFilter)[1];
  if (q) title.textContent = 'Résultats de recherche' + ' · ' + list.length;
  else if (globalFilter) title.textContent += ' · ' + list.length;
  let favPanel = document.getElementById('ccFavoritePanel');
  if (window.ccReady && ccOnlyFav) {
    if (!favPanel) {
      favPanel = document.createElement('section');
      favPanel.id = 'ccFavoritePanel';
      title.before(favPanel);
    }
    let saved = ccAll.filter((p) => ccFav.has(p.id));
    favPanel.innerHTML =
      '<h2 class="sectiontitle">' +
      'Mes favoris' +
      '</h2>' +
      (saved.length
        ? ccGroups(saved)
        : '<p class="empty cc-empty">' +
          'Aucun favori enregistré. Touchez le cœur dans la fiche d’un produit pour le retrouver ici.' +
          '</p><button class="cc-return" type="button">' +
          'Retour à la carte' +
          '</button>');
    favPanel.querySelector('.cc-return')?.addEventListener('click', () => {
      ccResetFilters(true);
      renderProducts();
    });
    ccBindCards(favPanel);
  } else favPanel?.remove();
  products.classList.toggle('offers-grid', !grouped && selected === 'offres');
  products.innerHTML = list.length
    ? grouped
      ? ccGroups(list)
      : ccCards(list)
    : '<p class="empty cc-empty">Aucun produit trouvé. Essayez une autre recherche.</p>';
  products.classList.toggle('cc-grouped', !!grouped);
  ccBindCards(products);
}
function ccBindCards(root) {
  root.querySelectorAll('.product').forEach(
    (b) =>
      (b.onclick = () =>
        showItem(
          [...menuItems, ...items, ...offers].find((p) => p.id === Number(b.dataset.id)),
          true,
        )),
  );
}
function ccGroups(list) {
  return cats
    .map((c) => {
      let group = list.filter((p) => p.cat === c.id);
      return group.length
        ? `<section class="cc-result-group"><h3>${safe(c.name)}</h3><div class="products ${c.id === 'offres' ? 'offers-grid' : ''}">${ccCards(group)}</div></section>`
        : '';
    })
    .join('');
}
function ccResetFilters(closeFavorites = false) {
  if (!window.ccReady) return;
  if (closeFavorites) {
    ccOnlyFav = false;
    ccFavBtn.setAttribute('aria-pressed', 'false');
  }
  if (window.ccFilterMatch) {
    ccFilter = 'all';
    ccSelect.value = 'all';
  }
}
const ccDetailSteps = [];
function detailHTML(p, m = false) {
  return ccDetailSteps.reduce((html, step) => step(html, p, m), ccDetailBase(p, m));
}
function ccDetailBase(p, mobile = false) {
  return `<div class="detailtop"><div class="detailactions"><button class="outline" data-back aria-label="Retour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg></button><span class="outline" aria-hidden="true">♡</span></div><img class="heroimage" src="${p.img}" alt="${safe(p.name)}" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src='${p.fallbackImg || photo.capp}'"></div><div class="detailbody"><span class="tag">${p.cat === 'offres' ? '✦ Offre de démonstration' : '✦ Club Café'}</span><div class="detailheading"><h1>${safe(p.name)}</h1><span class="pricepill">${safe(p.price)}</span></div><div class="detail-divider"></div><p class="detail-intro">Une pause à savourer</p><h2>À découvrir</h2><p class="description">${safe(p.detail)}</p><div class="specs"><span class="spec">${safe(p.extra)}</span><span class="spec">${safe(cats.find((c) => c.id === p.cat)?.name || '')}</span></div><p class="footerline">${p.cat === 'offres' ? 'Offre fictive : composition et prix uniquement illustratifs.' : 'Noms et recettes d’après les cartes Club Café. Photos illustratives non contractuelles ; allergènes, disponibilité et tarifs à confirmer en café.'}</p></div>`;
}
let ccReturnFocus = null;
const ccShell = document.querySelector('.shell');
function showItem(p, openMobile = false) {
  if (!p) return;
  current = p;
  const d = document.getElementById('desktopDetail');
  const m = document.getElementById('mobileDetail');
  const mobileViewport = ccMobileQuery.matches;
  if (!mobileViewport) {
    d.innerHTML = detailHTML(p);
    d.querySelector('[data-back]').onclick = () => {
      ccResetFilters();
      selected = current.cat;
      renderChips();
      renderProducts();
    };
    enhanceDetailMotion(d);
  }
  if (openMobile && mobileViewport) {
    if (!m.classList.contains('open')) ccReturnFocus = document.activeElement;
    m.innerHTML = detailHTML(p, true);
    m.querySelector('[data-back]').onclick = () => closeDetail();
    m.classList.add('open');
    m.removeAttribute('aria-hidden');
    m.inert = false;
    ccShell.inert = true;
    document.body.style.overflow = 'hidden';
    m.scrollTop = 0;
    m.querySelector('[data-back]').focus({ preventScroll: true });
    enhanceDetailMotion(m);
  }
}
function enhanceDetailMotion(node) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  node.classList.remove('fx-detail-enter');
  void node.offsetWidth;
  requestAnimationFrame(() => node.classList.add('fx-detail-enter'));
}
function closeDetail(restoreFocus = true) {
  const m = document.getElementById('mobileDetail');
  if (!m.classList.contains('open')) return;
  m.classList.remove('open');
  ccShell.inert = false;
  document.body.style.overflow = '';
  if (restoreFocus) {
    const target = ccReturnFocus?.isConnected ? ccReturnFocus : search;
    target.focus({ preventScroll: true });
  } else if (m.contains(document.activeElement)) document.activeElement.blur();
  m.inert = true;
  m.setAttribute('aria-hidden', 'true');
  ccReturnFocus = null;
}
function ccViewportChanged() {
  if (!ccMobileQuery.matches) {
    closeDetail(false);
    if (current) showItem(current);
  }
}
if (ccMobileQuery.addEventListener) ccMobileQuery.addEventListener('change', ccViewportChanged);
else ccMobileQuery.addListener(ccViewportChanged);
document.addEventListener('keydown', (e) => {
  const m = document.getElementById('mobileDetail');
  if (!m.classList.contains('open') || document.querySelector('dialog[open]')) return;
  if (e.key !== 'Tab') return;
  const controls = [...m.querySelectorAll('button:not([disabled]),a[href],input,[tabindex="0"]')].filter(
    (x) => x.getClientRects().length,
  );
  if (!controls.length) {
    e.preventDefault();
    return;
  }
  const first = controls[0],
    last = controls.at(-1);
  if (e.shiftKey && (document.activeElement === first || !m.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !m.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
});
let searchFrame = 0;
search.addEventListener('input', () => {
  if (searchFrame) cancelAnimationFrame(searchFrame);
  searchFrame = requestAnimationFrame(() => {
    searchFrame = 0;
    renderProducts();
  });
});
function ccGoHome() {
  if (searchFrame) {
    cancelAnimationFrame(searchFrame);
    searchFrame = 0;
  }
  ccResetFilters(true);
  selected = 'menus';
  search.value = '';
  search.blur();
  search.closest('.search').classList.remove('has-query');
  if (ccDialog.open) ccDialog.close();
  closeDetail();
  document.getElementById('mobileDetail').innerHTML = '';
  current = items[0];
  renderChips();
  renderProducts();
  showItem(current);
  chips.scrollTo({ left: 0, behavior: 'instant' });
  document.querySelector('.featured-items')?.scrollTo({ left: 0, behavior: 'instant' });
  document.querySelector('.extras-ticker')?.scrollTo({ left: 0, behavior: 'instant' });
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
document.getElementById('homeBtn').onclick = ccGoHome;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.querySelector('dialog[open]')) closeDetail();
});
renderChips();
renderProducts();
showItem(current);

/* Lightweight visual effects: no cart, ordering or tracking. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = document.getElementById('products');
  const markImages = (root) => {
    root.querySelectorAll('img').forEach((img) => {
      if (img.dataset.fxBound) return;
      img.dataset.fxBound = '1';
      if (!img.complete) {
        img.classList.add('fx-image-loading');
        const finish = () => img.classList.remove('fx-image-loading');
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      }
    });
  };
  const enhanceCards = () => {
    [...gallery.querySelectorAll('.product')].forEach((card, i) => {
      if (!reduced.matches) {
        card.style.setProperty('--fx-delay', Math.min(i, 5) * 18 + 'ms');
        card.classList.add('fx-enter');
      }
    });
    markImages(gallery);
  };
  new MutationObserver(enhanceCards).observe(gallery, { childList: true });
  enhanceCards();
  // Keep bottom navigation's active indicator consistent with existing actions.
  const home = document.getElementById('homeBtn'),
    categories = document.getElementById('menuBtn'),
    about = document.getElementById('aboutBtn');
  [home, categories, about].forEach((btn) =>
    btn.addEventListener('click', () => {
      [home, categories, about].forEach((b) => b.classList.toggle('active', b === btn));
    }),
  );
  const chips = document.getElementById('chips');
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    [home, categories, about].forEach((b) => b.classList.toggle('active', b === categories));
  });
  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    [home, categories, about].forEach((b) => b.classList.toggle('active', b === categories));
  });
})();

/* Search enhancement: existing live filtering remains the source of truth. */
(() => {
  const field = document.getElementById('search');
  const wrapper = field.closest('.search');
  const clear = document.getElementById('clearSearch');
  const searchButton = wrapper.querySelector('button[aria-label="Rechercher"]');
  const sync = () => wrapper.classList.toggle('has-query', field.value.length > 0);
  field.addEventListener('input', sync);
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && field.value) {
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  clear.addEventListener('click', () => {
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
  });
  searchButton.addEventListener('click', () => {
    if (!field.value.trim()) field.focus();
    else ccSubmitSearch();
  });
  // Also sync when the Home action clears the search programmatically.
  document.getElementById('homeBtn').addEventListener('click', () => requestAnimationFrame(sync));
  sync();
})();

(() => {
  const box = document.getElementById('featuredItems');
  if (!box) return;
  window.ccRenderFeatured = () => {
    const all = [...items, ...menuItems, ...offers];
    let picks = all.filter((p) => p.featured);
    if (!picks.length) picks = [311, 312, 322, 400].map((id) => all.find((p) => p.id === id)).filter(Boolean);
    box.innerHTML = '';
    const sec = box.closest('.featured-collection');
    if (sec) sec.hidden = !picks.length;
    for (const p of picks) {
      const b = document.createElement('button');
      b.type = 'button';
      const img = document.createElement('img');
      img.src = p.img;
      img.alt = '';
      img.onerror = () => {
        img.onerror = null;
        img.src = p.fallbackImg || photo.capp;
      };
      const label = document.createElement('span');
      label.textContent = p.name;
      b.append(img, label);
      b.onclick = () => showItem(p, true);
      box.append(b);
    }
  };
  window.ccRenderFeatured();
})();

(() => {
  const b = document.getElementById('scrollTopClub');
  if (!b) return;
  const update = () => {
    b.hidden = window.scrollY < 450 || document.getElementById('mobileDetail').classList.contains('open');
  };
  window.addEventListener('scroll', update, { passive: true });
  new MutationObserver(update).observe(document.getElementById('mobileDetail'), {
    attributes: true,
    attributeFilter: ['class'],
  });
  b.onclick = () =>
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  update();
})();

(() => {
  const home = document.querySelector('.home'),
    page = document.getElementById('clubNavPage'),
    hb = document.getElementById('homeBtn'),
    mb = document.getElementById('menuBtn'),
    ab = document.getElementById('aboutBtn');
  const motion = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  function active(btn) {
    [hb, mb, ab].forEach((b) => {
      b.classList.toggle('active', b === btn);
      if (b === btn) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  function top() {
    window.scrollTo({ top: 0, behavior: motion() });
  }
  function closePage() {
    home.classList.remove('nav-page-open');
    page.innerHTML = '';
    active(hb);
  }
  function openPage(html, btn) {
    page.innerHTML = html;
    home.classList.add('nav-page-open');
    active(btn);
    top();
    page.querySelector('.club-page-back').onclick = () => {
      closePage();
      top();
    };
  }
  const back = '<button type="button" class="club-page-back">← Retour à la carte</button>';
  hb.onclick = () => {
    closePage();
    ccGoHome();
  };
  mb.onclick = () => {
    openPage(
      back +
        '<h1 class="club-page-title">Catégories</h1><p class="club-page-note">Choisissez votre envie du moment.</p><div class="club-cat-grid">' +
        cats
          .map(
            (c) =>
              `<button type="button" data-category="${c.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${catPaths[c.id] || ccDefaultCatIcon}</svg><span>${safe(c.name)}</span><small>${(c.id === 'menus' ? menuItems : c.id === 'offres' ? offers : items.filter((p) => p.cat === c.id)).length} produits</small></button>`,
          )
          .join('') +
        '</div>',
      mb,
    );
    page.querySelectorAll('[data-category]').forEach(
      (b) =>
        (b.onclick = () => {
          ccResetFilters();
          selected = b.dataset.category;
          search.value = '';
          search.closest('.search').classList.remove('has-query');
          closePage();
          renderChips();
          renderProducts();
          active(mb);
          requestAnimationFrame(() => {
            document.getElementById('listTitle').scrollIntoView({ behavior: motion(), block: 'center' });
            chips.querySelector('.active')?.scrollIntoView({ behavior: motion(), block: 'nearest', inline: 'center' });
          });
        }),
    );
  };
  ab.onclick = () =>
    openPage(
      back +
        `<h1 class="club-page-title">Infos pratiques</h1><p class="club-page-note">Votre café Club Café</p><div class="club-info"><article><h3>Horaires d’ouverture</h3><p>À consulter auprès de votre café.</p></article><article><h3>Adresse et téléphone</h3><p>Coordonnées du café à renseigner.</p></article><article><h3>Wi-Fi</h3><p>Renseignez-vous auprès de l’équipe.</p></article><article><h3>Instagram</h3><p>Compte du café à renseigner.</p></article><article><h3>Allergènes</h3><p>Pour toute allergie ou intolérance, demandez les informations à notre équipe avant de consommer.</p></article><article><h3>Notre carte digitale</h3><p>Photos illustratives. Disponibilité et tarifs à confirmer en café. Aucun achat ni commande en ligne.</p></article></div>`,
      ab,
    );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && home.classList.contains('nav-page-open')) closePage();
  });
  active(hb);
})();

const ccAll = [...menuItems, ...items, ...offers];
ccDetailSteps.push((html) =>
  html.replace(
    '<p class="footerline">',
    `<section class="cc-extra"><h3>Allergènes</h3><p>Informations non vérifiées pour ce produit. Demandez la fiche officielle des allergènes et des traces éventuelles à notre équipe avant de consommer.</p></section><p class="footerline">`,
  ),
);
showItem(current);

ccDetailSteps.push((html, p) => {
  const target = ['cafes', 'gourmands', 'froids'].includes(p.cat) ? ['desserts', 'matin'] : ['cafes', 'froids'];
  const picks = items.filter((x) => x.id !== p.id && target.includes(x.cat)).slice(0, 3);
  return html.replace(
    '<p class="footerline">',
    `<section class="cc-extra"><h3>Suggestions gourmandes</h3><div class="cc-pairs">${picks.map((x) => `<button type="button" data-pair="${x.id}"><img src="${safe(x.img)}" alt="">${safe(x.name)}</button>`).join('')}</div></section><p class="footerline">`,
  );
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pair]');
  if (b)
    showItem(
      ccAll.find((x) => x.id === +b.dataset.pair),
      true,
    );
});
showItem(current);

let ccFav = new Set();
try {
  ccFav = new Set(JSON.parse(localStorage.getItem('cc-favorites') || '[]'));
} catch {}
let ccOnlyFav = false;
const ccTools = document.createElement('div');
ccTools.className = 'cc-tools';
document.getElementById('chips').after(ccTools);
const ccFavBtn = document.createElement('button');
ccFavBtn.textContent = '♡ Favoris';
ccFavBtn.setAttribute('aria-pressed', 'false');
document.querySelector('.brand-header').prepend(ccFavBtn);
ccFavBtn.classList.add('cc-header-action', 'cc-header-fav');
ccDetailSteps.push((html, p) =>
  html.replace(
    '<span class="outline" aria-hidden="true">♡</span>',
    `<button class="outline cc-fav" data-fav="${p.id}" aria-label="Favori" aria-pressed="${ccFav.has(p.id)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>`,
  ),
);
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  const id = +b.dataset.fav;
  ccFav.has(id) ? ccFav.delete(id) : ccFav.add(id);
  try {
    localStorage.setItem('cc-favorites', JSON.stringify([...ccFav]));
  } catch {}
  document.querySelectorAll('[data-fav="' + id + '"]').forEach((x) => {
    x.setAttribute('aria-pressed', ccFav.has(id));
  });
  if (ccOnlyFav) renderProducts();
});
window.ccReady = true;
ccFavBtn.onclick = () => {
  ccOnlyFav = !ccOnlyFav;
  ccFavBtn.setAttribute('aria-pressed', ccOnlyFav);
  renderProducts();
};
showItem(current);

let ccFilter = 'all';
const ccSelect = document.createElement('select');
ccSelect.setAttribute('aria-label', 'Filtrer les produits');
const ccFilters = [
  ['all', 'Tous'],
  ['hot', 'Chaud'],
  ['cold', 'Froid'],
  ['sweet', 'Sucré'],
  ['savory', 'Salé'],
];
ccSelect.innerHTML = ccFilters.map(([v, f]) => `<option value="${v}">${f}</option>`).join('');
ccTools.append(ccSelect);
ccSelect.onchange = () => {
  ccFilter = ccSelect.value;
  renderProducts();
};
window.ccFilterMatch = (p) =>
  ccFilter === 'all' ||
  (ccFilter === 'hot' && ['cafes', 'gourmands'].includes(p.cat)) ||
  (ccFilter === 'cold' && p.cat === 'froids') ||
  (ccFilter === 'sweet' && p.cat === 'desserts') ||
  (ccFilter === 'savory' && p.cat === 'sales');

const ccDialog = document.createElement('dialog');
ccDialog.className = 'cc-photo-dialog';
ccDialog.setAttribute('aria-label', 'Photo du produit');
ccDialog.innerHTML = '<button type="button">×</button><img alt=""><p></p>';
document.body.append(ccDialog);
ccDialog.querySelector('button').onclick = () => ccDialog.close();
ccDialog.addEventListener('click', (e) => {
  if (e.target === ccDialog) ccDialog.close();
});
function ccZoom(img) {
  ccDialog.querySelector('img').src = img.currentSrc || img.src;
  ccDialog.querySelector('img').alt = img.alt;
  ccDialog.querySelector('p').textContent = img.alt;
  ccDialog.querySelector('button').setAttribute('aria-label', 'Fermer');
  ccDialog.showModal();
}
document.addEventListener('click', (e) => {
  if (e.target.matches('.heroimage')) ccZoom(e.target);
});
document.addEventListener('keydown', (e) => {
  if (e.target.matches('.heroimage') && ['Enter', ' '].includes(e.key)) {
    e.preventDefault();
    ccZoom(e.target);
  }
});
function ccPhotoAccess() {
  document.querySelectorAll('.heroimage').forEach((x) => {
    x.tabIndex = 0;
    x.setAttribute('role', 'button');
  });
}
new MutationObserver(ccPhotoAccess).observe(document.body, { childList: true, subtree: true });
ccPhotoAccess();

function ccSubmitSearch() {
  search.blur();
  renderProducts();
  document.getElementById('ccSearchSuggestions').hidden = true;
  requestAnimationFrame(() =>
    document
      .getElementById('listTitle')
      .scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      }),
  );
}
(() => {
  const box = document.createElement('div');
  box.id = 'ccSearchSuggestions';
  box.className = 'cc-search-suggestions';
  box.hidden = true;
  search.closest('.search').after(box);
  search.setAttribute('enterkeyhint', 'search');
  search.setAttribute('autocomplete', 'off');
  function suggest() {
    const q = ccNormalize(search.value);
    box.replaceChildren();
    if (!q || document.activeElement !== search) {
      box.hidden = true;
      return;
    }
    const matches = ccAll.filter((p) => q.split(/\s+/).every((w) => ccNormalize(p.name).includes(w))).slice(0, 5);
    for (const p of matches) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = p.name;
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.onclick = () => {
        search.value = p.name;
        search.dispatchEvent(new Event('input', { bubbles: true }));
        ccSubmitSearch();
      };
      box.append(b);
    }
    box.hidden = !matches.length;
  }
  search.addEventListener('input', suggest);
  search.addEventListener('focus', suggest);
  search.addEventListener('blur', () =>
    setTimeout(() => {
      if (!box.contains(document.activeElement)) box.hidden = true;
    }, 150),
  );
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ccSubmitSearch();
    }
    if (e.key === 'Escape') box.hidden = true;
  });
  document.getElementById('homeBtn').addEventListener('click', () => (box.hidden = true));
  const sticky = document.createElement('div');
  sticky.className = 'cc-sticky-controls';
  chips.before(sticky);
  sticky.append(chips, ccTools);
  const count = document.createElement('span');
  count.className = 'cc-filter-count';
  count.setAttribute('aria-live', 'polite');
  ccTools.append(count);
  function counts() {
    const n = products.querySelectorAll('.product').length;
    const label = n + ' ' + (n === 1 ? 'produit' : 'produits');
    if (count.textContent !== label) count.textContent = label;
    for (const o of ccSelect.options) {
      const f = ccFilters.find((x) => x[0] === o.value);
      const k = ccAll.filter((p) => {
        const q = ccNormalize(search.value);
        return (
          (!q || q.split(/\s+/).every((w) => ccNormalize(p.name + ' ' + p.desc).includes(w))) &&
          (o.value === 'all' ||
            (o.value === 'hot' && ['cafes', 'gourmands'].includes(p.cat)) ||
            (o.value === 'cold' && p.cat === 'froids') ||
            (o.value === 'sweet' && p.cat === 'desserts') ||
            (o.value === 'savory' && p.cat === 'sales'))
        );
      }).length;
      const t = f[1] + ' (' + k + ')';
      if (o.textContent !== t) o.textContent = t;
    }
  }
  new MutationObserver(counts).observe(products, { childList: true });
  counts();
  document.addEventListener('click', (e) => {
    if (e.target.closest('.chip,.nav button,.cc-header-action,.product') && navigator.vibrate) navigator.vibrate(8);
  });
  window.addEventListener(
    'scroll',
    () => document.querySelector('.brand-header').classList.toggle('cc-compact', window.scrollY > 70),
    { passive: true },
  );
  function loading() {
    document.querySelectorAll('.product img,.heroimage').forEach((img) => {
      if (img.dataset.ccLoading) return;
      img.dataset.ccLoading = '1';
      if (!img.complete) {
        img.classList.add('fx-image-loading');
        const done = () => img.classList.remove('fx-image-loading');
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }
  new MutationObserver(loading).observe(document.body, { childList: true, subtree: true });
  loading();
})();
document.querySelector('.home .nav').addEventListener(
  'click',
  function (e) {
    if (e.target.closest('button')) closeDetail();
  },
  true,
);

// Prix provisoires en euros, à modifier ici avant publication.
const ccHotPrices = {
  304: { M: 3.1, L: 3.7 },
  305: { M: 4.1, L: 4.7 },
  306: { M: 4.1, L: 4.7 },
  307: { M: 4.7, L: 5.3 },
  308: { M: 4.4, L: 5 },
  309: { M: 4.1, L: 4.7 },
  310: { M: 4.7, L: 5.3 },
  311: { M: 5.1, L: 5.7 },
  312: { M: 5.1, L: 5.7 },
  313: { M: 3.5, L: 4.1 },
};
const ccSizeMoney = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
ccDetailSteps.push((html, p) => {
  const prices = ccHotPrices[p.id];
  if (!prices || !['cafes', 'gourmands'].includes(p.cat)) return html;
  const sizes = Object.keys(prices);
  const chosen = sizes.includes('M') ? 'M' : sizes[0];
  const labels = { M: 'Moyen', L: 'Grand' };
  const section = `<section class="cc-sizes"><h2>Choisissez votre taille</h2><div class="cc-size-grid" role="group" aria-label="Tailles">${sizes.map((k) => `<button type="button" class="cc-size" aria-pressed="${k === chosen}" data-size-price="${prices[k]}"><svg width="${{ M: 25, L: 30 }[k]}" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h15v7a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM18 9h2a2 2 0 0 1 0 4h-2M7 3v2m5-2v2"/></svg><strong>${k}</strong><span>${labels[k]}</span><b>${ccSizeMoney(prices[k])}</b></button>`).join('')}</div><p class="cc-size-note">Tailles et prix provisoires · À confirmer en café</p></section>`;
  return html
    .replace(/(<span class="pricepill">)[^<]*(<\/span>)/, `$1${ccSizeMoney(prices[chosen])}$2`)
    .replace('<div class="detail-divider"></div>', section + '<div class="detail-divider"></div>');
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('.cc-size');
  if (!b) return;
  const panel = b.closest('.detailbody');
  panel.querySelectorAll('.cc-size').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  panel.querySelector('.pricepill').textContent = ccSizeMoney(Number(b.dataset.sizePrice));
});
if (current) showItem(current, document.getElementById('mobileDetail').classList.contains('open'));

(() => {
  const box = document.getElementById('products');
  let raf = 0;
  const car = () => !box.classList.contains('cc-grouped');
  function update() {
    raf = 0;
    const cards = box.querySelectorAll(':scope>.product');
    if (!car()) {
      cards.forEach((c) => {
        c.style.removeProperty('--s');
        c.style.removeProperty('--o');
      });
      return;
    }
    const r = box.getBoundingClientRect(),
      mid = r.left + r.width / 2;
    cards.forEach((c) => {
      const b = c.getBoundingClientRect(),
        d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / (b.width * 1.1));
      c.style.setProperty('--s', (1 - d * 0.16).toFixed(3));
      c.style.setProperty('--o', (1 - d * 0.45).toFixed(3));
    });
  }
  const req = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  box.addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req, { passive: true });
  new MutationObserver(() => {
    if (car()) {
      box.style.scrollBehavior = 'auto';
      box.scrollLeft = 0;
      box.style.scrollBehavior = '';
    }
    req();
  }).observe(box, { childList: true });
  req();
})();

/* Geste « retour » (Android / Samsung) : ferme seulement l’écran ouvert au lieu de quitter la page. */
(() => {
  const md = document.getElementById('mobileDetail'),
    home = document.querySelector('.home');
  const stack = [],
    trail = [];
  let skip = 0,
    popping = false;
  const baseShow = showItem;
  showItem = function (p, open) {
    if (open && ccMobileQuery.matches && md.classList.contains('open') && p && current && current.id !== p.id) {
      trail.push(current);
      stack.push('nav');
      history.pushState({ cc: 'nav' }, '');
    }
    return baseShow.apply(this, arguments);
  };
  const is = {
    detail: () => md.classList.contains('open'),
    page: () => home.classList.contains('nav-page-open'),
    dialog: () => ccDialog.open,
  };
  const shut = {
    detail: () => closeDetail(),
    page: () => document.querySelector('.club-page-back')?.click(),
    dialog: () => ccDialog.close(),
  };
  const was = { detail: false, page: false, dialog: false };
  function sync(type) {
    const now = is[type]();
    if (now === was[type]) return;
    was[type] = now;
    if (now) {
      stack.push(type);
      history.pushState({ cc: type }, '');
    } else {
      if (popping) return;
      const i = stack.lastIndexOf(type);
      if (i < 0) return;
      const n = stack.length - i;
      stack.splice(i);
      if (type === 'detail') trail.length = 0;
      if (n > 0) {
        skip++;
        history.go(-n);
      }
    }
  }
  new MutationObserver(() => sync('detail')).observe(md, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => sync('page')).observe(home, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => sync('dialog')).observe(ccDialog, { attributes: true, attributeFilter: ['open'] });
  ccDialog.addEventListener('close', () => sync('dialog'));
  addEventListener('popstate', () => {
    if (skip > 0) {
      skip--;
      return;
    }
    const type = stack.pop();
    if (!type) return;
    if (type === 'nav') {
      const prev = trail.pop();
      if (prev) baseShow(prev, true);
      return;
    }
    popping = true;
    try {
      shut[type]();
    } finally {
      was[type] = is[type]();
      popping = false;
    }
  });
})();
(function () {
  const goods = [
    {
      fr: 'Mug nomade',
      desc: 'Votre café partout.',
      price: '14,90 €',
      img: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20180%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23faf0df%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23dfc4a8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22180%22%20height%3D%22200%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22165%22%20rx%3D%2258%22%20ry%3D%2212%22%20fill%3D%22%23c4a68b%22%20opacity%3D%22.55%22%2F%3E%3Crect%20x%3D%2252%22%20y%3D%2249%22%20width%3D%2276%22%20height%3D%22108%22%20rx%3D%2217%22%20fill%3D%22%23792039%22%2F%3E%3Crect%20x%3D%2247%22%20y%3D%2240%22%20width%3D%2286%22%20height%3D%2217%22%20rx%3D%226%22%20fill%3D%22%23482031%22%2F%3E%3Cpath%20d%3D%22M64%2067h52%22%20stroke%3D%22%23BE9455%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E',
    },
    {
      fr: 'Café en grains',
      desc: 'L’arôme à la maison.',
      price: '12,90 €',
      img: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20180%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23faf0df%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23dfc4a8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22180%22%20height%3D%22200%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22165%22%20rx%3D%2258%22%20ry%3D%2212%22%20fill%3D%22%23c4a68b%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M52%2038h76l-5%20119H57z%22%20fill%3D%22%23792039%22%2F%3E%3Cpath%20d%3D%22M52%2048h76M57%20145h66%22%20stroke%3D%22%23BE9455%22%20stroke-width%3D%223%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%2299%22%20rx%3D%2219%22%20ry%3D%2225%22%20fill%3D%22%23BE9455%22%20transform%3D%22rotate%2835%2090%2099%29%22%2F%3E%3Cpath%20d%3D%22M79%20119q24-20%2022-40%22%20fill%3D%22none%22%20stroke%3D%22%23792039%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E',
    },
    {
      fr: 'Verre double paroi',
      desc: 'Une pause élégante.',
      price: '8,90 €',
      img: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20180%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23faf0df%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23dfc4a8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22180%22%20height%3D%22200%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22165%22%20rx%3D%2258%22%20ry%3D%2212%22%20fill%3D%22%23c4a68b%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M49%2054h82l-9%2090q-32%2018-64%200z%22%20fill%3D%22%23fff8ec%22%20fill-opacity%3D%22.6%22%20stroke%3D%22%23a68b78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M60%2082h60l-7%2053q-23%2012-46%200z%22%20fill%3D%22%23a66d46%22%2F%3E%3Cpath%20d%3D%22M59%2062l8%2073q23%2012%2046%200l8-73%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E',
    },
    {
      fr: 'Mug céramique',
      desc: 'Votre rituel quotidien.',
      price: '9,90 €',
      img: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20180%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23faf0df%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23dfc4a8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22180%22%20height%3D%22200%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22165%22%20rx%3D%2258%22%20ry%3D%2212%22%20fill%3D%22%23c4a68b%22%20opacity%3D%22.55%22%2F%3E%3Cpath%20d%3D%22M121%2065q39-7%2032%2026t-32%2022%22%20fill%3D%22none%22%20stroke%3D%22%23792039%22%20stroke-width%3D%2212%22%2F%3E%3Crect%20x%3D%2243%22%20y%3D%2254%22%20width%3D%2285%22%20height%3D%2294%22%20rx%3D%2219%22%20fill%3D%22%23792039%22%2F%3E%3Cellipse%20cx%3D%2285%22%20cy%3D%2256%22%20rx%3D%2242%22%20ry%3D%229%22%20fill%3D%22%234d192c%22%2F%3E%3C%2Fsvg%3E',
    },
    {
      fr: 'Thermos',
      desc: 'Gardez votre café au chaud.',
      price: '19,90 €',
      img: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20180%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23faf0df%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23dfc4a8%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22180%22%20height%3D%22200%22%20fill%3D%22url%28%23b%29%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22165%22%20rx%3D%2258%22%20ry%3D%2212%22%20fill%3D%22%23c4a68b%22%20opacity%3D%22.55%22%2F%3E%3Crect%20x%3D%2265%22%20y%3D%2235%22%20width%3D%2250%22%20height%3D%2228%22%20rx%3D%228%22%20fill%3D%22%234d192c%22%2F%3E%3Crect%20x%3D%2255%22%20y%3D%2258%22%20width%3D%2270%22%20height%3D%22105%22%20rx%3D%2217%22%20fill%3D%22%23792039%22%2F%3E%3Cpath%20d%3D%22M65%2075h50%22%20stroke%3D%22%23BE9455%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E',
    },
  ];
  const shop = document.getElementById('ccBoutique');
  const dialog = document.createElement('dialog');
  dialog.className = 'cc-shop-dialog';
  dialog.setAttribute('aria-label', 'Détails de la boutique');
  document.body.append(dialog);
  function draw() {
    shop.innerHTML = `<header class="cc-shop-head"><small>L’UNIVERS CLUB CAFÉ</small><h2>La Boutique</h2><p>Prolongez l’expérience Club Café chez vous.</p><div class="cc-shop-indicators" role="group" aria-label="Pages de la boutique"></div></header><div class="cc-shop-track">${goods.map((g, i) => `<button type="button" class="cc-shop-card" data-shop="${i}"><img src="${g.img}" alt="${g.fr}"><span class="cc-shop-copy"><strong>${g.fr}</strong><small>${g.desc}</small><span class="cc-shop-price">${g.price}<i aria-hidden="true">↗</i></span></span></button>`).join('')}</div><p class="cc-shop-note">Illustrations et prix provisoires</p>`;
    const track = shop.querySelector('.cc-shop-track'),
      dots = shop.querySelector('.cc-shop-indicators');
    let stops = [];
    function update() {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const pos = track.scrollLeft;
      let active = 0;
      stops.forEach((v, i) => {
        if (Math.abs(v - pos) < Math.abs(stops[active] - pos)) active = i;
      });
      Array.from(dots.children).forEach((b, i) => b.setAttribute('aria-current', String(i === active)));
    }
    function layout() {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      if (!track.clientWidth) return;
      const cards = Array.from(track.children);
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
      const per = Math.max(1, Math.floor(track.clientWidth / step));
      stops = [0];
      for (let i = per; i < cards.length; i += per) {
        const v = Math.min(max, cards[i].offsetLeft - cards[0].offsetLeft);
        if (v - stops[stops.length - 1] > 2) stops.push(v);
      }
      if (max - stops[stops.length - 1] > 2) stops.push(max);
      dots.innerHTML = stops
        .map((v, i) => `<button type="button" aria-label="Page ${i + 1}" aria-current="false"></button>`)
        .join('');
      Array.from(dots.children).forEach(
        (b, i) =>
          (b.onclick = () =>
            track.scrollTo({
              left: stops[i],
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            })),
      );
      update();
    }
    track.addEventListener('scroll', update, { passive: true });
    if (shop._dotObserver) shop._dotObserver.disconnect();
    if ('ResizeObserver' in window) {
      shop._dotObserver = new ResizeObserver(layout);
      shop._dotObserver.observe(track);
    } else window.addEventListener('resize', layout, { passive: true });
    layout();
  }
  shop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-shop]');
    if (!b) return;
    const g = goods[+b.dataset.shop];
    dialog.innerHTML = `<button type="button" aria-label="Fermer">×</button><img src="${g.img}" alt="${g.fr}"><h2>${g.fr}</h2><strong>${g.price}</strong><p>${g.desc}</p><p>Illustration et prix provisoire. Disponibilité à confirmer en café.</p>`;
    dialog.querySelector('button').onclick = () => dialog.close();
    dialog.showModal();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  draw();
})();
(() => {
  const nav = document.querySelector('.home .nav'),
    fav = document.getElementById('ccNavFav'),
    home = document.querySelector('.home'),
    hb = document.getElementById('homeBtn'),
    mb = document.getElementById('menuBtn'),
    ab = document.getElementById('aboutBtn');
  function sync() {
    const page = home.classList.contains('nav-page-open');
    const on = !page && ccOnlyFav;
    fav.classList.toggle('active', on);
    if (on) {
      hb.classList.remove('active');
      hb.removeAttribute('aria-current');
      fav.setAttribute('aria-current', 'page');
    } else {
      fav.removeAttribute('aria-current');
      if (!page) {
        hb.classList.add('active');
        hb.setAttribute('aria-current', 'page');
      }
    }
    const label = 'Favoris';
    if (fav.querySelector('span').textContent !== label) fav.querySelector('span').textContent = label;
  }
  fav.onclick = () => {
    if (home.classList.contains('nav-page-open')) document.querySelector('.club-page-back')?.click();
    if (!ccOnlyFav) ccFavBtn.click();
    sync();
    document
      .getElementById('ccFavoritePanel')
      ?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
  };
  new MutationObserver(sync).observe(ccFavBtn, { attributes: true, attributeFilter: ['aria-pressed'] });
  new MutationObserver(sync).observe(home, { attributes: true, attributeFilter: ['class'] });
  nav.addEventListener('click', () => queueMicrotask(sync));
  sync();
})();

// Offline shell, only on supported secure origins.
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
