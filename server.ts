import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ORDERS,
  INITIAL_CLAIMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS
} from './src/data/mockData';
import {
  Order,
  Claim,
  User,
  Product,
  Ingredient,
  Recipe,
  Vehicle,
  DriverProfile,
  AuditLog,
  StockMovement,
  OrderStatus,
  ClaimStatus,
  ClaimResolution,
  Category,
  Supplier,
  SystemNotification,
  AppSettings,
  NotificationType,
  DeliveryZone,
  CashClosingRecord,
  PhysicalInventoryCheck,
  Promotion,
  AIMenuRecipe
} from './src/types';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialisation Client Gemini AI (Server-Side)
const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Initial Delivery Zones (§3, §4)
const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone_lac',
    name: 'Les Berges du Lac 1 & 2',
    active: true,
    deliveryFee: 4.0,
    minOrderAmount: 15.0,
    estimatedMinutes: 25,
    description: 'Lac 1, Lac 2, Berges du Lac - Hub Central BEBBA'
  },
  {
    id: 'zone_marsa',
    name: 'La Marsa, Gammarth & Sidi Bou Saïd',
    active: true,
    deliveryFee: 6.0,
    minOrderAmount: 20.0,
    estimatedMinutes: 35,
    description: 'Banlieue Nord'
  },
  {
    id: 'zone_carthage',
    name: 'Carthage, Le Kram & La Goulette',
    active: true,
    deliveryFee: 5.0,
    minOrderAmount: 20.0,
    estimatedMinutes: 30,
    description: 'Zone côtière historique'
  },
  {
    id: 'zone_menzah',
    name: 'Menzah, Ennasr & Centre Urbain Nord',
    active: true,
    deliveryFee: 5.0,
    minOrderAmount: 20.0,
    estimatedMinutes: 30,
    description: 'Quartiers d affaires et résidences'
  },
  {
    id: 'zone_centre',
    name: 'Tunis Centre, Lafayette & Mutuelleville',
    active: true,
    deliveryFee: 5.0,
    minOrderAmount: 20.0,
    estimatedMinutes: 35,
    description: 'Centre-ville'
  },
  {
    id: 'zone_ariana',
    name: 'Ariana & La Soukra',
    active: true,
    deliveryFee: 6.0,
    minOrderAmount: 25.0,
    estimatedMinutes: 40,
    description: 'Ariana Ville, Soukra'
  }
];

// In-Memory Database with disk persistence
interface DBState {
  users: User[];
  products: Product[];
  categories: Category[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  suppliers: Supplier[];
  vehicles: Vehicle[];
  drivers: DriverProfile[];
  orders: Order[];
  claims: Claim[];
  auditLogs: AuditLog[];
  stockMovements: StockMovement[];
  notifications: SystemNotification[];
  settings: AppSettings;
  deliveryZones: DeliveryZone[];
  cashClosings: CashClosingRecord[];
  inventoryChecks: PhysicalInventoryCheck[];
  promotions: Promotion[];
}

const db: DBState = {
  users: [...INITIAL_USERS],
  products: [...INITIAL_PRODUCTS],
  categories: [...INITIAL_CATEGORIES],
  ingredients: [...INITIAL_INGREDIENTS],
  recipes: [...INITIAL_RECIPES],
  suppliers: [...INITIAL_SUPPLIERS],
  vehicles: [...INITIAL_VEHICLES],
  drivers: [...INITIAL_DRIVERS],
  orders: [...INITIAL_ORDERS],
  claims: [...INITIAL_CLAIMS],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  stockMovements: [],
  notifications: [...INITIAL_NOTIFICATIONS],
  settings: { ...INITIAL_SETTINGS, timezone: 'Africa/Tunis' },
  deliveryZones: [...INITIAL_DELIVERY_ZONES],
  cashClosings: [],
  inventoryChecks: [],
  // Moteur de promotions (§42, §177, §225, §242)
  promotions: [
    {
      id: 'promo_welcome',
      name: 'Offre Bienvenue Santé (10%)',
      code: 'BEBBA10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 20,
      isActive: true,
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'promo_rentree',
      name: 'Remise Rentrée Équilibrée (5 DT)',
      code: 'RENTREE5',
      type: 'fixed',
      value: 5,
      minOrderAmount: 30,
      isActive: true,
      createdAt: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'promo_flash_vip',
      name: 'Avantage Flash Vitalité (5%)',
      code: 'FLASHVIP',
      type: 'percentage',
      value: 5,
      minOrderAmount: 25,
      isActive: true,
      createdAt: '2026-09-15T12:00:00.000Z'
    }
  ] as Promotion[]
};

// SSE Subscribers
interface SSESubscriber {
  id: string;
  res: Response;
  channel?: string;
}
let sseSubscribers: SSESubscriber[] = [];

function broadcast(event: string, data: any, channel?: string) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseSubscribers = sseSubscribers.filter(sub => {
    try {
      if (!channel || !sub.channel || sub.channel === 'all' || sub.channel === channel) {
        sub.res.write(payload);
      }
      return true;
    } catch (e) {
      return false;
    }
  });
}

function logAudit(action: string, category: AuditLog['category'], user: { id: string; name: string; role: any }, details: string, ip?: string, userAgent?: string) {
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    category,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    details,
    ip: ip || '127.0.0.1',
    userAgent: userAgent || 'Bebba-Client',
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  broadcast('audit_log', log);
}

function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  targetRole: any = 'all',
  metadata?: any
) {
  const notif: SystemNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    message,
    targetRole,
    read: false,
    createdAt: new Date().toISOString(),
    metadata
  };
  db.notifications.unshift(notif);
  broadcast('system_notification', notif);
  return notif;
}

function computeRecipeCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, item) => {
    const ing = db.ingredients.find(i => i.id === item.ingredientId);
    const cost = ing ? ing.unitCost : (item.unitCost || 0);
    return sum + (item.quantity * cost);
  }, 0);
}

// Format Tunisian phone number: +216 98 123 456 or 98123456 -> 0021698123456
function normalizeTunisianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00216')) {
    return digits;
  }
  if (digits.startsWith('216') && digits.length >= 11) {
    return `00${digits}`;
  }
  if (digits.length === 8) {
    return `00216${digits}`;
  }
  return digits.length > 0 ? `00216${digits}` : '';
}

// Timezone Africa/Tunis calculation helper (§1.1)
function getAfricaTunisTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('fr-TN', {
    timeZone: 'Africa/Tunis',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const findPart = (t: string) => parts.find(p => p.type === t)?.value || '00';
  const hour = parseInt(findPart('hour'), 10);
  const minute = parseInt(findPart('minute'), 10);
  return {
    dateStr: `${findPart('year')}-${findPart('month')}-${findPart('day')}`,
    timeStr: `${findPart('hour')}:${findPart('minute')}`,
    hour,
    minute,
    formatted: `${findPart('day')}/${findPart('month')}/${findPart('year')} ${findPart('hour')}:${findPart('minute')}:${findPart('second')} (Africa/Tunis)`
  };
}

// Store opening / closing validation (§2)
function isStoreOpenNow(): { isOpen: boolean; message?: string } {
  if (db.settings && db.settings.isStoreOpen === false) {
    return {
      isOpen: false,
      message: 'Le restaurant BEBBA Healthy Food est exceptionnellement fermé par la direction.'
    };
  }

  if (db.settings && db.settings.acceptingOrders === false) {
    return {
      isOpen: false,
      message: 'La prise de commande en ligne est temporairement suspendue par la cuisine BEBBA.'
    };
  }

  const tunis = getAfricaTunisTime();
  const openTime = db.settings?.openingTime || '10:00';
  const closeTime = db.settings?.closingTime || '23:00';
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const currentMinutes = tunis.hour * 60 + tunis.minute;
  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
    return {
      isOpen: false,
      message: `Le restaurant BEBBA est actuellement fermé. Horaires de commande autorisés : ${openTime} à ${closeTime} (Africa/Tunis).`
    };
  }

  return { isOpen: true };
}

// Generate 8-character unique alphanumeric tracking token
function generateTrackingToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Consume recipe ingredients when kitchen begins preparation (Règle #10)
function consumeIngredientsForOrder(order: Order, performedBy: string) {
  // Idempotence stricte (§22, §222, §242) : ne jamais consommer deux fois
  if (order.stockConsumed) {
    return;
  }

  for (const item of order.items) {
    const recipe = db.recipes.find(r => r.productId === item.productId);
    if (!recipe) continue;

    for (const recIng of recipe.ingredients) {
      const ing = db.ingredients.find(i => i.id === recIng.ingredientId);
      if (!ing) continue;

      const totalDeduction = recIng.quantity * item.quantity;
      const before = ing.currentStock;
      ing.currentStock = Math.max(0, parseFloat((ing.currentStock - totalDeduction).toFixed(3)));
      if (ing.currentStock <= ing.minThreshold) {
        ing.status = ing.currentStock === 0 ? 'out_of_stock' : 'low';
        createNotification(
          'STOCK_ALERT',
          `Seuil critique atteint : ${ing.name}`,
          `Stock restant : ${ing.currentStock} ${ing.unit} (seuil min : ${ing.minThreshold} ${ing.unit})`,
          'admin'
        );
      }

      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ingredientId: ing.id,
        ingredientName: ing.name,
        type: 'consumption',
        quantityDelta: -totalDeduction,
        unit: ing.unit,
        beforeQuantity: before,
        afterQuantity: ing.currentStock,
        orderId: order.id,
        reason: `Préparation commande ${order.orderNumber} (${item.quantity}x ${item.productName})`,
        performedBy,
        createdAt: new Date().toISOString()
      };
      db.stockMovements.unshift(movement);
    }
  }

  // Marquer définitivement comme consommé
  order.stockConsumed = true;
}

// Restore recipe ingredients if an order in preparation/ready is cancelled
function restoreIngredientsForCancelledOrder(order: Order, performedBy: string) {
  if (!order.stockConsumed) return; // Rien à restituer si non consommé

  for (const item of order.items) {
    const recipe = db.recipes.find(r => r.productId === item.productId);
    if (!recipe) continue;

    for (const recIng of recipe.ingredients) {
      const ing = db.ingredients.find(i => i.id === recIng.ingredientId);
      if (!ing) continue;

      const totalReturn = recIng.quantity * item.quantity;
      const before = ing.currentStock;
      ing.currentStock = parseFloat((ing.currentStock + totalReturn).toFixed(3));
      if (ing.currentStock > ing.minThreshold) {
        ing.status = 'optimal';
      } else if (ing.currentStock > 0) {
        ing.status = 'low';
      }

      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ingredientId: ing.id,
        ingredientName: ing.name,
        type: 'return',
        quantityDelta: totalReturn,
        unit: ing.unit,
        beforeQuantity: before,
        afterQuantity: ing.currentStock,
        orderId: order.id,
        reason: `Restitution de stock suite à annulation de commande ${order.orderNumber}`,
        performedBy,
        createdAt: new Date().toISOString()
      };
      db.stockMovements.unshift(movement);
    }
  }

  order.stockConsumed = false;
}

// Contrôle de la permission READ ONLY sur les Ingrédients (§24, §54, §142, §219, §243)
function checkIngredientsReadOnly(req: Request, res: Response): boolean {
  const perm = (
    req.headers['x-user-permission'] ||
    req.headers['x-user-role'] ||
    req.query.permission ||
    (req.body && req.body.userPermission) ||
    ''
  ).toString().toLowerCase();

  if (perm === 'read_only' || perm === 'readonly') {
    res.status(403).json({
      error: 'Action refusée : Vous disposez de la permission READ ONLY (Lecture Seule) sur les ingrédients. Aucune modification de stock, création, mise à jour ou suppression n\'est autorisée (Règles §24, §54, §142).'
    });
    return true;
  }
  return false;
}

