import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../../types';
import { fetchSettings, updateSettings, downloadBackup, restoreBackup } from '../../services/api';
import {
  Settings,
  DollarSign,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle,
  Truck,
  Percent,
  Sliders,
  Save,
  Database,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await updateSettings(settings);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour des paramètres');
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-xs text-stone-400">Chargement des paramètres...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Paramètres Généraux de la Plateforme</h3>
            <p className="text-xs text-stone-500">Configuration financière, seuils de livraison et horaires de service.</p>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-purple-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les modifications</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Paramètres enregistrés et diffusés en temps réel avec succès !</span>
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarification & Livraison */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2 text-purple-700">
            <Truck className="w-4 h-4" />
            <span>Frais de Livraison & Fiscalité</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Frais de livraison standard (DT)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.deliveryFee}
                onChange={e => setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Appliqué par défaut sur chaque commande.</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Seuil de livraison gratuite (DT)
              </label>
              <input
                type="number"
                step="1"
                value={settings.freeDeliveryThreshold}
                onChange={e => setSettings({ ...settings, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Frais offerts au-delà de ce panier.</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Taux de TVA (%)
              </label>
              <input
                type="number"
                step="1"
                value={settings.vatRate}
                onChange={e => setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Exploitation & Horaires */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2 text-purple-700">
            <Clock className="w-4 h-4" />
            <span>Horaires & Ouverture du Service</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Heure d ouverture</label>
                <input
                  type="text"
                  value={settings.openingTime}
                  onChange={e => setSettings({ ...settings, openingTime: e.target.value })}
                  placeholder="10:00"
                  className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Heure de fermeture</label>
                <input
                  type="text"
                  value={settings.closingTime}
                  onChange={e => setSettings({ ...settings, closingTime: e.target.value })}
                  placeholder="23:00"
                  className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.acceptingOrders}
                  onChange={e => setSettings({ ...settings, acceptingOrders: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="font-bold text-stone-800">
                  Accepter de nouvelles commandes en direct
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoAssignDrivers}
                  onChange={e => setSettings({ ...settings, autoAssignDrivers: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="font-bold text-stone-800">
                  Pré-affectation intelligente des livreurs les plus proches
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 md:col-span-2">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2 text-purple-700">
            <Phone className="w-4 h-4" />
            <span>Coordonnées Officielles du Service Client & SAV</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Téléphone Support Client</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Réclamations & Support</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Devise du système</label>
              <input
                type="text"
                disabled
                value={`${settings.currency} (Dinar Tunisien)`}
                className="w-full px-3 py-2 border rounded-xl bg-stone-100 text-stone-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sauvegardes & Continuité d'activité (§81, §92) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 md:col-span-2">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2 text-purple-700">
            <Database className="w-4 h-4" />
            <span>Sauvegarde, Restauration & Continuité d'Exploitation (§81, §92)</span>
          </h4>

          <p className="text-xs text-stone-500">
            Exportez l'intégralité des données (utilisateurs, commandes, catalogue, stocks, clôtures de caisse et traçabilité) sous forme de snapshot JSON sécurisé, ou restaurez un état précédent.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const backup = await downloadBackup();
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute('href', dataStr);
                  dlAnchor.setAttribute('download', `bebba_snapshot_${new Date().toISOString().slice(0, 10)}.json`);
                  document.body.appendChild(dlAnchor);
                  dlAnchor.click();
                  dlAnchor.remove();
                } catch (e: any) {
                  alert(e.message || 'Erreur lors du téléchargement du backup');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Exporter la sauvegarde complète (JSON)</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>Restaurer une sauvegarde</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async event => {
                    try {
                      const json = JSON.parse(event.target?.result as string);
                      if (!confirm('Attention : La restauration remplacera toutes les données en mémoire. Voulez-vous continuer ?')) {
                        return;
                      }
                      await restoreBackup(json);
                      alert('Sauvegarde restaurée avec succès ! La page va s actualiser.');
                      window.location.reload();
                    } catch (err: any) {
                      alert('Fichier invalide : ' + (err.message || 'Format JSON incorrect'));
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};
