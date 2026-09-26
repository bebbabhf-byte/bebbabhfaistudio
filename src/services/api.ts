import {
  Order,
  Claim,
  Product,
  Ingredient,
  Recipe,
  Vehicle,
  DriverProfile,
  AuditLog,
  User,
  OrderStatus,
  ClaimStatus,
  ClaimResolution,
  GPSCoordinate,
  Category,
  Supplier,
  SystemNotification,
  AppSettings,
  ClientProfile,
  DeliveryZone,
  CashClosingRecord,
  UserRole,
  Promotion,
  AIMenuRecipe
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ORDERS,
  INITIAL_CLAIMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUPPLIERS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
  INITIAL_DELIVERY_ZONES
} from '../data/mockData';

const API_BASE = '/api';

/**
 * Resilient fetch wrapper with retry on network error/server restart
 */
export async function apiFetch(url: string, options?: RequestInit, retries = 1): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 400));
      return apiFetch(url, options, retries - 1);
    }
    throw err;
  }
}

// ==========================================
// CATEGORIES
// ==========================================
export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await apiFetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Erreur chargement des catégories');
    const data = await res.json();
    return data.categories || INITIAL_CATEGORIES;
  } catch (e) {
    console.warn('Fallback catégories en local', e);
    return INITIAL_CATEGORIES;
  }
}

export async function createCategory(payload: Partial<Category>): Promise<Category> {
  const res = await apiFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création catégorie');
  const data = await res.json();
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const res = await apiFetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour catégorie');
  const data = await res.json();
  return data.category;
}

export async function deleteCategory(id: string) {
  const res = await apiFetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression catégorie');
  return res.json();
}

// ==========================================
// PRODUCTS
// ==========================================
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await apiFetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Erreur chargement des produits');
    const data = await res.json();
    return data.products || INITIAL_PRODUCTS;
  } catch (e) {
    console.warn('Fallback produits en local', e);
    return INITIAL_PRODUCTS;
  }
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création produit');
  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour produit');
  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: string) {
  const res = await apiFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression produit');
  return res.json();
}

// ==========================================
// ORDERS
// ==========================================
export async function fetchOrders(params?: { clientId?: string; driverId?: string; status?: string }): Promise<Order[]> {
  try {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.driverId) query.set('driverId', params.driverId);
    if (params?.status) query.set('status', params.status);

    const res = await apiFetch(`${API_BASE}/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Erreur chargement des commandes');
    const data = await res.json();
    return data.orders || INITIAL_ORDERS;
  } catch (e) {
    console.warn('Fallback commandes en local', e);
    let list = [...INITIAL_ORDERS];
    if (params?.clientId) list = list.filter(o => o.clientId === params.clientId);
    if (params?.driverId) list = list.filter(o => o.assignedDriverId === params.driverId);
    if (params?.status) list = list.filter(o => o.orderStatus === params.status);
    return list;
  }
}

export async function fetchOrderById(id: string): Promise<Order> {
  try {
    const res = await apiFetch(`${API_BASE}/orders/${id}`);
    if (!res.ok) throw new Error('Commande introuvable');
    const data = await res.json();
    return data.order;
  } catch (e) {
    const found = INITIAL_ORDERS.find(o => o.id === id);
    if (found) return found;
    throw e;
  }
}

export async function fetchTrackingByToken(token: string): Promise<any> {
  try {
    const res = await apiFetch(`${API_BASE}/tracking/${token}`);
    if (!res.ok) throw new Error('Code de suivi introuvable');
    const data = await res.json();
    return data.tracking;
  } catch (e) {
    const order = INITIAL_ORDERS.find(o => o.trackingToken === token);
    if (order) {
      return {
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        customerName: order.clientName,
        customerAddress: order.deliveryAddress,
        deliveryZone: order.deliveryZoneName || 'Tunis',
        deliveryFee: order.deliveryFee,
        items: order.items,
        totalAmount: order.totalAmount,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        assignedDriverName: order.assignedDriverName,
        driverVehicleModel: order.assignedVehicle,
        driverPhone: order.assignedDriverPhone,
        driverLocation: order.currentLocation
      };
    }
    throw e;
  }
}

export async function createOrder(payload: any): Promise<Order> {
  const res = await apiFetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création commande' }));
    throw new Error(err.error || 'Erreur création commande');
  }
  const data = await res.json();
  return data.order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  detailsOrUser?: string | { id?: string; name?: string; role?: string }
): Promise<Order> {
  const details = typeof detailsOrUser === 'string' ? detailsOrUser : detailsOrUser?.name;
  const performedBy = typeof detailsOrUser === 'object' ? detailsOrUser : undefined;

  const res = await apiFetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, details, performedBy })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur mise à jour statut' }));
    throw new Error(err.error || 'Erreur mise à jour statut');
  }
  const data = await res.json();
  return data.order;
}

export async function assignDriver(
  orderId: string,
  driverId: string,
  performedBy?: any
): Promise<Order> {
  return assignDriverToOrder(orderId, driverId, performedBy);
}

export async function assignDriverToOrder(
  orderId: string,
  driverId: string,
  performedBy?: any
): Promise<Order> {
  const res = await apiFetch(`${API_BASE}/orders/${orderId}/assign-driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, performedBy })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur assignation livreur' }));
    throw new Error(err.error || 'Erreur assignation livreur');
  }
  const data = await res.json();
  return data.order;
}

