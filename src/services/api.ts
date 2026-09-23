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
  ClientProfile
} from '../types';

const API_BASE = '/api';

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Erreur chargement des catégories');
  const data = await res.json();
  return data.categories;
}

export async function createCategory(payload: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création catégorie');
  const data = await res.json();
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour catégorie');
  const data = await res.json();
  return data.category;
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression catégorie');
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Erreur chargement des produits');
  const data = await res.json();
  return data.products;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur création produit');
  const data = await res.json();
  return data.product;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour produit');
  const data = await res.json();
  return data.product;
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression produit');
  return res.json();
}

export async function fetchOrders(params?: { clientId?: string; driverId?: string; status?: string }): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.driverId) query.set('driverId', params.driverId);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
  if (!res.ok) throw new Error('Erreur chargement des commandes');
  const data = await res.json();
  return data.orders;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`);
  if (!res.ok) throw new Error('Commande introuvable');
  const data = await res.json();
  return data.order;
}

export async function fetchTrackingByToken(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/tracking/${token}`);
  if (!res.ok) throw new Error('Code de suivi introuvable');
  const data = await res.json();
  return data.tracking;
}

export async function createOrder(payload: any): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de la création de la commande');
  }
  const data = await res.json();
  return data.order;
}

export async function updateOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  performer: { id?: string; name?: string; role?: string }
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nextStatus,
      performedByUserId: performer.id,
      performedByName: performer.name,
      performedByRole: performer.role
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur mise à jour statut');
  }
  const data = await res.json();
  return data.order;
}

export async function assignDriver(
  orderId: string,
  driverId: string,
  admin: { id: string; name: string }
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/assign-driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driverId,
      performedByUserId: admin.id,
      performedByName: admin.name
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur affectation livreur');
  }
  const data = await res.json();
  return data.order;
}

export async function collectPayment(
  orderId: string,
  amount: number,
  collector: { name: string; id: string; role: string }
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/collect-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collectedAmount: amount,
      collectorName: collector.name,
      collectorUserId: collector.id,
      collectorRole: collector.role
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur encaissement');
  }
  const data = await res.json();
  return data.order;
}

export async function sendDriverLocation(payload: {
  orderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}): Promise<GPSCoordinate> {
  const res = await fetch(`${API_BASE}/driver/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur envoi position GPS');
  }
  const data = await res.json();
  return data.location;
}

export async function fetchClaims(params?: { clientId?: string; orderId?: string; status?: string }): Promise<Claim[]> {
  const query = new URLSearchParams();
  if (params?.clientId) query.set('clientId', params.clientId);
  if (params?.orderId) query.set('orderId', params.orderId);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/claims?${query.toString()}`);
  if (!res.ok) throw new Error('Erreur chargement réclamations');
  const data = await res.json();
  return data.claims;
}

export async function fetchClaimById(id: string): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims/${id}`);
  if (!res.ok) throw new Error('Réclamation introuvable');
  const data = await res.json();
  return data.claim;
}

export async function createClaim(payload: {
  orderId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: string;
  description: string;
  photos: string[];
}): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création réclamation');
  }
  const data = await res.json();
  return data.claim;
}

export async function updateClaimStatus(
  id: string,
  payload: {
    status?: ClaimStatus;
    resolution?: ClaimResolution;
    resolutionNotes?: string;
    adminName: string;
    adminId: string;
  }
): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
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
    senderRole: string;
    message: string;
    attachments?: string[];
  }
) {
  const res = await fetch(`${API_BASE}/claims/${claimId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur envoi message');
  }
  const data = await res.json();
  return data.message;
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await fetch(`${API_BASE}/stock/ingredients`);
  if (!res.ok) throw new Error('Erreur chargement ingrédients');
  const data = await res.json();
  return data.ingredients;
}

