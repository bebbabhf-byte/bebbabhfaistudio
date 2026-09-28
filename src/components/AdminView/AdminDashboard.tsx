import React, { useState, useEffect, useRef } from 'react';
import {
  Order,
  Claim,
  DriverProfile,
  Ingredient,
  Vehicle,
  AuditLog,
  ClaimStatus,
  ClaimResolution
} from '../../types';
import {
  fetchOrders,
  fetchClaims,
  fetchDrivers,
  fetchVehicles,
  fetchIngredients,
  fetchAuditLogs,
  fetchNotifications,
  assignDriver,
  updateClaimStatus,
  sendClaimMessage,
  recordStockMovement,
  collectPayment
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Package,
  Bike,
  ChefHat,
  MessageSquareWarning,
  DollarSign,
  Layers,
  History,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  X,
  Send,
  Camera,
  RefreshCw,
  Plus,
  Bell,
  Navigation,
  Utensils,
  Tag,
  Users,
  Truck,
  Sliders,
  RotateCcw,
  BarChart3,
  MapPin,
  ClipboardList,
  Sparkles,
  Trash2
} from 'lucide-react';

import { CatalogTab } from './CatalogTab';
import { ClientsTab } from './ClientsTab';
import { SuppliersTab } from './SuppliersTab';
import { RecipesTab } from './RecipesTab';
import { StatisticsTab } from './StatisticsTab';
import { LiveMapTab } from './LiveMapTab';
import { SettingsTab } from './SettingsTab';
import { NotificationsDrawer } from './NotificationsDrawer';
import { CancelOrderModal, ReassignDriverModal, PriorityOrderModal } from './OrderActionModals';
import { StockWasteModal, PhysicalInventoryModal } from './StockActionModals';
import { DeliveryZonesTab } from './DeliveryZonesTab';
import { CashClosingTab } from './CashClosingTab';
import { UsersTab } from './UsersTab';
import { StockTab } from './StockTab';
import { AuditTab } from './AuditTab';
import { FleetTab } from './FleetTab';
import { OrderDetailModal } from './OrderDetailModal';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents';