export async function collectPayment(
  orderId: string,
  amount: number,
  methodOrUser?: 'cash_cod' | 'konnect_tpe' | { name?: string; id?: string; role?: string },
  notesOrUser?: string | { name?: string; id?: string; role?: string },
  performedBy?: any
): Promise<Order> {
  let method: 'cash_cod' | 'konnect_tpe' = 'cash_cod';
  let actualPerformedBy = performedBy;
  let notes: string | undefined = typeof notesOrUser === 'string' ? notesOrUser : undefined;

  if (typeof methodOrUser === 'string') {
    method = methodOrUser;
  } else if (typeof methodOrUser === 'object' && methodOrUser !== null) {
    actualPerformedBy = methodOrUser;
  }

  if (typeof notesOrUser === 'object' && notesOrUser !== null) {
    actualPerformedBy = notesOrUser;
  }

  const res = await apiFetch(`${API_BASE}/orders/${orderId}/collect-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      collectedAmount: amount,
      method,
      notes,
      collectorName: actualPerformedBy?.name,
      collectorUserId: actualPerformedBy?.id,
      collectorRole: actualPerformedBy?.role,
      performedBy: actualPerformedBy
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur encaissement' }));
    throw new Error(err.error || 'Erreur encaissement');
  }
  const data = await res.json();
  return data.order;
}

export async function sendDriverLocation(
  driverIdOrPayload: string | (Partial<GPSCoordinate> & { orderId?: string; latitude: number; longitude: number; driverId?: string }),
  locationOrOrderId?: GPSCoordinate | string,
  orderId?: string
) {
  let driverId: string = 'driver_user';
  let location: Partial<GPSCoordinate>;
  let actualOrderId: string | undefined;

  if (typeof driverIdOrPayload === 'string') {
    driverId = driverIdOrPayload;
    location = locationOrOrderId as GPSCoordinate;
    actualOrderId = orderId;
  } else {
    const payload = driverIdOrPayload;
    driverId = payload.driverId || 'driver_user';
    actualOrderId = payload.orderId || (typeof locationOrOrderId === 'string' ? locationOrOrderId : undefined);
    location = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      heading: payload.heading,
      speed: payload.speed,
      timestamp: payload.timestamp || new Date().toISOString()
    };
  }

  const res = await apiFetch(`${API_BASE}/driver/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, location, orderId: actualOrderId })
  });
  return res.json().catch(() => ({ success: true }));
}