export async function recordStockMovement(payload: {
  ingredientId: string;
  type: string;
  quantityDelta: number;
  reason: string;
  performedBy: string;
}) {
  const res = await fetch(`${API_BASE}/stock/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour stock');
  return res.json();
}

export async function fetchStockMovements() {
  const res = await fetch(`${API_BASE}/stock/movements`);
  if (!res.ok) return { movements: [] };
  return res.json();
}

export async function fetchDrivers(): Promise<DriverProfile[]> {
  const res = await fetch(`${API_BASE}/drivers`);
  if (!res.ok) throw new Error('Erreur chargement livreurs');
  const data = await res.json();
  return data.drivers;
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Erreur chargement véhicules');
  const data = await res.json();
  return data.vehicles;
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Erreur chargement analytiques');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Erreur chargement logs');
  const data = await res.json();
  return data.auditLogs;
}

export async function registerUser(payload: any): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de l inscription');
  }
  const data = await res.json();
  return data.user;
}

export async function loginUser(phoneOrEmail?: string, role?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail, role })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Échec de connexion');
  }
  const data = await res.json();
  return data.user;
}

// Order Cancellation (§9)
export async function cancelOrder(orderId: string, reason: string, user: { id: string; name: string; role: string }): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason,
      cancelledByUserId: user.id,
      cancelledByName: user.name,
      cancelledByRole: user.role
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur annulation commande');
  }
  const data = await res.json();
  return data.order;
}

// Order Reassignment (§8)
export async function reassignDriver(orderId: string, newDriverId: string, reason: string, admin: { id: string; name: string }): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/reassign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      newDriverId,
      reason,
      adminId: admin.id,
      adminName: admin.name
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur réaffectation livreur');
  }
  const data = await res.json();
  return data.order;
}

// Payments (§28)
export async function fetchPayments() {
  const res = await fetch(`${API_BASE}/payments`);
  if (!res.ok) throw new Error('Erreur chargement paiements');
  return res.json();
}

// Clients (§12)
export async function fetchClients(): Promise<ClientProfile[]> {
  const res = await fetch(`${API_BASE}/clients`);
  if (!res.ok) throw new Error('Erreur chargement clients');
  const data = await res.json();
  return data.clients;
}

export async function fetchClientById(id: string): Promise<ClientProfile & { orders: Order[]; claims: Claim[] }> {
  const res = await fetch(`${API_BASE}/clients/${id}`);
  if (!res.ok) throw new Error('Client introuvable');
  const data = await res.json();
  return data.client;
}

export async function updateClientStatus(id: string, status: string, adminName: string) {
  const res = await fetch(`${API_BASE}/clients/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminName })
  });
  if (!res.ok) throw new Error('Erreur modification statut client');
  return res.json();
}

// Ingredients (§15, §16)
export async function createIngredient(payload: Partial<Ingredient>): Promise<Ingredient> {
  const res = await fetch(`${API_BASE}/ingredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création ingrédient');
  }
  const data = await res.json();
  return data.ingredient;
}

export async function updateIngredient(id: string, payload: Partial<Ingredient>): Promise<Ingredient> {
  const res = await fetch(`${API_BASE}/ingredients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour ingrédient');
  const data = await res.json();
  return data.ingredient;
}

export async function deleteIngredient(id: string) {
  const res = await fetch(`${API_BASE}/ingredients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur désactivation ingrédient');
  return res.json();
}

// Recipes (§17, §18)
export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error('Erreur chargement recettes');
  const data = await res.json();
  return data.recipes;
}

export async function createRecipe(payload: Partial<Recipe>): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création recette');
  }
  const data = await res.json();
  return data.recipe;
}

export async function updateRecipe(id: string, payload: Partial<Recipe>): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour recette');
  const data = await res.json();
  return data.recipe;
}

export async function deleteRecipe(id: string) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression recette');
  return res.json();
}

// Suppliers (§23)
export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${API_BASE}/suppliers`);
  if (!res.ok) throw new Error('Erreur chargement fournisseurs');
  const data = await res.json();
  return data.suppliers;
}

export async function createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
  const res = await fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création fournisseur');
  }
  const data = await res.json();
  return data.supplier;
}

export async function updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour fournisseur');
  const data = await res.json();
  return data.supplier;
}

export async function deleteSupplier(id: string) {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur désactivation fournisseur');
  return res.json();
}

// Drivers & Vehicles (§24, §25, §26)
export async function createDriver(payload: { name: string; phone: string; email?: string; vehicleId?: string }): Promise<DriverProfile> {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création livreur');
  }
  const data = await res.json();
  return data.driver;
}

export async function updateDriverStatus(id: string, status: string) {
  const res = await fetch(`${API_BASE}/drivers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Erreur statut livreur');
  return res.json();
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur création véhicule');
  }
  const data = await res.json();
  return data.vehicle;
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour véhicule');
  const data = await res.json();
  return data.vehicle;
}

// Active Deliveries for Admin Map (§34)
export async function fetchDeliveries() {
  const res = await fetch(`${API_BASE}/deliveries`);
  if (!res.ok) throw new Error('Erreur chargement livraisons');
  return res.json();
}

// Notifications (§69)
export async function fetchNotifications(role?: string): Promise<SystemNotification[]> {
  const query = role ? `?role=${role}` : '';
  const res = await fetch(`${API_BASE}/notifications${query}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.notifications;
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
  return res.json();
}

// Settings (§60)
export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Erreur chargement paramètres');
  const data = await res.json();
  return data.settings;
}

export async function updateSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
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
  const res = await fetch(`${API_BASE}/statistics`);
  if (!res.ok) throw new Error('Erreur chargement statistiques');
  return res.json();
}
