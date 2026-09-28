import React, { useState, useEffect } from 'react';
import { Order, Recipe, Ingredient } from '../../types';
import { fetchOrders, updateOrderStatus, fetchIngredients, fetchRecipes } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Flame,
  AlertCircle,
  Warehouse,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  BookOpen,
  X,
  Loader2
} from 'lucide-react';
import { AIRecipesSection } from './AIRecipesSection';

export const KDSBoard: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<'board' | 'stocks' | 'recipes' | 'ai_recipes'>('board');
  const [loading, setLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Read-only stock filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadKDS();
    const interval = setInterval(loadKDS, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadKDS = async () => {
    try {
      const [allOrders, ings, recs] = await Promise.all([
        fetchOrders(),
        fetchIngredients(),
        fetchRecipes().catch(() => [])
      ]);
      setOrders(allOrders);
      setIngredients(ings);
      if (recs && recs.length > 0) setRecipes(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPreparation = async (orderId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'preparing', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'kitchen'
      });
      setActionSuccess('Préparation commencée avec succès ! Les ingrédients ont été déstockés.');
      await loadKDS();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('KDS start preparation error:', err);
      setActionError(err.message || 'Erreur lors du démarrage de la préparation.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setProcessingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, 'ready', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'kitchen'
      });
      setActionSuccess('Commande déclarée prête ! En attente d enlèvement par le livreur.');
      await loadKDS();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('KDS mark ready error:', err);
      setActionError(err.message || 'Erreur lors de la déclaration de commande prête.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const receivedOrders = orders.filter(o => o.orderStatus === 'received');
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'ready' || o.orderStatus === 'waiting_for_driver');

  const getElapsedMinutes = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, diff);
  };

  // Filtered ingredients for kitchen read-only view
  const filteredIngredients = ingredients.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      (i.supplierName && i.supplierName.toLowerCase().includes(stockSearch.toLowerCase()));
    const matchesStatus = stockFilter === 'all' || i.status === stockFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = ingredients.filter(i => i.status === 'low' || i.currentStock <= i.minThreshold).length;
  const outOfStockCount = ingredients.filter(i => i.status === 'out_of_stock' || i.currentStock === 0).length;
  const optimalCount = ingredients.filter(i => i.status === 'optimal' && i.currentStock > i.minThreshold).length;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* KDS Header Banner */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">Cuisine Centrale BEBBA — Écran KDS</h1>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                Direct Fourneaux
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Préparation minute à la commande • Consultation du stock en temps réel • Déstockage automatique selon recettes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Commandes KDS ({receivedOrders.length + preparingOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('stocks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stocks'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Stocks & Ingrédients (Lecture Seule)</span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Fiches Recettes</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_recipes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ai_recipes'
                  ? 'bg-linear-to-r from-emerald-400 to-amber-400 text-stone-950 font-black shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-stone-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Recette IA</span>
              <span className="bg-emerald-950/60 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                20 Menus
              </span>
            </button>
          </div>

          <button
            onClick={loadKDS}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Error / Success Feedback Banners */}
      {actionError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start justify-between gap-3 text-rose-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm">Action bloquée</div>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{actionError}</p>
            </div>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 hover:text-rose-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between gap-3 text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold text-emerald-800">{actionSuccess}</p>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 hover:text-emerald-900 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 1: STOCKS & INGREDIENTS (READ ONLY) */}
      {/* ========================================== */}
      {activeTab === 'stocks' && (
        <div className="space-y-6">
          {/* Read-Only Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>Consultation des Stocks Ingrédients — Accès Cuisine (Lecture Seule)</span>
                  <span className="bg-amber-200 text-amber-950 px-2 py-0.2 rounded text-[10px] font-black">
                    READ ONLY
                  </span>
                </div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Vous consultez les réserves d ingrédients frais pour anticiper les préparations. Les ajouts et modifications sont gérés par l administration.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> {optimalCount} optimaux
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="w-4 h-4" /> {lowStockCount} alertes
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <TrendingDown className="w-4 h-4" /> {outOfStockCount} ruptures
              </span>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            {/* Filters */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  placeholder="Rechercher un ingrédient en réserve..."
                  className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-400" />
                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value)}
                  className="p-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="all">Tous les états de stock</option>
                  <option value="optimal">Stock Optimal</option>
                  <option value="low">Alerte (Stock bas)</option>
                  <option value="out_of_stock">Épuisé (Rupture)</option>
                </select>
              </div>
            </div>

            {/* Read-Only Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Ingrédient</th>
                    <th className="py-3 px-4 text-center">Unité de Mesure</th>
                    <th className="py-3 px-4 text-right">Stock Disponible</th>
                    <th className="py-3 px-4 text-right">Seuil d Alerte Minimum</th>
                    <th className="py-3 px-4">Fournisseur Référencé</th>
                    <th className="py-3 px-4 text-center">État Opérationnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        Aucun ingrédient ne correspond à la recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map(ing => (
                      <tr key={ing.id} className="hover:bg-amber-50/20 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{ing.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{ing.id}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] font-mono text-stone-700">
                            {ing.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-black text-sm">
                          <span
                            className={
                              ing.currentStock === 0
                                ? 'text-rose-600'
                                : ing.currentStock <= ing.minThreshold
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }
                          >
                            {ing.currentStock} {ing.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-stone-500">
                          {ing.minThreshold} {ing.unit}
                        </td>

                        <td className="py-3 px-4 text-stone-600">
                          {ing.supplierName || 'Fournisseur BEBBA'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ing.status === 'optimal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ing.status === 'low'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ing.status === 'optimal'
                              ? 'OPTIMAL'
                              : ing.status === 'low'
                              ? 'STOCK BAS'
                              : 'ÉPUISÉ'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: RECIPES */}
      {/* ========================================== */}
      {activeTab === 'recipes' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <h2 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            Fiches Techniques Recettes & Consommation par Portion
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.length > 0 ? (
              recipes.map(recipe => (
                <div key={recipe.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-sm text-stone-900 mb-2">
                    {recipe.productName}
                  </h3>
                  <p className="text-xs text-stone-500 mb-3">
                    Dosage pour 1 portion servie :
                  </p>
                  <ul className="text-xs space-y-1.5 font-medium text-stone-700">
                    {recipe.ingredients.map(ing => (
                      <li key={ing.ingredientId} className="flex justify-between">
                        <span>• {ing.ingredientName}</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {ing.quantity} {ing.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-sm text-stone-900 mb-2">
                    Blanc de Poulet Mariné aux Herbes & Légumes Rôtis
                  </h3>
                  <p className="text-xs text-stone-500 mb-3">
                    Pour 1 portion servie :
                  </p>
                  <ul className="text-xs space-y-1.5 font-medium text-stone-700">
                    <li className="flex justify-between">
                      <span>• Blanc de poulet fermier</span>
                      <span className="font-mono text-emerald-700 font-bold">250 g</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Légumes maraîchers (courgettes/carottes)</span>
                      <span className="font-mono text-emerald-700 font-bold">150 g</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Huile d olive extra vierge</span>
                      <span className="font-mono text-emerald-700 font-bold">10 ml</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Épices et herbes maison</span>
                      <span className="font-mono text-emerald-700 font-bold">5 g</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-sm text-stone-900 mb-2">
                    Bowl Saumon Sauvage & Quinoa Énergie
                  </h3>
                  <p className="text-xs text-stone-500 mb-3">
                    Pour 1 portion servie :
                  </p>
                  <ul className="text-xs space-y-1.5 font-medium text-stone-700">
                    <li className="flex justify-between">
                      <span>• Filet de saumon atlantique</span>
                      <span className="font-mono text-emerald-700 font-bold">180 g</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Quinoa royal bio</span>
                      <span className="font-mono text-emerald-700 font-bold">100 g</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Avocat Hass mûr</span>
                      <span className="font-mono text-emerald-700 font-bold">0.5 pièce</span>
                    </li>
                    <li className="flex justify-between">
                      <span>• Huile d olive & assaisonnements</span>
                      <span className="font-mono text-emerald-700 font-bold">8 ml</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: KDS COMMANDES KANBAN */}
      {/* ========================================== */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. NOUVELLES COMMANDES */}
          <div className="bg-stone-100/70 rounded-3xl p-4 border border-stone-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <h2 className="font-black text-sm text-stone-900 tracking-wide uppercase">
                  1. Nouvelles ({receivedOrders.length})
                </h2>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                À lancer
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 max-h-[750px] pr-1">
              {receivedOrders.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  Aucune nouvelle commande reçue.
                </div>
              ) : (
                receivedOrders.map(order => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-4 border-2 border-rose-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-xs text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {elapsed} min
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-stone-700 mb-2">
                          Client : {order.clientName}
                        </div>

                        {/* Items list */}
                        <div className="space-y-2 mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          {order.items.map(it => (
                            <div key={it.id} className="text-xs">
                              <div className="font-black text-stone-900 flex items-center justify-between">
                                <span>{it.quantity}x {it.productName}</span>
                              </div>
                              {it.selectedOptions && it.selectedOptions.length > 0 && (
                                <div className="text-[11px] text-emerald-700 pl-2">
                                  + {it.selectedOptions.map(o => o.name).join(', ')}
                                </div>
                              )}
                              {it.specialInstructions && (
                                <div className="text-[11px] text-amber-800 font-bold pl-2 bg-amber-50 rounded mt-0.5">
                                  ⚠️ {it.specialInstructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartPreparation(order.id)}
                        disabled={processingOrderId === order.id}
                        className={`w-full font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
                          processingOrderId === order.id
                            ? 'bg-rose-400 text-white cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                        }`}
                      >
                        {processingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Démarrage en cours...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Commencer Préparation</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. EN PRÉPARATION */}
          <div className="bg-amber-50/50 rounded-3xl p-4 border border-amber-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-spin"></span>
                <h2 className="font-black text-sm text-stone-900 tracking-wide uppercase">
                  2. En Préparation ({preparingOrders.length})
                </h2>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                Sur les fourneaux
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 max-h-[750px] pr-1">
              {preparingOrders.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  Aucun plat en cours de cuisson.
                </div>
              ) : (
                preparingOrders.map(order => {
                  const elapsed = getElapsedMinutes(order.preparedAt || order.createdAt);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-xs text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {elapsed} min en cuisson
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-stone-700 mb-2">
                          Client : {order.clientName}
                        </div>

                        <div className="space-y-2 mb-4 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100">
                          {order.items.map(it => (
                            <div key={it.id} className="text-xs">
                              <div className="font-black text-stone-900">
                                {it.quantity}x {it.productName}
                              </div>
                              {it.selectedOptions && it.selectedOptions.length > 0 && (
                                <div className="text-[11px] text-emerald-700 pl-2">
                                  + {it.selectedOptions.map(o => o.name).join(', ')}
                                </div>
                              )}
                              {it.specialInstructions && (
                                <div className="text-[11px] text-amber-900 font-bold pl-2 bg-amber-100/70 rounded p-1 mt-1">
                                  ⚠️ Remarque : {it.specialInstructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkReady(order.id)}
                        disabled={processingOrderId === order.id}
                        className={`w-full font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
                          processingOrderId === order.id
                            ? 'bg-amber-400 text-white cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                        }`}
                      >
                        {processingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mise à disposition...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Déclarer Prête (Prêt à l expédition)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. COMMANDES PRÊTES */}
          <div className="bg-emerald-50/40 rounded-3xl p-4 border border-emerald-200 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h2 className="font-black text-sm text-stone-900 tracking-wide uppercase">
                  3. Prêtes ({readyOrders.length})
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Attente Livreur
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 max-h-[750px] pr-1">
              {readyOrders.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  Aucune commande en attente d enlèvement.
                </div>
              ) : (
                readyOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-black text-xs text-stone-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {order.assignedDriverName ? `Livreur : ${order.assignedDriverName}` : 'Non affecté'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 mb-2">
                      {order.items.length} plat(s) • Total {order.totalAmount} DT (COD)
                    </div>

                    <div className="text-[11px] text-stone-400">
                      Prête depuis {getElapsedMinutes(order.readyAt || order.updatedAt)} min
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: RECETTE IA (GÉNÉRATEUR 20 MENUS) */}
      {/* ========================================== */}
      {activeTab === 'ai_recipes' && (
        <AIRecipesSection ingredients={ingredients} />
      )}
    </div>
  );
};