// Moteur de calcul des promotions cumulables (§42, §177, §225, §242)
// Règle #11 : Ordre strict : la plus récente en premier, puis précédente, puis précédente
function applyPromotionsEngine(subtotal: number, promoCodes?: string[]): {
  discountAmount: number;
  promotionsApplied: Array<{ id: string; name: string; code?: string; discount: number; appliedAt: string }>;
  discountedSubtotal: number;
} {
  const codes = (promoCodes || []).map(c => c.trim().toUpperCase());
  // Trier de la plus récente à la plus ancienne (déterministe)
  const sortedActive = [...(db.promotions || [])]
    .filter(p => p.isActive)
    .filter(p => {
      if (codes.length > 0) {
        return p.code && codes.includes(p.code.toUpperCase());
      }
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let running = subtotal;
  let totalDiscount = 0;
  const applied: Array<{ id: string; name: string; code?: string; discount: number; appliedAt: string }> = [];

  for (const promo of sortedActive) {
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      continue;
    }
    let disc = 0;
    if (promo.type === 'percentage') {
      disc = parseFloat(((running * promo.value) / 100).toFixed(2));
    } else if (promo.type === 'fixed') {
      disc = Math.min(running, promo.value);
    }

    if (disc > 0) {
      totalDiscount += disc;
      running = Math.max(0, running - disc);
      applied.push({
        id: promo.id,
        name: promo.name,
        code: promo.code,
        discount: parseFloat(disc.toFixed(2)),
        appliedAt: new Date().toISOString()
      });
    }
  }

  return {
    discountAmount: parseFloat(totalDiscount.toFixed(2)),
    promotionsApplied: applied,
    discountedSubtotal: parseFloat(running.toFixed(2))
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // CORS & Preflight for API
  app.use('/api', (req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // SSE Real-time Endpoint
  app.get('/api/realtime', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = (req.query.channel as string) || 'all';

    const sub: SSESubscriber = { id: subId, res, channel };
    sseSubscribers.push(sub);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ subId, channel, time: Date.now() })}\n\n`);

    req.on('close', () => {
      sseSubscribers = sseSubscribers.filter(s => s.id !== subId);
    });
  });

  // ==========================================
  // AUTH ROUTES
  // ==========================================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, phone, address, city, governorate, email, password } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Le prénom/nom et le téléphone sont obligatoires.' });
    }

    const formattedPhone = normalizeTunisianPhone(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Numéro de téléphone tunisien invalide (+216...)' });
    }

    const existingUser = db.users.find(u => u.phone === formattedPhone);
    if (existingUser) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà associé à un compte client.' });
    }

    const newUser: User = {
      id: `user_client_${Date.now()}`,
      name: name.trim(),
      email: email ? email.trim() : undefined,
      phone: formattedPhone,
      rawPhone: phone.trim(),
      role: 'client',
      address: address ? address.trim() : undefined,
      city: city || 'Tunis',
      governorate: governorate || 'Tunis',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    logAudit('CLIENT_INSCRIPTION', 'auth', newUser, `Création de compte client (${newUser.phone})`);
    return res.status(201).json({ user: newUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { phoneOrEmail, role } = req.body;

    // Fast role switcher / impersonation for testing
    if (role && !phoneOrEmail) {
      const user = db.users.find(u => u.role === role);
      if (user) {
        return res.json({ user });
      }
    }

    if (!phoneOrEmail) {
      return res.status(400).json({ error: 'Identifiant requis.' });
    }

    const searchInput = phoneOrEmail.trim().toLowerCase();
    const normalizedPhone = normalizeTunisianPhone(phoneOrEmail);

    const user = db.users.find(
      u => (normalizedPhone && u.phone === normalizedPhone) || (u.email && u.email.toLowerCase() === searchInput)
    );

    if (!user) {
      return res.status(404).json({ error: 'Aucun utilisateur trouvé avec ce numéro ou cet email.' });
    }

    return res.json({ user });
  });

  app.get('/api/auth/users', (req: Request, res: Response) => {
    return res.json({ users: db.users });
  });

  // ==========================================
  // CATEGORIES & CATALOG ROUTES
  // ==========================================
  app.get('/api/categories', (req: Request, res: Response) => {
    return res.json({ categories: db.categories });
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const { name, description, displayOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom de la catégorie est requis' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      slug,
      description: description || '',
      displayOrder: parseInt(displayOrder) || (db.categories.length + 1),
      isActive: true
    };
    db.categories.push(newCategory);
    logAudit('CATEGORIE_CREEE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Création catégorie ${newCategory.name}`);
    broadcast('category_updated', newCategory);
    return res.status(201).json({ category: newCategory });
  });

  app.put('/api/categories/:id', (req: Request, res: Response) => {
    const cat = db.categories.find(c => c.id === req.params.id);
    if (!cat) return res.status(404).json({ error: 'Catégorie introuvable' });

    const { name, description, displayOrder, isActive } = req.body;
    if (name) cat.name = name.trim();
    if (description !== undefined) cat.description = description;
    if (displayOrder !== undefined) cat.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) cat.isActive = Boolean(isActive);

    broadcast('category_updated', cat);
    return res.json({ category: cat });
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const index = db.categories.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Catégorie introuvable' });

    const [deleted] = db.categories.splice(index, 1);
    broadcast('category_deleted', deleted);
    return res.json({ success: true, category: deleted });
  });

  // ==========================================
  // PRODUCTS & OPTIONS ROUTES
  // ==========================================
  app.get('/api/products', (req: Request, res: Response) => {
    return res.json({ products: db.products });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const { name, description, category, basePrice, image, calories, protein, carbs, fat, availableOptions, recipeId } = req.body;
    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({ error: 'Champs requis manquants pour le produit.' });
    }

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      description: description || '',
      category,
      basePrice: parseFloat(basePrice),
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      calories: parseInt(calories) || 400,
      protein: parseInt(protein) || 25,
      carbs: parseInt(carbs) || 30,
      fat: parseInt(fat) || 12,
      isAvailable: true,
      availableOptions: availableOptions || [],
      recipeId
    };

    db.products.push(newProd);
    logAudit('PRODUIT_CREE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouveau produit : ${newProd.name} (${newProd.basePrice} DT)`);
    broadcast('product_updated', newProd);
    return res.status(201).json({ product: newProd });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produit introuvable' });

    const { name, description, category, basePrice, image, calories, protein, carbs, fat, isAvailable, availableOptions, recipeId } = req.body;
    if (name) prod.name = name.trim();
    if (description !== undefined) prod.description = description;
    if (category) prod.category = category;
    if (basePrice !== undefined) prod.basePrice = parseFloat(basePrice);
    if (image) prod.image = image;
    if (calories !== undefined) prod.calories = parseInt(calories);
    if (protein !== undefined) prod.protein = parseInt(protein);
    if (carbs !== undefined) prod.carbs = parseInt(carbs);
    if (fat !== undefined) prod.fat = parseInt(fat);
    if (isAvailable !== undefined) prod.isAvailable = Boolean(isAvailable);
    if (availableOptions !== undefined) prod.availableOptions = availableOptions;
    if (recipeId !== undefined) prod.recipeId = recipeId;

    logAudit('PRODUIT_MODIFIE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Modification produit : ${prod.name}`);
    broadcast('product_updated', prod);
    return res.json({ product: prod });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produit introuvable' });

    // Soft delete by marking unavailable as per §79
    prod.isAvailable = false;
    logAudit('PRODUIT_DESACTIVE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Désactivation produit : ${prod.name}`);
    broadcast('product_updated', prod);
    return res.json({ success: true, product: prod });
  });

  // ==========================================
  // USERS & ROLES MANAGEMENT ROUTES (§2, §3, §25, §57, §60)
  // ==========================================
  app.get('/api/users', (req: Request, res: Response) => {
    return res.json({ users: db.users });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { name, email, phone, role, address, city, governorate } = req.body;
    if (!name || !phone || !role) {
      return res.status(400).json({ error: 'Le nom, téléphone et rôle sont obligatoires.' });
    }

    const formattedPhone = normalizeTunisianPhone(phone);
    const existing = db.users.find(u => u.phone === formattedPhone);
    if (existing) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé.' });
    }

    const newUser: User = {
      id: `user_${role}_${Date.now()}`,
      name: name.trim(),
      email: email ? email.trim() : undefined,
      phone: formattedPhone,
      rawPhone: phone.trim(),
      role,
      address: address ? address.trim() : undefined,
      city: city || 'Tunis',
      governorate: governorate || 'Tunis',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // If driver, also create driver profile
    if (role === 'driver') {
      const newDriver: DriverProfile = {
        id: `drv_${Date.now()}`,
        userId: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        status: 'available',
        completedDeliveriesToday: 0,
        collectedAmountToday: 0
      };
      db.drivers.push(newDriver);
    }

    logAudit('UTILISATEUR_CREE', 'system', { id: 'admin', name: 'Super Admin', role: 'admin' }, `Création utilisateur : ${newUser.name} (${newUser.role})`);
    broadcast('user_created', newUser);
    return res.status(201).json({ user: newUser });
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const { name, email, phone, role, status, address, city, governorate } = req.body;
    if (name) user.name = name.trim();
    if (email !== undefined) user.email = email.trim();
    if (phone) {
      user.phone = normalizeTunisianPhone(phone);
      user.rawPhone = phone;
    }
    if (role) user.role = role;
    if (status) user.status = status;
    if (address !== undefined) user.address = address;
    if (city) user.city = city;
    if (governorate) user.governorate = governorate;

    // Sync DriverProfile if driver
    const driver = db.drivers.find(d => d.userId === user.id);
    if (driver) {
      if (name) driver.name = user.name;
      if (phone) driver.phone = user.phone;
      if (status === 'inactive' || status === 'suspended') driver.status = 'inactive';
      else if (status === 'active' && (driver.status === 'inactive' || driver.status === 'suspended')) driver.status = 'available';
    }

    logAudit('UTILISATEUR_MODIFIE', 'system', { id: 'admin', name: 'Super Admin', role: 'admin' }, `Modification utilisateur : ${user.name} (Rôle: ${user.role}, Statut: ${user.status})`);
    broadcast('user_updated', user);
    return res.json({ user });
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Soft delete / deactivate as per §79
    user.status = 'inactive';
    const driver = db.drivers.find(d => d.userId === user.id);
    if (driver) {
      driver.status = 'inactive';
      if (driver.vehicleId) {
        const v = db.vehicles.find(veh => veh.id === driver.vehicleId);
        if (v) {
          v.assignedDriverId = undefined;
          v.assignedDriverName = undefined;
          if (v.status === 'ASSIGNED') v.status = 'AVAILABLE';
        }
        driver.vehicleId = undefined;
        driver.vehicleModel = undefined;
        driver.vehiclePlate = undefined;
      }
    }
    logAudit('UTILISATEUR_DESACTIVE', 'system', { id: 'admin', name: 'Super Admin', role: 'admin' }, `Désactivation de l utilisateur : ${user.name}`);
    broadcast('user_updated', user);
    return res.json({ success: true, user });
  });

  // ==========================================
  // CLIENTS MANAGEMENT ROUTES (§12)
  // ==========================================
  app.get('/api/clients', (req: Request, res: Response) => {
    const clients = db.users
      .filter(u => u.role === 'client')
      .map(u => {
        const userOrders = db.orders.filter(o => o.clientId === u.id || o.clientPhone === u.phone);
        const totalSpent = userOrders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((s, o) => s + (o.collectedAmount || o.totalAmount), 0);
        const activeOrdersCount = userOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
        const claimsCount = db.claims.filter(c => c.clientId === u.id || c.clientPhone === u.phone).length;

        return {
          ...u,
          totalOrders: userOrders.length,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          activeOrdersCount,
          claimsCount,
          status: u.status || 'active'
        };
      });

    return res.json({ clients });
  });

  app.get('/api/clients/:id', (req: Request, res: Response) => {
    const user = db.users.find(u => u.id === req.params.id && u.role === 'client');
    if (!user) return res.status(404).json({ error: 'Client introuvable' });

    const userOrders = db.orders.filter(o => o.clientId === user.id || o.clientPhone === user.phone);
    const userClaims = db.claims.filter(c => c.clientId === user.id || c.clientPhone === user.phone);
    const totalSpent = userOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((s, o) => s + (o.collectedAmount || o.totalAmount), 0);

    return res.json({
      client: {
        ...user,
        totalOrders: userOrders.length,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        activeOrdersCount: userOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length,
        claimsCount: userClaims.length,
        orders: userOrders,
        claims: userClaims
      }
    });
  });

  app.patch('/api/clients/:id/status', (req: Request, res: Response) => {
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const { status, adminName } = req.body;
    user.status = status;
    logAudit('CLIENT_STATUT_MODIFIE', 'auth', { id: 'admin', name: adminName || 'Admin', role: 'admin' }, `Statut du client ${user.name} modifié en ${status}`);
    return res.json({ user });
  });

  // ==========================================
  // ORDERS MANAGEMENT ROUTES
  // ==========================================
  app.get('/api/orders', (req: Request, res: Response) => {
    const { clientId, driverId, status } = req.query;

    let orders = [...db.orders];
    if (clientId) {
      orders = orders.filter(o => o.clientId === clientId);
    }
    if (driverId) {
      orders = orders.filter(o => o.assignedDriverId === driverId);
    }
    if (status) {
      orders = orders.filter(o => o.orderStatus === status);
    }

    // Sort by recent first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ orders });
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    return res.json({ order });
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    // 1. Verify restaurant opening status (§2)
    const storeCheck = isStoreOpenNow();
    if (!storeCheck.isOpen) {
      return res.status(403).json({ error: storeCheck.message });
    }

    const {
      clientId,
      clientName,
      clientPhone,
      deliveryAddress,
      deliveryCity,
      deliveryNotes,
      deliveryLat,
      deliveryLng,
      deliveryZoneId,
      items
    } = req.body;

    if (!clientName || !clientPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Informations de livraison et panier obligatoires.' });
    }

    const formattedPhone = normalizeTunisianPhone(clientPhone);

    // SERVER-SIDE TRUTH FOR PRICING (§20, §21, §22)
    let subtotal = 0;
    const validatedItems = items.map((rawItem: any, index: number) => {
      const product = db.products.find(p => p.id === rawItem.productId);
      const unitBasePrice = product ? product.basePrice : (rawItem.unitPrice || 20);
      const qty = Math.max(1, parseInt(rawItem.quantity) || 1);

      let optionsDelta = 0;
      const validatedOptions = (rawItem.selectedOptions || []).map((opt: any) => {
        let delta = 0;
        if (product) {
          const matchedOpt = product.availableOptions.find(o => o.id === opt.optionId);
          if (matchedOpt) delta = matchedOpt.priceDelta;
        } else {
          delta = opt.priceDelta || 0;
        }
        optionsDelta += delta;
        return {
          optionId: opt.optionId,
          name: opt.name,
          priceDelta: delta
        };
      });

      const itemTotal = (unitBasePrice + optionsDelta) * qty;
      subtotal += itemTotal;

      // Preserve snapshot as per §11
      return {
        id: `item_${Date.now()}_${index}`,
        productId: product ? product.id : rawItem.productId,
        productName: product ? product.name : rawItem.productName,
        productImage: product ? product.image : (rawItem.productImage || ''),
        unitPrice: unitBasePrice,
        quantity: qty,
        selectedOptions: validatedOptions,
        itemTotal: parseFloat(itemTotal.toFixed(2)),
        specialInstructions: rawItem.specialInstructions ? rawItem.specialInstructions.trim() : undefined,
        recipeVersion: product?.recipeId ? 'v1.0' : undefined
      };
    });

    // 2. Zone matching & Minimum order amount (§3, §4)
    let matchedZone = db.deliveryZones.find(z => z.id === deliveryZoneId);
    if (!matchedZone) {
      const addrCombined = `${deliveryAddress} ${deliveryCity || ''}`.toLowerCase();
      matchedZone = db.deliveryZones.find(z =>
        addrCombined.includes(z.name.toLowerCase()) ||
        (z.id === 'zone_lac' && (addrCombined.includes('lac') || addrCombined.includes('berges'))) ||
        (z.id === 'zone_marsa' && (addrCombined.includes('marsa') || addrCombined.includes('gammarth') || addrCombined.includes('sidi bou'))) ||
        (z.id === 'zone_carthage' && (addrCombined.includes('carthage') || addrCombined.includes('kram') || addrCombined.includes('goulette'))) ||
        (z.id === 'zone_menzah' && (addrCombined.includes('menzah') || addrCombined.includes('ennasr') || addrCombined.includes('urbain'))) ||
        (z.id === 'zone_centre' && (addrCombined.includes('centre') || addrCombined.includes('lafayette') || addrCombined.includes('mutuelle'))) ||
        (z.id === 'zone_ariana' && (addrCombined.includes('ariana') || addrCombined.includes('soukra')))
      );
    }

    if (!matchedZone) {
      matchedZone = db.deliveryZones[0]; // Default to Lac
    }

    if (!matchedZone.active) {
      return res.status(400).json({ error: `La zone de livraison ${matchedZone.name} est temporairement fermée.` });
    }

    // Minimum order check (§4)
    if (subtotal < matchedZone.minOrderAmount) {
      return res.status(400).json({
        error: `Montant minimum non atteint : ${matchedZone.minOrderAmount.toFixed(2)} DT requis pour ${matchedZone.name} (Panier actuel : ${subtotal.toFixed(2)} DT).`
      });
    }

    // Free delivery threshold check
    const freeDeliveryThreshold = db.settings?.freeDeliveryThreshold || 50.0;

    // Promotions calculation (§42, §177, §225, §242 - Règle #11 : plus récente à plus ancienne)
    const promoCodes = req.body.promoCodes || (req.body.promoCode ? [req.body.promoCode] : []);
    const promoCalc = applyPromotionsEngine(subtotal, promoCodes);
    const effectiveSubtotal = promoCalc.discountedSubtotal;

    const deliveryFee = effectiveSubtotal >= freeDeliveryThreshold ? 0.0 : matchedZone.deliveryFee;
    const totalAmount = parseFloat((effectiveSubtotal + deliveryFee).toFixed(2));
    const orderNumber = `BEBBA-2026-${1000 + db.orders.length + 1}`;
    const trackingToken = generateTrackingToken();

    // ETA calculation (§5)
    const prepMinutes = 20;
    const transitMinutes = matchedZone.estimatedMinutes || 25;
    const estimatedDeliveryTime = new Date(Date.now() + (prepMinutes + transitMinutes) * 60000).toISOString();

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      clientId: clientId || `guest_${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: formattedPhone,
      deliveryAddress: deliveryAddress.trim(),
      deliveryCity: deliveryCity || matchedZone.name,
      deliveryLat: deliveryLat || 36.8385,
      deliveryLng: deliveryLng || 10.1654,
      deliveryNotes: deliveryNotes ? deliveryNotes.trim() : undefined,
      deliveryZoneId: matchedZone.id,
      deliveryZoneName: matchedZone.name,
      estimatedDeliveryTime,
      priority: 'normal',
      items: validatedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: promoCalc.discountAmount,
      promotionsApplied: promoCalc.promotionsApplied,
      deliveryFee,
      totalAmount,
      orderStatus: 'received',
      paymentStatus: 'to_collect',
      trackingToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.unshift(newOrder);

    logAudit('COMMANDE_CREEE', 'order', {
      id: newOrder.clientId || 'guest',
      name: newOrder.clientName,
      role: 'client'
    }, `Création commande ${orderNumber} - Zone: ${matchedZone.name} - Montant total: ${totalAmount} DT (COD)`);

    broadcast('order_created', newOrder);
    return res.status(201).json({ order: newOrder });
  });

  // State transitions with strict backend rules & KDS duration timestamps (§28, §29)
  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { nextStatus, performedByUserId, performedByName, performedByRole } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const currentStatus = order.orderStatus;
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      received: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['waiting_for_driver', 'delivering'],
      waiting_for_driver: ['delivering', 'cancelled'],
      delivering: ['delivered'],
      delivered: [],
      cancelled: []
    };

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      return res.status(400).json({
        error: `Transition invalide de "${currentStatus}" vers "${nextStatus}".`
      });
    }

    const now = new Date().toISOString();
    order.orderStatus = nextStatus;
    order.updatedAt = now;

    const userRef = {
      id: performedByUserId || 'system',
      name: performedByName || 'Personnel Bebba',
      role: performedByRole || 'admin'
    };

    if (nextStatus === 'preparing') {
      order.preparedAt = now;
      order.prepStartedAt = now;
      // Auto consume recipe ingredients from stock transactionally! (Règle #10)
      if (!order.stockConsumed) {
        consumeIngredientsForOrder(order, userRef.name);
        logAudit('CUISINE_PREPARATION', 'kitchen', userRef, `Début préparation & déstockage ingrédients pour ${order.orderNumber}`);
      } else {
        logAudit('CUISINE_PREPARATION', 'kitchen', userRef, `Début préparation pour ${order.orderNumber} (stock déjà consommé - protection idempotence)`);
      }
    } else if (nextStatus === 'ready') {
      order.readyAt = now;
      order.prepCompletedAt = now;
      logAudit('COMMANDE_PRETE', 'kitchen', userRef, `Commande ${order.orderNumber} prête pour expédition`);
    } else if (nextStatus === 'delivering') {
      // Driver started delivery
      if (!order.currentLocation) {
        order.currentLocation = {
          latitude: 36.8485,
          longitude: 10.2185,
          accuracy: 10,
          heading: 0,
          speed: 0,
          timestamp: now
        };
      }
      logAudit('LIVRAISON_DEMARREE', 'delivery', userRef, `Départ livraison et activation GPS pour ${order.orderNumber}`);
    } else if (nextStatus === 'delivered') {
      order.deliveredAt = now;
      logAudit('COMMANDE_LIVREE', 'delivery', userRef, `Commande ${order.orderNumber} remise au client`);
    }

    broadcast('order_status_updated', order);
    return res.json({ order });
  });

  // Modify Order Priority (§6)
  app.patch('/api/orders/:id/priority', (req: Request, res: Response) => {
    const { id } = req.params;
    const { priority, reason, adminName } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Le motif de modification de priorité est obligatoire (§6).' });
    }

    const oldPriority = order.priority || 'normal';
    order.priority = priority;
    order.priorityReason = reason.trim();
    order.updatedAt = new Date().toISOString();

    logAudit(
      'PRIORITE_COMMANDE_MODIFIEE',
      'order',
      { id: 'admin', name: adminName || 'Admin', role: 'admin' },
      `Priorité commande ${order.orderNumber} changée de [${oldPriority}] à [${priority}]. Motif : ${reason.trim()}`
    );

    broadcast('order_status_updated', order);
    return res.json({ order });
  });

  // Assign or reassign driver
  app.post('/api/orders/:id/assign-driver', (req: Request, res: Response) => {
    const { id } = req.params;
    const { driverId, performedByUserId, performedByName } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const driver = db.drivers.find(d => d.id === driverId || d.userId === driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }

    const isReassignment = !!order.assignedDriverId;
    order.assignedDriverId = driver.userId;
    order.assignedDriverName = driver.name;
    order.assignedDriverPhone = driver.phone;
    order.assignedVehicle = driver.vehicleModel ? `${driver.vehicleModel} (${driver.vehiclePlate})` : 'Véhicule flotte Bebba';
    order.updatedAt = new Date().toISOString();

    if (order.orderStatus === 'ready') {
      order.orderStatus = 'waiting_for_driver';
    }

    driver.status = 'busy';
    driver.activeOrderId = order.id;

    logAudit(
      isReassignment ? 'REAFFECTATION_LIVREUR' : 'AFFECTATION_LIVREUR',
      'delivery',
      { id: performedByUserId || 'admin', name: performedByName || 'Admin', role: 'admin' },
      `${isReassignment ? 'Réaffectation' : 'Affectation'} du livreur ${driver.name} pour ${order.orderNumber}`
    );

    broadcast('order_driver_assigned', order);
    createNotification(
      'DRIVER_ASSIGNED',
      isReassignment ? 'Livreur réaffecté' : 'Livreur affecté',
      `Le livreur ${driver.name} a été assigné à la commande ${order.orderNumber}`,
      'driver',
      { orderId: order.id, driverId: driver.userId }
    );
    return res.json({ order });
  });

  // Reassignment with complete audit trail as per §8
  app.post('/api/orders/:id/reassign', (req: Request, res: Response) => {
    const { id } = req.params;
    const { newDriverId, reason, adminId, adminName } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const newDriver = db.drivers.find(d => d.id === newDriverId || d.userId === newDriverId);
    if (!newDriver) return res.status(404).json({ error: 'Nouveau livreur non trouvé' });

    const oldDriverId = order.assignedDriverId || 'none';
    const oldDriverName = order.assignedDriverName || 'Non assigné';

    // Free up old driver
    if (order.assignedDriverId) {
      const oldDriver = db.drivers.find(d => d.userId === order.assignedDriverId);
      if (oldDriver && oldDriver.activeOrderId === order.id) {
        oldDriver.status = 'available';
        oldDriver.activeOrderId = undefined;
      }
    }

    if (!order.reassignmentHistory) order.reassignmentHistory = [];
    order.reassignmentHistory.push({
      oldDriverId,
      oldDriverName,
      newDriverId: newDriver.userId,
      newDriverName: newDriver.name,
      reassignedBy: adminName || 'Admin',
      reassignedAt: new Date().toISOString()
    });

    order.assignedDriverId = newDriver.userId;
    order.assignedDriverName = newDriver.name;
    order.assignedDriverPhone = newDriver.phone;
    order.assignedVehicle = newDriver.vehicleModel ? `${newDriver.vehicleModel} (${newDriver.vehiclePlate})` : 'Flotte Bebba';
    order.updatedAt = new Date().toISOString();

    newDriver.status = 'busy';
    newDriver.activeOrderId = order.id;

    logAudit(
      'REAFFECTATION_LIVREUR',
      'delivery',
      { id: adminId || 'admin', name: adminName || 'Admin', role: 'admin' },
      `Réaffectation de ${order.orderNumber} : de ${oldDriverName} vers ${newDriver.name}. Raison: ${reason || 'Non précisée'}`
    );

    createNotification(
      'DRIVER_ASSIGNED',
      'Réaffectation de course',
      `Vous avez été réaffecté sur la commande ${order.orderNumber}`,
      'driver',
      { orderId: order.id, driverId: newDriver.userId }
    );

    broadcast('order_driver_assigned', order);
    return res.json({ order });
  });

  // Cancel order with stock restitution as per §9
  app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, cancelledByUserId, cancelledByName, cancelledByRole } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({ error: 'Impossible d annuler une commande déjà livrée.' });
    }
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cette commande est déjà annulée.' });
    }

    const previousStatus = order.orderStatus;
    const now = new Date().toISOString();
    order.orderStatus = 'cancelled';
    order.cancelReason = reason || 'Annulation administrative';
    order.cancelledBy = cancelledByName || 'Personnel Bebba';
    order.cancelledAt = now;
    order.updatedAt = now;

    // Release driver if assigned
    if (order.assignedDriverId) {
      const driver = db.drivers.find(d => d.userId === order.assignedDriverId);
      if (driver && driver.activeOrderId === order.id) {
        driver.status = 'available';
        driver.activeOrderId = undefined;
      }
    }

    // Restitute stock if order was in preparation or ready as per §9
    if (previousStatus === 'preparing' || previousStatus === 'ready' || previousStatus === 'waiting_for_driver') {
      restoreIngredientsForCancelledOrder(order, cancelledByName || 'Personnel Bebba');
    }

    logAudit(
      'COMMANDE_ANNULEE',
      'order',
      { id: cancelledByUserId || 'system', name: cancelledByName || 'Admin', role: cancelledByRole || 'admin' },
      `Annulation commande ${order.orderNumber} (statut précédent : ${previousStatus}). Motif : ${order.cancelReason}`
    );

    createNotification(
      'ORDER_CREATED',
      'Commande annulée',
      `La commande ${order.orderNumber} a été annulée (${order.cancelReason})`,
      'all',
      { orderId: order.id }
    );

    broadcast('order_status_updated', order);
    return res.json({ order });
  });

  // Payments overview & list (§28)
  app.get('/api/payments', (req: Request, res: Response) => {
    const payments = db.orders.map(o => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      clientName: o.clientName,
      clientPhone: o.clientPhone,
      totalAmount: o.totalAmount,
      collectedAmount: o.collectedAmount || 0,
      paymentStatus: o.paymentStatus,
      paidAt: o.paidAt,
      paidBy: o.paidBy,
      orderStatus: o.orderStatus,
      driverName: o.assignedDriverName,
      createdAt: o.createdAt
    }));

    const totalExpected = db.orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);
    const totalCollected = db.orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.collectedAmount || o.totalAmount), 0);
    const remainingToCollect = db.orders.filter(o => o.paymentStatus === 'to_collect' && o.orderStatus !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);

    return res.json({
      payments,
      summary: {
        totalExpected: parseFloat(totalExpected.toFixed(2)),
        totalCollected: parseFloat(totalCollected.toFixed(2)),
        remainingToCollect: parseFloat(remainingToCollect.toFixed(2))
      }
    });
  });

  // Confirm Cash On Delivery payment collection
  app.post('/api/orders/:id/collect-payment', (req: Request, res: Response) => {
    const { id } = req.params;
    const { collectedAmount, collectorName, collectorUserId, collectorRole, performedBy } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const role = (collectorRole || (performedBy && performedBy.role) || '').toLowerCase();
    const isDriver = role === 'driver' || (!role && order.assignedDriverId);

    // RÈGLE MÉTIER STRICTE : L'encaissement par le livreur ne doit passer que si la livraison est confirmée (statut "delivered")
    if (isDriver && order.orderStatus !== 'delivered') {
      return res.status(400).json({
        error: 'L\'encaissement par le livreur ne peut être validé que si la livraison est confirmée (statut "Livrée"). Veuillez d\'abord confirmer la livraison au client.'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Cette commande a déjà été encaissée.' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ error: 'Impossible d\'encaisser une commande annulée.' });
    }

    const rawAmount = collectedAmount !== undefined ? collectedAmount : (req.body.amount !== undefined ? req.body.amount : order.totalAmount);
    const amount = parseFloat(rawAmount);
    order.paymentStatus = 'paid';
    order.paidAt = new Date().toISOString();
    order.paidBy = collectorName || (performedBy && performedBy.name) || 'Livreur Bebba';
    order.collectedAmount = amount;
    order.updatedAt = new Date().toISOString();

    // Update driver daily stats
    if (order.assignedDriverId) {
      const driver = db.drivers.find(d => d.userId === order.assignedDriverId);
      if (driver) {
        driver.collectedAmountToday += amount;
        driver.completedDeliveriesToday += 1;
        driver.status = 'available';
        driver.activeOrderId = undefined;
      }
    }

    logAudit('ENCAISSEMENT_CONFIRME', 'delivery', {
      id: collectorUserId || (performedBy && performedBy.id) || 'driver',
      name: collectorName || (performedBy && performedBy.name) || 'Livreur',
      role: collectorRole || (performedBy && performedBy.role) || 'driver'
    }, `Encaissement COD de ${amount} DT pour ${order.orderNumber} (Livraison confirmée)`);

    broadcast('order_payment_collected', order);
    return res.json({ order });
  });

  // ==========================================
  // DRIVER GPS TRANSMISSION & TRACKING
  // ==========================================
  app.post('/api/driver/location', (req: Request, res: Response) => {
    const { orderId, latitude, longitude, accuracy, heading, speed } = req.body;

    const order = db.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.orderStatus !== 'delivering') {
      return res.status(400).json({ error: 'Partage GPS actif uniquement pendant le statut "delivering"' });
    }

    const gpsPoint = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : 10,
      heading: heading !== undefined ? parseFloat(heading) : undefined,
      speed: speed !== undefined ? parseFloat(speed) : undefined,
      timestamp: new Date().toISOString()
    };

    order.currentLocation = gpsPoint;
    if (!order.locationHistory) order.locationHistory = [];
    order.locationHistory.push(gpsPoint);

    // Règle #13 (§35, §163) : Rétention stricte de 72 heures pour l'historique GPS
    const seventyTwoHoursAgo = Date.now() - (72 * 3600 * 1000);
    order.locationHistory = order.locationHistory.filter(
      pt => new Date(pt.timestamp).getTime() >= seventyTwoHoursAgo
    );

    // Also update driver profile
    if (order.assignedDriverId) {
      const driver = db.drivers.find(d => d.userId === order.assignedDriverId);
      if (driver) driver.currentLocation = gpsPoint;
    }

    broadcast('driver_location', { orderId: order.id, location: gpsPoint, trackingToken: order.trackingToken });
    return res.json({ success: true, location: gpsPoint });
  });

  // Public Tracking Endpoint via Token (e.g. /tracking?token=AB7K92QX ou fallback tk_bebba_1047_demo - §20)
  app.get('/api/tracking/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    const cleanToken = token.trim().toUpperCase();
    const order = db.orders.find(
      o => o.trackingToken.toUpperCase() === cleanToken ||
      (cleanToken === 'TK_BEBBA_1047_DEMO' && (o.trackingToken.toLowerCase() === 'tk_bebba_1047_demo' || o.orderStatus === 'delivering' || o.id === 'ord_delivering_1'))
    );
    if (!order) {
      return res.status(404).json({ error: 'Token de suivi invalide ou expiré.' });
    }

    // Confidentiality filter: only expose safe public tracking details
    const isDelivering = order.orderStatus === 'delivering';
    const publicData = {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      clientName: order.clientName,
      deliveryAddress: order.deliveryAddress,
      deliveryCity: order.deliveryCity,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      createdAt: order.createdAt,
      preparedAt: order.preparedAt,
      readyAt: order.readyAt,
      deliveredAt: order.deliveredAt,
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        itemTotal: i.itemTotal,
        selectedOptions: i.selectedOptions
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      driverName: order.assignedDriverName,
      driverVehicle: order.assignedVehicle,
      // GPS position ONLY visible when status = delivering
      currentLocation: isDelivering ? order.currentLocation : null,
      locationHistory: isDelivering ? (order.locationHistory || []) : []
    };

    return res.json({ tracking: publicData });
  });

  // ==========================================
  // CLAIMS & CLAIMS CHAT
  // ==========================================
  app.get('/api/claims', (req: Request, res: Response) => {
    const { clientId, orderId, status } = req.query;
    let claims = [...db.claims];

    if (clientId) {
      claims = claims.filter(c => c.clientId === clientId);
    }
    if (orderId) {
      claims = claims.filter(c => c.orderId === orderId);
    }
    if (status) {
      claims = claims.filter(c => c.status === status);
    }

    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ claims });
  });

  app.get('/api/claims/:id', (req: Request, res: Response) => {
    const claim = db.claims.find(c => c.id === req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Réclamation non trouvée' });
    }
    return res.json({ claim });
  });

  app.post('/api/claims', (req: Request, res: Response) => {
    const { orderId, clientId, clientName, clientPhone, type, description, photos } = req.body;

    const order = db.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande liée introuvable.' });
    }

    // Règle #16 (§38, §138, §224, §242) : Une seule réclamation par commande
    const existingClaim = db.claims.find(c => c.orderId === order.id || c.orderNumber === order.orderNumber);
    if (existingClaim) {
      return res.status(400).json({
        error: `Une réclamation (${existingClaim.claimNumber}) existe déjà pour la commande ${order.orderNumber}. Conformément à la Règle #16, une seule réclamation par commande est autorisée.`
      });
    }

    // Règle #15 (§37, §137, §224, §242) : Délai légal de 3 heures max après confirmation de livraison
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        error: 'Une réclamation ne peut être déposée que pour une commande effectivement livrée (statut "delivered").'
      });
    }

    const deliveredTimestamp = new Date(order.deliveredAt || order.updatedAt).getTime();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    if (Date.now() - deliveredTimestamp > threeHoursMs) {
      return res.status(400).json({
        error: 'Le délai légal de 3 heures après la confirmation de livraison est expiré (Règle #15). Aucune réclamation ne peut plus être enregistrée pour cette commande.'
      });
    }

    const claimNumber = `REC-2026-${String(db.claims.length + 1).padStart(5, '0')}`;
    const newClaim: Claim = {
      id: `claim_${Date.now()}`,
      claimNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientId: clientId || order.clientId || 'guest',
      clientName: clientName || order.clientName,
      clientPhone: clientPhone || order.clientPhone,
      type: type || 'Autre',
      description: description || '',
      photos: Array.isArray(photos) ? photos : [],
      status: 'OPEN',
      messages: [
        {
          id: `msg_${Date.now()}`,
          claimId: `claim_${Date.now()}`,
          senderId: clientId || 'client',
          senderName: clientName || order.clientName,
          senderRole: 'client',
          message: description,
          attachments: Array.isArray(photos) && photos.length > 0 ? photos : undefined,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.claims.unshift(newClaim);

    logAudit('RECLAMATION_CREEE', 'claim', {
      id: newClaim.clientId,
      name: newClaim.clientName,
      role: 'client'
    }, `Nouvelle réclamation ${claimNumber} pour la commande ${order.orderNumber} - Motif: ${type}`);

    broadcast('claim_created', newClaim);
    return res.status(201).json({ claim: newClaim });
  });

  app.patch('/api/claims/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, resolution, resolutionNotes, adminName, adminId } = req.body;

    const claim = db.claims.find(c => c.id === id);
    if (!claim) {
      return res.status(404).json({ error: 'Réclamation non trouvée' });
    }

    const now = new Date().toISOString();
    if (status) {
      const upper = status.toUpperCase();
      if (['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].includes(upper)) {
        claim.status = upper as ClaimStatus;
      } else {
        claim.status = status as ClaimStatus;
      }
    }
    if (resolution) claim.resolution = resolution as ClaimResolution;
    if (resolutionNotes) claim.resolutionNotes = resolutionNotes;
    if (claim.status === 'RESOLVED' || claim.status === 'CLOSED') {
      claim.resolvedAt = now;
      claim.resolvedBy = adminName || 'Bebba Admin';
    }
    claim.updatedAt = now;

    logAudit('RECLAMATION_STATUT', 'claim', {
      id: adminId || 'admin',
      name: adminName || 'Admin',
      role: 'admin'
    }, `Statut réclamation ${claim.claimNumber} passé à ${claim.status} (Résolution: ${resolution || 'N/A'})`);

    broadcast('claim_updated', claim);
    return res.json({ claim });
  });

  app.post('/api/claims/:id/messages', (req: Request, res: Response) => {
    const { id } = req.params;
    const { senderId, senderName, senderRole, message, attachments } = req.body;

    const claim = db.claims.find(c => c.id === id);
    if (!claim) {
      return res.status(404).json({ error: 'Réclamation non trouvée' });
    }

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message ou photo obligatoire.' });
    }

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      claimId: claim.id,
      senderId: senderId || 'user',
      senderName: senderName || 'Utilisateur',
      senderRole: senderRole || 'client',
      message: message ? message.trim() : '',
      attachments: attachments || [],
      createdAt: new Date().toISOString()
    };

    claim.messages.push(newMessage);
    claim.updatedAt = new Date().toISOString();

    if (senderRole === 'client' && (claim.status as any) === 'WAITING_FOR_CUSTOMER') {
      claim.status = 'IN_REVIEW';
    }

    broadcast('claim_message', { claimId: claim.id, message: newMessage });
    return res.status(201).json({ message: newMessage });
  });

  // ==========================================
  // INGREDIENTS & STOCK CRUD (§15, §16, §19, §20, §21)
  // ==========================================
  app.get(['/api/ingredients', '/api/stock/ingredients'], (req: Request, res: Response) => {
    return res.json({ ingredients: db.ingredients });
  });

  app.post(['/api/ingredients', '/api/stock/ingredients'], (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;

    const { name, unit, unitCost, currentStock, minThreshold, supplierId, supplierName } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Le nom et l unité (g, kg, ml, L, pièce) sont obligatoires.' });
    }

    const validUnits = ['g', 'kg', 'ml', 'L', 'pièce'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({ error: `Unité invalide. Doit être l une des suivantes : ${validUnits.join(', ')}` });
    }

    const stockVal = currentStock !== undefined ? parseFloat(currentStock) : 0;
    const threshVal = minThreshold !== undefined ? parseFloat(minThreshold) : 5;

    const newIng: Ingredient = {
      id: `ing_${Date.now()}`,
      name: name.trim(),
      unit,
      unitCost: unitCost !== undefined ? parseFloat(unitCost) : 10,
      currentStock: stockVal,
      minThreshold: threshVal,
      supplierId,
      supplierName: supplierName || 'Fournisseur BEBBA',
      status: stockVal === 0 ? 'out_of_stock' : (stockVal <= threshVal ? 'low' : 'optimal')
    };

    db.ingredients.push(newIng);
    logAudit('INGREDIENT_CREE', 'stock', { id: 'admin', name: 'Admin', role: 'admin' }, `Création ingrédient : ${newIng.name} (${newIng.currentStock} ${newIng.unit})`);
    broadcast('stock_updated', { ingredient: newIng });
    return res.status(201).json({ ingredient: newIng });
  });

  app.put(['/api/ingredients/:id', '/api/stock/ingredients/:id'], (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;

    const ing = db.ingredients.find(i => i.id === req.params.id);
    if (!ing) return res.status(404).json({ error: 'Ingrédient non trouvé' });

    const { name, unit, unitCost, minThreshold, supplierId, supplierName, status } = req.body;
    if (name) ing.name = name.trim();
    if (unit) ing.unit = unit;
    if (unitCost !== undefined) ing.unitCost = parseFloat(unitCost);
    if (minThreshold !== undefined) ing.minThreshold = parseFloat(minThreshold);
    if (supplierId !== undefined) ing.supplierId = supplierId;
    if (supplierName !== undefined) ing.supplierName = supplierName;
    if (status !== undefined) ing.status = status;

    logAudit('INGREDIENT_MODIFIE', 'stock', { id: 'admin', name: 'Admin', role: 'admin' }, `Modification ingrédient : ${ing.name}`);
    broadcast('stock_updated', { ingredient: ing });
    return res.json({ ingredient: ing });
  });

  app.delete(['/api/ingredients/:id', '/api/stock/ingredients/:id'], (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;

    const ing = db.ingredients.find(i => i.id === req.params.id);
    if (!ing) return res.status(404).json({ error: 'Ingrédient non trouvé' });

    // As per §15: deactivate / mark out of stock instead of physical destruction to preserve history
    ing.status = 'out_of_stock';
    logAudit('INGREDIENT_DESACTIVE', 'stock', { id: 'admin', name: 'Admin', role: 'admin' }, `Désactivation ingrédient : ${ing.name}`);
    broadcast('stock_updated', { ingredient: ing });
    return res.json({ success: true, ingredient: ing });
  });

  // Stock movements (RESTOCK, ADJUSTMENT, WASTE, RETURN, etc.)
  app.post('/api/stock/movements', (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;
    const { ingredientId, type, quantityDelta, reason, performedBy, unitCost, supplierName } = req.body;

    const ing = db.ingredients.find(i => i.id === ingredientId);
    if (!ing) {
      return res.status(404).json({ error: 'Ingrédient non trouvé' });
    }

    const delta = parseFloat(quantityDelta);
    if (isNaN(delta)) {
      return res.status(400).json({ error: 'Quantité invalide' });
    }

    const before = ing.currentStock;
    ing.currentStock = Math.max(0, parseFloat((ing.currentStock + delta).toFixed(3)));
    if (ing.currentStock === 0) {
      ing.status = 'out_of_stock';
    } else if (ing.currentStock <= ing.minThreshold) {
      ing.status = 'low';
    } else {
      ing.status = 'optimal';
    }

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      ingredientId: ing.id,
      ingredientName: ing.name,
      type: type || (delta >= 0 ? 'restock' : 'adjustment'),
      quantityDelta: delta,
      unit: ing.unit,
      beforeQuantity: before,
      afterQuantity: ing.currentStock,
      unitCost: unitCost !== undefined ? parseFloat(unitCost) : ing.unitCost,
      supplierName: supplierName || ing.supplierName,
      reason: reason || (delta >= 0 ? 'Réapprovisionnement stock' : 'Ajustement inventaire'),
      performedBy: performedBy || 'Admin Stock',
      createdAt: new Date().toISOString()
    };

    db.stockMovements.unshift(movement);

    logAudit(
      'MOUVEMENT_STOCK',
      'stock',
      { id: 'stock_admin', name: performedBy || 'Admin Stock', role: 'admin' },
      `Mouvement ${movement.type.toUpperCase()} pour ${ing.name} : ${delta > 0 ? '+' : ''}${delta} ${ing.unit} (${before} -> ${ing.currentStock})`
    );

    broadcast('stock_updated', { ingredient: ing, movement });
    return res.status(201).json({ ingredient: ing, movement });
  });

  app.get('/api/stock/movements', (req: Request, res: Response) => {
    return res.json({ movements: db.stockMovements });
  });

  // Enregistrer Pertes et Gaspillage (§33)
  app.post('/api/stock/waste', (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;
    const { ingredientId, quantity, unit, reason, wasteType, performedBy } = req.body;
    const ing = db.ingredients.find(i => i.id === ingredientId);
    if (!ing) return res.status(404).json({ error: 'Ingrédient introuvable' });

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantité de perte invalide' });
    }
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Le motif de la perte/gaspillage est obligatoire (§33).' });
    }

    const before = ing.currentStock;
    ing.currentStock = Math.max(0, parseFloat((ing.currentStock - qty).toFixed(3)));
    if (ing.currentStock === 0) ing.status = 'out_of_stock';
    else if (ing.currentStock <= ing.minThreshold) ing.status = 'low';

    const movement: StockMovement = {
      id: `mov_waste_${Date.now()}`,
      ingredientId: ing.id,
      ingredientName: ing.name,
      type: 'waste',
      quantityDelta: -qty,
      unit: unit || ing.unit,
      beforeQuantity: before,
      afterQuantity: ing.currentStock,
      unitCost: ing.unitCost,
      reason: `[${(wasteType || 'perte').toUpperCase()}] ${reason.trim()}`,
      performedBy: performedBy || 'Responsable Cuisine',
      createdAt: new Date().toISOString()
    };

    db.stockMovements.unshift(movement);

    logAudit(
      'PERTE_STOCK_DECLAREE',
      'stock',
      { id: 'stock_admin', name: performedBy || 'Responsable Cuisine', role: 'admin' },
      `Déclaration de perte pour ${ing.name} : -${qty} ${ing.unit} (Motif: ${reason.trim()})`
    );

    broadcast('stock_updated', { ingredient: ing, movement });
    return res.status(201).json({ success: true, ingredient: ing, movement });
  });

  // Inventaire physique et ajustement de stock (§34)
  app.post('/api/inventory/reconcile', (req: Request, res: Response) => {
    if (checkIngredientsReadOnly(req, res)) return;
    const { countedItems, conductedBy, notes } = req.body;
    if (!countedItems || !Array.isArray(countedItems) || countedItems.length === 0) {
      return res.status(400).json({ error: 'Liste d inventaire compté obligatoire.' });
    }

    const checkItems: any[] = [];
    let totalCostImpact = 0;

    for (const item of countedItems) {
      const ing = db.ingredients.find(i => i.id === item.ingredientId);
      if (!ing) continue;

      const countedStock = parseFloat(item.countedStock);
      if (isNaN(countedStock) || countedStock < 0) continue;

      const theoretical = ing.currentStock;
      const difference = parseFloat((countedStock - theoretical).toFixed(3));
      const costImpact = parseFloat((difference * ing.unitCost).toFixed(2));
      totalCostImpact += costImpact;

      checkItems.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.unit,
        theoreticalStock: theoretical,
        countedStock,
        difference,
        unitCost: ing.unitCost,
        costImpact
      });

      // Apply adjustment movement if there is a discrepancy
      if (difference !== 0) {
        ing.currentStock = countedStock;
        if (ing.currentStock === 0) ing.status = 'out_of_stock';
        else if (ing.currentStock <= ing.minThreshold) ing.status = 'low';
        else ing.status = 'optimal';

        const adjMov: StockMovement = {
          id: `mov_inv_${Date.now()}_${ing.id}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          type: 'adjustment',
          quantityDelta: difference,
          unit: ing.unit,
          beforeQuantity: theoretical,
          afterQuantity: countedStock,
          unitCost: ing.unitCost,
          reason: `Ajustement inventaire physique (${difference > 0 ? '+' : ''}${difference} ${ing.unit})`,
          performedBy: conductedBy || 'Responsable Inventaire',
          createdAt: new Date().toISOString()
        };
        db.stockMovements.unshift(adjMov);
      }
    }

    const checkRecord: PhysicalInventoryCheck = {
      id: `inv_${Date.now()}`,
      date: new Date().toISOString(),
      conductedBy: conductedBy || 'Responsable Inventaire',
      items: checkItems,
      totalCostImpact: parseFloat(totalCostImpact.toFixed(2)),
      status: 'adjusted'
    };

    db.inventoryChecks.unshift(checkRecord);

    logAudit(
      'INVENTAIRE_PHYSIQUE_VALIDE',
      'stock',
      { id: 'stock_admin', name: conductedBy || 'Responsable Inventaire', role: 'admin' },
      `Validation inventaire physique (${checkItems.length} articles vérifiés). Écart financier total : ${totalCostImpact >= 0 ? '+' : ''}${totalCostImpact.toFixed(2)} DT. Notes: ${notes || 'Aucune'}`
    );

    broadcast('inventory_reconciled', checkRecord);
    return res.status(201).json({ success: true, checkRecord });
  });

  // ==========================================
  // RECIPES MANAGEMENT (§17, §18)
  // ==========================================
  app.get(['/api/recipes', '/api/stock/recipes'], (req: Request, res: Response) => {
    const recipesWithCost = db.recipes.map(r => ({
      ...r,
      theoreticalCost: parseFloat(computeRecipeCost(r).toFixed(2))
    }));
    return res.json({ recipes: recipesWithCost });
  });

  app.post(['/api/recipes', '/api/stock/recipes'], (req: Request, res: Response) => {
    const { productId, productName, ingredients } = req.body;
    if (!productId || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Produit et liste d ingrédients obligatoires.' });
    }

    const product = db.products.find(p => p.id === productId);
    const newRecipe: Recipe = {
      id: `rec_${Date.now()}`,
      productId,
      productName: productName || (product ? product.name : 'Produit Bebba'),
      ingredients: ingredients.map((item: any) => {
        const ing = db.ingredients.find(i => i.id === item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          ingredientName: ing ? ing.name : item.ingredientName,
          quantity: parseFloat(item.quantity) || 0,
          unit: ing ? ing.unit : (item.unit || 'g'),
          unitCost: ing ? ing.unitCost : 0
        };
      })
    };

    newRecipe.theoreticalCost = parseFloat(computeRecipeCost(newRecipe).toFixed(2));
    db.recipes.push(newRecipe);

    if (product) {
      product.recipeId = newRecipe.id;
    }

    logAudit('RECETTE_CREEE', 'stock', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouvelle recette pour ${newRecipe.productName} (Coût théorique : ${newRecipe.theoreticalCost} DT)`);
    broadcast('recipe_updated', newRecipe);
    return res.status(201).json({ recipe: newRecipe });
  });

  app.put(['/api/recipes/:id', '/api/stock/recipes/:id'], (req: Request, res: Response) => {
    const recipe = db.recipes.find(r => r.id === req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recette introuvable' });

    const { ingredients, productName } = req.body;
    if (productName) recipe.productName = productName;
    if (ingredients && Array.isArray(ingredients)) {
      recipe.ingredients = ingredients.map((item: any) => {
        const ing = db.ingredients.find(i => i.id === item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          ingredientName: ing ? ing.name : item.ingredientName,
          quantity: parseFloat(item.quantity) || 0,
          unit: ing ? ing.unit : (item.unit || 'g'),
          unitCost: ing ? ing.unitCost : 0
        };
      });
    }

    recipe.theoreticalCost = parseFloat(computeRecipeCost(recipe).toFixed(2));
    logAudit('RECETTE_MODIFIEE', 'stock', { id: 'admin', name: 'Admin', role: 'admin' }, `Mise à jour recette : ${recipe.productName} (Nouveau coût : ${recipe.theoreticalCost} DT)`);
    broadcast('recipe_updated', recipe);
    return res.json({ recipe });
  });

  app.delete(['/api/recipes/:id', '/api/stock/recipes/:id'], (req: Request, res: Response) => {
    const index = db.recipes.findIndex(r => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Recette introuvable' });

    const [deleted] = db.recipes.splice(index, 1);
    return res.json({ success: true, recipe: deleted });
  });

  // ==========================================
  // IA CUISINE : GÉNÉRATEUR DE 20 MENUS HEALTHY (GEMINI 3.8 FLASH)
  // ==========================================
  app.post('/api/ai/recipes/generate', async (req: Request, res: Response) => {
    try {
      const { mode, selectedIngredientIds } = req.body;
      // mode: 'all_stock' | 'selected_ingredients'

      let candidateIngredients: Ingredient[] = [];

      if (mode === 'selected_ingredients' && Array.isArray(selectedIngredientIds) && selectedIngredientIds.length > 0) {
        candidateIngredients = db.ingredients.filter(i => selectedIngredientIds.includes(i.id));
      } else {
        // 'all_stock': tous les ingrédients avec stock > 0 (ou tous si catalogue vide)
        candidateIngredients = db.ingredients.filter(i => i.currentStock > 0);
        if (candidateIngredients.length === 0) {
          candidateIngredients = [...db.ingredients];
        }
      }

      if (candidateIngredients.length === 0) {
        return res.status(400).json({
          error: 'Aucun ingrédient disponible ou sélectionné pour la génération.'
        });
      }

      const ingredientsSummary = candidateIngredients
        .map(i => `- ${i.name} (${i.currentStock} ${i.unit} en stock${i.category ? `, catégorie: ${i.category}` : ''})`)
        .join('\n');

      let generatedRecipes: AIMenuRecipe[] = [];
      let isAIPowered = false;
      let modelUsed = '';

      // Modèles Gemini officiels à essayer en séquence de résilience (avec gestion des pics 503)
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

      if (process.env.GEMINI_API_KEY) {
        const prompt = `Tu es le Chef Nutritionniste exécutif de BEBBA Healthy Food.
Voici les ingrédients actuels disponibles dans nos réserves :
${ingredientsSummary}

Mode sélectionné : ${mode === 'selected_ingredients' ? 'Sélection stricte des ingrédients cochés par le chef' : 'Tout le stock disponible en cuisine'}

Génère un tableau JSON de EXACTEMENT 20 menus et recettes healthy équilibrées qui mettent en valeur ces ingrédients.
Pour chaque recette, utilise cette structure JSON :
- "id": identifiant unique string
- "name": nom attrayant et gastronomique healthy (ex: "Buddha Bowl Vitalité Quinoa & Saumon")
- "tagline": courte phrase percutante valorisant la fraîcheur
- "category": une de ces 6 catégories ("Bowl", "Salade", "Plat chaud", "Wrap & Sandwich", "Soupe & Velouté", "Snack Healthy")
- "prepTimeMinutes": nombre entier (ex: 12)
- "calories": calories estimées (ex: 420)
- "proteinGrams": protéines en grammes (ex: 28)
- "healthBenefits": tableau de 2 ou 3 bienfaits nutritionnels (ex: ["Riche en oméga-3", "Index glycémique bas"])
- "ingredientsUsed": tableau [{"ingredientName": "Nom", "quantityEstimated": "100g", "inStock": true}]
- "chefInstructions": tableau de 3 ou 4 étapes de préparation pour la brigade
- "dietaryTags": tableau de badges (ex: ["Sans gluten", "High protein", "Végétarien"])

Réponds UNIQUEMENT avec le tableau JSON valide de 20 recettes, sans texte introductif.`;

        for (const candidateModel of candidateModels) {
          try {
            console.log(`[IA Recettes] Tentative de génération avec le modèle ${candidateModel}...`);
            const response = await aiClient.models.generateContent({
              model: candidateModel,
              contents: prompt,
              config: {
                systemInstruction: 'Tu es le Chef Nutritionniste de BEBBA Healthy Food. Tu génères exclusivement un tableau JSON strict de 20 recettes diététiques.',
                responseMimeType: 'application/json',
                temperature: 0.6
              }
            });

            const rawText = response.text || '';
            const parsed = JSON.parse(rawText);
            const recipesList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.recipes) ? parsed.recipes : []);

            if (recipesList.length > 0) {
              generatedRecipes = recipesList;
              isAIPowered = true;
              modelUsed = candidateModel;
              console.log(`[IA Recettes] Succès : 20 menus générés avec succès via ${candidateModel}`);
              break;
            }
          } catch (modelErr: any) {
            const errMsg = modelErr?.message || String(modelErr);
            const is503 = errMsg.includes('503') || errMsg.includes('high demand') || modelErr?.status === 'UNAVAILABLE' || modelErr?.code === 503;
            if (is503) {
              console.warn(`[IA Recettes] Modèle ${candidateModel} en pic temporaire de demande (503). Essai du modèle suivant...`);
              await new Promise(resolve => setTimeout(resolve, 600));
            } else {
              console.warn(`[IA Recettes] Notification modèle ${candidateModel}:`, errMsg.slice(0, 150));
            }
          }
        }
      }

      // Si l'IA n'a pas pu être contactée (ou en cas de pic de charge global), compléter avec le moteur nutritionnel BEBBA
      if (generatedRecipes.length < 20) {
        const fallbackRecipes = generateSmartFallbackRecipes(candidateIngredients, mode);
        generatedRecipes = [...generatedRecipes, ...fallbackRecipes].slice(0, 20);
        if (!modelUsed) {
          modelUsed = 'Moteur Nutritionnel BEBBA';
        }
      }

      // Attribuer une image haute définition qui correspond scrupuleusement aux ingrédients et au plat
      const usedPhotoUrls: Record<string, number> = {};
      generatedRecipes = generatedRecipes.map((recipe) => {
        const matchedImage = getAccurateDishImage(
          recipe.category,
          recipe.name,
          recipe.ingredientsUsed?.map(i => i.ingredientName) || [],
          recipe.tagline || '',
          usedPhotoUrls
        );
        usedPhotoUrls[matchedImage] = (usedPhotoUrls[matchedImage] || 0) + 1;
        return {
          ...recipe,
          image: matchedImage
        };
      });

      // Audit log pour la génération de menus
      logAudit(
        'IA_RECETTES_GENEREES',
        'kitchen',
        { id: 'chef', name: 'Chef de Cuisine', role: 'kitchen' },
        `Génération de 20 menus healthy par IA (Mode: ${mode}, Ingrédients analysés: ${candidateIngredients.length}, Moteur: ${modelUsed})`
      );

      return res.json({
        success: true,
        count: generatedRecipes.length,
        isAIPowered,
        modelUsed,
        mode,
        ingredientsAnalyzedCount: candidateIngredients.length,
        recipes: generatedRecipes
      });
    } catch (err: any) {
      console.error('Erreur génération recettes IA :', err);
      return res.status(500).json({ error: err.message || 'Erreur lors de la génération de recettes IA' });
    }
  });

  // Catalogue complet de photographies culinaires professionnelles spécifiques aux plats healthy BEBBA
  interface DishPhotoItem {
    id: string;
    url: string;
    category: string;
    keywords: string[];
  }

  const DISH_PHOTOS_CATALOG: DishPhotoItem[] = [
    // --- 1. SAUMON & POISSONS ---
    {
      id: 'salmon_quinoa_bowl',
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['saumon', 'salmon', 'poke', 'quinoa', 'edamame', 'poisson', 'graines', 'sauvage', 'omega']
    },
    {
      id: 'salmon_grilled_filet',
      url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['saumon grillé', 'pavé de saumon', 'saumon rôti', 'filet saumon', 'saumon à la plancha', 'saumon']
    },
    {
      id: 'white_fish_steamed',
      url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['poisson blanc', 'cabillaud', 'loup', 'daurade', 'poisson', 'vapeur', 'filet de poisson']
    },
    {
      id: 'tuna_salad_bowl',
      url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['thon', 'tuna', 'tataki', 'sesame', 'sésame', 'algues']
    },

    // --- 2. POULET, DINDE & VOLAILLE ---
    {
      id: 'chicken_breast_grilled',
      url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['poulet', 'chicken', 'blanc de poulet', 'poulet grillé', 'poulet mariné', 'volaille', 'fermier']
    },
    {
      id: 'chicken_salad_caesar',
      url: 'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['poulet salade', 'salade poulet', 'salade césar', 'émincé poulet', 'poulet rôti']
    },
    {
      id: 'turkey_steamed_spinach',
      url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['dinde', 'turkey', 'escalope', 'moutarde', 'épinards', 'volaille']
    },

    // --- 3. BOEUF MAIGRE & GRILLADES ---
    {
      id: 'beef_steak_rice',
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['boeuf', 'bœuf', 'beef', 'steak', 'viande', 'brochette', 'filet de bœuf', 'viande maigre', 'riz complet']
    },
    {
      id: 'grilled_meat_veggies',
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['grillade', 'grillé', 'brochettes', 'viande rouge', 'barbecue', 'plancha']
    },

    // --- 4. TOFU, PLANT-BASED & LEGUMINEUSES ---
    {
      id: 'tofu_power_bowl',
      url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['tofu', 'tofu bio', 'tofu grillé', 'patate douce', 'patates douces', 'brocolis', 'soja', 'tahini']
    },
    {
      id: 'quinoa_superfood_bowl',
      url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['quinoa', 'superfood', 'buddha bowl', 'graines de chia', 'avocat', 'vitalité', 'super-aliments']
    },
    {
      id: 'rainbow_avocado_bowl',
      url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['rainbow', 'arc-en-ciel', 'bol', 'radis', 'concombre', 'coloré', 'avocat']
    },
    {
      id: 'falafel_hummus_bowl',
      url: 'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=800&q=80',
      category: 'Bowl',
      keywords: ['falafel', 'pois chiches', 'houmous', 'hummus', 'tahina', 'pois chiche', 'libanais']
    },
    {
      id: 'chickpea_curry_dahl',
      url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['curry', 'curcuma', 'lentilles', 'dahl', 'pois chiches', 'coco', 'mijoté', 'épices']
    },
    {
      id: 'roasted_veggie_skillet',
      url: 'https://images.unsplash.com/photo-1547496502-ffa22d388377?auto=format&fit=crop&w=800&q=80',
      category: 'Plat chaud',
      keywords: ['wok', 'légumes rôtis', 'poêlée', 'vapeur', 'courgettes', 'carottes', 'poivrons', 'sauté', 'skillet']
    },

    // --- 5. SALADES & CRUDITES ---
    {
      id: 'greek_feta_salad',
      url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['feta', 'féta', 'salade grecque', 'olives', 'tomates cerises', 'concombre', 'méditerranéenne', 'origan']
    },
    {
      id: 'crisp_green_salad',
      url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['salade verte', 'croquante', 'épinards', 'roquette', 'vinaigrette', 'pousses', 'détox']
    },
    {
      id: 'walnut_apple_salad',
      url: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['noix', 'grenade', 'pomme', 'salade gourmande', 'crudités', 'fruits secs', 'graines torréfiées']
    },
    {
      id: 'citrus_avocado_salad',
      url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['agrumes', 'pamplemousse', 'orange', 'citron', 'avocat', 'menthe', 'fraîcheur']
    },
    {
      id: 'beetroot_salad',
      url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
      category: 'Salade',
      keywords: ['betterave', 'chèvre', 'pourpre', 'antioxydant', 'racine']
    },

    // --- 6. WRAPS & SANDWICHS ---
    {
      id: 'fresh_veggie_wrap',
      url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
      category: 'Wrap & Sandwich',
      keywords: ['wrap', 'roulé', 'tortilla', 'galette', 'green wrap', 'avocat', 'légumes croquants', 'wrap végétal']
    },
    {
      id: 'chicken_caesar_wrap',
      url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      category: 'Wrap & Sandwich',
      keywords: ['wrap poulet', 'sandwich poulet', 'poulet wrap', 'panini', 'club sandwich']
    },
    {
      id: 'pita_pocket_falafel',
      url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      category: 'Wrap & Sandwich',
      keywords: ['pita', 'pain pita', 'sandwich', 'poche pita', 'garnie']
    },
    {
      id: 'nordic_rye_toast',
      url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
      category: 'Wrap & Sandwich',
      keywords: ['tartine', 'toast', 'pain de seigle', 'toast nordique', 'saumon fumé', 'pain complet', 'seigle']
    },

    // --- 7. SOUPES & VELOUTES ---
    {
      id: 'green_detox_soup',
      url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
      category: 'Soupe & Velouté',
      keywords: ['velouté', 'soupe verte', 'velouté épinards', 'courgette', 'détox', 'poireaux', 'brocoli', 'velouté détox']
    },
    {
      id: 'carrot_ginger_soup',
      url: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80',
      category: 'Soupe & Velouté',
      keywords: ['carotte', 'potiron', 'courge', 'butternut', 'gingembre', 'curcuma', 'velouté orange', 'soupe carottes']
    },
    {
      id: 'spicy_asian_broth',
      url: 'https://images.unsplash.com/photo-1607528971899-2e89e6c0ec69?auto=format&fit=crop&w=800&q=80',
      category: 'Soupe & Velouté',
      keywords: ['bouillon', 'ramen', 'soupe thaï', 'miso', 'nouilles', 'coriandre', 'asiatique']
    },
    {
      id: 'tomato_gazpacho',
      url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
      category: 'Soupe & Velouté',
      keywords: ['tomate', 'gaspacho', 'gazpacho', 'soupe froide', 'basilic', 'velouté tomates']
    },
    {
      id: 'mushroom_cream_soup',
      url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
      category: 'Soupe & Velouté',
      keywords: ['champignon', 'champignons', 'velouté champignons', 'crème', 'forestier']
    },

    // --- 8. SNACKS & DESSERTS HEALTHY ---
    {
      id: 'avocado_seed_toast',
      url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80',
      category: 'Snack Healthy',
      keywords: ['avocado toast', 'tartine avocat', 'pain grillé', 'graines de courge', 'snack', 'toast', 'énergie']
    },
    {
      id: 'chia_seed_pudding',
      url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
      category: 'Snack Healthy',
      keywords: ['chia', 'pudding', 'graines de chia', 'lait végétal', 'amande', 'fruits rouges', 'dessert', 'verrine']
    },
    {
      id: 'acai_berry_bowl',
      url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
      category: 'Snack Healthy',
      keywords: ['acai', 'açaí', 'smoothie bowl', 'granola', 'baies', 'myrtilles', 'banane', 'superfruit', 'fruits']
    },
    {
      id: 'oatmeal_porridge',
      url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
      category: 'Snack Healthy',
      keywords: ['flocons d\'avoine', 'avoine', 'porridge', 'fruits secs', 'amandes', 'petit déjeuner']
    },
    {
      id: 'energy_protein_balls',
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      category: 'Snack Healthy',
      keywords: ['energy ball', 'bouchées protéinées', 'dattes', 'cacao', 'barre énergétique', 'noix', 'snack']
    }
  ];

  // Moteur d'attribution sémantique haute fidélité reliant chaque plat à sa photographie exacte
  function getAccurateDishImage(
    category: string,
    name: string,
    ingredients: string[] = [],
    tagline: string = '',
    usedUrls: Record<string, number> = {}
  ): string {
    const fullText = [name, category, tagline, ...ingredients].join(' ').toLowerCase();

    const scored = DISH_PHOTOS_CATALOG.map(photo => {
      let score = 0;

      // Correspondance stricte de catégorie (+10)
      if (category.toLowerCase() === photo.category.toLowerCase() || photo.category.toLowerCase().includes(category.toLowerCase())) {
        score += 10;
      }

      // Correspondance des mots-clés culinaires
      for (const kw of photo.keywords) {
        const lowerKw = kw.toLowerCase();
        if (name.toLowerCase().includes(lowerKw)) {
          // Mot-clé présent directement dans le titre du plat (+18)
          score += 18;
        } else if (fullText.includes(lowerKw)) {
          // Mot-clé présent dans les ingrédients ou la description (+8)
          score += 8;
        }
      }

      // Légère pénalité de réutilisation pour varier les angles au sein d'une même brigade (-4 par usage)
      const usageCount = usedUrls[photo.url] || 0;
      score -= usageCount * 4;

      return { photo, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.photo?.url || DISH_PHOTOS_CATALOG[0].url;
  }

  // Fonction génératrice de 20 recettes healthy basée sur les ingrédients réels du stock
  function generateSmartFallbackRecipes(ings: Ingredient[], mode: string): AIMenuRecipe[] {
    const ingNames = ings.map(i => i.name);
    const getIng = (idx: number) => ingNames[idx % ingNames.length] || 'Légumes de saison';
    const getIng2 = (idx: number) => ingNames[(idx + 1) % ingNames.length] || 'Herbes fraîches';
    const getIng3 = (idx: number) => ingNames[(idx + 2) % ingNames.length] || 'Graines torréfiées';
    const getIng4 = (idx: number) => ingNames[(idx + 3) % ingNames.length] || 'Huile d\'olive extra vierge';

    const templates = [
      {
        namePrefix: 'Buddha Bowl Vitalité & Super-Aliments',
        category: 'Bowl' as const,
        tagline: 'Un bol complet riche en fibres végétales et protéines végétales d\'excellence.',
        baseCal: 420,
        baseProt: 22,
        time: 12,
        benefits: ['Équilibre acido-basique optimal', 'Riche en antioxydants', 'Digestion légère'],
        tags: ['Sans gluten', 'High fiber', 'Végétarien']
      },
      {
        namePrefix: 'Salade Croquante Méditerranéenne',
        category: 'Salade' as const,
        tagline: 'Fraîcheur intense aux saveurs du terroir tunisien sublimées.',
        baseCal: 340,
        baseProt: 16,
        time: 10,
        benefits: ['Hydratation cellulaire', 'Pauvre en lipides saturés', 'Vitamines A & C'],
        tags: ['Faible en calories', 'Fraîcheur minute', 'Méditerranéen']
      },
      {
        namePrefix: 'Wok Santé Équilibré & Graines Torréfiées',
        category: 'Plat chaud' as const,
        tagline: 'Cuisson vapeur douce pour préserver 100% des micronutriments.',
        baseCal: 480,
        baseProt: 30,
        time: 15,
        benefits: ['Haute biodisponibilité', 'Index glycémique bas', 'Énergie durable'],
        tags: ['Plat réconfortant', 'High protein', 'Zéro friture']
      },
      {
        namePrefix: 'Wrap Green Détox & Sauce Végétale Légère',
        category: 'Wrap & Sandwich' as const,
        tagline: 'Roulé frais dans une galette aux céréales complètes croustillante.',
        baseCal: 390,
        baseProt: 19,
        time: 8,
        benefits: ['Pratique et digeste', 'Riche en chlorophylle', 'Satiété prolongée'],
        tags: ['Sur le pouce', 'Énergie saine', 'Riche en fibres']
      },
      {
        namePrefix: 'Velouté Onctueux Détox aux Herbes Aromatiques',
        category: 'Soupe & Velouté' as const,
        tagline: 'Douceur réconfortante mijotée à basse température.',
        baseCal: 260,
        baseProt: 12,
        time: 18,
        benefits: ['Purification hépatique', 'Hydratation profonde', 'Ultra-léger'],
        tags: ['Détox', 'Faible index glycémique', 'Végétarien']
      },
      {
        namePrefix: 'Power Protein Bowl au Saumon & Quinoa',
        category: 'Bowl' as const,
        tagline: 'L\'allié parfait des sportifs pour une récupération musculaire maximale.',
        baseCal: 530,
        baseProt: 36,
        time: 14,
        benefits: ['Oméga-3 anti-inflammatoires', 'Acides aminés complets', 'Magnésium'],
        tags: ['High protein', 'Sport & Fitness', 'Sans gluten']
      },
      {
        namePrefix: 'Salade Gourmande Avocat, Agrumes & Féta',
        category: 'Salade' as const,
        tagline: 'Accord parfait entre le crémeux des bons gras et l\'acidité vivifiante.',
        baseCal: 410,
        baseProt: 18,
        time: 10,
        benefits: ['Bons lipides mono-insaturés', 'Vitamine E protectrice', 'Éclat du teint'],
        tags: ['Keto friendly', 'Végétarien', 'Gourmandise saine']
      },
      {
        namePrefix: 'Assiette Tiède Énergie & Racines Caramélisées',
        category: 'Plat chaud' as const,
        tagline: 'Mélange harmonieux de textures fondantes et croquantes.',
        baseCal: 460,
        baseProt: 24,
        time: 16,
        benefits: ['Régulation de la glycémie', 'Bêta-carotène naturel', 'Confort digestif'],
        tags: ['Plat complet', 'Énergie clean', 'Sans conservateur']
      },
      {
        namePrefix: 'Pita Rustique Façon BEBBA & Crème Protéinée',
        category: 'Wrap & Sandwich' as const,
        tagline: 'Pain artisanal aux graines garni généreusement d\'ingrédients frais.',
        baseCal: 430,
        baseProt: 25,
        time: 10,
        benefits: ['Zinc et fer biodisponibles', 'Index glycémique modéré', 'Sans additifs'],
        tags: ['Gourmand', 'High protein', 'Cuisine minute']
      },
      {
        namePrefix: 'Bouillon Thaï Healthy au Gingembre & Citronnelle',
        category: 'Soupe & Velouté' as const,
        tagline: 'Infusion bienfaisante stimulante pour le système immunitaire.',
        baseCal: 220,
        baseProt: 15,
        time: 12,
        benefits: ['Booste l\'immunité', 'Action anti-inflammatoire', 'Effet brûle-graisse'],
        tags: ['Immunité booster', 'Low calorie', 'Thermogénique']
      },
      {
        namePrefix: 'Rainbow Bowl Croquant & Vinaigrette Passion-Yuzu',
        category: 'Bowl' as const,
        tagline: 'Une explosion de couleurs pour faire le plein de phytonutriments.',
        baseCal: 380,
        baseProt: 20,
        time: 11,
        benefits: ['Large spectre d\'antioxydants', 'Fibres solubles', 'Cœur en santé'],
        tags: ['100% végétal', 'Sans gluten', 'Superfood']
      },
      {
        namePrefix: 'Salade Protéinée au Poulet Mariné Citron & Thym',
        category: 'Salade' as const,
        tagline: 'Blancs de poulet fondants marinés aux herbes sauvages.',
        baseCal: 440,
        baseProt: 38,
        time: 13,
        benefits: ['Maintien de la masse musculaire', 'Faible en glucides', 'Zéro sucre ajouté'],
        tags: ['High protein', 'Keto', 'Rassasiant']
      },
      {
        namePrefix: 'Cocotte Express de Saison & Légumes Rôtis au Four',
        category: 'Plat chaud' as const,
        tagline: 'Douceur rôtie avec une pointe d\'huile d\'olive vierge de Tunisie.',
        baseCal: 450,
        baseProt: 22,
        time: 18,
        benefits: ['Minéraux préservés', 'Satiété sans lourdeur', 'Potassium naturel'],
        tags: ['Chaud & équilibré', 'Terroir', 'Sans gluten']
      },
      {
        namePrefix: 'Tartine Nordique au Pain Noir & Herbes Fraîches',
        category: 'Wrap & Sandwich' as const,
        tagline: 'Pain de seigle toasté garni de protéines nobles et d\'éclats croquants.',
        baseCal: 370,
        baseProt: 23,
        time: 7,
        benefits: ['Fibres de seigle rassasiantes', 'Oméga-3 essentiels', 'Vitamines B'],
        tags: ['Snack détox', 'Faible IG', 'Riche en zinc']
      },
      {
        namePrefix: 'Gaspacho Vert Rafraîchissant Menthe & Concombre',
        category: 'Soupe & Velouté' as const,
        tagline: 'Soupe froide désaltérante idéale pour une digestion optimale.',
        baseCal: 180,
        baseProt: 8,
        time: 6,
        benefits: ['Effet drainant immédiat', 'Hydratation cellulaire', 'Effet fraîcheur'],
        tags: ['Cold detox', 'Zéro matière grasse', 'Végane']
      },
      {
        namePrefix: 'Bowl Soleil Levant au Tofu Croustillant & Sésame',
        category: 'Bowl' as const,
        tagline: 'Inspiration asiatique diététique relevée d\'une sauce soja allégée.',
        baseCal: 410,
        baseProt: 26,
        time: 14,
        benefits: ['Isoflavones protectrices', 'Protéines végétales complètes', 'Calcium'],
        tags: ['Végane', 'Sans lactose', 'Asian clean']
      },
      {
        namePrefix: 'Salade Croquante Quinoa, Grenade & Noix Torréfiées',
        category: 'Salade' as const,
        tagline: 'Harmonie sucrée-salée riche en polyphénols anti-âge.',
        baseCal: 430,
        baseProt: 17,
        time: 9,
        benefits: ['Polyphénols protecteurs', 'Microbiote renforcé', 'Vitamines B & E'],
        tags: ['Anti-âge', 'Riche en oméga-3', 'Sans gluten']
      },
      {
        namePrefix: 'Bowl Chaud Steak Végétal Maison & Purée de Patate Douce',
        category: 'Plat chaud' as const,
        tagline: 'Galette maison d\'ingrédients nobles sur lit de patate douce veloutée.',
        baseCal: 490,
        baseProt: 28,
        time: 17,
        benefits: ['Bêta-carotène protecteur', 'Énergie à diffusion lente', 'Pauvre en sel'],
        tags: ['Plant based', 'Gourmand & Healthy', 'Sans friture']
      },
      {
        namePrefix: 'Energy Toast & Écrasé d\'Avocat aux Graines de Chia',
        category: 'Snack Healthy' as const,
        tagline: 'Encas sain parfait avant ou après l\'effort physique.',
        baseCal: 310,
        baseProt: 14,
        time: 5,
        benefits: ['Mucilages bienfaisants pour l\'intestin', 'Bons acides gras', 'Magnésium'],
        tags: ['Superfood', 'Quick & Healthy', 'Végétarien']
      },
      {
        namePrefix: 'Chia Pudding Onctueux Lait d\'Amande & Coulis Maison',
        category: 'Snack Healthy' as const,
        tagline: 'Pause sucrée naturelle sans sucres raffinés pour terminer en beauté.',
        baseCal: 240,
        baseProt: 11,
        time: 5,
        benefits: ['Riche en calcium végétal', 'Zéro sucre raffiné', 'Oméga-3 d\'origine végétale'],
        tags: ['Dessert healthy', 'Sans gluten', 'Gourmandise clean']
      }
    ];

    return templates.map((tpl, i) => {
      const mainIng = getIng(i);
      const secondIng = getIng2(i);
      const thirdIng = getIng3(i);
      const fourthIng = getIng4(i);

      return {
        id: `ai_recipe_${Date.now()}_${i + 1}`,
        name: `${tpl.namePrefix} — ${mainIng}`,
        tagline: tpl.tagline,
        category: tpl.category,
        prepTimeMinutes: tpl.time,
        calories: tpl.baseCal + ((i * 13) % 40) - 20,
        proteinGrams: tpl.baseProt + (i % 5),
        healthBenefits: tpl.benefits,
        ingredientsUsed: [
          { ingredientName: mainIng, quantityEstimated: '120g', inStock: true },
          { ingredientName: secondIng, quantityEstimated: '60g', inStock: true },
          { ingredientName: thirdIng, quantityEstimated: '25g', inStock: true },
          { ingredientName: fourthIng, quantityEstimated: '15ml', inStock: true }
        ],
        chefInstructions: [
          `Préparer et découper délicatement les ${mainIng} frais en fines tranches ou julienne.`,
          `Associer les ${secondIng} et ${thirdIng} pour créer le contraste de texture croustillant.`,
          `Napper d'un filet de ${fourthIng} émulsionné avec le jus de citron pressé.`,
          `Dresser harmonieusement dans un bol éco-conçu et servir immédiatement à température optimale.`
        ],
        dietaryTags: tpl.tags,
        image: getAccurateDishImage(tpl.category, `${tpl.namePrefix} — ${mainIng}`, [mainIng, secondIng, thirdIng], tpl.tagline)
      };
    });
  }
  app.get('/api/suppliers', (req: Request, res: Response) => {
    return res.json({ suppliers: db.suppliers });
  });

  app.post('/api/suppliers', (req: Request, res: Response) => {
    const { name, phone, email, address, contactPerson, notes, suppliedIngredients } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone du fournisseur obligatoires.' });
    }

    const newSupplier: Supplier = {
      id: `sup_${Date.now()}`,
      name: name.trim(),
      phone: normalizeTunisianPhone(phone) || phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      contactPerson: contactPerson ? contactPerson.trim() : '',
      status: 'active',
      suppliedIngredients: suppliedIngredients || [],
      notes: notes ? notes.trim() : '',
      createdAt: new Date().toISOString()
    };

    db.suppliers.push(newSupplier);
    logAudit('FOURNISSEUR_CREE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouveau fournisseur : ${newSupplier.name}`);
    return res.status(201).json({ supplier: newSupplier });
  });

  app.put('/api/suppliers/:id', (req: Request, res: Response) => {
    const sup = db.suppliers.find(s => s.id === req.params.id);
    if (!sup) return res.status(404).json({ error: 'Fournisseur non trouvé' });

    const { name, phone, email, address, contactPerson, notes, status, suppliedIngredients } = req.body;
    if (name) sup.name = name.trim();
    if (phone) sup.phone = phone.trim();
    if (email !== undefined) sup.email = email.trim();
    if (address !== undefined) sup.address = address.trim();
    if (contactPerson !== undefined) sup.contactPerson = contactPerson.trim();
    if (notes !== undefined) sup.notes = notes.trim();
    if (status !== undefined) sup.status = status;
    if (suppliedIngredients !== undefined) sup.suppliedIngredients = suppliedIngredients;

    return res.json({ supplier: sup });
  });

  app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
    const sup = db.suppliers.find(s => s.id === req.params.id);
    if (!sup) return res.status(404).json({ error: 'Fournisseur non trouvé' });

    sup.status = 'inactive';
    return res.json({ success: true, supplier: sup });
  });

  // ==========================================
  // FLEET & VEHICLES (§26)
  // ==========================================
  app.get('/api/vehicles', (req: Request, res: Response) => {
    return res.json({ vehicles: db.vehicles });
  });

  app.post('/api/vehicles', (req: Request, res: Response) => {
    const { type, licensePlate, model, assignedDriverId, status, year } = req.body;
    if (!licensePlate || !model) {
      return res.status(400).json({ error: 'Immatriculation et modèle obligatoires.' });
    }

    const driver = assignedDriverId ? db.drivers.find(d => d.id === assignedDriverId || d.userId === assignedDriverId) : undefined;
    const newVehicle: Vehicle = {
      id: `veh_${Date.now()}`,
      type: type || 'Moto',
      licensePlate: licensePlate.trim(),
      model: model.trim(),
      assignedDriverId: driver ? driver.userId : undefined,
      assignedDriverName: driver ? driver.name : undefined,
      status: status || (driver ? 'ASSIGNED' : 'AVAILABLE'),
      year: year || '2025'
    };

    if (driver) {
      driver.vehicleId = newVehicle.id;
      driver.vehicleModel = newVehicle.model;
      driver.vehiclePlate = newVehicle.licensePlate;
    }

    db.vehicles.push(newVehicle);
    logAudit('VEHICULE_CREE', 'delivery', { id: 'admin', name: 'Admin Flotte', role: 'admin' }, `Nouveau véhicule : ${newVehicle.model} (${newVehicle.licensePlate}) - Type: ${newVehicle.type}`);
    broadcast('vehicle_updated', newVehicle);
    return res.status(201).json({ vehicle: newVehicle });
  });

  app.put('/api/vehicles/:id', (req: Request, res: Response) => {
    const veh = db.vehicles.find(v => v.id === req.params.id);
    if (!veh) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const { type, licensePlate, model, assignedDriverId, status, year } = req.body;
    if (type) veh.type = type;
    if (licensePlate) veh.licensePlate = licensePlate.trim();
    if (model) veh.model = model.trim();
    if (year !== undefined) veh.year = year;
    if (status !== undefined) veh.status = status;

    if (assignedDriverId !== undefined) {
      // If previous driver was assigned, clear their vehicle
      if (veh.assignedDriverId) {
        const prevDriver = db.drivers.find(d => d.userId === veh.assignedDriverId || d.id === veh.assignedDriverId);
        if (prevDriver && prevDriver.vehicleId === veh.id) {
          prevDriver.vehicleId = undefined;
          prevDriver.vehicleModel = undefined;
          prevDriver.vehiclePlate = undefined;
        }
      }

      if (assignedDriverId) {
        const driver = db.drivers.find(d => d.id === assignedDriverId || d.userId === assignedDriverId);
        if (driver) {
          veh.assignedDriverId = driver.userId;
          veh.assignedDriverName = driver.name;
          if (veh.status === 'AVAILABLE') veh.status = 'ASSIGNED';
          driver.vehicleId = veh.id;
          driver.vehicleModel = veh.model;
          driver.vehiclePlate = veh.licensePlate;
        }
      } else {
        veh.assignedDriverId = undefined;
        veh.assignedDriverName = undefined;
        if (veh.status === 'ASSIGNED') veh.status = 'AVAILABLE';
      }
    }

    logAudit('VEHICULE_MODIFIE', 'delivery', { id: 'admin', name: 'Admin Flotte', role: 'admin' }, `Modification véhicule : ${veh.model} (${veh.licensePlate})`);
    broadcast('vehicle_updated', veh);
    return res.json({ vehicle: veh });
  });

  app.delete('/api/vehicles/:id', (req: Request, res: Response) => {
    const idx = db.vehicles.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const veh = db.vehicles[idx];
    // Free any assigned driver
    const driver = db.drivers.find(d => d.vehicleId === veh.id || d.userId === veh.assignedDriverId);
    if (driver) {
      driver.vehicleId = undefined;
      driver.vehicleModel = undefined;
      driver.vehiclePlate = undefined;
    }

    db.vehicles.splice(idx, 1);
    logAudit('VEHICULE_SUPPRIME', 'delivery', { id: 'admin', name: 'Admin Flotte', role: 'admin' }, `Suppression véhicule : ${veh.model} (${veh.licensePlate})`);
    broadcast('vehicle_deleted', { vehicleId: veh.id });
    return res.json({ success: true, vehicleId: veh.id });
  });

  app.patch('/api/vehicles/:id/toggle-active', (req: Request, res: Response) => {
    const veh = db.vehicles.find(v => v.id === req.params.id);
    if (!veh) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const isCurrentlyInactive = veh.status === 'INACTIVE' || veh.status === 'inactive';
    if (isCurrentlyInactive) {
      veh.status = veh.assignedDriverId ? 'ASSIGNED' : 'AVAILABLE';
    } else {
      veh.status = 'INACTIVE';
      // Free driver if currently inactive
      if (veh.assignedDriverId) {
        const driver = db.drivers.find(d => d.userId === veh.assignedDriverId || d.id === veh.assignedDriverId);
        if (driver) {
          driver.vehicleId = undefined;
          driver.vehicleModel = undefined;
          driver.vehiclePlate = undefined;
        }
        veh.assignedDriverId = undefined;
        veh.assignedDriverName = undefined;
      }
    }

    logAudit('VEHICULE_STATUT_CHANGE', 'delivery', { id: 'admin', name: 'Admin Flotte', role: 'admin' }, `Véhicule ${veh.model} (${veh.licensePlate}) passé à ${veh.status}`);
    broadcast('vehicle_updated', veh);
    return res.json({ vehicle: veh });
  });

  // ==========================================
  // DRIVERS (§24, §25)
  // ==========================================
  app.get('/api/drivers', (req: Request, res: Response) => {
    return res.json({ drivers: db.drivers });
  });

  app.post('/api/drivers', (req: Request, res: Response) => {
    const { name, phone, email, vehicleId } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone obligatoires pour créer un livreur.' });
    }

    const formattedPhone = normalizeTunisianPhone(phone);
    const userId = `user_driver_${Date.now()}`;
    const newUser: User = {
      id: userId,
      name: name.trim(),
      phone: formattedPhone,
      rawPhone: phone.trim(),
      email: email ? email.trim() : undefined,
      role: 'driver',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);

    const vehicle = vehicleId ? db.vehicles.find(v => v.id === vehicleId) : undefined;
    const newDriver: DriverProfile = {
      id: `drv_${Date.now()}`,
      userId,
      name: name.trim(),
      phone: formattedPhone,
      vehicleId: vehicle ? vehicle.id : undefined,
      vehicleModel: vehicle ? vehicle.model : undefined,
      vehiclePlate: vehicle ? vehicle.licensePlate : undefined,
      status: 'available',
      completedDeliveriesToday: 0,
      collectedAmountToday: 0
    };

    if (vehicle) {
      vehicle.assignedDriverId = userId;
      vehicle.assignedDriverName = newDriver.name;
      vehicle.status = 'ASSIGNED';
    }

    db.drivers.push(newDriver);
    logAudit('LIVREUR_CREE', 'delivery', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouveau livreur créé : ${newDriver.name} (${newDriver.phone})`);
    broadcast('driver_updated', newDriver);
    return res.status(201).json({ driver: newDriver });
  });

  app.put('/api/drivers/:id', (req: Request, res: Response) => {
    const driver = db.drivers.find(d => d.id === req.params.id || d.userId === req.params.id);
    if (!driver) return res.status(404).json({ error: 'Livreur non trouvé' });

    const { name, phone, email, vehicleId, status } = req.body;
    if (name) driver.name = name.trim();
    if (phone) driver.phone = normalizeTunisianPhone(phone);
    if (status) driver.status = status;

    // Handle vehicle assignment changes
    if (vehicleId !== undefined) {
      // Clear previous vehicle if different
      if (driver.vehicleId && driver.vehicleId !== vehicleId) {
        const oldVeh = db.vehicles.find(v => v.id === driver.vehicleId);
        if (oldVeh) {
          oldVeh.assignedDriverId = undefined;
          oldVeh.assignedDriverName = undefined;
          if (oldVeh.status === 'ASSIGNED') oldVeh.status = 'AVAILABLE';
        }
      }

      if (vehicleId) {
        const newVeh = db.vehicles.find(v => v.id === vehicleId);
        if (newVeh) {
          driver.vehicleId = newVeh.id;
          driver.vehicleModel = newVeh.model;
          driver.vehiclePlate = newVeh.licensePlate;
          newVeh.assignedDriverId = driver.userId;
          newVeh.assignedDriverName = driver.name;
          newVeh.status = 'ASSIGNED';
        }
      } else {
        driver.vehicleId = undefined;
        driver.vehicleModel = undefined;
        driver.vehiclePlate = undefined;
      }
    }

    // Update corresponding user in db.users
    const user = db.users.find(u => u.id === driver.userId || u.phone === driver.phone);
    if (user) {
      if (name) user.name = name.trim();
      if (phone) {
        user.phone = driver.phone;
        user.rawPhone = phone.trim();
      }
      if (email !== undefined) user.email = email ? email.trim() : undefined;
      if (status === 'inactive' || status === 'suspended') user.status = 'suspended';
      else if (status === 'available') user.status = 'active';
    }

    logAudit('LIVREUR_MODIFIE', 'delivery', { id: 'admin', name: 'Admin', role: 'admin' }, `Mise à jour livreur : ${driver.name} (${driver.phone})`);
    broadcast('driver_updated', driver);
    return res.json({ driver });
  });

  app.delete('/api/drivers/:id', (req: Request, res: Response) => {
    const idx = db.drivers.findIndex(d => d.id === req.params.id || d.userId === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Livreur non trouvé' });

    const driver = db.drivers[idx];

    // Free assigned vehicle
    if (driver.vehicleId) {
      const veh = db.vehicles.find(v => v.id === driver.vehicleId);
      if (veh) {
        veh.assignedDriverId = undefined;
        veh.assignedDriverName = undefined;
        if (veh.status === 'ASSIGNED') veh.status = 'AVAILABLE';
      }
    }

    // Check if driver has active orders
    const activeOrders = db.orders.filter(
      o => o.assignedDriverId === driver.userId && (o.orderStatus === 'delivering' || o.orderStatus === 'waiting_for_driver')
    );
    for (const ord of activeOrders) {
      ord.assignedDriverId = undefined;
      ord.assignedDriverName = undefined;
      ord.assignedDriverPhone = undefined;
      ord.orderStatus = 'waiting_for_driver';
    }

    // En conformité avec §30, §31, §32 :
    // La suppression physique ne doit pas détruire les informations historiques nécessaires
    // aux commandes, livraisons, encaissements, statistiques et audits.
    // On désactive / archive le livreur pour préserver la traçabilité intégrale.
    driver.status = 'inactive';
    driver.vehicleId = undefined;
    driver.vehiclePlate = undefined;

    // Update user status
    const user = db.users.find(u => u.id === driver.userId);
    if (user) {
      user.status = 'inactive';
    }

    logAudit('LIVREUR_ARCHIVE', 'delivery', { id: 'admin', name: 'Admin', role: 'admin' }, `Archivage du livreur : ${driver.name} (${driver.phone}) - Préservation de l'historique d'encaissement et de livraison (§31, §32)`);
    broadcast('driver_updated', driver);
    return res.json({ success: true, driverId: driver.id, archived: true });
  });

  app.patch('/api/drivers/:id/toggle-active', (req: Request, res: Response) => {
    const driver = db.drivers.find(d => d.id === req.params.id || d.userId === req.params.id);
    if (!driver) return res.status(404).json({ error: 'Livreur non trouvé' });

    const isCurrentlyInactive = driver.status === 'inactive' || driver.status === 'suspended';
    driver.status = isCurrentlyInactive ? 'available' : 'inactive';

    const user = db.users.find(u => u.id === driver.userId);
    if (user) {
      user.status = isCurrentlyInactive ? 'active' : 'suspended';
    }

    logAudit('LIVREUR_STATUT_CHANGE', 'delivery', { id: 'admin', name: 'Admin', role: 'admin' }, `Livreur ${driver.name} passé à ${driver.status}`);
    broadcast('driver_updated', driver);
    return res.json({ driver });
  });

  app.patch('/api/drivers/:id/status', (req: Request, res: Response) => {
    const driver = db.drivers.find(d => d.id === req.params.id || d.userId === req.params.id);
    if (!driver) return res.status(404).json({ error: 'Livreur non trouvé' });

    const { status } = req.body;
    driver.status = status;
    broadcast('driver_updated', driver);
    return res.json({ driver });
  });

  // ==========================================
  // ACTIVE DELIVERIES & ADMIN MAP (§34)
  // ==========================================
  app.get('/api/deliveries', (req: Request, res: Response) => {
    const activeDeliveries = db.orders
      .filter(o => o.orderStatus === 'delivering' || o.orderStatus === 'waiting_for_driver')
      .map(o => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        clientName: o.clientName,
        clientPhone: o.clientPhone,
        deliveryAddress: o.deliveryAddress,
        deliveryLat: o.deliveryLat,
        deliveryLng: o.deliveryLng,
        driverId: o.assignedDriverId,
        driverName: o.assignedDriverName,
        driverPhone: o.assignedDriverPhone,
        vehicle: o.assignedVehicle,
        status: o.orderStatus,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        currentLocation: o.currentLocation,
        lastUpdate: o.currentLocation ? o.currentLocation.timestamp : o.updatedAt
      }));

    return res.json({ deliveries: activeDeliveries });
  });

  // ==========================================
  // NOTIFICATIONS SYSTEM (§69)
  // ==========================================
  app.get('/api/notifications', (req: Request, res: Response) => {
    const { role } = req.query;
    let notifs = [...db.notifications];
    if (role && role !== 'all') {
      notifs = notifs.filter(n => n.targetRole === 'all' || n.targetRole === role);
    }
    return res.json({ notifications: notifs });
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const notif = db.notifications.find(n => n.id === req.params.id);
    if (notif) notif.read = true;
    return res.json({ success: true, notification: notif });
  });

  app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
    db.notifications.forEach(n => { n.read = true; });
    return res.json({ success: true });
  });

  // ==========================================
  // APP SETTINGS (§60)
  // ==========================================
  app.get('/api/settings', (req: Request, res: Response) => {
    return res.json({ settings: db.settings });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    db.settings = { ...db.settings, ...req.body };
    logAudit('PARAMETRES_MODIFIES', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, 'Mise à jour des paramètres système BEBBA');
    broadcast('settings_updated', db.settings);
    return res.json({ settings: db.settings });
  });

  // ==========================================
  // STORE STATUS & BUSINESS HOURS (§1, §2)
  // ==========================================
  app.get('/api/store/status', (req: Request, res: Response) => {
    const tunisTime = getAfricaTunisTime();
    const status = isStoreOpenNow();
    return res.json({
      isOpen: status.isOpen,
      message: status.message,
      timezone: 'Africa/Tunis',
      tunisTime: tunisTime.formatted,
      currentTime: tunisTime.timeStr,
      currentDate: tunisTime.dateStr,
      openingTime: db.settings?.openingTime || '10:00',
      closingTime: db.settings?.closingTime || '23:00',
      isStoreOpen: db.settings?.isStoreOpen !== false,
      acceptingOrders: db.settings?.acceptingOrders !== false
    });
  });

  // ==========================================
  // DELIVERY ZONES (§3, §4)
  // ==========================================
  app.get('/api/delivery-zones', (req: Request, res: Response) => {
    return res.json({ zones: db.deliveryZones });
  });

  app.post('/api/delivery-zones', (req: Request, res: Response) => {
    const { name, deliveryFee, minOrderAmount, estimatedMinutes, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom de la zone est obligatoire.' });

    const newZone: DeliveryZone = {
      id: `zone_${Date.now()}`,
      name: name.trim(),
      active: true,
      deliveryFee: parseFloat(deliveryFee) || 5.0,
      minOrderAmount: parseFloat(minOrderAmount) || 20.0,
      estimatedMinutes: parseInt(estimatedMinutes, 10) || 30,
      description: description ? description.trim() : undefined
    };

    db.deliveryZones.push(newZone);
    logAudit('ZONE_LIVRAISON_CREEE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouvelle zone de livraison ajoutée : ${newZone.name}`);
    broadcast('zones_updated', db.deliveryZones);
    return res.status(201).json({ zone: newZone });
  });

  app.put('/api/delivery-zones/:id', (req: Request, res: Response) => {
    const zone = db.deliveryZones.find(z => z.id === req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone de livraison non trouvée' });

    const { name, active, deliveryFee, minOrderAmount, estimatedMinutes, description } = req.body;
    if (name) zone.name = name.trim();
    if (active !== undefined) zone.active = Boolean(active);
    if (deliveryFee !== undefined) zone.deliveryFee = parseFloat(deliveryFee);
    if (minOrderAmount !== undefined) zone.minOrderAmount = parseFloat(minOrderAmount);
    if (estimatedMinutes !== undefined) zone.estimatedMinutes = parseInt(estimatedMinutes, 10);
    if (description !== undefined) zone.description = description.trim();

    logAudit('ZONE_LIVRAISON_MODIFIEE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Modification zone de livraison : ${zone.name}`);
    broadcast('zones_updated', db.deliveryZones);
    return res.json({ zone });
  });

  // ==========================================
  // CASH REGISTER RECONCILIATION & CLOSING (§25, §26)
  // ==========================================
  app.get('/api/cash-register/reconciliation', (req: Request, res: Response) => {
    const tunisTime = getAfricaTunisTime();

    // Delivered orders to collect or collected
    const relevantOrders = db.orders.filter(o => o.orderStatus === 'delivered' || o.paymentStatus === 'paid');
    const theoreticalAmount = relevantOrders.reduce((sum, o) => sum + (o.collectedAmount || o.totalAmount), 0);
    const paidOrders = relevantOrders.filter(o => o.paymentStatus === 'paid');
    const paidAmount = paidOrders.reduce((sum, o) => sum + (o.collectedAmount || o.totalAmount), 0);
    const pendingOrders = relevantOrders.filter(o => o.paymentStatus === 'to_collect');
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Group by driver
    const driverSummary: Record<string, { driverId: string; driverName: string; count: number; totalToCollect: number; totalCollected: number }> = {};
    relevantOrders.forEach(o => {
      const dId = o.assignedDriverId || 'unassigned';
      const dName = o.assignedDriverName || 'Sans livreur';
      if (!driverSummary[dId]) {
        driverSummary[dId] = { driverId: dId, driverName: dName, count: 0, totalToCollect: 0, totalCollected: 0 };
      }
      driverSummary[dId].count += 1;
      if (o.paymentStatus === 'paid') {
        driverSummary[dId].totalCollected += (o.collectedAmount || o.totalAmount);
      } else {
        driverSummary[dId].totalToCollect += o.totalAmount;
      }
    });

    return res.json({
      periodDate: tunisTime.dateStr,
      timezone: 'Africa/Tunis',
      theoreticalAmount: parseFloat(theoreticalAmount.toFixed(2)),
      paidAmount: parseFloat(paidAmount.toFixed(2)),
      pendingAmount: parseFloat(pendingAmount.toFixed(2)),
      deliveredOrdersCount: relevantOrders.length,
      paidOrdersCount: paidOrders.length,
      pendingCollectCount: pendingOrders.length,
      byDriver: Object.values(driverSummary),
      closingsHistory: db.cashClosings
    });
  });

  app.post('/api/cash-register/close', (req: Request, res: Response) => {
    const { declaredAmount, notes, closedByUserId, closedByName, closedByRole } = req.body;
    const tunisTime = getAfricaTunisTime();

    const declared = parseFloat(declaredAmount);
    if (isNaN(declared) || declared < 0) {
      return res.status(400).json({ error: 'Montant réel déclaré invalide.' });
    }

    const relevantOrders = db.orders.filter(o => o.orderStatus === 'delivered' || o.paymentStatus === 'paid');
    const theoretical = parseFloat(relevantOrders.reduce((sum, o) => sum + (o.collectedAmount || o.totalAmount), 0).toFixed(2));
    const discrepancy = parseFloat((declared - theoretical).toFixed(2));

    const closing: CashClosingRecord = {
      id: `close_${Date.now()}`,
      closingNumber: `CLOTURE-${tunisTime.dateStr}-${db.cashClosings.length + 1}`,
      closingDate: new Date().toISOString(),
      periodStart: `${tunisTime.dateStr} 00:00:00 (Africa/Tunis)`,
      periodEnd: `${tunisTime.dateStr} 23:59:59 (Africa/Tunis)`,
      theoreticalAmount: theoretical,
      declaredAmount: declared,
      discrepancy,
      deliveredOrdersCount: relevantOrders.length,
      paidOrdersCount: relevantOrders.filter(o => o.paymentStatus === 'paid').length,
      pendingCollectCount: relevantOrders.filter(o => o.paymentStatus === 'to_collect').length,
      closedBy: {
        id: closedByUserId || 'admin',
        name: closedByName || 'Directeur Général',
        role: closedByRole || 'admin'
      },
      notes: notes ? notes.trim() : undefined,
      status: Math.abs(discrepancy) < 0.01 ? 'validated' : 'discrepancy_reported',
      createdAt: new Date().toISOString()
    };

    db.cashClosings.unshift(closing);

    logAudit(
      'CLOTURE_CAISSE_VALIDEE',
      'system',
      { id: closing.closedBy.id, name: closing.closedBy.name, role: closing.closedBy.role },
      `Clôture de caisse n° ${closing.closingNumber}. Théorique: ${theoretical} DT, Déclaré: ${declared} DT, Écart: ${discrepancy >= 0 ? '+' : ''}${discrepancy} DT.`
    );

    broadcast('cash_closing_created', closing);
    return res.status(201).json({ success: true, closing });
  });

  app.get('/api/cash-register/closings', (req: Request, res: Response) => {
    return res.json({ closings: db.cashClosings });
  });

  // ==========================================
  // PROMOTIONS & REMISES (§42, §177, §225, §242)
  // ==========================================
  app.get('/api/promotions', (req: Request, res: Response) => {
    // Sort promotions strictly newest first (Règle #11)
    const sorted = [...(db.promotions || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json({ promotions: sorted });
  });

  app.post('/api/promotions/calculate', (req: Request, res: Response) => {
    const { subtotal, promoCodes } = req.body;
    const numSubtotal = parseFloat(subtotal) || 0;
    const result = applyPromotionsEngine(numSubtotal, promoCodes);
    return res.json(result);
  });

  // ==========================================
  // SYSTEM HEALTH CHECK (§108)
  // ==========================================
  app.get('/api/health', (req: Request, res: Response) => {
    const tunisTime = getAfricaTunisTime();
    const store = isStoreOpenNow();

    return res.json({
      status: 'healthy',
      application: 'BEBBA Healthy Food - Vos Plats santé en un clic',
      version: '4.0.0-final',
      timezone: 'Africa/Tunis',
      serverTime: new Date().toISOString(),
      tunisTime: tunisTime.formatted,
      storeStatus: store,
      systemMetrics: {
        ordersCount: db.orders.length,
        activeOrders: db.orders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length,
        productsCount: db.products.length,
        categoriesCount: db.categories.length,
        ingredientsCount: db.ingredients.length,
        recipesCount: db.recipes.length,
        driversCount: db.drivers.length,
        vehiclesCount: db.vehicles.length,
        claimsCount: db.claims.length,
        auditLogsCount: db.auditLogs.length,
        stockMovementsCount: db.stockMovements.length,
        activeRealtimeSubscribers: sseSubscribers.length
      }
    });
  });

  // ==========================================
  // AUDIT LOGS & COMPREHENSIVE STATISTICS (§65, §70)
  // ==========================================
  app.get(['/api/audit', '/api/audit-logs'], (req: Request, res: Response) => {
    const { category, search } = req.query;
    let logs = [...db.auditLogs];

    if (category) {
      logs = logs.filter(l => l.category === category);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      logs = logs.filter(l => l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
    }
    return res.json({ auditLogs: logs });
  });

  app.get(['/api/statistics', '/api/analytics'], (req: Request, res: Response) => {
    const totalOrders = db.orders.length;
    const paidOrders = db.orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.collectedAmount || o.totalAmount), 0);
    const toCollect = db.orders
      .filter(o => o.paymentStatus === 'to_collect' && o.orderStatus !== 'cancelled')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const averageBasket = totalOrders > 0
      ? db.orders.reduce((acc, o) => acc + o.totalAmount, 0) / totalOrders
      : 0;

    // Claims breakdown
    const claimsCount = db.claims.length;
    const resolvedClaims = db.claims.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

    // Product breakdown
    const productSalesMap: Record<string, { name: string; count: number; revenue: number; category: string }> = {};
    db.orders.forEach(ord => {
      ord.items.forEach(it => {
        if (!productSalesMap[it.productId]) {
          const prod = db.products.find(p => p.id === it.productId);
          productSalesMap[it.productId] = {
            name: it.productName,
            count: 0,
            revenue: 0,
            category: prod ? prod.category : 'Healthy'
          };
        }
        productSalesMap[it.productId].count += it.quantity;
        productSalesMap[it.productId].revenue += it.itemTotal;
      });
    });

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.count - a.count);

    // Stock alert count
    const criticalStock = db.ingredients.filter(i => i.currentStock <= i.minThreshold);

    return res.json({
      revenue: {
        totalCollected: parseFloat(totalRevenue.toFixed(2)),
        toCollect: parseFloat(toCollect.toFixed(2)),
        averageBasket: parseFloat(averageBasket.toFixed(2)),
        todayCollected: parseFloat(paidOrders.reduce((s, o) => s + (o.collectedAmount || o.totalAmount), 0).toFixed(2))
      },
      orders: {
        total: totalOrders,
        byStatus: {
          received: db.orders.filter(o => o.orderStatus === 'received').length,
          preparing: db.orders.filter(o => o.orderStatus === 'preparing').length,
          ready: db.orders.filter(o => o.orderStatus === 'ready').length,
          waiting_for_driver: db.orders.filter(o => o.orderStatus === 'waiting_for_driver').length,
          delivering: db.orders.filter(o => o.orderStatus === 'delivering').length,
          delivered: db.orders.filter(o => o.orderStatus === 'delivered').length,
          cancelled: db.orders.filter(o => o.orderStatus === 'cancelled').length
        }
      },
      drivers: {
        total: db.drivers.length,
        available: db.drivers.filter(d => d.status === 'available').length,
        activeDelivering: db.drivers.filter(d => d.status === 'busy').length
      },
      claims: {
        total: claimsCount,
        open: db.claims.filter(c => c.status === 'OPEN' || c.status === 'IN_REVIEW').length,
        waitingCustomer: db.claims.filter(c => (c.status as any) === 'WAITING_FOR_CUSTOMER').length,
        resolved: resolvedClaims
      },
      stock: {
        totalIngredients: db.ingredients.length,
        criticalCount: criticalStock.length,
        outOfStockCount: db.ingredients.filter(i => i.currentStock === 0).length,
        criticalItems: criticalStock.map(i => ({ name: i.name, stock: i.currentStock, unit: i.unit, threshold: i.minThreshold }))
      },
      topProducts
    });
  });

  // ==========================================
  // BACKUP & RESTORE DATA ROUTES (§81, §92)
  // ==========================================
  app.get('/api/system/backup', (req: Request, res: Response) => {
    const backupData = {
      version: '4.0-final',
      exportedAt: new Date().toISOString(),
      timezone: 'Africa/Tunis',
      data: {
        users: db.users,
        products: db.products,
        categories: db.categories,
        ingredients: db.ingredients,
        recipes: db.recipes,
        suppliers: db.suppliers,
        vehicles: db.vehicles,
        drivers: db.drivers,
        orders: db.orders,
        claims: db.claims,
        deliveryZones: db.deliveryZones,
        cashClosings: db.cashClosings,
        stockMovements: db.stockMovements,
        auditLogs: db.auditLogs,
        settings: db.settings
      }
    };
    logAudit('SAUVEGARDE_EXPORTEE', 'system', { id: 'admin', name: 'Super Admin', role: 'admin' }, 'Export complet de la base de données et des configurations');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=bebba_backup_${new Date().toISOString().slice(0, 10)}.json`);
    return res.json(backupData);
  });

  app.post('/api/system/restore', (req: Request, res: Response) => {
    const { backup } = req.body;
    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Fichier de sauvegarde corrompu ou invalide.' });
    }

    try {
      const data = backup.data;
      if (Array.isArray(data.users)) db.users = data.users;
      if (Array.isArray(data.products)) db.products = data.products;
      if (Array.isArray(data.categories)) db.categories = data.categories;
      if (Array.isArray(data.ingredients)) db.ingredients = data.ingredients;
      if (Array.isArray(data.recipes)) db.recipes = data.recipes;
      if (Array.isArray(data.suppliers)) db.suppliers = data.suppliers;
      if (Array.isArray(data.vehicles)) db.vehicles = data.vehicles;
      if (Array.isArray(data.drivers)) db.drivers = data.drivers;
      if (Array.isArray(data.orders)) db.orders = data.orders;
      if (Array.isArray(data.claims)) db.claims = data.claims;
      if (Array.isArray(data.deliveryZones)) db.deliveryZones = data.deliveryZones;
      if (Array.isArray(data.cashClosings)) db.cashClosings = data.cashClosings;
      if (Array.isArray(data.stockMovements)) db.stockMovements = data.stockMovements;
      if (Array.isArray(data.auditLogs)) db.auditLogs = data.auditLogs;
      if (data.settings) db.settings = { ...db.settings, ...data.settings };

      logAudit('SAUVEGARDE_RESTAUREE', 'system', { id: 'admin', name: 'Super Admin', role: 'admin' }, `Restauration réussie de la sauvegarde du ${backup.exportedAt || 'Inconnue'}`);
      broadcast('system_restored', { restoredAt: new Date().toISOString() });
      return res.json({ success: true, message: 'Sauvegarde restaurée avec succès.' });
    } catch (e: any) {
      return res.status(500).json({ error: `Échec restauration : ${e.message}` });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BEBBA Healthy Food server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
