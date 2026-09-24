import React, { useState, useEffect } from 'react';
import { DeliveryZone } from '../../types';
import { fetchDeliveryZones, createDeliveryZone, updateDeliveryZone } from '../../services/api';
import { MapPin, Plus, Edit2, CheckCircle2, XCircle, Clock, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

export const DeliveryZonesTab: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('5.0');
  const [minOrderAmount, setMinOrderAmount] = useState('20.0');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await fetchDeliveryZones();
      setZones(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du chargement des zones de livraison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openCreateModal = () => {
    setEditingZone(null);
    setName('');
    setDeliveryFee('5.0');
    setMinOrderAmount('20.0');
    setEstimatedMinutes('30');
    setDescription('');
    setActive(true);
    setIsCreating(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const openEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setName(zone.name);
    setDeliveryFee(zone.deliveryFee.toString());
    setMinOrderAmount(zone.minOrderAmount.toString());
    setEstimatedMinutes(zone.estimatedMinutes.toString());
    setDescription(zone.description || '');
    setActive(zone.active);
    setIsCreating(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const updated = await updateDeliveryZone(zone.id, { active: !zone.active });
      setZones(zones.map(z => z.id === zone.id ? updated : z));
      setSuccessMsg(`Zone "${zone.name}" ${!zone.active ? 'activée' : 'désactivée'} avec succès.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur modification zone');
    }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Le nom de la zone est obligatoire.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        deliveryFee: parseFloat(deliveryFee) || 5.0,
        minOrderAmount: parseFloat(minOrderAmount) || 20.0,
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 30,
        description: description.trim(),
        active
      };

      if (editingZone) {
        const updated = await updateDeliveryZone(editingZone.id, payload);
        setZones(zones.map(z => z.id === editingZone.id ? updated : z));
        setSuccessMsg(`Zone "${updated.name}" mise à jour avec succès.`);
      } else {
        const created = await createDeliveryZone(payload);
        setZones([...zones, created]);
        setSuccessMsg(`Nouvelle zone "${created.name}" créée.`);
      }

      setIsCreating(false);
      setEditingZone(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l enregistrement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-stone-900">Zones & Périmètres de Livraison (Tunis)</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configuration des frais de port fixes, du montant minimum de commande et des délais estimés par secteur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadZones}
            className="p-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une zone</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map(zone => (
          <div
            key={zone.id}
            className={`p-5 rounded-2xl border transition-all ${
              zone.active
                ? 'bg-white border-stone-200 shadow-xs hover:border-emerald-300'
                : 'bg-stone-50 border-stone-200/60 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{zone.name}</span>
                </h3>
                {zone.description && (
                  <p className="text-xs text-stone-500 mt-0.5">{zone.description}</p>
                )}
              </div>
              <button
                onClick={() => handleToggleActive(zone)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                  zone.active
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {zone.active ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Frais</div>
                <div className="text-xs font-bold text-stone-900 font-mono mt-0.5">
                  {zone.deliveryFee.toFixed(2)} DT
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Min. Commande</div>
                <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">
                  {zone.minOrderAmount.toFixed(2)} DT
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Délai Est.</div>
                <div className="text-xs font-bold text-stone-900 mt-0.5 flex items-center justify-center gap-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{zone.estimatedMinutes}m</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-[11px] text-stone-400">
                Id: <span className="font-mono">{zone.id}</span>
              </span>
              <button
                onClick={() => openEditModal(zone)}
                className="text-stone-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit / Create */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base">
                {editingZone ? `Modifier : ${editingZone.name}` : 'Ajouter une Zone de Livraison'}
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom de la Zone / Secteur *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: Les Berges du Lac 1 & 2"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description / Quartiers couverts</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: Lac 1, Lac 2, Berges du Lac"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Frais de livraison (DT) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={deliveryFee}
                    onChange={e => setDeliveryFee(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Montant Min. Commande (DT) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Délai estimé (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                    />
                    <span>Zone ouverte aux commandes</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 border border-stone-300 text-stone-700 font-bold rounded-xl hover:bg-stone-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingZone ? 'Enregistrer les modifications' : 'Créer la zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
