import {
  Product,
  Ingredient,
  Recipe,
  Vehicle,
  DriverProfile,
  Order,
  Claim,
  User,
  AuditLog,
  Category,
  Supplier,
  SystemNotification,
  AppSettings
} from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Healthy', slug: 'healthy', description: 'Bowls équilibrés, salades riches en micronutriments et superaliments frais.', displayOrder: 1, isActive: true },
  { id: 'cat_2', name: 'Grillades', slug: 'grillades', description: 'Viandes blanches fermières et bœuf maigre marinés aux herbes et grillés sans matières grasses saturées.', displayOrder: 2, isActive: true },
  { id: 'cat_3', name: 'Enfants', slug: 'enfants', description: 'Menus ludiques, équilibrés et spécialement dosés pour la croissance des plus jeunes.', displayOrder: 3, isActive: true },
  { id: 'cat_4', name: 'Jus détox', slug: 'jus-detox', description: 'Jus 100% naturels pressés à froid sans sucre ajouté ni conservateurs.', displayOrder: 4, isActive: true },
  { id: 'cat_5', name: 'Régime complet 30 jours', slug: 'regime-30-jours', description: 'Programmes de rééquilibrage alimentaire complets avec livraison quotidienne déjeuner et dîner.', displayOrder: 5, isActive: true }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Volaille du Nord',
    phone: '0021671888999',
    email: 'contact@volaillesdunord.tn',
    address: 'Zone Industrielle Mghira, Ben Arous',
    contactPerson: 'Mounir Khelifi',
    status: 'active',
    suppliedIngredients: ['ing_poulet', 'ing_dinde'],
    notes: 'Livraison quotidienne fraîcheur certifiée à 06h30.',
    createdAt: '2026-01-02T08:00:00.000Z'
  },
  {
    id: 'sup_2',
    name: 'Marée Fraîche La Goulette',
    phone: '0021671730120',
    email: 'commandes@mareefraiche.tn',
    address: 'Port de Pêche, La Goulette, Tunis',
    contactPerson: 'Farouk Bouzid',
    status: 'active',
    suppliedIngredients: ['ing_saumon'],
    notes: 'Saumon atlantique et poissons sauvages issus de pêche durable.',
    createdAt: '2026-01-03T08:00:00.000Z'
  },
  {
    id: 'sup_3',
    name: 'Maraîcher Mornag',
    phone: '0021679350444',
    email: 'bio@maraichermornag.tn',
    address: 'Plaine de Mornag, Ben Arous',
    contactPerson: 'Habib Ben Amor',
    status: 'active',
    suppliedIngredients: ['ing_avocat', 'ing_epinards', 'ing_legumes_rotis'],
    notes: 'Légumes et herbes aromatiques de saison certifiés bio.',
    createdAt: '2026-01-05T08:00:00.000Z'
  },
  {
    id: 'sup_4',
    name: 'Fromagerie Méditerranée',
    phone: '0021672450678',
    email: 'vente@fromagerie-med.tn',
    address: 'Béja / Tunis',
    contactPerson: 'Sonia Trabelsi',
    status: 'active',
    suppliedIngredients: ['ing_feta'],
    notes: 'Feta grecque AOP et ricotta artisanale allégée.',
    createdAt: '2026-01-06T08:00:00.000Z'
  },
  {
    id: 'sup_5',
    name: 'Huilerie du Sahel',
    phone: '0021673220110',
    email: 'contact@huileriedusahel.tn',
    address: 'Monastir / Tunis',
    contactPerson: 'Kamel Jemmali',
    status: 'active',
    suppliedIngredients: ['ing_huile_olive'],
    notes: 'Huile d olive extra vierge acidité < 0.2%.',
    createdAt: '2026-01-07T08:00:00.000Z'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  restaurantName: 'BEBBA Healthy Food',
  slogan: '« Vos Plats santé en un clic »',
  currency: 'DT',
  defaultDeliveryFee: 5.0,
  minOrderAmount: 15.0,
  stockAlertThresholdDefault: 10.0,
  contactPhone: '+216 71 000 000',
  contactEmail: 'contact@bebba.tn',
  address: 'Cuisine Centrale BEBBA, Rue du Lac Biwa, Les Berges du Lac 2, Tunis',
  isStoreOpen: true
};

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_1',
    type: 'ORDER_CREATED',
    title: 'Nouvelle commande reçue',
    message: 'Commande BEBBA-2026-1044 de Leila Chaabane (25.0 DT)',
    targetRole: 'kitchen',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString()
  },
  {
    id: 'notif_2',
    type: 'CLAIM_CREATED',
    title: 'Nouvelle réclamation client',
    message: 'Réclamation REC-2026-00001 ouverte par Sarra Mansour',
    targetRole: 'admin',
    read: true,
    createdAt: new Date(Date.now() - 150 * 60000).toISOString()
  },
  {
    id: 'notif_3',
    type: 'STOCK_ALERT',
    title: 'Alerte Stock',
    message: 'Le stock de Blanc de poulet fermier est en baisse régulière.',
    targetRole: 'admin',
    read: false,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString()
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_1',
    name: 'Bebba Direction',
    email: 'admin@bebba.tn',
    phone: '0021671000000',
    rawPhone: '+216 71 000 000',
    role: 'admin',
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'user_kitchen_1',
    name: 'Chef Karim — KDS',
    email: 'chef@bebba.tn',
    phone: '0021671222333',
    rawPhone: '+216 71 222 333',
    role: 'kitchen',
    createdAt: '2026-01-05T08:00:00.000Z'
  },
  {
    id: 'user_driver_1',
    name: 'Ahmed Ben Salah',
    email: 'ahmed.livreur@bebba.tn',
    phone: '0021698111222',
    rawPhone: '+216 98 111 222',
    role: 'driver',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'user_driver_2',
    name: 'Youssef Trabelsi',
    email: 'youssef.livreur@bebba.tn',
    phone: '0021698333444',
    rawPhone: '+216 98 333 444',
    role: 'driver',
    createdAt: '2026-01-12T08:00:00.000Z'
  },
  {
    id: 'user_client_1',
    name: 'Sarra Mansour',
    email: 'sarra.m@gmail.com',
    phone: '0021698765432',
    rawPhone: '+216 98 765 432',
    role: 'client',
    address: '14 Rue de la Liberté, El Menzah 6',
    city: 'Tunis',
    governorate: 'Ariana',
    createdAt: '2026-02-01T10:30:00.000Z'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Healthy
  {
    id: 'prod_healthy_1',
    name: 'Bowl Saumon Sauvage & Quinoa Énergie',
    description: 'Pavé de saumon atlantique poêlé, quinoa royal bio, avocat frais, edamames, concombre croquant et vinaigrette citronnette au sésame.',
    category: 'Healthy',
    basePrice: 28.5,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    calories: 520,
    protein: 36,
    carbs: 42,
    fat: 20,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_salmon', name: 'Supplément Saumon (80g)', priceDelta: 7.5, category: 'protein' },
      { id: 'opt_extra_avocado', name: 'Demi-avocat supplémentaire', priceDelta: 4.0, category: 'supplement' },
      { id: 'opt_extra_edamame', name: 'Portion extra Edamame', priceDelta: 2.5, category: 'vegetable' },
      { id: 'opt_sauce_asian', name: 'Sauce soja gingembre allégée', priceDelta: 0, category: 'sauce' }
    ]
  },
  {
    id: 'prod_healthy_2',
    name: 'Salade Méditerranéenne Detox & Feta AOP',
    description: 'Mélange de pousses d épinards, roquette, dés de feta AOP, tomates cerises confites, noix de Grenoble, olives de Teboursouk et graines de chia.',
    category: 'Healthy',
    basePrice: 21.0,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    protein: 16,
    carbs: 22,
    fat: 24,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_feta', name: 'Extra Feta AOP (50g)', priceDelta: 3.5, category: 'protein' },
      { id: 'opt_extra_walnuts', name: 'Noix de Grenoble torréfiées', priceDelta: 3.0, category: 'supplement' },
      { id: 'opt_extra_veggies', name: 'Double portion légumes croquants', priceDelta: 2.0, category: 'vegetable' }
    ]
  },
  {
    id: 'prod_healthy_3',
    name: 'Power Bowl Tofu Bio & Patates Douces Rôties',
    description: 'Tofu mariné au curcuma et romarin, cubes de patates douces rôties au four, brocolis vapeur, pois chiches croustillants et sauce tahini citron.',
    category: 'Healthy',
    basePrice: 19.5,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    calories: 440,
    protein: 22,
    carbs: 58,
    fat: 14,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_tofu', name: 'Extra Tofu grillé (100g)', priceDelta: 4.5, category: 'protein' },
      { id: 'opt_extra_sweet_potato', name: 'Extra Patates douces', priceDelta: 2.5, category: 'base' },
      { id: 'opt_extra_sauce_tahini', name: 'Double sauce tahini', priceDelta: 1.5, category: 'sauce' }
    ]
  },

  // 2. Grillades
  {
    id: 'prod_grill_1',
    name: 'Blanc de Poulet Mariné aux Herbes & Légumes Rôtis',
    description: 'Blanc de poulet fermier (250g) mariné au thym frais et citron de Zaghouan, grillé minute, accompagné de tagliatelles de courgettes et carottes rissolées.',
    category: 'Grillades',
    basePrice: 24.0,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    calories: 490,
    protein: 48,
    carbs: 18,
    fat: 12,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_chicken', name: '+1 Portion Poulet Fermier (120g)', priceDelta: 6.0, category: 'protein' },
      { id: 'opt_extra_veggies_grill', name: '+ Légumes rôtis au four', priceDelta: 3.5, category: 'vegetable' },
      { id: 'opt_side_rice', name: 'Accompagnement Riz Basmati Complet', priceDelta: 3.0, category: 'base' }
    ]
  },
  {
    id: 'prod_grill_2',
    name: 'Brochettes de Filet de Bœuf Maigre & Riz Complet',
    description: 'Filet de bœuf tendre mariné aux épices douces et poivrons multicolores, grillé à cœur, servi avec riz complet parfumé aux graines de lin.',
    category: 'Grillades',
    basePrice: 29.5,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    calories: 560,
    protein: 45,
    carbs: 38,
    fat: 16,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_beef', name: '+1 Brochette Bœuf (100g)', priceDelta: 8.5, category: 'protein' },
      { id: 'opt_extra_mushroom', name: 'Poêlée de champignons de Paris frais', priceDelta: 4.0, category: 'vegetable' }
    ]
  },
  {
    id: 'prod_grill_3',
    name: 'Pavé de Dinde Grillée Sauce Moutarde à l Ancienne & Épinards',
    description: 'Escalope de dinde épaisse grillée à la plancha, lit d épinards sautés à l ail léger et purée de chou-fleur onctueuse sans beurre.',
    category: 'Grillades',
    basePrice: 22.0,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    calories: 420,
    protein: 46,
    carbs: 12,
    fat: 10,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_turkey', name: '+1 Portion Dinde grillée', priceDelta: 5.5, category: 'protein' },
      { id: 'opt_extra_spinach', name: 'Double dose d épinards frais', priceDelta: 2.5, category: 'vegetable' }
    ]
  },

  // 3. Enfants
  {
    id: 'prod_kids_1',
    name: 'Mini Bowl P tits Champions & Purée Carotte Maison',
    description: 'Émincé de poulet fermier tendre cuit à la vapeur douce, écrasé de carottes au cumin doux, petits pois croquants et maïs doux.',
    category: 'Enfants',
    basePrice: 14.5,
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
    calories: 320,
    protein: 24,
    carbs: 30,
    fat: 8,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_kids_fruit', name: 'Compote pomme-banane bio sans sucre', priceDelta: 2.5, category: 'supplement' },
      { id: 'opt_kids_extra_puree', name: 'Supplément purée carotte douce', priceDelta: 2.0, category: 'base' }
    ]
  },
  {
    id: 'prod_kids_2',
    name: 'Nuggets Sains au Four & Frites de Patate Douce',
    description: 'Bouchées de blanc de poulet panées aux flocons d avoine et cuites au four à l air chaud (sans friture), accompagnées de frites de patates douces maison.',
    category: 'Enfants',
    basePrice: 16.0,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    calories: 360,
    protein: 28,
    carbs: 34,
    fat: 11,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_kids_extra_nuggets', name: '+3 Nuggets sains au four', priceDelta: 3.5, category: 'protein' },
      { id: 'opt_kids_dip_yogurt', name: 'Sauce trempette au yaourt grec & ciboulette', priceDelta: 0, category: 'sauce' }
    ]
  },

  // 4. Jus détox
  {
    id: 'prod_juice_1',
    name: 'Green Booster Détox (350ml)',
    description: 'Pressé à froid : Pousses d épinards, pomme verte Granny Smith, concombre frais, céleri branche, jus de citron bio et touche de gingembre.',
    category: 'Jus détox',
    basePrice: 8.5,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    calories: 110,
    protein: 2,
    carbs: 24,
    fat: 0.5,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_ginger_boost', name: 'Dose supplémentaire gingembre frais', priceDelta: 1.0, category: 'supplement' },
      { id: 'opt_chia_seeds', name: 'Graines de chia réhydratées', priceDelta: 1.5, category: 'supplement' }
    ]
  },
  {
    id: 'prod_juice_2',
    name: 'Red Glow Antioxydant (350ml)',
    description: 'Betterave crue pressée à froid, carotte pourpre, orange douce de Nabeul, grenade et menthe poivrée.',
    category: 'Jus détox',
    basePrice: 8.5,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    calories: 125,
    protein: 2.2,
    carbs: 28,
    fat: 0.3,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_extra_mint', name: 'Feuilles de menthe fraîche pilées', priceDelta: 0.5, category: 'supplement' }
    ]
  },
  {
    id: 'prod_juice_3',
    name: 'Sunrise Citrus & Curcuma Vitalité (350ml)',
    description: 'Pamplemousse rose, clémentine, racine de curcuma frais infusée, poivre noir pour assimilation et eau de coco.',
    category: 'Jus détox',
    basePrice: 9.0,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
    calories: 105,
    protein: 1.8,
    carbs: 23,
    fat: 0.2,
    isAvailable: true,
    availableOptions: []
  },

  // 5. Régime complet 30 jours
  {
    id: 'prod_program_1',
    name: 'Programme Détox & Équilibre Vital (30 Jours)',
    description: 'Accompagnement nutritionnel complet : Déjeuner + Dîner équilibrés livrés chaque jour ouvré, collation saine et 1 jus détox pressé à froid par jour. Suivi personnalisé.',
    category: 'Régime complet 30 jours',
    basePrice: 590.0,
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    calories: 1450,
    protein: 110,
    carbs: 130,
    fat: 45,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_prog_gluten_free', name: 'Option 100% Sans Gluten certifiée', priceDelta: 40.0, category: 'supplement' },
      { id: 'opt_prog_pesco', name: 'Option Pesco-Végétarien (poisson & végétal)', priceDelta: 25.0, category: 'supplement' }
    ]
  },
  {
    id: 'prod_program_2',
    name: 'Programme Sèche & Masse Musculaire Pro (30 Jours)',
    description: 'Pour athlètes et sportifs : 2 repas hyperprotéinés (min. 55g protéine/repas) livrés au quotidien avec glucides complexes contrôlés et collation pré/post-workout.',
    category: 'Régime complet 30 jours',
    basePrice: 650.0,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    calories: 1900,
    protein: 145,
    carbs: 180,
    fat: 50,
    isAvailable: true,
    availableOptions: [
      { id: 'opt_prog_extra_shake', name: 'Ajout shaker protéine végétale bio post-workout', priceDelta: 60.0, category: 'supplement' }
    ]
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing_poulet', name: 'Blanc de poulet fermier', unit: 'kg', unitCost: 16.5, currentStock: 42.5, minThreshold: 15.0, supplierName: 'Volaille du Nord', status: 'optimal' },
  { id: 'ing_saumon', name: 'Filet de saumon atlantique', unit: 'kg', unitCost: 48.0, currentStock: 18.0, minThreshold: 8.0, supplierName: 'Marée Fraîche La Goulette', status: 'optimal' },
  { id: 'ing_boeuf', name: 'Filet de bœuf maigre', unit: 'kg', unitCost: 38.0, currentStock: 22.0, minThreshold: 10.0, supplierName: 'Boucherie Centrale', status: 'optimal' },
  { id: 'ing_dinde', name: 'Escalope de dinde fraîche', unit: 'kg', unitCost: 15.0, currentStock: 28.0, minThreshold: 10.0, supplierName: 'Volaille du Nord', status: 'optimal' },
  { id: 'ing_tofu', name: 'Tofu bio nature', unit: 'kg', unitCost: 22.0, currentStock: 12.0, minThreshold: 5.0, supplierName: 'Bio Tunisie', status: 'optimal' },
  { id: 'ing_quinoa', name: 'Quinoa royal blanc bio', unit: 'kg', unitCost: 14.0, currentStock: 35.0, minThreshold: 12.0, supplierName: 'Céréales & Co', status: 'optimal' },
  { id: 'ing_riz', name: 'Riz complet basmati', unit: 'kg', unitCost: 6.5, currentStock: 60.0, minThreshold: 20.0, supplierName: 'Céréales & Co', status: 'optimal' },
  { id: 'ing_avocat', name: 'Avocat Hass mûr', unit: 'pièce', unitCost: 3.2, currentStock: 65, minThreshold: 25, supplierName: 'Maraîcher Mornag', status: 'optimal' },
  { id: 'ing_feta', name: 'Feta grecque AOP', unit: 'kg', unitCost: 26.0, currentStock: 14.5, minThreshold: 6.0, supplierName: 'Fromagerie Méditerranée', status: 'optimal' },
  { id: 'ing_epinards', name: 'Pousses d épinards fraîches', unit: 'kg', unitCost: 5.5, currentStock: 24.0, minThreshold: 8.0, supplierName: 'Maraîcher Mornag', status: 'optimal' },
  { id: 'ing_legumes_rotis', name: 'Mélange légumes maraîchers (courgette/carotte)', unit: 'kg', unitCost: 3.8, currentStock: 45.0, minThreshold: 15.0, supplierName: 'Maraîcher Mornag', status: 'optimal' },
  { id: 'ing_huile_olive', name: 'Huile d olive extra vierge pressée à froid', unit: 'L', unitCost: 22.0, currentStock: 50.0, minThreshold: 15.0, supplierName: 'Huilerie du Sahel', status: 'optimal' },
  { id: 'ing_epices', name: 'Mélange d herbes et épices maison', unit: 'kg', unitCost: 35.0, currentStock: 8.5, minThreshold: 3.0, supplierName: 'Souk El Grana Épices', status: 'optimal' }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_grill_poulet',
    productId: 'prod_grill_1',
    productName: 'Blanc de Poulet Mariné aux Herbes & Légumes Rôtis',
    ingredients: [
      { ingredientId: 'ing_poulet', ingredientName: 'Blanc de poulet fermier', quantity: 0.25, unit: 'kg' },
      { ingredientId: 'ing_legumes_rotis', ingredientName: 'Légumes maraîchers', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing_huile_olive', ingredientName: 'Huile d olive extra vierge', quantity: 0.01, unit: 'L' },
      { ingredientId: 'ing_epices', ingredientName: 'Épices et herbes', quantity: 0.005, unit: 'kg' }
    ]
  },
  {
    id: 'rec_healthy_saumon',
    productId: 'prod_healthy_1',
    productName: 'Bowl Saumon Sauvage & Quinoa Énergie',
    ingredients: [
      { ingredientId: 'ing_saumon', ingredientName: 'Filet de saumon atlantique', quantity: 0.18, unit: 'kg' },
      { ingredientId: 'ing_quinoa', ingredientName: 'Quinoa royal bio', quantity: 0.1, unit: 'kg' },
      { ingredientId: 'ing_avocat', ingredientName: 'Avocat Hass', quantity: 0.5, unit: 'pièce' },
      { ingredientId: 'ing_huile_olive', ingredientName: 'Huile d olive', quantity: 0.008, unit: 'L' }
    ]
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'veh_1', type: 'Scooter', licensePlate: '245-TUN-8812', model: 'Yamaha NMAX 125', assignedDriverId: 'user_driver_1', assignedDriverName: 'Ahmed Ben Salah', status: 'active' },
  { id: 'veh_2', type: 'Moto', licensePlate: '198-TUN-4450', model: 'Honda CB125F', assignedDriverId: 'user_driver_2', assignedDriverName: 'Youssef Trabelsi', status: 'active' },
  { id: 'veh_3', type: 'Voiture', licensePlate: '210-TUN-9931', model: 'Renault Clio 5 (Livraisons packs)', status: 'active' }
];

