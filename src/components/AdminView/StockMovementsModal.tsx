import React, { useState, useEffect } from 'react';
import { StockMovement } from '../../types';
import { fetchStockMovements } from '../../services/api';
import { History, Search, ArrowDownRight, ArrowUpRight, Filter, Calendar, Layers, X } from 'lucide-react';

interface StockMovementsModalProps {
  onClose: () => void;
}

export const StockMovementsModal: React.FC<StockMovementsModalProps> = ({ onClose }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await fetchStockMovements();
      setMovements(res.movements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = movements.filter(m => {
    const matchesSearch =
      m.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      (m.reason && m.reason.toLowerCase().includes(search.toLowerCase())) ||
      m.performedBy.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'restock':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <ArrowUpRight className="w-3 h-3" />
            {type.toUpperCase()}
          </span>
        );
      case 'consumption':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <ArrowDownRight className="w-3 h-3" />
            CONSO
          </span>
        );
      case 'waste':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <ArrowDownRight className="w-3 h-3" />
            PERTE
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            AJUSTEMENT
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {type.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-black text-sm">
                Historique des Mouvements de Stock (§20)
              </h3>
              <p className="text-[11px] text-stone-400">
                Traçabilité complète des entrées, sorties de cuisine, pertes et ajustements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filtrer par ingrédient, motif, opérateur..."
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="p-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">Tous les mouvements</option>
              <option value="purchase">Achats (PURCHASE)</option>
              <option value="restock">Réappro (RESTOCK)</option>
              <option value="consumption">Cuisine (CONSUMPTION)</option>
              <option value="waste">Pertes (WASTE)</option>
              <option value="adjustment">Ajustements (ADJUSTMENT)</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-stone-400 text-xs">Chargement de l historique...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">Aucun mouvement trouvé.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 font-bold uppercase tracking-wider border-b border-stone-200 sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Ingrédient</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Variation</th>
                  <th className="p-3 text-center">Avant / Après</th>
                  <th className="p-3">Motif & Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-stone-50 transition">
                    <td className="p-3 font-mono text-stone-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}
                    </td>
                    <td className="p-3 font-bold text-stone-900">{m.ingredientName}</td>
                    <td className="p-3">{getTypeBadge(m.type)}</td>
                    <td className={`p-3 font-mono font-bold text-right ${m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-center text-stone-600">
                      {m.beforeQuantity !== undefined ? `${m.beforeQuantity} -> ${m.afterQuantity}` : '—'}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="text-stone-800 font-medium truncate">{m.reason || '—'}</div>
                      <div className="text-[10px] text-stone-400">Opérateur : {m.performedBy}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">
            Total : {filtered.length} mouvement(s) enregistré(s)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