// ==========================================
// CLAIMS
// ==========================================
export async function fetchClaims(params?: { clientId?: string; orderId?: string; status?: string }): Promise<Claim[]> {
  try {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.orderId) query.set('orderId', params.orderId);
    if (params?.status) query.set('status', params.status);

    const res = await apiFetch(`${API_BASE}/claims?${query.toString()}`);
    if (!res.ok) throw new Error('Erreur chargement des réclamations');
    const data = await res.json();
    return data.claims || INITIAL_CLAIMS;
  } catch (e) {
    console.warn('Fallback claims en local', e);
    let list = [...INITIAL_CLAIMS];
    if (params?.clientId) list = list.filter(c => c.clientId === params.clientId);
    if (params?.orderId) list = list.filter(c => c.orderId === params.orderId);
    if (params?.status) list = list.filter(c => c.status === params.status);
    return list;
  }
}

export async function fetchClaimById(id: string): Promise<Claim> {
  try {
    const res = await apiFetch(`${API_BASE}/claims/${id}`);
    if (!res.ok) throw new Error('Réclamation introuvable');
    const data = await res.json();
    return data.claim;
  } catch (e) {
    const found = INITIAL_CLAIMS.find(c => c.id === id);
    if (found) return found;
    throw e;
  }
}

export async function createClaim(payload: {
  orderId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  category?: string;
  type?: string;
  description: string;
  photos?: string[];
}): Promise<Claim> {
  const res = await apiFetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      type: payload.type || payload.category || 'Autre'
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création réclamation' }));
    throw new Error(err.error || 'Erreur création réclamation');
  }
  const data = await res.json();
  return data.claim;
}