export const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: 'drv_1',
    userId: 'user_driver_1',
    name: 'Ahmed Ben Salah',
    phone: '0021698111222',
    vehicleId: 'veh_1',
    vehicleModel: 'Yamaha NMAX 125',
    vehiclePlate: '245-TUN-8812',
    status: 'busy',
    activeOrderId: 'ord_active_delivering',
    completedDeliveriesToday: 7,
    collectedAmountToday: 184.5,
    currentLocation: {
      latitude: 36.8375,
      longitude: 10.1832,
      accuracy: 9,
      heading: 42,
      speed: 28.5,
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'drv_2',
    userId: 'user_driver_2',
    name: 'Youssef Trabelsi',
    phone: '0021698333444',
    vehicleId: 'veh_2',
    vehicleModel: 'Honda CB125F',
    vehiclePlate: '198-TUN-4450',
    status: 'available',
    completedDeliveriesToday: 5,
    collectedAmountToday: 122.0
  }
];

// Kitchen/Bebba Central coordinates in Tunis (e.g. Les Berges du Lac 2 / Centre Urbain Nord)
export const RESTAURANT_COORDINATES = {
  latitude: 36.8485,
  longitude: 10.2185,
  address: 'Cuisine Centrale BEBBA, Rue du Lac Biwa, Les Berges du Lac 2, Tunis'
};

