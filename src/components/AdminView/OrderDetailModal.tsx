import React, { useState } from 'react';
import { Order } from '../../types';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Bike,
  CreditCard,
  ChefHat,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  History
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onAssignDriver?: (order: Order) => void;
  onReassignDriver?: (order: Order) => void;
  onCancelOrder?: (order: Order) => void;
  onPrioritize?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onAssignDriver,
  onReassignDriver,
  onCancelOrder,
  onPrioritize
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">{order.orderNumber}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.orderStatus === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : order.orderStatus === 'delivering'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                      : order.orderStatus === 'ready'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {order.orderStatus}
                </span>
                {order.priority && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      order.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : order.priority === 'vip'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-stone-700 text-stone-300'
                    }`}
                  >
                    {order.priority}
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-400 mt-0.5 font-mono">
                Token public de suivi : <strong>{order.trackingToken}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Client & Adresse (§6) */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Client & Coordonnées</span>
              </div>
              <div className="font-black text-sm text-stone-900">{order.clientName}</div>
              <div className="flex items-center gap-1.5 text-stone-600 font-mono mt-1">
                <Phone className="w-3 h-3 text-stone-400" />
                <span>{order.clientPhone}</span>
              </div>
              {order.clientId && (
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">ID : {order.clientId}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Adresse de Livraison</span>
              </div>
              {order.deliveryZoneName && (
                <div className="font-bold text-emerald-800 text-[11px] mb-0.5">
                  Zone : {order.deliveryZoneName}
                </div>
              )}
              <div className="text-stone-800 font-medium">{order.deliveryAddress}, {order.deliveryCity}</div>
              {order.deliveryNotes && (
                <div className="text-[11px] text-stone-500 italic mt-1 bg-white p-2 rounded-lg border border-stone-200">
                  Note : « {order.deliveryNotes} »
                </div>
              )}
            </div>
          </div>

          {/* 2. Produits & Quantités (§6) */}
          <div>
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-purple-600" />
              <span>Contenu de la Commande ({order.items?.length || 0} articles)</span>
            </div>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <div className="font-bold text-stone-900 text-xs">
                        {item.quantity}x {item.productName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {item.unitPrice.toFixed(2)} DT l unité
                      </div>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedOptions.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-100"
                            >
                              +{opt.name} ({opt.priceDelta > 0 ? `+${opt.priceDelta.toFixed(2)} DT` : 'inclus'})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="font-black text-sm text-stone-900 font-mono">
                    {item.itemTotal.toFixed(2)} DT
                  </div>
                </div>
              ))}

              {/* Totals Summary */}
              <div className="p-4 bg-stone-50 space-y-1.5 text-right font-medium">
                <div className="text-stone-500 flex justify-between">
                  <span>Sous-total articles :</span>
                  <span className="font-mono font-bold text-stone-800">{order.subtotal.toFixed(2)} DT</span>
                </div>
                <div className="text-stone-500 flex justify-between">
                  <span>Frais de livraison ({order.deliveryZoneName || 'Standard'}) :</span>
                  <span className="font-mono font-bold text-stone-800">{order.deliveryFee.toFixed(2)} DT</span>
                </div>
                <div className="text-stone-900 text-sm font-black flex justify-between pt-2 border-t border-stone-200">
                  <span>Total à encaisser (COD) :</span>
                  <span className="font-mono text-base text-emerald-700">{order.totalAmount.toFixed(2)} DT</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Livraison & Livreur affecté (§6, §7, §8) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                Mise en Livraison & Livreur
              </span>
              {order.assignedDriverId && (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Affecté
                </span>
              )}
            </div>

            {order.assignedDriverName ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl">
                <div>
                  <div className="font-black text-stone-900 text-xs">{order.assignedDriverName}</div>
                  <div className="text-[11px] text-stone-500 font-mono">{order.assignedDriverPhone}</div>
                  {order.assignedVehicle && (
                    <div className="text-[11px] text-stone-400">Véhicule : {order.assignedVehicle}</div>
                  )}
                </div>

                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && onReassignDriver && (
                  <button
                    onClick={() => onReassignDriver(order)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-black transition"
                  >
                    Réaffecter un autre livreur (§8)
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-amber-800 font-medium text-xs">Aucun livreur actuellement affecté</span>
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && onAssignDriver && (
                  <button
                    onClick={() => onAssignDriver(order)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
                  >
                    Affecter un livreur (§7)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Paiement (§6, §28) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Statut du Paiement & Encaissement</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <div>
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {order.paymentStatus === 'paid' ? 'Payé (PAID)' : 'À encaisser (TO_COLLECT)'}
                </span>
                <div className="text-[11px] text-stone-500 mt-1">
                  Mode : Espèces à la livraison (COD)
                </div>
              </div>

              {order.paidAt && (
                <div className="text-right text-[11px] text-stone-500">
                  <div>Encaissé le : {new Date(order.paidAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</div>
                  {order.paidBy && <div>Par : <strong>{order.paidBy}</strong></div>}
                </div>
              )}
            </div>
          </div>

          {/* 5. Historique & Transitions (§6, §8, §9) */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-stone-600" />
              <span>Historique des Événements</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-stone-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                <span>Création : {new Date(order.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</span>
              </div>
              {order.preparedAt && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Prise en préparation cuisine : {new Date(order.preparedAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</span>
                </div>
              )}
              {order.readyAt && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Déclarée prête : {new Date(order.readyAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Livraison confirmée : {new Date(order.deliveredAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })}</span>
                </div>
              )}
              {order.cancelReason && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 mt-2 font-medium">
                  Annulée par {order.cancelledBy || 'Admin'} : « {order.cancelReason} »
                </div>
              )}

              {/* Reassignment logs (§8) */}
              {order.reassignmentHistory && order.reassignmentHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-200 space-y-1">
                  <div className="font-bold text-stone-700">Historique des réaffectations de livreur :</div>
                  {order.reassignmentHistory.map((re, rIdx) => (
                    <div key={rIdx} className="text-[10px] text-stone-500">
                      • {new Date(re.reassignedAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' })} :
                      Changé de <strong>{re.oldDriverName}</strong> à <strong>{re.newDriverName}</strong> par {re.reassignedBy}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && onPrioritize && (
              <button
                onClick={() => onPrioritize(order)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition"
              >
                Priorité
              </button>
            )}

            {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && onCancelOrder && (
              <button
                onClick={() => onCancelOrder(order)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition"
              >
                Annuler la commande (§9)
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
