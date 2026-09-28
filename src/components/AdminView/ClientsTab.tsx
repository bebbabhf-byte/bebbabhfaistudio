import React, { useState, useEffect } from 'react';
import { ClientProfile, Order, Claim } from '../../types';
import { fetchClients, fetchClientById, updateClientStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  X,
  CreditCard,
  Clock
} from 'lucide-react';

export const ClientsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected client detail drawer
  const [selectedClient, setSelectedClient] = useState<(ClientProfile & { orders: Order[]; claims: Claim[] }) | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client: ClientProfile) => {
    try {
      setLoadingDetail(true);
      const detail = await fetchClientById(client.id);
      setSelectedClient(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (clientId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateClientStatus(clientId, nextStatus, currentUser.name);
      loadClients();
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({ ...selectedClient, status: nextStatus as any });
      }
      showSuccess(`Statut client mis à jour : ${nextStatus === 'active' ? 'Actif' : 'Suspendu'}`);
    } catch (e: any) {
      showError(e.message || 'Erreur mise à jour statut client');
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalClientsSpent = clients.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Comptes Clients</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{clients.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">
            {clients.filter(c => (c.status || 'active') === 'active').length} comptes actifs
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Volume Total Dépensé</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono mt-2">
            {totalClientsSpent.toFixed(2)} <span className="text-xs font-semibold text-emerald-600">DT</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Chiffre d affaires cumulé client</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Fidélité Moyenne</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {clients.length > 0
              ? (clients.reduce((s, c) => s + (c.totalOrders || 0), 0) / clients.length).toFixed(1)
              : 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Commandes en moyenne par client</div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Répertoire des Clients</span>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone (+216), ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Coordonnées</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4 text-center">Commandes</th>
                <th className="py-3 px-4 text-right">Dépensé</th>
                <th className="py-3 px-4 text-center">Réclamations</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredClients.map(c => {
                const isActive = (c.status || 'active') === 'active';
                return (
                  <tr key={c.id} className="hover:bg-stone-50 transition cursor-pointer" onClick={() => handleSelectClient(c)}>
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{c.name}</div>
                      <div className="text-[11px] text-stone-400">{c.email || 'Email non renseigné'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-stone-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{c.city || 'Tunis'}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 truncate max-w-[160px]">{c.address}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {c.totalOrders || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      {(c.totalSpent || 0).toFixed(2)} DT
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(c.claimsCount || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 text-[10px]">
                          {c.claimsCount}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isActive ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleToggleStatus(c.id, c.status || 'active');
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                          isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-stone-900 text-base">{selectedClient.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (selectedClient.status || 'active') === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {(selectedClient.status || 'active') === 'active' ? 'Compte Actif' : 'Compte Suspendu'}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-3">
                  <span>Tél : {selectedClient.phone}</span>
                  {selectedClient.email && <span>Email : {selectedClient.email}</span>}
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Commandes</span>
                <span className="text-xl font-black text-stone-900">{selectedClient.orders.length}</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Dépenses Totales</span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {selectedClient.totalSpent.toFixed(2)} DT
                </span>
              </div>
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Réclamations</span>
                <span className="text-xl font-black text-rose-700">{selectedClient.claims.length}</span>
              </div>
            </div>

            {/* Past Orders */}
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                <span>Historique des Commandes ({selectedClient.orders.length})</span>
              </h4>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedClient.orders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">Aucune commande enregistrée pour le moment.</p>
                ) : (
                  selectedClient.orders.map(o => (
                    <div key={o.id} className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900 font-mono">{o.orderNumber}</div>
                        <div className="text-[11px] text-stone-400">
                          {new Date(o.createdAt).toLocaleDateString('fr-TN')} • {o.items.length} article(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-900 font-mono">{o.totalAmount.toFixed(2)} DT</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Claims */}
            {selectedClient.claims.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Dossiers SAV & Réclamations ({selectedClient.claims.length})</span>
                </h4>
                <div className="space-y-2">
                  {selectedClient.claims.map(c => (
                    <div key={c.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900 font-mono">{c.claimNumber}</div>
                        <div className="text-[11px] text-stone-600">{c.type} — {c.description}</div>
                      </div>
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                onClick={() => handleToggleStatus(selectedClient.id, selectedClient.status || 'active')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  (selectedClient.status || 'active') === 'active'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {(selectedClient.status || 'active') === 'active' ? 'Suspendre ce compte' : 'Activer ce compte'}
              </button>

              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
