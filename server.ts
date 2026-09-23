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
  NotificationType
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  settings: { ...INITIAL_SETTINGS }
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

// Generate 8-character unique alphanumeric tracking token
function generateTrackingToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Consume recipe ingredients when kitchen begins preparation
function consumeIngredientsForOrder(order: Order, performedBy: string) {
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
}

// Restore recipe ingredients if an order in preparation/ready is cancelled
function restoreIngredientsForCancelledOrder(order: Order, performedBy: string) {
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
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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
    const {
      clientId,
      clientName,
      clientPhone,
      deliveryAddress,
      deliveryCity,
      deliveryNotes,
      deliveryLat,
      deliveryLng,
      items
    } = req.body;

    if (!clientName || !clientPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Informations de livraison et panier obligatoires.' });
    }

    const formattedPhone = normalizeTunisianPhone(clientPhone);

    // SERVER-SIDE TRUTH FOR PRICING
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

      return {
        id: `item_${Date.now()}_${index}`,
        productId: product ? product.id : rawItem.productId,
        productName: product ? product.name : rawItem.productName,
        productImage: product ? product.image : (rawItem.productImage || ''),
        unitPrice: unitBasePrice,
        quantity: qty,
        selectedOptions: validatedOptions,
        itemTotal: parseFloat(itemTotal.toFixed(2)),
        specialInstructions: rawItem.specialInstructions ? rawItem.specialInstructions.trim() : undefined
      };
    });

    // Fixed delivery fee or tiered based on zone (e.g. 5 DT for standard Tunis perimeter)
    const deliveryFee = 5.0;
    const totalAmount = parseFloat((subtotal + deliveryFee).toFixed(2));
    const orderNumber = `BEBBA-2026-${1000 + db.orders.length + 1}`;
    const trackingToken = generateTrackingToken();

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      clientId: clientId || `guest_${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: formattedPhone,
      deliveryAddress: deliveryAddress.trim(),
      deliveryCity: deliveryCity || 'Tunis',
      deliveryLat: deliveryLat || 36.8385,
      deliveryLng: deliveryLng || 10.1654,
      deliveryNotes: deliveryNotes ? deliveryNotes.trim() : undefined,
      items: validatedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
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
    }, `Création commande ${orderNumber} - Montant total: ${totalAmount} DT (COD)`);

    broadcast('order_created', newOrder);
    return res.status(201).json({ order: newOrder });
  });

  // State transitions with strict backend rules
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
      // Auto consume recipe ingredients from stock transactionally!
      consumeIngredientsForOrder(order, userRef.name);
      logAudit('CUISINE_PREPARATION', 'kitchen', userRef, `Début préparation & déstockage ingrédients pour ${order.orderNumber}`);
    } else if (nextStatus === 'ready') {
      order.readyAt = now;
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
    const { collectedAmount, collectorName, collectorUserId, collectorRole } = req.body;

    const order = db.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const amount = collectedAmount !== undefined ? parseFloat(collectedAmount) : order.totalAmount;
    order.paymentStatus = 'paid';
    order.paidAt = new Date().toISOString();
    order.paidBy = collectorName || 'Livreur Bebba';
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
      id: collectorUserId || 'driver',
      name: collectorName || 'Livreur',
      role: collectorRole || 'driver'
    }, `Encaissement COD de ${amount} DT pour ${order.orderNumber} (${order.paymentStatus})`);

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
    // Keep max 300 points in memory
    if (order.locationHistory.length > 300) {
      order.locationHistory.shift();
    }

    // Also update driver profile
    if (order.assignedDriverId) {
      const driver = db.drivers.find(d => d.userId === order.assignedDriverId);
      if (driver) driver.currentLocation = gpsPoint;
    }

    broadcast('driver_location', { orderId: order.id, location: gpsPoint, trackingToken: order.trackingToken });
    return res.json({ success: true, location: gpsPoint });
  });

  // Public Tracking Endpoint via Token (e.g. /tracking?token=AB7K92QX)
  app.get('/api/tracking/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    const order = db.orders.find(o => o.trackingToken === token.toUpperCase());
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
      status: 'open',
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
    if (status) claim.status = status as ClaimStatus;
    if (resolution) claim.resolution = resolution as ClaimResolution;
    if (resolutionNotes) claim.resolutionNotes = resolutionNotes;
    if (status === 'resolved' || status === 'closed') {
      claim.resolvedAt = now;
      claim.resolvedBy = adminName || 'Bebba Admin';
    }
    claim.updatedAt = now;

    logAudit('RECLAMATION_STATUT', 'claim', {
      id: adminId || 'admin',
      name: adminName || 'Admin',
      role: 'admin'
    }, `Statut réclamation ${claim.claimNumber} passé à ${status} (Résolution: ${resolution || 'N/A'})`);

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

    if (senderRole === 'client' && claim.status === 'waiting_for_customer') {
      claim.status = 'in_review';
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
  // SUPPLIERS MANAGEMENT (§23)
  // ==========================================
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

    db.vehicles.push(newVehicle);
    logAudit('VEHICULE_CREE', 'system', { id: 'admin', name: 'Admin', role: 'admin' }, `Nouveau véhicule : ${newVehicle.model} (${newVehicle.licensePlate})`);
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
      const driver = db.drivers.find(d => d.id === assignedDriverId || d.userId === assignedDriverId);
      veh.assignedDriverId = driver ? driver.userId : undefined;
      veh.assignedDriverName = driver ? driver.name : undefined;
    }

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
    const resolvedClaims = db.claims.filter(c => c.status === 'resolved' || c.status === 'closed').length;

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
        open: db.claims.filter(c => c.status === 'open' || c.status === 'in_review').length,
        waitingCustomer: db.claims.filter(c => c.status === 'waiting_for_customer').length,
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