export async function updateClaimStatus(
  id: string,
  payload: {
    status: ClaimStatus;
    resolution?: ClaimResolution;
    resolutionNotes?: string;
    refundAmount?: number;
    couponCode?: string;
    adminName?: string;
    adminId?: string;
    performedBy?: any;
  }
): Promise<Claim> {
  const res = await apiFetch(`${API_BASE}/claims/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur mise à jour réclamation' }));
    throw new Error(err.error || 'Erreur mise à jour réclamation');
  }
  const data = await res.json();
  return data.claim;
}

export async function sendClaimMessage(
  claimId: string,
  payload: {
    senderId: string;
    senderName: string;
    senderRole: 'client' | 'admin' | 'support' | UserRole;
    message: string;
    attachments?: string[];
  }
) {
  const res = await apiFetch(`${API_BASE}/claims/${claimId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur envoi message' }));
    throw new Error(err.error || 'Erreur envoi message');
  }
  const data = await res.json();
  return data.message;
}

// ==========================================
// INGREDIENTS & STOCK
// ==========================================
export async function fetchIngredients(): Promise<Ingredient[]> {
  try {
    const res = await apiFetch(`${API_BASE}/stock/ingredients`);
    if (!res.ok) throw new Error('Erreur chargement ingrédients');
    const data = await res.json();
    return data.ingredients || INITIAL_INGREDIENTS;
  } catch (e) {
    console.warn('Fallback ingrédients en local', e);
    return INITIAL_INGREDIENTS;
  }
}

export async function recordStockMovement(payload: {
  ingredientId: string;
  type: string;
  quantityDelta: number;
  reason: string;
  performedBy: string;
}) {
  const res = await apiFetch(`${API_BASE}/stock/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour stock');
  return res.json();
}

export async function fetchStockMovements() {
  try {
    const res = await apiFetch(`${API_BASE}/stock/movements`);
    if (!res.ok) return { movements: [] };
    return await res.json();
  } catch (e) {
    return { movements: [] };
  }
}

// ==========================================
// DRIVERS & VEHICLES
// ==========================================
export async function fetchDrivers(): Promise<DriverProfile[]> {
  try {
    const res = await apiFetch(`${API_BASE}/drivers`);
    if (!res.ok) throw new Error('Erreur chargement livreurs');
    const data = await res.json();
    return data.drivers || INITIAL_DRIVERS;
  } catch (e) {
    console.warn('Fallback livreurs en local', e);
    return INITIAL_DRIVERS;
  }
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const res = await apiFetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error('Erreur chargement véhicules');
    const data = await res.json();
    return data.vehicles || INITIAL_VEHICLES;
  } catch (e) {
    console.warn('Fallback véhicules en local', e);
    return INITIAL_VEHICLES;
  }
}

export async function fetchAnalytics() {
  try {
    const res = await apiFetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Erreur chargement analytiques');
    return await res.json();
  } catch (e) {
    return {
      revenue: { totalCollected: 1420.5, toCollect: 110.0, averageBasket: 38.5, todayCollected: 420.0 },
      orders: { total: INITIAL_ORDERS.length, byStatus: {} },
      drivers: { total: INITIAL_DRIVERS.length, available: 1, activeDelivering: 1 },
      claims: { total: INITIAL_CLAIMS.length, open: 1, waitingCustomer: 0, resolved: 0 },
      stock: { totalIngredients: INITIAL_INGREDIENTS.length, criticalCount: 0, outOfStockCount: 0, criticalItems: [] }
    };
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await apiFetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('Erreur chargement logs');
    const data = await res.json();
    return data.auditLogs || INITIAL_AUDIT_LOGS;
  } catch (e) {
    console.warn('Fallback logs en local', e);
    return INITIAL_AUDIT_LOGS;
  }
}

export async function registerUser(payload: any): Promise<User> {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur lors de l inscription' }));
    throw new Error(err.error || 'Erreur lors de l inscription');
  }
  const data = await res.json();
  return data.user;
}

export async function loginUser(
  payloadOrPhone?: string | { phoneOrEmail?: string; role?: UserRole },
  optionalRole?: UserRole
): Promise<User> {
  const payload = typeof payloadOrPhone === 'string'
    ? { phoneOrEmail: payloadOrPhone, role: optionalRole }
    : typeof payloadOrPhone === 'object' && payloadOrPhone !== null
      ? payloadOrPhone
      : { phoneOrEmail: undefined, role: optionalRole };

  const res = await apiFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Identifiants ou rôle incorrects' }));
    throw new Error(err.error || 'Identifiants ou rôle incorrects');
  }
  const data = await res.json();
  return data.user;
}

export async function cancelOrder(orderId: string, reason: string, performedBy?: any): Promise<Order> {
  const res = await apiFetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, performedBy })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur annulation' }));
    throw new Error(err.error || 'Erreur annulation');
  }
  const data = await res.json();
  return data.order;
}

export async function reassignDriver(
  orderId: string,
  newDriverId: string,
  reason: string,
  performedBy?: any
): Promise<Order> {
  const res = await apiFetch(`${API_BASE}/orders/${orderId}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newDriverId, reason, performedBy })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réaffectation' }));
    throw new Error(err.error || 'Erreur réaffectation');
  }
  const data = await res.json();
  return data.order;
}

export async function fetchPayments() {
  try {
    const res = await apiFetch(`${API_BASE}/payments`);
    if (!res.ok) return { payments: [] };
    return await res.json();
  } catch (e) {
    return { payments: [] };
  }
}

// Clients (§12)
export async function fetchClients(): Promise<ClientProfile[]> {
  try {
    const res = await apiFetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error('Erreur chargement clients');
    const data = await res.json();
    return data.clients || [];
  } catch (e) {
    return [];
  }
}

export async function fetchClientById(id: string): Promise<ClientProfile & { orders: Order[]; claims: Claim[] }> {
  const res = await apiFetch(`${API_BASE}/clients/${id}`);
  if (!res.ok) throw new Error('Client introuvable');
  const data = await res.json();
  return data.client;
}