export type AdminTab =
  | 'orders'
  | 'live_map'
  | 'claims'
  | 'catalog'
  | 'recipes'
  | 'stock'
  | 'suppliers'
  | 'clients'
  | 'users'
  | 'zones'
  | 'cash_register'
  | 'fleet'
  | 'statistics'
  | 'settings'
  | 'audit';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications Drawer
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Modals
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [orderToReassign, setOrderToReassign] = useState<Order | null>(null);
  const [orderToPrioritize, setOrderToPrioritize] = useState<Order | null>(null);
  const [orderForDetail, setOrderForDetail] = useState<Order | null>(null);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  // Driver Assignment Modal
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Claim Detail / Chat Drawer
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [claimReplyText, setClaimReplyText] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<ClaimResolution>('Avoir');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Stock Restock Modal
  const [restockIngredient, setRestockIngredient] = useState<Ingredient | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(loadAllAdminData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Server-Sent Events (SSE) for real-time dashboard updates
  useRealtimeEvents('all', (event) => {
    if (
      event.type.startsWith('order_') ||
      event.type === 'payment_collected' ||
      event.type === 'delivery_completed'
    ) {
      loadAllAdminData();
    } else if (event.type.startsWith('claim_')) {
      loadAllAdminData();
    } else if (event.type === 'stock_updated') {
      fetchIngredients().then(setIngredients).catch(console.error);
    } else if (event.type === 'system_notification') {
      setUnreadNotifsCount(prev => prev + 1);
    } else if (event.type === 'audit_log') {
      setAuditLogs(prev => [event.data, ...prev]);
    }
  });

  const loadAllAdminData = async () => {
    try {
      const [ordList, clmList, drvList, vehList, ingList, logs, notifs] = await Promise.all([
        fetchOrders(),
        fetchClaims(),
        fetchDrivers(),
        fetchVehicles(),
        fetchIngredients(),
        fetchAuditLogs(),
        fetchNotifications('admin')
      ]);
      setOrders(ordList);
      setClaims(clmList);
      setDrivers(drvList);
      setVehicles(vehList);
      setIngredients(ingList);
      setAuditLogs(logs);
      setUnreadNotifsCount(notifs.filter(n => !n.read).length);

      if (selectedClaim) {
        const freshClaim = clmList.find(c => c.id === selectedClaim.id);
        if (freshClaim) setSelectedClaim(freshClaim);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.collectedAmount || o.totalAmount), 0);
  const toCollect = orders
    .filter(o => o.paymentStatus === 'to_collect' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeDeliveriesCount = orders.filter(o => o.orderStatus === 'delivering').length;
  const inKitchenCount = orders.filter(o => o.orderStatus === 'received' || o.orderStatus === 'preparing').length;
  const openClaimsCount = claims.filter(c => c.status === 'OPEN' || c.status === 'IN_REVIEW').length;

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToAssign || !selectedDriverId) return;

    try {
      await assignDriver(orderToAssign.id, selectedDriverId, {
        id: currentUser.id,
        name: currentUser.name
      });
      showSuccess(`Commande ${orderToAssign.orderNumber} affectée au livreur.`);
      setOrderToAssign(null);
      setSelectedDriverId('');
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Erreur affectation livreur');
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !claimReplyText.trim()) return;

    try {
      await sendClaimMessage(selectedClaim.id, {
        senderId: currentUser.id,
        senderName: 'Bebba Direction',
        senderRole: 'admin',
        message: claimReplyText.trim()
      });
      showSuccess('Réponse envoyée au client.');
      setClaimReplyText('');
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Erreur envoi réponse');
    }
  };

  const handleResolveClaim = async (status: ClaimStatus) => {
    if (!selectedClaim) return;
    try {
      await updateClaimStatus(selectedClaim.id, {
        status,
        resolution: selectedResolution,
        resolutionNotes: resolutionNotes.trim() || undefined,
        adminName: currentUser.name,
        adminId: currentUser.id
      });
      loadAllAdminData();
      showSuccess(`Réclamation ${selectedClaim.claimNumber} mise à jour avec succès.`);
    } catch (err: any) {
      showError(err.message || 'Erreur mise à jour réclamation');
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockIngredient || !restockQuantity) return;

    try {
      await recordStockMovement({
        ingredientId: restockIngredient.id,
        type: 'restock',
        quantityDelta: restockQuantity,
        reason: 'Réapprovisionnement fournisseur direct',
        performedBy: currentUser.name
      });
      showSuccess(`Réapprovisionnement enregistré (+${restockQuantity} ${restockIngredient.unit}).`);
      setRestockIngredient(null);
      loadAllAdminData();
    } catch (err: any) {
      showError(err.message || 'Erreur restock');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientPhone.includes(searchQuery);
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Administration Centrale BEBBA</h1>
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Supervision des commandes, affectation des livreurs, résolution des réclamations et gestion des stocks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Notifications système"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-stone-900">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            onClick={loadAllAdminData}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards: Spec §43 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Encaissé (COD)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono mt-2">
            {totalRevenue.toFixed(2)} <span className="text-xs font-semibold text-emerald-600">DT</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            À encaisser : <span className="font-bold text-amber-600">{toCollect.toFixed(2)} DT</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>En Cuisine (KDS)</span>
            <ChefHat className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {inKitchenCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Nouvelles & en préparation
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>En Livraison GPS</span>
            <Bike className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {activeDeliveriesCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            {drivers.filter(d => d.status === 'busy').length} livreur(s) en transit
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Réclamations Actives</span>
            <MessageSquareWarning className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {openClaimsCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Sur {claims.length} dossier(s) au total
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('live_map')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'live_map'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Carte Flotte GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          <span>Réclamations ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu & Plats</span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recipes'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Fiches Recettes</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stock'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stocks ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'suppliers'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fournisseurs</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'clients'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clients</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Utilisateurs & RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'zones'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Zones Livraison</span>
        </button>

        <button
          onClick={() => setActiveTab('cash_register')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cash_register'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Caisse & Clôture</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'fleet'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Flotte ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'statistics'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Statistiques</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Paramètres</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & ASSIGNMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher N° commande, client, tel..."
                className="w-full pl-9 p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="received">Received (Nouvelle)</option>
                <option value="preparing">Preparing (Cuisine)</option>
                <option value="ready">Ready (Prête)</option>
                <option value="waiting_for_driver">Waiting for Driver</option>
                <option value="delivering">Delivering (En livraison)</option>
                <option value="delivered">Delivered (Livrée)</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 font-bold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">Commande</th>
                  <th className="p-3">Priorité</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Zone & Adresse</th>
                  <th className="p-3">Total (COD)</th>
                  <th className="p-3">Statut Commande</th>
                  <th className="p-3">Livreur Affecté</th>
                  <th className="p-3">Paiement</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setOrderForDetail(order)}
                    className="hover:bg-purple-50/40 transition cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-stone-900">
                      <div className="hover:text-purple-600 transition underline decoration-dotted">
                        {order.orderNumber}
                      </div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        Token : {order.trackingToken}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          order.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : order.priority === 'vip'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {order.priority || 'normal'}
                      </span>
                      {order.priorityReason && (
                        <div className="text-[10px] text-stone-400 truncate max-w-[110px]" title={order.priorityReason}>
                          {order.priorityReason}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{order.clientName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{order.clientPhone}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      {order.deliveryZoneName && (
                        <div className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{order.deliveryZoneName}</span>
                        </div>
                      )}
                      <div className="truncate text-stone-600">{order.deliveryAddress}, {order.deliveryCity}</div>
                      {order.estimatedDeliveryTime && (
                        <div className="text-[10px] text-stone-400">
                          ETA : {new Date(order.estimatedDeliveryTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' })}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-stone-900">
                      {order.totalAmount.toFixed(2)} DT
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.orderStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.orderStatus === 'delivering'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : order.orderStatus === 'ready'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      {order.assignedDriverName ? (
                        <div className="font-medium text-stone-800 flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-blue-600" />
                          <span>{order.assignedDriverName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Non affecté</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? 'PAID' : 'TO_COLLECT'}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToPrioritize(order);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-1.5 rounded-lg transition"
                              title="Changer priorité (§6)"
                            >
                              Priorité
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToReassign(order);
                              }}
                              className="bg-stone-900 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition"
                            >
                              {order.assignedDriverId ? 'Réaffecter' : 'Affecter'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToCancel(order);
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-1.5 rounded-lg transition"
                              title="Annuler avec restitution stock"
                            >
                              Annuler
                            </button>
                          </>
                        ) : order.paymentStatus === 'to_collect' && order.orderStatus !== 'cancelled' ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await collectPayment(order.id, order.totalAmount, {
                                name: currentUser.name,
                                id: currentUser.id,
                                role: 'admin'
                              });
                              loadAllAdminData();
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition"
                          >
                            Valider paiement
                          </button>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">
                            {order.orderStatus === 'cancelled' ? 'Annulée' : 'Clôturée'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS MANAGEMENT & REALTIME CHAT */}
      {activeTab === 'claims' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Claims List Table */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Dossiers Réclamations ({claims.length})
            </h3>
            {claims.map(claim => {
              const isSelected = selectedClaim?.id === claim.id;
              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-stone-900">{claim.claimNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        claim.status.toUpperCase() === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status.toUpperCase() === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : claim.status.toUpperCase() === 'CLOSED'
                          ? 'bg-stone-100 text-stone-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-stone-800">{claim.type}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                    Client : {claim.clientName} ({claim.clientPhone})
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
                    <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                    <span>{claim.messages?.length || 0} msg</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Claim Inspector & Live Chat Thread */}
          <div className="lg:col-span-2">
            {selectedClaim ? (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col h-[700px] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900">{selectedClaim.claimNumber}</span>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {selectedClaim.type}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 mt-1">
                      Client : <strong>{selectedClaim.clientName}</strong> ({selectedClaim.clientPhone}) • Commande #{selectedClaim.orderNumber}
                    </div>
                  </div>

                  {/* Resolution Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedResolution}
                      onChange={e => setSelectedResolution(e.target.value as ClaimResolution)}
                      className="p-2 border border-stone-300 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="Avoir">Avoir commercial</option>
                      <option value="Remboursement">Remboursement</option>
                      <option value="Remplacement">Remplacement plat</option>
                      <option value="Geste commercial">Geste commercial</option>
                      <option value="Aucune action">Aucune action</option>
                    </select>

                    <button
                      onClick={() => handleResolveClaim('RESOLVED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Résoudre
                    </button>
                    <button
                      onClick={() => handleResolveClaim('CLOSED')}
                      className="bg-stone-700 hover:bg-stone-800 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Clôturer
                    </button>
                  </div>
                </div>

                {/* Photos if provided by customer */}
                {selectedClaim.photos && selectedClaim.photos.length > 0 && (
                  <div className="p-3 bg-stone-100 border-b border-stone-200">
                    <div className="text-[11px] font-bold text-stone-600 mb-1.5">
                      Photos transmises par le client :
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {selectedClaim.photos.map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer">
                          <img
                            src={p}
                            alt="Preuve"
                            className="w-16 h-16 rounded-xl object-cover border border-stone-300 hover:scale-105 transition"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-stone-50/50">
                  {selectedClaim.messages.map(msg => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-1 px-1">
                          {isAdmin ? (
                            <>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="font-semibold text-purple-700">Vous (Direction)</span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-stone-700">{msg.senderName}</span>
                              <span>• {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          )}
                        </div>

                        <div
                          className={`p-3 rounded-2xl max-w-md text-xs shadow-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-purple-600 text-white rounded-tr-none'
                              : 'bg-white border border-stone-200 text-stone-900 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                          {msg.attachments && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att, aIdx) => (
                                <img
                                  key={aIdx}
                                  src={att}
                                  alt="Pièce jointe"
                                  className="rounded-lg max-h-36 object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Message Reply Composer */}
                <form onSubmit={handleSendAdminReply} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={claimReplyText}
                    onChange={e => setClaimReplyText(e.target.value)}
                    placeholder="Répondre au client en direct..."
                    className="flex-1 text-xs p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!claimReplyText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-stone-200 text-stone-400">
                Sélectionnez une réclamation à gauche pour inspecter le dossier et échanger avec le client.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STOCKS & INGREDIENTS */}
      {activeTab === 'stock' && <StockTab />}

      {/* TAB 4: FLEET & DRIVERS */}
      {activeTab === 'fleet' && <FleetTab />}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && <AuditTab />}

      {/* TAB: USERS & RBAC */}
      {activeTab === 'users' && <UsersTab />}

      {/* TAB: LIVE FLEET MAP */}
      {activeTab === 'live_map' && <LiveMapTab />}

      {/* TAB: CATALOG & CATEGORIES */}
      {activeTab === 'catalog' && <CatalogTab />}

      {/* TAB: RECIPES & FOOD COST */}
      {activeTab === 'recipes' && <RecipesTab />}

      {/* TAB: SUPPLIERS */}
      {activeTab === 'suppliers' && <SuppliersTab />}

      {/* TAB: CLIENTS */}
      {activeTab === 'clients' && <ClientsTab />}

      {/* TAB: DELIVERY ZONES */}
      {activeTab === 'zones' && <DeliveryZonesTab />}

      {/* TAB: CASH REGISTER & CLOSINGS */}
      {activeTab === 'cash_register' && <CashClosingTab />}

      {/* TAB: STATISTICS */}
      {activeTab === 'statistics' && <StatisticsTab />}

      {/* TAB: SETTINGS */}
      {activeTab === 'settings' && <SettingsTab />}

      {/* Modal: Driver Assignment */}
      {orderToAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-stone-900">
                  Affecter un Livreur — {orderToAssign.orderNumber}
                </h3>
              </div>
              <button onClick={() => setOrderToAssign(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Sélectionner le livreur disponible
                </label>
                <select
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {drivers.map(drv => (
                    <option key={drv.id} value={drv.userId}>
                      {drv.name} ({drv.vehicleModel} - {drv.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600">
                <div>Client : <strong>{orderToAssign.clientName}</strong></div>
                <div>Adresse : {orderToAssign.deliveryAddress}</div>
                <div>Total à encaisser : <strong>{orderToAssign.totalAmount} DT (COD)</strong></div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToAssign(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  Confirmer affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock Ingredient */}
      {restockIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-sm text-stone-900">
                Réapprovisionner : {restockIngredient.name}
              </h3>
              <button onClick={() => setRestockIngredient(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Quantité à ajouter ({restockIngredient.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={restockQuantity}
                  onChange={e => setRestockQuantity(parseFloat(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockIngredient(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  Valider entrée en stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Order Cancellation (§9) */}
      <CancelOrderModal
        order={orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onSuccess={loadAllAdminData}
      />

      {/* Modal: Reassign Driver (§8) */}
      <ReassignDriverModal
        order={orderToReassign}
        drivers={drivers}
        onClose={() => setOrderToReassign(null)}
        onSuccess={loadAllAdminData}
      />

      {/* Modal: Order Priority (§6) */}
      {orderToPrioritize && (
        <PriorityOrderModal
          order={orderToPrioritize}
          onClose={() => setOrderToPrioritize(null)}
          onSuccess={loadAllAdminData}
        />
      )}

      {/* Modal: Stock Waste & Loss (§33) */}
      {isWasteModalOpen && (
        <StockWasteModal
          ingredients={ingredients}
          onClose={() => setIsWasteModalOpen(false)}
          onSuccess={loadAllAdminData}
        />
      )}

      {/* Modal: Physical Inventory Reconciliation (§34) */}
      {isInventoryModalOpen && (
        <PhysicalInventoryModal
          ingredients={ingredients}
          onClose={() => setIsInventoryModalOpen(false)}
          onSuccess={loadAllAdminData}
        />
      )}

      {/* Modal: Order Detailed View & Lifecycle (§6) */}
      <OrderDetailModal
        order={orderForDetail}
        onClose={() => setOrderForDetail(null)}
        onAssignDriver={(ord) => {
          setOrderForDetail(null);
          setOrderToAssign(ord);
        }}
        onReassignDriver={(ord) => {
          setOrderForDetail(null);
          setOrderToReassign(ord);
        }}
        onCancelOrder={(ord) => {
          setOrderForDetail(null);
          setOrderToCancel(ord);
        }}
        onPrioritize={(ord) => {
          setOrderForDetail(null);
          setOrderToPrioritize(ord);
        }}
      />

      {/* Drawer: System Notifications (§69) */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={(id) => {
          setActiveTab('orders');
          setSearchQuery(id);
        }}
      />
    </div>
  );
};
