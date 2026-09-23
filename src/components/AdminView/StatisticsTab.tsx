import React, { useState, useEffect } from 'react';
import { fetchStatistics } from '../../services/api';
import {
  TrendingUp,
  DollarSign,
  Package,
  Bike,
  AlertTriangle,
  MessageSquareWarning,
  CheckCircle,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export const StatisticsTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchStatistics();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-12 text-center text-xs text-stone-400">
        Chargement des indicateurs analytiques...
      </div>
    );
  }

  const { revenue, orders, drivers, claims, stock, topProducts } = stats;

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-400 font-bold uppercase tracking-wider">
            <span>Encaissé (COD Payé)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono mt-2">
            {revenue.totalCollected.toFixed(2)} <span className="text-xs font-semibold text-emerald-600">DT</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Aujourd hui : {revenue.todayCollected.toFixed(2)} DT</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-400 font-bold uppercase tracking-wider">
            <span>À Encaisser (En cours)</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-2">
            {revenue.toCollect.toFixed(2)} <span className="text-xs font-semibold text-amber-600">DT</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Montant chez les livreurs / cuisine</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-400 font-bold uppercase tracking-wider">
            <span>Panier Moyen</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono mt-2">
            {revenue.averageBasket.toFixed(2)} <span className="text-xs font-semibold text-purple-600">DT</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Sur l ensemble des commandes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-400 font-bold uppercase tracking-wider">
            <span>Taux Résolution SAV</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {claims.total > 0 ? ((claims.resolved / claims.total) * 100).toFixed(0) : 100}%
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {claims.resolved} résolues sur {claims.total} réclamation(s)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Répartition des Commandes par Statut</span>
            </h3>
            <span className="text-xs font-bold text-stone-400">Total : {orders.total}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Reçues', count: orders.byStatus.received, color: 'bg-stone-500' },
              { label: 'En Préparation (Cuisine)', count: orders.byStatus.preparing, color: 'bg-amber-500' },
              { label: 'Prêtes (KDS)', count: orders.byStatus.ready, color: 'bg-emerald-500' },
              { label: 'En Attente Livreur', count: orders.byStatus.waiting_for_driver, color: 'bg-blue-400' },
              { label: 'En Cours de Livraison GPS', count: orders.byStatus.delivering, color: 'bg-blue-600' },
              { label: 'Livrées & Clôturées', count: orders.byStatus.delivered, color: 'bg-emerald-600' },
              { label: 'Annulées', count: orders.byStatus.cancelled, color: 'bg-rose-500' }
            ].map((item, idx) => {
              const pct = orders.total > 0 ? (item.count / orders.total) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-stone-700">{item.label}</span>
                    <span className="font-bold font-mono text-stone-900">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Healthy Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Plats Santé les Plus Commandés</span>
            </h3>
            <span className="text-xs text-stone-400 font-bold">Top Ventes</span>
          </div>

          <div className="divide-y divide-stone-100">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((p: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-stone-900">{p.name}</div>
                      <div className="text-[10px] text-stone-400">{p.category}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 font-mono">{p.revenue.toFixed(2)} DT</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">{p.count} portions vendues</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-4 italic text-center">Aucune vente enregistrée pour l instant.</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock Critical Alerts Summary */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Alertes Stock & Approvisionnement Critique ({stock.criticalCount})</span>
          </h3>
          <span className="text-xs font-semibold text-stone-500">
            Total matières actives : {stock.totalIngredients}
          </span>
        </div>

        {stock.criticalItems && stock.criticalItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {stock.criticalItems.map((ing: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-1">
                <div className="font-bold text-stone-900">{ing.name}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Stock actuel :</span>
                  <span className="font-mono font-bold text-rose-700">
                    {ing.stock} {ing.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <span>Seuil min :</span>
                  <span>{ing.threshold} {ing.unit}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Tous les ingrédients disposent d un stock optimal supérieur au seuil d alerte.</span>
          </div>
        )}
      </div>
    </div>
  );
};
