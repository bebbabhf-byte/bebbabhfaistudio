import React, { useState } from 'react';
import { Ingredient } from '../../types';
import { recordStockWaste, reconcilePhysicalInventory } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Trash2, AlertTriangle, ClipboardList, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface StockWasteModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockWasteModal: React.FC<StockWasteModalProps> = ({
  ingredients,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [wasteType, setWasteType] = useState('perte');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedIng = ingredients.find(i => i.id === selectedIngredientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Veuillez saisir une quantité de perte valide supérieure à 0.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Le motif de la perte / gaspillage est obligatoire (§33).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await recordStockWaste({
        ingredientId: selectedIngredientId,
        quantity: qty,
        unit: selectedIng?.unit,
        wasteType,
        reason: reason.trim(),
        performedBy: currentUser.name || 'Responsable Cuisine'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold">
            <Trash2 className="w-5 h-5" />
            <span>Déclarer une Perte / Gaspillage (§33)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:bg-stone-100">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 mb-1">Ingrédient concerné *</label>
            <select
              value={selectedIngredientId}
              onChange={e => setSelectedIngredientId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Stock actuel : {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Quantité perdue ({selectedIng?.unit || 'kg'}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                placeholder="Ex: 1.5"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Type de perte *</label>
              <select
                value={wasteType}
                onChange={e => setWasteType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="perte">Perte cuisine</option>
                <option value="casse">Casse / Endommagé</option>
                <option value="peremption">Périmé / Date dépassée</option>
                <option value="surproduction">Surproduction</option>
                <option value="qualite">Non-conformité qualité</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Motif obligatoire (§33) *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Rupture de chaîne du froid pendant la nuit, chute de bac, etc."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer la perte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PhysicalInventoryModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PhysicalInventoryModal: React.FC<PhysicalInventoryModalProps> = ({
  ingredients,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ingredients.forEach(i => {
      init[i.id] = i.currentStock.toString();
    });
    return init;
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCountChange = (id: string, val: string) => {
    setCounts(prev => ({ ...prev, [id]: val }));
  };

  // Compute live discrepancy impact
  let totalDiscrepancyCost = 0;
  let hasDifferences = false;

  ingredients.forEach(ing => {
    const counted = parseFloat(counts[ing.id]) || 0;
    const diff = counted - ing.currentStock;
    if (Math.abs(diff) > 0.001) {
      hasDifferences = true;
      totalDiscrepancyCost += diff * ing.unitCost;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const countedItems = ingredients.map(ing => ({
        ingredientId: ing.id,
        countedStock: parseFloat(counts[ing.id]) || 0
      }));

      await reconcilePhysicalInventory({
        countedItems,
        conductedBy: currentUser.name || 'Responsable Stock',
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du rapprochement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <ClipboardList className="w-5 h-5" />
            <span>Inventaire Physique & Régularisation (§34)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:bg-stone-100">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-800">Impact financier des écarts constatés :</div>
              <div className="text-[11px] text-stone-500">
                Calculé selon les coûts unitaires d approvisionnement
              </div>
            </div>
            <div className={`text-base font-black font-mono ${
              totalDiscrepancyCost < 0
                ? 'text-rose-600'
                : totalDiscrepancyCost > 0
                  ? 'text-emerald-600'
                  : 'text-stone-700'
            }`}>
              {totalDiscrepancyCost >= 0 ? '+' : ''}{totalDiscrepancyCost.toFixed(2)} DT
            </div>
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Ingrédient</th>
                  <th className="p-2.5 text-center">Unité</th>
                  <th className="p-2.5 text-right">Théorique</th>
                  <th className="p-2.5 text-right w-28">Compté réel</th>
                  <th className="p-2.5 text-right">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ingredients.map(ing => {
                  const countedVal = parseFloat(counts[ing.id]) || 0;
                  const diff = countedVal - ing.currentStock;
                  return (
                    <tr key={ing.id} className="hover:bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-800">{ing.name}</td>
                      <td className="p-2.5 text-center text-stone-400 font-mono">{ing.unit}</td>
                      <td className="p-2.5 text-right font-mono text-stone-600">{ing.currentStock}</td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={counts[ing.id] ?? ''}
                          onChange={e => handleCountChange(ing.id, e.target.value)}
                          className="w-full text-right p-1.5 border border-stone-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className={`p-2.5 text-right font-mono font-bold ${
                        Math.abs(diff) < 0.001
                          ? 'text-stone-400'
                          : diff > 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Notes & Observations de l inventaire</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Inventaire de fin de semaine, pesée directe..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-xs"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {submitting ? 'Validation...' : 'Valider & Ajuster les Stocks'}
          </button>
        </div>
      </div>
    </div>
  );
};