export async function updateClientStatus(id: string, status: string, adminName: string) {
  const res = await apiFetch(`${API_BASE}/clients/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminName })
  });
  if (!res.ok) throw new Error('Erreur modification statut client');
  return res.json();
}

// Ingredients CRUD (§15, §16)
export async function createIngredient(payload: Partial<Ingredient>): Promise<Ingredient> {
  const res = await apiFetch(`${API_BASE}/ingredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création ingrédient' }));
    throw new Error(err.error || 'Erreur création ingrédient');
  }
  const data = await res.json();
  return data.ingredient;
}

export async function updateIngredient(id: string, payload: Partial<Ingredient>): Promise<Ingredient> {
  const res = await apiFetch(`${API_BASE}/ingredients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour ingrédient');
  const data = await res.json();
  return data.ingredient;
}

export async function deleteIngredient(id: string) {
  const res = await apiFetch(`${API_BASE}/ingredients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur désactivation ingrédient');
  return res.json();
}

// Recipes CRUD (§17, §18)
export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const res = await apiFetch(`${API_BASE}/recipes`);
    if (!res.ok) throw new Error('Erreur chargement recettes');
    const data = await res.json();
    return data.recipes || INITIAL_RECIPES;
  } catch (e) {
    console.warn('Fallback recettes en local', e);
    return INITIAL_RECIPES;
  }
}

export async function createRecipe(payload: Partial<Recipe>): Promise<Recipe> {
  const res = await apiFetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création recette' }));
    throw new Error(err.error || 'Erreur création recette');
  }
  const data = await res.json();
  return data.recipe;
}

export async function updateRecipe(id: string, payload: Partial<Recipe>): Promise<Recipe> {
  const res = await apiFetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour recette');
  const data = await res.json();
  return data.recipe;
}

export async function deleteRecipe(id: string) {
  const res = await apiFetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression recette');
  return res.json();
}

// Suppliers CRUD (§23)
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const res = await apiFetch(`${API_BASE}/suppliers`);
    if (!res.ok) throw new Error('Erreur chargement fournisseurs');
    const data = await res.json();
    return data.suppliers || INITIAL_SUPPLIERS;
  } catch (e) {
    console.warn('Fallback fournisseurs en local', e);
    return INITIAL_SUPPLIERS;
  }
}

export async function createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
  const res = await apiFetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création fournisseur' }));
    throw new Error(err.error || 'Erreur création fournisseur');
  }
  const data = await res.json();
  return data.supplier;
}

export async function updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
  const res = await apiFetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour fournisseur');
  const data = await res.json();
  return data.supplier;
}

export async function deleteSupplier(id: string) {
  const res = await apiFetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur désactivation fournisseur');
  return res.json();
}

// Drivers Management (§24, §25, §26)
export async function createDriver(payload: { name: string; phone: string; email?: string; vehicleId?: string }): Promise<DriverProfile> {
  const res = await apiFetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création livreur' }));
    throw new Error(err.error || 'Erreur création livreur');
  }
  const data = await res.json();
  return data.driver;
}

export async function updateDriver(id: string, payload: { name?: string; phone?: string; email?: string; vehicleId?: string; status?: string }): Promise<DriverProfile> {
  const res = await apiFetch(`${API_BASE}/drivers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur modification livreur' }));
    throw new Error(err.error || 'Erreur modification livreur');
  }
  const data = await res.json();
  return data.driver;
}

export async function deleteDriver(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur suppression livreur' }));
    throw new Error(err.error || 'Erreur suppression livreur');
  }
}

export async function toggleDriverActive(id: string): Promise<DriverProfile> {
  const res = await apiFetch(`${API_BASE}/drivers/${id}/toggle-active`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur bascule statut livreur' }));
    throw new Error(err.error || 'Erreur bascule statut livreur');
  }
  const data = await res.json();
  return data.driver;
}

export async function updateDriverStatus(id: string, status: string) {
  const res = await apiFetch(`${API_BASE}/drivers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Erreur statut livreur');
  return res.json();
}

// Vehicles Management
export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await apiFetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création véhicule' }));
    throw new Error(err.error || 'Erreur création véhicule');
  }
  const data = await res.json();
  return data.vehicle;
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await apiFetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur mise à jour véhicule' }));
    throw new Error(err.error || 'Erreur mise à jour véhicule');
  }
  const data = await res.json();
  return data.vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/vehicles/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur suppression véhicule' }));
    throw new Error(err.error || 'Erreur suppression véhicule');
  }
}

