import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { fetchOrders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Bike,
  MessageSquareWarning,
  Navigation,
  RefreshCw,
  Heart
} from 'lucide-react';

interface ClientOrdersViewProps {
  onTrackOrder: (order: Order) => void;
  onOpenClaim: (order: Order) => void;
}

export const ClientOrdersView: React.FC<ClientOrdersViewProps> = ({
  onTrackOrder,
  onOpenClaim
}) => {
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders({ clientId: currentUser.id });
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Vos Commandes BEBBA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Historique de Vos Repas Sains
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Retrouvez tous vos menus passés, suivez vos livraisons actives et accédez au service après-vente.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition self-start sm:self-auto"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400">Chargement de vos commandes...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">Aucune commande enregistrée</h3>
          <p className="text-xs text-stone-500 mb-6">
            Découvrez nos plats santé préparés minute et faites-vous livrer en un clic !
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-stone-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      Code : {order.trackingToken}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Commandé le {new Date(order.createdAt).toLocaleDateString()} à{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.orderStatus === 'delivering'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : order.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.orderStatus.toUpperCase()}
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? 'Encaissé (PAID)' : 'À régler (COD)'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4">
                {order.items.map(it => (
                  <div key={it.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      {it.productImage && (
                        <img
                          src={it.productImage}
                          alt={it.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                        />
                      )}
                      <div>
                        <div className="font-bold text-stone-900">
                          {it.quantity}x {it.productName}
                        </div>
                        {it.selectedOptions && it.selectedOptions.length > 0 && (
                          <div className="text-[11px] text-emerald-700">
                            {it.selectedOptions.map(o => o.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-stone-900">
                        {it.itemTotal.toFixed(2)} DT
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(it.productId)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isFavorite(it.productId)
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200'
                        }`}
                        title={isFavorite(it.productId) ? 'Dans vos favoris (cliquer pour retirer)' : 'Ajouter ce plat à vos favoris'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite(it.productId) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & Actions */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{order.deliveryAddress}, {order.deliveryCity}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-stone-400 block">Total TTC (COD)</span>
                    <span className="font-mono font-black text-base text-stone-900">
                      {order.totalAmount.toFixed(2)} DT
                    </span>
                  </div>

                  <button
                    onClick={() => onTrackOrder(order)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Suivi Carte GPS</span>
                  </button>

                  <button
                    onClick={() => onOpenClaim(order)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                    <span>Réclamer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