export const INITIAL_ORDERS: Order[] = [
  // 1. Order currently delivering with live GPS!
  {
    id: 'ord_active_delivering',
    orderNumber: 'BEBBA-2026-1042',
    clientId: 'user_client_1',
    clientName: 'Sarra Mansour',
    clientPhone: '0021698765432',
    deliveryAddress: '14 Rue de la Liberté, Résidence Ennasr, El Menzah 6',
    deliveryCity: 'Tunis',
    deliveryLat: 36.8398,
    deliveryLng: 10.1654,
    deliveryNotes: '2ème étage, interphone 14. Merci d appeler en arrivant.',
    items: [
      {
        id: 'item_1',
        productId: 'prod_healthy_1',
        productName: 'Bowl Saumon Sauvage & Quinoa Énergie',
        productImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        unitPrice: 28.5,
        quantity: 1,
        selectedOptions: [
          { optionId: 'opt_extra_avocado', name: 'Demi-avocat supplémentaire', priceDelta: 4.0 }
        ],
        itemTotal: 32.5
      },
      {
        id: 'item_2',
        productId: 'prod_juice_1',
        productName: 'Green Booster Détox (350ml)',
        productImage: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
        unitPrice: 8.5,
        quantity: 1,
        selectedOptions: [],
        itemTotal: 8.5
      }
    ],
    subtotal: 41.0,
    deliveryFee: 5.0,
    totalAmount: 46.0,
    orderStatus: 'delivering',
    paymentStatus: 'to_collect',
    assignedDriverId: 'user_driver_1',
    assignedDriverName: 'Ahmed Ben Salah',
    assignedDriverPhone: '0021698111222',
    assignedVehicle: 'Yamaha NMAX 125 (245-TUN-8812)',
    trackingToken: 'AB7K92QX',
    currentLocation: {
      latitude: 36.8375,
      longitude: 10.1832,
      accuracy: 8,
      heading: 75,
      speed: 32.0,
      timestamp: new Date().toISOString()
    },
    locationHistory: [
      { latitude: 36.8485, longitude: 10.2185, timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
      { latitude: 36.8450, longitude: 10.2050, timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
      { latitude: 36.8410, longitude: 10.1920, timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
      { latitude: 36.8375, longitude: 10.1832, timestamp: new Date(Date.now() - 10000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10000).toISOString(),
    preparedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 16 * 60000).toISOString()
  },

  // 2. Order in preparation in KDS
  {
    id: 'ord_prep_1',
    orderNumber: 'BEBBA-2026-1043',
    clientId: 'user_client_guest_1',
    clientName: 'Mohamed Ali Gharbi',
    clientPhone: '0021622334455',
    deliveryAddress: 'Avenue Habib Bourguiba, Carthage Présidence',
    deliveryCity: 'Tunis',
    deliveryLat: 36.8580,
    deliveryLng: 10.3290,
    deliveryNotes: 'Villa blanche avec grand portail gris',
    items: [
      {
        id: 'item_3',
        productId: 'prod_grill_1',
        productName: 'Blanc de Poulet Mariné aux Herbes & Légumes Rôtis',
        productImage: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80',
        unitPrice: 24.0,
        quantity: 2,
        selectedOptions: [
          { optionId: 'opt_extra_chicken', name: '+1 Portion Poulet Fermier (120g)', priceDelta: 6.0 }
        ],
        itemTotal: 60.0,
        specialInstructions: 'Bien cuit sans sel excessif s il vous plaît'
      },
      {
        id: 'item_4',
        productId: 'prod_juice_2',
        productName: 'Red Glow Antioxydant (350ml)',
        productImage: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
        unitPrice: 8.5,
        quantity: 1,
        selectedOptions: [],
        itemTotal: 8.5
      }
    ],
    subtotal: 68.5,
    deliveryFee: 6.0,
    totalAmount: 74.5,
    orderStatus: 'preparing',
    paymentStatus: 'to_collect',
    trackingToken: 'CK93L8MP',
    createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    preparedAt: new Date(Date.now() - 10 * 60000).toISOString()
  },

  // 3. Order freshly received (waiting for kitchen to accept)
  {
    id: 'ord_received_1',
    orderNumber: 'BEBBA-2026-1044',
    clientId: 'user_client_guest_2',
    clientName: 'Leila Chaabane',
    clientPhone: '0021650998877',
    deliveryAddress: 'Centre Urbain Nord, Immeuble Horizon 3',
    deliveryCity: 'Tunis',
    deliveryLat: 36.8420,
    deliveryLng: 10.2010,
    items: [
      {
        id: 'item_5',
        productId: 'prod_healthy_2',
        productName: 'Salade Méditerranéenne Detox & Feta AOP',
        productImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
        unitPrice: 21.0,
        quantity: 1,
        selectedOptions: [],
        itemTotal: 21.0
      }
    ],
    subtotal: 21.0,
    deliveryFee: 4.0,
    totalAmount: 25.0,
    orderStatus: 'received',
    paymentStatus: 'to_collect',
    trackingToken: 'TZ48Y1BQ',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60000).toISOString()
  },

  // 4. Order ready in kitchen, waiting for driver assignment
  {
    id: 'ord_ready_1',
    orderNumber: 'BEBBA-2026-1041',
    clientId: 'user_client_1',
    clientName: 'Sarra Mansour',
    clientPhone: '0021698765432',
    deliveryAddress: 'Clinique Pasteur, Bab Saadoun, Tunis',
    deliveryCity: 'Tunis',
    items: [
      {
        id: 'item_6',
        productId: 'prod_kids_1',
        productName: 'Mini Bowl P tits Champions & Purée Carotte Maison',
        productImage: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=400&q=80',
        unitPrice: 14.5,
        quantity: 1,
        selectedOptions: [],
        itemTotal: 14.5
      }
    ],
    subtotal: 14.5,
    deliveryFee: 4.5,
    totalAmount: 19.0,
    orderStatus: 'ready',
    paymentStatus: 'to_collect',
    trackingToken: 'RD88N2KL',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    preparedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 15 * 60000).toISOString()
  },

  // 5. Delivered order with resolved claim
  {
    id: 'ord_delivered_paid_1',
    orderNumber: 'BEBBA-2026-1039',
    clientId: 'user_client_1',
    clientName: 'Sarra Mansour',
    clientPhone: '0021698765432',
    deliveryAddress: '14 Rue de la Liberté, El Menzah 6',
    deliveryCity: 'Tunis',
    items: [
      {
        id: 'item_7',
        productId: 'prod_grill_2',
        productName: 'Brochettes de Filet de Bœuf Maigre & Riz Complet',
        productImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
        unitPrice: 29.5,
        quantity: 1,
        selectedOptions: [],
        itemTotal: 29.5
      }
    ],
    subtotal: 29.5,
    deliveryFee: 5.0,
    totalAmount: 34.5,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paidAt: new Date(Date.now() - 180 * 60000).toISOString(),
    paidBy: 'Ahmed Ben Salah (Livreur)',
    collectedAmount: 34.5,
    assignedDriverId: 'user_driver_1',
    assignedDriverName: 'Ahmed Ben Salah',
    trackingToken: 'DL77W9RT',
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 185 * 60000).toISOString()
  }
];

export const INITIAL_CLAIMS: Claim[] = [
  {
    id: 'claim_1',
    claimNumber: 'REC-2026-00017',
    orderId: 'ord_delivered_paid_1',
    orderNumber: 'BEBBA-2026-1039',
    clientId: 'user_client_1',
    clientName: 'Sarra Mansour',
    clientPhone: '0021698765432',
    type: 'Produit manquant',
    description: 'La salade d accompagnement n était pas présente dans le sac de livraison du plat Brochettes de bœuf.',
    photos: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    ],
    status: 'in_review',
    resolution: 'Avoir',
    resolutionNotes: 'Avoir de 8 DT accordé pour la salade manquante lors de la prochaine commande.',
    messages: [
      {
        id: 'msg_1',
        claimId: 'claim_1',
        senderId: 'user_client_1',
        senderName: 'Sarra Mansour',
        senderRole: 'client',
        message: 'Bonjour, j ai bien reçu la commande BEBBA-2026-1039 mais il manquait l accompagnement de légumes.',
        createdAt: new Date(Date.now() - 150 * 60000).toISOString()
      },
      {
        id: 'msg_2',
        claimId: 'claim_1',
        senderId: 'user_admin_1',
        senderName: 'Bebba Direction',
        senderRole: 'admin',
        message: 'Bonjour Madame Mansour. Toutes nos excuses pour ce désagrément de la part de notre équipe cuisine. Avez-vous une photo du sac reçu ?',
        createdAt: new Date(Date.now() - 120 * 60000).toISOString()
      },
      {
        id: 'msg_3',
        claimId: 'claim_1',
        senderId: 'user_client_1',
        senderName: 'Sarra Mansour',
        senderRole: 'client',
        message: 'Voici la photo de la boîte reçue.',
        attachments: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'],
        createdAt: new Date(Date.now() - 100 * 60000).toISOString()
      },
      {
        id: 'msg_4',
        claimId: 'claim_1',
        senderId: 'user_admin_1',
        senderName: 'Bebba Direction',
        senderRole: 'admin',
        message: 'Merci beaucoup. Nous validons un avoir de 8 DT utilisable immédiatement sur votre prochaine commande avec le code SANTE8.',
        createdAt: new Date(Date.now() - 60 * 60000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60000).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    action: 'COMMANDE_CREEE',
    category: 'order',
    userId: 'user_client_1',
    userName: 'Sarra Mansour',
    userRole: 'client',
    details: 'Création de la commande BEBBA-2026-1042 (Total 46.0 DT COD)',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    id: 'log_2',
    action: 'PREPARATION_DEBUTEE',
    category: 'kitchen',
    userId: 'user_kitchen_1',
    userName: 'Chef Karim',
    userRole: 'kitchen',
    details: 'Début de préparation et déstockage des ingrédients pour BEBBA-2026-1042',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'log_3',
    action: 'COMMANDE_PRETE',
    category: 'kitchen',
    userId: 'user_kitchen_1',
    userName: 'Chef Karim',
    userRole: 'kitchen',
    details: 'Commande BEBBA-2026-1042 marquée PRÊTE en cuisine',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString()
  },
  {
    id: 'log_4',
    action: 'AFFECTATION_LIVREUR',
    category: 'delivery',
    userId: 'user_admin_1',
    userName: 'Bebba Direction',
    userRole: 'admin',
    details: 'Affectation du livreur Ahmed Ben Salah sur BEBBA-2026-1042 (Yamaha NMAX)',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString()
  },
  {
    id: 'log_5',
    action: 'LIVRAISON_DEMARREE',
    category: 'delivery',
    userId: 'user_driver_1',
    userName: 'Ahmed Ben Salah',
    userRole: 'driver',
    details: 'Mission acceptée, départ en livraison et partage GPS activé pour BEBBA-2026-1042',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString()
  }
];