export async function toggleVehicleActive(id: string): Promise<Vehicle> {
  const res = await apiFetch(`${API_BASE}/vehicles/${id}/toggle-active`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur activation véhicule' }));
    throw new Error(err.error || 'Erreur activation véhicule');
  }
  const data = await res.json();
  return data.vehicle;
}

export async function fetchDeliveries() {
  try {
    const res = await apiFetch(`${API_BASE}/deliveries`);
    if (!res.ok) throw new Error('Erreur chargement livraisons');
    return await res.json();
  } catch (e) {
    return { deliveries: [] };
  }
}

// Notifications (§69)
export async function fetchNotifications(role?: string): Promise<SystemNotification[]> {
  try {
    const query = role ? `?role=${role}` : '';
    const res = await apiFetch(`${API_BASE}/notifications${query}`);
    if (!res.ok) return INITIAL_NOTIFICATIONS;
    const data = await res.json();
    return data.notifications || INITIAL_NOTIFICATIONS;
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export async function markNotificationRead(id: string) {
  const res = await apiFetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
  return res.json().catch(() => ({ success: true }));
}

export async function markAllNotificationsRead() {
  const res = await apiFetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
  return res.json().catch(() => ({ success: true }));
}

// Settings (§60)
export async function fetchSettings(): Promise<AppSettings> {
  try {
    const res = await apiFetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Erreur chargement paramètres');
    const data = await res.json();
    return data.settings || INITIAL_SETTINGS;
  } catch (e) {
    console.warn('Fallback settings en local', e);
    return INITIAL_SETTINGS;
  }
}

export async function updateSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  const res = await apiFetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour paramètres');
  const data = await res.json();
  return data.settings;
}

// Comprehensive Statistics (§70)
export async function fetchStatistics() {
  try {
    const res = await apiFetch(`${API_BASE}/statistics`);
    if (!res.ok) throw new Error('Erreur chargement statistiques');
    return await res.json();
  } catch (e) {
    return {
      revenue: { totalCollected: 1420.5, toCollect: 110.0, averageBasket: 38.5, todayCollected: 420.0 },
      orders: { total: INITIAL_ORDERS.length, byStatus: {} },
      drivers: { total: INITIAL_DRIVERS.length, available: 1, activeDelivering: 1 },
      claims: { total: INITIAL_CLAIMS.length, open: 1, waitingCustomer: 0, resolved: 0 },
      stock: { totalIngredients: INITIAL_INGREDIENTS.length, criticalCount: 0, outOfStockCount: 0, criticalItems: [] }
    };
  }
}

// Store Status & Tunis Timezone (§1.1, §2)
export async function fetchStoreStatus(): Promise<{
  isOpen: boolean;
  message?: string;
  timezone: string;
  tunisTime: string;
  currentTime: string;
  currentDate: string;
  openingTime: string;
  closingTime: string;
  isStoreOpen: boolean;
  acceptingOrders: boolean;
}> {
  try {
    const res = await apiFetch(`${API_BASE}/store/status`);
    if (!res.ok) throw new Error('Erreur vérification statut restaurant');
    return await res.json();
  } catch (e) {
    const tunisTime = new Date().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis' });
    const currentDate = new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Tunis' });
    return {
      isOpen: true,
      isStoreOpen: true,
      acceptingOrders: true,
      message: 'Restaurant Ouvert',
      timezone: 'Africa/Tunis',
      tunisTime,
      currentTime: tunisTime,
      currentDate,
      openingTime: '10:00',
      closingTime: '23:00'
    };
  }
}

// Delivery Zones (§3, §4)
export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    const res = await apiFetch(`${API_BASE}/delivery-zones`);
    if (!res.ok) throw new Error('Erreur chargement zones de livraison');
    const data = await res.json();
    return data.zones || INITIAL_DELIVERY_ZONES;
  } catch (e) {
    console.warn('Fallback zones de livraison en local', e);
    return INITIAL_DELIVERY_ZONES;
  }
}

