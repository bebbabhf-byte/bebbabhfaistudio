import React, { useState } from 'react';
import { Order, DriverProfile } from '../../types';
import { cancelOrder, reassignDriver } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Bike, X, RotateCcw, CheckCircle } from 'lucide-react';

interface CancelOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ order, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('Client indisponible / Annulation demandée');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const isStockRestitutionNeeded =
    order.orderStatus === 'preparing' ||
    order.orderStatus === 'ready' ||
    order.orderStatus === 'waiting_for_driver';

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setSubmitting(true);
      await cancelOrder(order.id, reason.trim(), {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l annulation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>Annuler la commande {order.orderNumber}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancel} className="space-y-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Client :</span>
              <strong className="text-stone-900">{order.clientName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Montant total :</span>
              <strong className="font-mono text-stone-900">{order.totalAmount.toFixed(2)} DT</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Statut actuel :</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[10px]">
                {order.orderStatus}
              </span>
            </div>
          </div>

          {isStockRestitutionNeeded && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Restitution automatique en stock</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cette commande était déjà engagée en cuisine. Les ingrédients consommés seront réintégrés automatiquement à l inventaire.
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 mb-1">Motif de l annulation *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none mb-2"
            >
              <option value="Client injoignable ou absent à l adresse">Client injoignable ou absent à l adresse</option>
              <option value="Demande d annulation expresse du client">Demande d annulation expresse du client</option>
              <option value="Retard excessif de livraison">Retard excessif de livraison</option>
              <option value="Rupture imprévue d ingrédient">Rupture imprévue d ingrédient</option>
              <option value="Autre motif administratif">Autre motif administratif</option>
            </select>

            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Précisez la raison détaillée..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-md shadow-rose-600/20"
            >
              {submitting ? 'Annulation...' : 'Confirmer l annulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReassignDriverModalProps {
  order: Order | null;
  drivers: DriverProfile[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ReassignDriverModal: React.FC<ReassignDriverModalProps> = ({
  order,
  drivers,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reason, setReason] = useState('Optimisation de tournée / livreur indisponible');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const currentDriverName = order.assignedDriverName || 'Aucun livreur';

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;

    try {
      setSubmitting(true);
      await reassignDriver(order.id, selectedDriverId, reason, {
        id: currentUser.id,
        name: currentUser.name
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réaffectation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-purple-700 font-bold">
            <Bike className="w-5 h-5" />
            <span>Réaffecter le livreur ({order.orderNumber})</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReassign} className="space-y-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Livreur actuel :</span>
              <strong className="text-stone-900">{currentDriverName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Adresse de livraison :</span>
              <span className="text-stone-700 truncate max-w-[200px]">{order.deliveryAddress}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Nouveau livreur *</label>
            <select
              value={selectedDriverId}
              required
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Sélectionner un livreur de la flotte</option>
              {drivers.map(d => (
                <option key={d.id} value={d.userId}>
                  {d.name} ({d.phone}) — {d.status === 'busy' ? 'En course' : 'Disponible'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Motif de réaffectation</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Panne de scooter, proximité client..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
              disabled={submitting || !selectedDriverId}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {submitting ? 'Affectation...' : 'Confirmer la réaffectation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PriorityOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PriorityOrderModal: React.FC<PriorityOrderModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'vip'>((order?.priority as any) || 'normal');
  const [reason, setReason] = useState(order?.priorityReason || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Le motif de modification de priorité est obligatoire (§6).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const { updateOrderPriority } = await import('../../services/api');
      await updateOrderPriority(order.id, priority, reason.trim(), currentUser.name);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la modification de priorité');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <span>Modifier la Priorité : {order.orderNumber}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Client :</span>
              <strong className="text-stone-900">{order.clientName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Statut :</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-stone-200 text-stone-800 text-[10px]">
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Niveau de Priorité Cuisine & Livraison *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'urgent', 'vip'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-3 rounded-xl border text-center font-bold uppercase text-[11px] transition ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-100 border-rose-400 text-rose-800 ring-2 ring-rose-500'
                        : p === 'vip'
                          ? 'bg-purple-100 border-purple-400 text-purple-800 ring-2 ring-purple-500'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Motif obligatoire de la modification (§6) *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Retard suite à un incident de circulation, client institutionnel prioritaire, etc."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer la priorité'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
