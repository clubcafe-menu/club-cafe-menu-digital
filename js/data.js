// ===== DONNÉES : c'est le seul fichier à modifier pour changer le menu =====

const CATEGORIES = [
  { id: 'menus',          label: 'Les Menus',        icon: 'fa-bell-concierge', title: 'Nos Formules & Menus' },
  { id: 'signatures',     label: 'Signatures',       icon: 'fa-star',           title: 'Nos Signatures' },
  { id: 'offres',         label: 'Offres',           icon: 'fa-tags',           title: 'Nos Offres Spéciales' },
  { id: 'plats',          label: 'Plats',            icon: 'fa-utensils',       title: 'Plats' },
  { id: 'sandwichs',      label: 'Sandwichs',        icon: 'fa-bread-slice',    title: 'Sandwichs' },
  { id: 'patisseries',    label: 'Pâtisseries',      icon: 'fa-cake-candles',   title: 'Pâtisseries' },
  { id: 'boissons',       label: 'Boissons',         icon: 'fa-mug-hot',        title: 'Boissons (Chaudes & Froides)' },
  { id: 'crepes_gaufres', label: 'Crêpes & Gaufres', icon: 'fa-stroopwafel',    title: 'Crêpes & Gaufres' }
];

const SUBCATEGORIES = [
  { id: 'matin', label: `<i class="fa-solid fa-cloud-sun"></i> L'offre du matin`, title: "Nos Formules: L'offre du matin" },
  { id: 'midi',  label: `<i class="fa-solid fa-sun"></i> L'offre du midi`,        title: "Nos Formules: L'offre du midi" },
  { id: 'soir',  label: `<i class="fa-solid fa-moon"></i> L'offre du soir`,       title: "Nos Formules: L'offre du soir" }
];

const VARIANT_LABELS = { temp: ['☕ Chaud', '🧊 Froid'], dessert: ['🥞 Crêpe', '🧇 Gaufre'] };

/*
  Article simple :   { id, name, category, price, description, badge, image, isSignature }
  Article à choix :  { id, name, category, description, badge, variantType, variants:{opt1:{price,image}, opt2:{price,image}} }
  "image" est facultatif : sans image (ou si elle ne charge pas), le nom du produit s'affiche.
  "imagePos" est facultatif : cadrage de la photo, ex. "center 30%" (30% = plus haut, 70% = plus bas).
*/
const menuItems = [
  //=== menus matin ===
  { id: 201, name: "Petit-Déjeuner Express", category: "menus", subCategory: "matin",
    description: "1 Espresso + 1 Croissant.", badge: "Matin", price: "3.50 €",
    image: "https://placehold.co/400x300/E5A93B/30080E?text=Matin+Express" },

  //=== menus midi ===
  { id: 202, name: "Formule Déjeuner", category: "menus", subCategory: "midi",
    description: "1 Sandwich + 1 Boisson fraîche + 1 Pâtisserie au choix.", badge: "Complet", price: "12.00 €",
    image: "https://placehold.co/400x300/4A0E17/FFFFFF?text=Midi+Formule", isSignature: true },

  //=== menus soir ===
  { id: 203, name: "Dîner Douceur", category: "menus", subCategory: "soir",
    description: "1 Plat chaud + 1 Boisson.", badge: "Soir", price: "14.00 €",
    image: "https://placehold.co/400x300/E6E0D4/4A0E17?text=Soir+Douceur" },

  //=== Offres ===


  //=== plats ===


  //=== sandwichs ===
  { id: 6, name: "Nordique", category: "sandwichs", isSignature: true, price: "6.00 €",
    description: "Saumon fumé, cream cheese ail et fines herbes.", badge: "Gourmet",
    image: "https://placehold.co/400x300/E5A93B/30080E?text=Nordique" },

  //=== Pâtisseries ===


  //=== boissons ===
  { id: 2, name: "Espresso", category: "boissons", isSignature: true,
    description: "Espresso ou Allongé", badge: "Populaire", price: "2.00 €",
    image: "./images/boissons chaudes/espresso.webp" },
  { id: 1, name: "Caffè Latte", category: "boissons", isSignature: true,
    description: "Espresso marié au lait, surmonté d'une fine couche de mousse de lait.", badge: "Populaire",
    variantType: 'temp',
    variants: { opt1: { price: "3.80 €", image: "./images/boissons chaudes/cafe latte.webp" },
                opt2: { price: "4.20 €", image: "./images/boissons froides/cafelatte.webp", imagePos: "center 30%" } } },
  { id: 3, name: "Cappuccino", category: "boissons", isSignature: true,
    description: "Double espresso marié au lait, surmonté d'une fine couche de mousse de lait", badge: "Populaire", price: "2.00 €",
    image: "./images/boissons chaudes/cappuccino.webp" },

  //=== crepes_gaufres ===
  { id: 10, name: "Nutella", category: "crepes_gaufres", isSignature: true,
    description: "Gourmandise garnie de véritable pâte à tartiner Nutella.", badge: "Classique",
    variantType: 'dessert',
    variants: { opt1: { price: "4.50 €", image: "https://placehold.co/400x300/E5A93B/30080E?text=Crepe+Nutella" },
                opt2: { price: "5.00 €", image: "https://placehold.co/400x300/E5A93B/30080E?text=Gaufre+Nutella" } } }
];