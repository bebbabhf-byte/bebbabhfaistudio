export type UserRole = 'client' | 'kitchen' | 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string; // Formatted international ID, e.g. "0021698123456"
  rawPhone?: string; // "+216 98 123 456"
  role: UserRole;
  address?: string;
  city?: string;
  governorate?: string;
  status?: 'active' | 'suspended' | 'inactive';
  createdAt: string;
}

export interface ClientProfile extends User {
  totalOrders: number;
  totalSpent: number;
  activeOrdersCount: number;
  claimsCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  status: 'active' | 'inactive';
  suppliedIngredients?: string[];
  notes?: string;
  createdAt: string;
}

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number; // e.g. +3.5 DT
  category: 'protein' | 'vegetable' | 'base' | 'supplement' | 'sauce';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number; // in TND / DT
  image: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  isAvailable: boolean;
  availableOptions: ProductOption[];
  recipeId?: string;
  displayOrder?: number;
}

export interface OrderItemOption {
  optionId: string;
  name: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: OrderItemOption[];
  itemTotal: number;
  specialInstructions?: string;
  recipeVersion?: string;
}

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'waiting_for_driver'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'to_collect' | 'paid';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface DriverAssignment {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  assignedAt: string;
  status: 'assigned' | 'in_transit' | 'completed' | 'reassigned';
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "BEBBA-2026-1042"
  clientId?: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryNotes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  paidBy?: string;
  collectedAmount?: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehicle?: string;
  trackingToken: string; // 8 characters e.g. "AB7K92QX"
  stockConsumed?: boolean; // Règle #10 : Idempotence consommation stock
  discountAmount?: number; // Règle #11 : Montant total des promotions appliquées
  promotionsApplied?: Array<{
    id: string;
    name: string;
    code?: string;
    discount: number;
    appliedAt: string;
  }>;
  currentLocation?: GPSCoordinate;
  locationHistory?: GPSCoordinate[];
  createdAt: string;
  updatedAt: string;
  preparedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  estimatedDeliveryTime?: string;
  prepStartedAt?: string;
  prepCompletedAt?: string;
  priority?: 'normal' | 'urgent' | 'vip';
  priorityReason?: string;
  reassignmentHistory?: Array<{
    oldDriverId: string;
    oldDriverName: string;
    newDriverId: string;
    newDriverName: string;
    reassignedBy: string;
    reassignedAt: string;
  }>;
}

export interface Promotion {
  id: string;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10% or 5 for 5 DT
  minOrderAmount?: number;
  isActive: boolean;
  createdAt: string; // ISO date, used to sort: newest first (Règle #11)
}

export type ClaimType =
  | 'Produit incorrect'
  | 'Produit manquant'
  | 'Produit endommagé'
  | 'Quantité incorrecte'
  | 'Problème de qualité'
  | 'Commande incomplète'
  | 'Problème de livraison'
  | 'Problème de paiement'
  | 'Autre';

// Statuts officiels de réclamation (§36, §139, §247) : Casse obligatoire en MAJUSCULES
export type ClaimStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'RESOLVED'
  | 'CLOSED';

export type ClaimResolution =
  | 'Aucune action'
  | 'Remboursement'
  | 'Remplacement'
  | 'Avoir'
  | 'Geste commercial'
  | 'Autre';

export interface ClaimMessage {
  id: string;
  claimId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachments?: string[];
  createdAt: string;
  readAt?: string;
}

export interface Claim {
  id: string;
  claimNumber: string; // e.g. "REC-2026-00017"
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: ClaimType;
  description: string;
  photos: string[]; // URLs or base64 images
  status: ClaimStatus;
  resolution?: ClaimResolution;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  messages: ClaimMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'L' | 'pièce';
  unitCost: number; // in TND
  currentStock: number;
  minThreshold: number;
  supplierId?: string;
  supplierName?: string;
  status: 'optimal' | 'low' | 'out_of_stock';
  category?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost?: number;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  ingredients: RecipeIngredient[];
  theoreticalCost?: number;
}

export type StockMovementType =
  | 'purchase'
  | 'restock'
  | 'consumption'
  | 'adjustment'
  | 'waste'
  | 'return';

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMovementType;
  quantityDelta: number; // negative for consumption/waste, positive for restock
  unit: string;
  beforeQuantity?: number;
  afterQuantity?: number;
  unitCost?: number;
  supplierName?: string;
  orderId?: string;
  reason?: string;
  performedBy: string;
  createdAt: string;
}

export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'INACTIVE';

export interface Vehicle {
  id: string;
  type: 'Moto' | 'Voiture' | 'Scooter';
  licensePlate: string;
  model: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  status: 'active' | 'maintenance' | 'inactive' | VehicleStatus;
  year?: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleId?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  status: 'available' | 'busy' | 'offline' | 'suspended' | 'inactive';
  activeOrderId?: string;
  currentLocation?: GPSCoordinate;
  completedDeliveriesToday: number;
  collectedAmountToday: number;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'order' | 'kitchen' | 'delivery' | 'claim' | 'stock' | 'auth' | 'system';
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'DRIVER_ASSIGNED'
  | 'DELIVERY_STARTED'
  | 'DRIVER_LOCATION_UPDATED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'CLAIM_CREATED'
  | 'CLAIM_MESSAGE_RECEIVED'
  | 'CLAIM_RESOLVED'
  | 'STOCK_ALERT';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetRole: UserRole | 'all';
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export interface AppSettings {
  restaurantName: string;
  slogan: string;
  currency: string;
  defaultDeliveryFee: number;
  minOrderAmount: number;
  stockAlertThresholdDefault: number;
  contactPhone: string;
  contactEmail: string;
  address: string;
  isStoreOpen: boolean;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  vatRate?: number;
  openingTime?: string;
  closingTime?: string;
  acceptingOrders?: boolean;
  autoAssignDrivers?: boolean;
  timezone?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  active: boolean;
  deliveryFee: number;
  minOrderAmount: number;
  estimatedMinutes: number;
  description?: string;
}

export interface CashClosingRecord {
  id: string;
  closingNumber: string;
  closingDate: string;
  periodStart: string;
  periodEnd: string;
  theoreticalAmount: number;
  declaredAmount: number;
  discrepancy: number;
  deliveredOrdersCount: number;
  paidOrdersCount: number;
  pendingCollectCount: number;
  closedBy: {
    id: string;
    name: string;
    role: string;
  };
  notes?: string;
  status: 'validated' | 'discrepancy_reported';
  createdAt: string;
}

export interface PhysicalInventoryCheck {
  id: string;
  date: string;
  conductedBy: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    unit: string;
    theoreticalStock: number;
    countedStock: number;
    difference: number;
    unitCost: number;
    costImpact: number;
  }[];
  totalCostImpact: number;
  status: 'submitted' | 'adjusted';
}

export interface AIMenuRecipe {
  id: string;
  name: string;
  tagline: string;
  category: 'Bowl' | 'Salade' | 'Plat chaud' | 'Wrap & Sandwich' | 'Soupe & Velouté' | 'Snack Healthy';
  prepTimeMinutes: number;
  calories: number;
  proteinGrams: number;
  image?: string;
  healthBenefits: string[];
  ingredientsUsed: {
    ingredientName: string;
    quantityEstimated: string;
    inStock: boolean;
  }[];
  chefInstructions: string[];
  dietaryTags: string[];
}

