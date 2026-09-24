import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { fetchAuditLogs } from '../../services/api';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  Clock,
  Laptop
} from 'lucide-react';

export const AuditTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Horodatage', 'Action', 'Utilisateur', 'Role', 'Categorie', 'Details', 'IP'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}"`,
      `"${l.action}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.category}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ip || '127.0.0.1'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bebba_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || l.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'order':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">COMMANDE</span>;
      case 'delivery':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">LIVRAISON</span>;
      case 'stock':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">STOCK</span>;
      case 'kitchen':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">CUISINE</span>;
      case 'claim':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">RÉCLAMATION</span>;
      case 'auth':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">AUTH</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold">SYSTÈME</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Journal d Audit & Traçabilité Complète (§65)
            </h3>
            <p className="text-xs text-stone-500">
              Enregistrement immuable de toutes les actions sensibles côté serveur (horodatage, rôle, IP & détails).
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filter & Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par action, acteur ou détails..."
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="p-2 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">Toutes les catégories</option>
              <option value="order">Commandes</option>
              <option value="delivery">Livraisons & GPS</option>
              <option value="stock">Stocks & Pertes</option>
              <option value="kitchen">Cuisine (KDS)</option>
              <option value="claim">Réclamations & Chat</option>
              <option value="auth">Authentification & Sécurité</option>
              <option value="system">Système & Caisse</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-400 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-3">Horodatage (Tunis)</th>
                <th className="p-3">Action</th>
                <th className="p-3">Acteur & Rôle</th>
                <th className="p-3">Domaine</th>
                <th className="p-3">Détails de l opération</th>
                <th className="p-3 text-right">Machine / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Chargement des logs d audit...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Aucun événement ne correspond aux critères.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50 transition">
                    <td className="p-3 font-mono text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}
                    </td>
                    <td className="p-3 font-bold text-stone-900">{log.action}</td>
                    <td className="p-3">
                      <div className="font-semibold text-stone-800">{log.userName}</div>
                      <div className="text-[10px] text-stone-400 uppercase font-mono">({log.userRole})</div>
                    </td>
                    <td className="p-3">{getCategoryBadge(log.category)}</td>
                    <td className="p-3 text-stone-700 max-w-md">{log.details}</td>
                    <td className="p-3 text-right font-mono text-[10px] text-stone-400">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