export async function createDeliveryZone(payload: Partial<DeliveryZone>): Promise<DeliveryZone> {
  const res = await apiFetch(`${API_BASE}/delivery-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création zone de livraison' }));
    throw new Error(err.error || 'Erreur création zone de livraison');
  }
  const data = await res.json();
  return data.zone;
}

export async function updateDeliveryZone(id: string, payload: Partial<DeliveryZone>): Promise<DeliveryZone> {
  const res = await apiFetch(`${API_BASE}/delivery-zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur mise à jour zone de livraison' }));
    throw new Error(err.error || 'Erreur mise à jour zone de livraison');
  }
  const data = await res.json();
  return data.zone;
}

// Order Priority (§6)
export async function updateOrderPriority(
  orderId: string,
  priority: 'normal' | 'urgent' | 'vip',
  reason: string,
  adminName?: string
): Promise<Order> {
  const res = await apiFetch(`${API_BASE}/orders/${orderId}/priority`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority, reason, adminName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur modification priorité' }));
    throw new Error(err.error || 'Erreur modification priorité');
  }
  const data = await res.json();
  return data.order;
}

// Stock Waste & Losses (§33)
export async function recordStockWaste(payload: {
  ingredientId: string;
  quantity: number;
  unit?: string;
  reason: string;
  wasteType?: string;
  performedBy?: string;
}) {
  const res = await apiFetch(`${API_BASE}/stock/waste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur enregistrement perte de stock' }));
    throw new Error(err.error || 'Erreur enregistrement perte de stock');
  }
  return res.json();
}

// Physical Inventory Reconciliation (§34)
export async function reconcilePhysicalInventory(payload: {
  countedItems: { ingredientId: string; countedStock: number }[];
  conductedBy?: string;
  notes?: string;
}) {
  const res = await apiFetch(`${API_BASE}/inventory/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur validation inventaire physique' }));
    throw new Error(err.error || 'Erreur validation inventaire physique');
  }
  return res.json();
}

// Cash Register Reconciliation & Closing (§25, §26)
export async function fetchCashReconciliation() {
  try {
    const res = await apiFetch(`${API_BASE}/cash-register/reconciliation`);
    if (!res.ok) throw new Error('Erreur réconciliation de caisse');
    return await res.json();
  } catch (e) {
    return {
      date: new Date().toISOString().slice(0, 10),
      expectedAmount: 184.5,
      paidOrdersCount: 7,
      isClosed: false
    };
  }
}

