import React, { useState, useEffect } from 'react';
import { Order, Recipe, Ingredient } from '../../types';
import { fetchOrders, updateOrderStatus, fetchIngredients } from '../../services/api';
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
  AlertCircle
} from 'lucide-react';

export const KDSBoard: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [activeTab, setActiveTab] = useState<'board' | 'recipes'>('board');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKDS();
    const interval = setInterval(loadKDS, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadKDS = async () => {
    try {
      const [allOrders, ings] = await Promise.all([fetchOrders(), fetchIngredients()]);
      setOrders(allOrders);
      setIngredients(ings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPreparation = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'kitchen'
      });
      loadKDS();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'ready', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'kitchen'
      });
      loadKDS();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const receivedOrders = orders.filter(o => o.orderStatus === 'received');
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'ready' || o.orderStatus === 'waiting_for_driver');

  const getElapsedMinutes = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    return Math.max(0, diff);
  };

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
              Préparation minute à la commande • Déstockage automatique des ingrédients selon recettes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'board' ? 'recipes' : 'board')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-stone-700 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{activeTab === 'board' ? 'Fiches Recettes & Stocks' : 'Retour Commandes KDS'}</span>
          </button>

          <button
            onClick={loadKDS}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'recipes' ? (
        // Recipes & Stock Status
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <h2 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            Fiches Techniques Recettes & Consommation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
      ) : (
        // 3-Column KDS Board
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
                      className="bg-white rounded-2xl p-4 border-2 border-rose-200 shadow-sm flex flex-col justify-between"
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
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Commencer Préparation
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
                      className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-sm flex flex-col justify-between"
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
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Déclarer Prête (Prêt à l expédition)
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
                    className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm"
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
    </div>
  );
};
