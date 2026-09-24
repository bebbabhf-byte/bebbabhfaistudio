import React, { useState, useEffect } from 'react';
import { CashClosingRecord } from '../../types';
import { fetchCashReconciliation, submitCashClosing, fetchCashClosings } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const CashClosingTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [closings, setClosings] = useState<CashClosingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Closing form state
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [reconData, closingsData] = await Promise.all([
        fetchCashReconciliation(),
        fetchCashClosings()
      ]);
      setReconciliation(reconData);
      setClosings(closingsData);
      if (reconData?.theoreticalAmount !== undefined && !declaredAmount) {
        setDeclaredAmount(reconData.theoreticalAmount.toString());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du chargement de la caisse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePerformClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const decVal = parseFloat(declaredAmount);
    if (isNaN(decVal) || decVal < 0) {
      setErrorMsg('Veuillez entrer un montant réel déclaré valide en Dinars Tunisiens (DT).');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitCashClosing({
        declaredAmount: decVal,
        notes: notes.trim(),
        closedByUserId: currentUser.id,
        closedByName: currentUser.name || 'Directeur Général',
        closedByRole: currentUser.role || 'admin'
      });

      setSuccessMsg(`Clôture de caisse n° ${result.closing.closingNumber} validée avec succès.`);
      setNotes('');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la clôture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTheoretical = reconciliation ? reconciliation.theoreticalAmount : 0;
  const declaredNum = parseFloat(declaredAmount) || 0;
  const currentDiscrepancy = parseFloat((declaredNum - currentTheoretical).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-stone-900">Gestion de Caisse & Clôture Journalière (COD)</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
            <span>Fuseau horaire : <strong>Africa/Tunis</strong></span>
            <span>•</span>
            <span>Date d exploitation : <strong>{reconciliation?.periodDate || new Date().toISOString().split('T')[0]}</strong></span>
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition self-start sm:self-auto"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase">Théorique à encaisser</div>
          <div className="text-2xl font-black text-stone-900 font-mono mt-1">
            {reconciliation?.theoreticalAmount.toFixed(2) || '0.00'} DT
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {reconciliation?.deliveredOrdersCount || 0} commandes livrées
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Encaissé & Validé</div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {reconciliation?.paidAmount.toFixed(2) || '0.00'} DT
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {reconciliation?.paidOrdersCount || 0} commandes réglées
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase">En cours chez les livreurs</div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {reconciliation?.pendingAmount.toFixed(2) || '0.00'} DT
          </div>
          <div className="text-[11px] text-amber-600 mt-1">
            {reconciliation?.pendingCollectCount || 0} règlements en attente
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-600 uppercase">Livreurs en service</div>
          <div className="text-2xl font-black text-blue-700 font-mono mt-1">
            {reconciliation?.byDriver?.length || 0}
          </div>
          <div className="text-[11px] text-blue-600 mt-1">
            Actifs sur la journée
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Clôture de Caisse */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Effectuer la Clôture de Caisse</h3>
          </div>

          <form onSubmit={handlePerformClosing} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Montant théorique attendu</label>
              <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl font-bold font-mono text-stone-900 text-sm">
                {currentTheoretical.toFixed(2)} DT
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Montant réel compté en caisse (DT) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={declaredAmount}
                onChange={e => setDeclaredAmount(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-base font-bold text-stone-900"
                placeholder="0.00"
              />
            </div>

            {/* Live Discrepancy indicator */}
            <div className={`p-3 rounded-xl border text-xs ${
              Math.abs(currentDiscrepancy) < 0.01
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : currentDiscrepancy < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex justify-between items-center font-bold">
                <span>Écart calculé (Déclaré - Théorique) :</span>
                <span className="font-mono text-sm">
                  {currentDiscrepancy >= 0 ? '+' : ''}{currentDiscrepancy.toFixed(2)} DT
                </span>
              </div>
              <p className="text-[11px] mt-1 opacity-90">
                {Math.abs(currentDiscrepancy) < 0.01
                  ? '✓ Caisse parfaitement équilibrée.'
                  : currentDiscrepancy < 0
                    ? '⚠️ Manquant de caisse détecté. Sera enregistré et consigné dans l audit.'
                    : 'ℹ️ Excédent de caisse constaté.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Observations / Justificatifs d écart</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Ex: Fond de caisse vérifié, 2DT de pourboire laissé au comptoir..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Validation...' : 'Valider & Signer la Clôture'}</span>
            </button>
          </form>
        </div>

        {/* Détail par livreur & Historique des clôtures */}
        <div className="lg:col-span-2 space-y-6">
          {/* Situation par livreur */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Encaissements par Livreur ({reconciliation?.periodDate})</span>
              </h3>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {(!reconciliation?.byDriver || reconciliation.byDriver.length === 0) ? (
                <div className="text-stone-400 py-3 text-center text-xs">
                  Aucun encaissement livreur enregistré aujourd hui.
                </div>
              ) : (
                reconciliation.byDriver.map((d: any) => (
                  <div key={d.driverId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">{d.driverName}</div>
                      <div className="text-[11px] text-stone-400">{d.count} commandes livrées</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700 font-mono">
                        {d.totalCollected.toFixed(2)} DT encaissés
                      </div>
                      {d.totalToCollect > 0 && (
                        <div className="text-[11px] text-amber-600 font-mono">
                          {d.totalToCollect.toFixed(2)} DT en cours
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historique des clôtures */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Historique des Clôtures Validées</span>
              </h3>
              <span className="text-[11px] text-stone-400">{closings.length} clôtures archivées</span>
            </div>

            {closings.length === 0 ? (
              <div className="text-stone-400 py-6 text-center text-xs">
                Aucune clôture de caisse n a encore été enregistrée.
              </div>
            ) : (
              <div className="space-y-3">
                {closings.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{c.closingNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'validated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.status === 'validated' ? 'Sans écart' : 'Écart signalé'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{new Date(c.closingDate).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</span>
                        <span>• Par {c.closedBy.name}</span>
                      </div>
                      {c.notes && (
                        <div className="text-[11px] text-stone-600 italic mt-1">« {c.notes} »</div>
                      )}
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200">
                      <div className="font-mono font-bold text-stone-900">
                        {c.declaredAmount.toFixed(2)} DT déclarés
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        (Théorique : {c.theoreticalAmount.toFixed(2)} DT)
                      </div>
                      <div className={`text-[11px] font-bold font-mono ${
                        Math.abs(c.discrepancy) < 0.01
                          ? 'text-emerald-600'
                          : c.discrepancy < 0
                            ? 'text-rose-600'
                            : 'text-amber-600'
                      }`}>
                        Écart : {c.discrepancy >= 0 ? '+' : ''}{c.discrepancy.toFixed(2)} DT
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