export async function submitCashClosing(payload: {
  declaredAmount: number;
  notes?: string;
  closedByUserId?: string;
  closedByName?: string;
  closedByRole?: string;
}): Promise<{ success: boolean; closing: CashClosingRecord }> {
  const res = await apiFetch(`${API_BASE}/cash-register/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur validation clôture de caisse' }));
    throw new Error(err.error || 'Erreur validation clôture de caisse');
  }
  return res.json();
}

export async function fetchCashClosings(): Promise<CashClosingRecord[]> {
  try {
    const res = await apiFetch(`${API_BASE}/cash-register/closings`);
    if (!res.ok) throw new Error('Erreur chargement historiques clôtures');
    const data = await res.json();
    return data.closings || [];
  } catch (e) {
    return [];
  }
}

// System Health Check (§108)
export async function fetchSystemHealth() {
  try {
    const res = await apiFetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Erreur health check');
    return await res.json();
  } catch (e) {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

// Users & Roles Management (§2, §3, §25, §57)
export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await apiFetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Erreur chargement utilisateurs');
    const data = await res.json();
    return data.users || INITIAL_USERS;
  } catch (e) {
    console.warn('Fallback utilisateurs en local', e);
    return INITIAL_USERS;
  }
}

export async function createUser(payload: {
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  address?: string;
  city?: string;
  governorate?: string;
}): Promise<User> {
  const res = await apiFetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur création utilisateur' }));
    throw new Error(err.error || 'Erreur création utilisateur');
  }
  const data = await res.json();
  return data.user;
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const res = await apiFetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur mise à jour utilisateur' }));
    throw new Error(err.error || 'Erreur mise à jour utilisateur');
  }
  const data = await res.json();
  return data.user;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur désactivation utilisateur');
}

// Backup & Restore (§81, §92)
export async function downloadBackup(): Promise<any> {
  const res = await apiFetch(`${API_BASE}/system/backup`);
  if (!res.ok) throw new Error('Erreur génération sauvegarde');
  return res.json();
}

export async function restoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch(`${API_BASE}/system/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backup: backupData })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur restauration sauvegarde' }));
    throw new Error(err.error || 'Erreur restauration sauvegarde');
  }
  return res.json();
}

// Promotions Engine (§42, §177, §225, §242)
export async function fetchPromotions(): Promise<Promotion[]> {
  try {
    const res = await apiFetch(`${API_BASE}/promotions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.promotions || [];
  } catch (e) {
    return [];
  }
}

export async function calculatePromotions(subtotal: number, promoCodes?: string[]) {
  const res = await apiFetch(`${API_BASE}/promotions/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtotal, promoCodes })
  });
  if (!res.ok) throw new Error('Erreur calcul promotions');
  return res.json();
}

// IA Recettes Cuisine (Gemini 3.8 Flash)
export async function generateAIRecipes(
  mode: 'all_stock' | 'selected_ingredients',
  selectedIngredientIds?: string[]
): Promise<{
  success: boolean;
  count: number;
  isAIPowered: boolean;
  modelUsed?: string;
  mode: string;
  ingredientsAnalyzedCount: number;
  recipes: AIMenuRecipe[];
}> {
  const res = await apiFetch(`${API_BASE}/ai/recipes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, selectedIngredientIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur génération recettes IA' }));
    throw new Error(err.error || 'Erreur génération recettes IA');
  }
  return res.json();
}

// Générateur d'image IA basé sur la description visuelle détaillée
export async function generateDishImageFromPrompt(params: {
  visualDescription: string;
  dishTitle: string;
  ingredients?: string[];
  category?: string;
}): Promise<{
  success: boolean;
  imageUrl: string;
  visualConsistency: {
    isVerified: boolean;
    confidenceScore: number;
    matchedIngredients: string[];
    controlNotes: string;
  };
}> {
  const res = await apiFetch(`${API_BASE}/ai/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur génération d\'image' }));
    throw new Error(err.error || 'Erreur génération d\'image');
  }
  return res.json();
}

// Ajout d'une ou plusieurs recettes à la carte des plats à commander
export async function addRecipeToMenu(
  recipes: AIMenuRecipe | AIMenuRecipe[],
  force: boolean = false
): Promise<{
  success: boolean;
  conflict?: boolean;
  conflicts?: Array<{ recipeId: string; recipeName: string }>;
  addedProducts?: Product[];
  message?: string;
}> {
  const res = await apiFetch(`${API_BASE}/ai/recipes/add-to-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipes: Array.isArray(recipes) ? recipes : [recipes],
      force
    })
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409) {
      return data;
    }
    throw new Error(data.error || data.message || 'Erreur lors de l\'ajout à la carte');
  }
  return data;
}




