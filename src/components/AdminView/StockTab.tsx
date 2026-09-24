import React, { useState, useEffect } from 'react';
import { Ingredient, StockMovement } from '../../types';
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  recordStockMovement,
  fetchSuppliers
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StockWasteModal, PhysicalInventoryModal } from './StockActionModals';
import { StockMovementsModal } from './StockMovementsModal';
import {
  Layers,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ClipboardList,
  History,
  Edit2,
  PackagePlus,
  X,
  TrendingDown,
  Warehouse,
  Filter
} from 'lucide-react';

export const StockTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Ingredient Create / Edit Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg' as 'g' | 'kg' | 'ml' | 'L' | 'pièce',
    unitCost: 10,
    currentStock: 10,
    minThreshold: 5,
    supplierId: '',
    supplierName: ''
  });

  // Fast Restock Modal
  const [restockIngredient, setRestockIngredient] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('Approvisionnement arrivage frais');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ings, sups] = await Promise.all([fetchIngredients(), fetchSuppliers()]);
      setIngredients(ings);
      setSuppliers(sups);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '',
      unit: 'kg',
      unitCost: 12.0,
      currentStock: 10,
      minThreshold: 5,
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || 'Fournisseur BEBBA'
    });
    setIsIngredientModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unit: ing.unit,
      unitCost: ing.unitCost,
      currentStock: ing.currentStock,
      minThreshold: ing.minThreshold,
      supplierId: ing.supplierId || '',
      supplierName: ing.supplierName || ''
    });
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSup = suppliers.find(s => s.id === ingredientForm.supplierId);
      const payload = {
        ...ingredientForm,
        supplierName: selectedSup ? selectedSup.name : ingredientForm.supplierName
      };

      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, payload);
      } else {
        await createIngredient(payload);
      }
      setIsIngredientModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Erreur enregistrement ingrédient');
    }
  };

  const handleFastRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockIngredient || restockQty <= 0) return;

    try {
      await recordStockMovement({
        ingredientId: restockIngredient.id,
        type: 'restock',
        quantityDelta: restockQty,
        reason: restockReason.trim() || 'Réapprovisionnement fournisseur direct',
        performedBy: currentUser.name || 'Admin Stock'
      });
      setRestockIngredient(null);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Erreur restock');
    }
  };

  const handleDeactivate = async (ing: Ingredient) => {
    if (!confirm(`Désactiver l'ingrédient « ${ing.name} » ? L'historique sera préservé (§15).`)) return;
    try {
      await deleteIngredient(ing.id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Erreur désactivation');
    }
  };

  const filtered = ingredients.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplierName && i.supplierName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = ingredients.filter(i => i.status === 'low' || i.currentStock <= i.minThreshold).length;
  const outOfStockCount = ingredients.filter(i => i.status === 'out_of_stock' || i.currentStock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary (§19) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Ingrédients Actifs</span>
            <Warehouse className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{ingredients.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Frais & épicerie saine</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>En Alerte Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{lowStockCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Sous le seuil minimum (§19)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>En Rupture</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{outOfStockCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">Stock épuisé (0)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Valeur du Stock</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono mt-2">
            {ingredients.reduce((s, i) => s + i.currentStock * i.unitCost, 0).toFixed(2)}{' '}
            <span className="text-xs text-emerald-600">DT</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Valorisation théorique</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {/* Actions Bar */}
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-sm text-stone-900">
              Gestion des Stocks d Ingrédients Frais & Mouvements (§19, §20, §21, §22)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <History className="w-4 h-4" />
              <span>Historique mouvements (§20)</span>
            </button>

            <button
              onClick={() => setIsWasteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Déclarer perte / casse (§33)</span>
            </button>

            <button
              onClick={() => setIsInventoryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Inventaire physique (§34)</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un ingrédient (§15)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom d ingrédient ou fournisseur..."
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 border border-stone-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">Tous les états de stock</option>
              <option value="optimal">Normal / Optimal</option>
              <option value="low">Alerte (Stock bas)</option>
              <option value="out_of_stock">Épuisé (Rupture)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Ingrédient</th>
                <th className="py-3 px-4 text-center">Unité (§16)</th>
                <th className="py-3 px-4 text-right">Stock Actuel</th>
                <th className="py-3 px-4 text-right">Seuil Minimum</th>
                <th className="py-3 px-4 text-right">Coût Unitaire</th>
                <th className="py-3 px-4">Fournisseur (§23)</th>
                <th className="py-3 px-4 text-center">État (§19)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(ing => (
                <tr key={ing.id} className="hover:bg-stone-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900">{ing.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{ing.id}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] font-mono text-stone-700">
                      {ing.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-stone-900">
                    {ing.currentStock}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-stone-500">
                    {ing.minThreshold} {ing.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-stone-700">
                    {ing.unitCost.toFixed(2)} DT
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
                      {ing.status === 'optimal' ? 'NORMAL' : ing.status === 'low' ? 'ALERTE' : 'ÉPUISÉ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setRestockIngredient(ing);
                          setRestockQty(10);
                          setRestockReason('Arrivage fournisseur direct');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition"
                        title="Réapprovisionner"
                      >
                        + Entrée (§21)
                      </button>

                      <button
                        onClick={() => handleOpenEdit(ing)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-purple-700 hover:bg-purple-50 transition"
                        title="Modifier ingrédient"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeactivate(ing)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                        title="Désactiver ingrédient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingredient Create / Edit Modal */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingIngredient ? 'Modifier l ingrédient' : 'Ajouter un ingrédient (§15)'}
              </h3>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom de l ingrédient *</label>
                <input
                  type="text"
                  required
                  value={ingredientForm.name}
                  onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  placeholder="Ex: Pavé de saumon frais"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Unité (§16) *</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  >
                    <option value="g">g (grammes)</option>
                    <option value="kg">kg (kilogrammes)</option>
                    <option value="ml">ml (millilitres)</option>
                    <option value="L">L (litres)</option>
                    <option value="pièce">pièce</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Coût unitaire (DT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ingredientForm.unitCost}
                    onChange={e => setIngredientForm({ ...ingredientForm, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Stock actuel *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={ingredientForm.currentStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Seuil minimum d alerte *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={ingredientForm.minThreshold}
                    onChange={e => setIngredientForm({ ...ingredientForm, minThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Fournisseur attitré (§23)</label>
                <select
                  value={ingredientForm.supplierId}
                  onChange={e => setIngredientForm({ ...ingredientForm, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Sélectionner un fournisseur...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Restock Modal (§21) */}
      {restockIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-600" />
                <span>Réapprovisionnement (§21) : {restockIngredient.name}</span>
              </h3>
              <button
                onClick={() => setRestockIngredient(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFastRestock} className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>Stock actuel : <strong>{restockIngredient.currentStock} {restockIngredient.unit}</strong></div>
                <div>Coût d achat : <strong>{restockIngredient.unitCost.toFixed(2)} DT/{restockIngredient.unit}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Quantité à ajouter ({restockIngredient.unit}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Motif / Réf bon de livraison</label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  placeholder="Ex: BL-2026-981 arrivage du matin"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRestockIngredient(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md shadow-emerald-600/20"
                >
                  Confirmer l entrée en stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Modal (§33) */}
      {isWasteModalOpen && (
        <StockWasteModal
          ingredients={ingredients}
          onClose={() => setIsWasteModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Inventory Reconciliation Modal (§34) */}
      {isInventoryModalOpen && (
        <PhysicalInventoryModal
          ingredients={ingredients}
          onClose={() => setIsInventoryModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Movements History Modal (§20) */}
      {isHistoryModalOpen && (
        <StockMovementsModal onClose={() => setIsHistoryModalOpen(false)} />
      )}
    </div>
  );
};
