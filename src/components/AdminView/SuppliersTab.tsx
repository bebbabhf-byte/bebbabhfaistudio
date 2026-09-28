import React, { useState, useEffect } from 'react';
import { Supplier, Ingredient } from '../../types';
import { fetchSuppliers, fetchIngredients, createSupplier, updateSupplier, deleteSupplier } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Search,
  CheckCircle,
  XCircle,
  Package,
  X
} from 'lucide-react';

export const SuppliersTab: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: '',
    notes: '',
    suppliedIngredients: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sups, ings] = await Promise.all([fetchSuppliers(), fetchIngredients()]);
      setSuppliers(sups);
      setIngredients(ings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setForm({
        name: sup.name,
        phone: sup.phone,
        email: sup.email || '',
        address: sup.address || '',
        contactPerson: sup.contactPerson || '',
        notes: sup.notes || '',
        suppliedIngredients: sup.suppliedIngredients || []
      });
    } else {
      setEditingSupplier(null);
      setForm({
        name: '',
        phone: '',
        email: '',
        address: 'Grand Tunis',
        contactPerson: '',
        notes: '',
        suppliedIngredients: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, form);
        showSuccess(`Fournisseur « ${form.name} » mis à jour.`);
      } else {
        await createSupplier(form);
        showSuccess(`Fournisseur « ${form.name} » ajouté avec succès.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur enregistrement fournisseur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce fournisseur ?')) return;
    try {
      await deleteSupplier(id);
      showSuccess('Fournisseur désactivé avec succès.');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur désactivation fournisseur');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Gestion des Fournisseurs Agréés</h3>
            <p className="text-xs text-stone-500">Approvisionnement en matières premières fraîches et biologiques.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Rechercher un fournisseur, contact, téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => {
          const suppliedCount = ingredients.filter(i => i.supplierId === sup.id || i.supplierName === sup.name).length;
          return (
            <div key={sup.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-purple-200 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{sup.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Contact : <strong className="text-stone-700">{sup.contactPerson || 'Direction'}</strong></span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sup.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {sup.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span className="font-mono text-stone-800">{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-600 truncate">{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-600">{sup.address}</span>
                  </div>
                )}
              </div>

              {/* Supplied Ingredients Badge */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center justify-between">
                  <span>Matières fournies</span>
                  <span className="text-purple-700 font-bold">{suppliedCount} ingrédient(s)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sup.suppliedIngredients && sup.suppliedIngredients.length > 0 ? (
                    sup.suppliedIngredients.map((item, idx) => (
                      <span key={idx} className="bg-white border border-stone-200 px-2 py-0.5 rounded-md text-[10px] text-stone-700">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-stone-400 italic text-[11px]">Général</span>
                  )}
                </div>
              </div>

              {sup.notes && (
                <p className="text-[11px] text-stone-400 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                  « {sup.notes} »
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => handleOpenModal(sup)}
                  className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sup.id)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                  title="Désactiver"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Raison Sociale / Nom *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: BioFarm Tunisie"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Téléphone (+216) *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="98 123 456"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Contact Référent</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Ex: M. Slim"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@fournisseur.tn"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Adresse / Localisation</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Zone Industrielle Charguia, Tunis"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Notes / Conditions d approvisionnement</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Livraison chaque lundi matin à 7h..."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};
