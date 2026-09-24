import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  ChefHat,
  Bike,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Lock,
  Phone,
  Mail,
  MapPin,
  Shield
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'driver' as UserRole,
    status: 'active' as 'active' | 'suspended' | 'inactive',
    address: '',
    city: 'Tunis',
    governorate: 'Tunis'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsersList();
  }, []);

  const loadUsersList = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'driver',
      status: 'active',
      address: '',
      city: 'Tunis',
      governorate: 'Tunis'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.rawPhone || user.phone,
      email: user.email || '',
      role: user.role,
      status: user.status || 'active',
      address: user.address || '',
      city: user.city || 'Tunis',
      governorate: user.governorate || 'Tunis'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          address: formData.address,
          city: formData.city,
          governorate: formData.governorate
        });
      } else {
        await createUser({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
          address: formData.address,
          city: formData.city,
          governorate: formData.governorate
        });
      }
      setIsModalOpen(false);
      loadUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (user.id === currentUser.id) {
      alert('Vous ne pouvez pas désactiver votre propre compte Super Admin.');
      return;
    }
    if (!confirm(`Confirmer la désactivation du compte de ${user.name} ?`)) return;

    try {
      await deleteUser(user.id);
      loadUsersList();
    } catch (e: any) {
      alert(e.message || 'Erreur désactivation');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3" />
            Super Admin
          </span>
        );
      case 'kitchen':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ChefHat className="w-3 h-3" />
            Cuisine / KDS
          </span>
        );
      case 'driver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Bike className="w-3 h-3" />
            Livreur Flotte
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3" />
            Client BEBBA
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Utilisateurs</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">{users.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">Tous rôles confondus</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Super Admins</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Accès total (§3)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Équipe Cuisine</span>
            <ChefHat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {users.filter(u => u.role === 'kitchen').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Opérateurs KDS (§10)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Livreurs</span>
            <Bike className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {users.filter(u => u.role === 'driver').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Flotte active (§24, §25)</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-sm text-stone-900">
              Gestion des Utilisateurs & Permissions RBAC (§2, §3, §25, §57)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher nom, tel (+216), email..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="p-2 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Super Admin</option>
              <option value="kitchen">Cuisine (KDS)</option>
              <option value="driver">Livreur</option>
              <option value="client">Client</option>
            </select>

            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Utilisateur</span>
            </button>
          </div>
        </div>

        {/* Permissions Matrix Card (§57) */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs">
          <div className="font-bold text-stone-800 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Matrice de Permissions Active (§57)</span>
          </div>
          <p className="text-stone-500 text-[11px]">
            • <strong>Super Admin</strong> : Accès intégral, validation des clôtures de caisse, affectations, paramètres & stocks.<br />
            • <strong>Cuisine (KDS)</strong> : Visualisation des commandes, avancement des états de préparation, consultation en lecture seule des ingrédients et stocks en temps réel, pas d'accès aux prix de vente ni aux données financières/utilisateurs.<br />
            • <strong>Livreur</strong> : Accès restreint à ses missions affectées, GPS en transit et encaissement en espèces (COD).<br />
            • <strong>Client</strong> : Consultation de ses propres commandes, suivi de sa livraison, réclamations et chat dédié.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Ville</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map(u => {
                const isActive = (u.status || 'active') === 'active';
                return (
                  <tr key={u.id} className="hover:bg-stone-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{u.name}</div>
                      <div className="text-[10px] text-stone-400 font-mono">ID: {u.id}</div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-700">{u.phone}</td>
                    <td className="py-3 px-4 text-stone-600">{u.email || '—'}</td>
                    <td className="py-3 px-4 text-stone-600">{u.city || 'Tunis'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-purple-700 hover:bg-purple-50 transition"
                          title="Modifier utilisateur"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                            title="Désactiver compte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingUser ? 'Modifier le compte' : 'Créer un utilisateur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mohamed Khemiri"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Téléphone (+216) *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="98 123 456"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Rôle *</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="driver">Livreur</option>
                    <option value="kitchen">Cuisine (KDS)</option>
                    <option value="admin">Super Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@bebba.tn"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="active">Actif</option>
                    <option value="suspended">Suspendu</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse ou quartier..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-500 text-[11px] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Sécurité (§25) : Le mot de passe initial généré sera envoyé de façon sécurisée par SMS.</span>
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer l utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
