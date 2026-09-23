import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/api';
import { Order } from '../../types';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Phone, MapPin, Bike } from 'lucide-react';

interface CartDrawerProps {
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderPlaced }) => {
  const { items, subtotal, deliveryFee, totalAmount, isCartOpen, setIsCartOpen, removeItem, updateQuantity, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [clientName, setClientName] = useState(currentUser.name || '');
  const [clientPhone, setClientPhone] = useState(currentUser.rawPhone || currentUser.phone || '+216 98 765 432');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.address || '14 Rue de la Liberté, El Menzah 6');
  const [deliveryCity, setDeliveryCity] = useState(currentUser.city || 'Tunis');
  const [deliveryNotes, setDeliveryNotes] = useState('Sonner à l interphone 14, 2ème étage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCartOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim() || !clientPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Veuillez renseigner votre nom, téléphone et adresse de livraison.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        clientId: currentUser.id,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryNotes: deliveryNotes.trim(),
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          specialInstructions: item.specialInstructions
        }))
      };

      const newOrder = await createOrder(payload);
      clearCart();
      setIsCartOpen(false);
      setIsCheckingOut(false);
      onOrderPlaced(newOrder);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la validation de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-stone-900">
              {isCheckingOut ? 'Validation de votre Commande' : 'Votre Panier Repas'}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-8">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-stone-700 font-bold mb-1">Votre panier est vide</h3>
              <p className="text-xs text-stone-500 mb-6">
                Découvrez nos plats sains préparés à la commande et nos jus détox frais.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
              >
                Explorer la carte
              </button>
            </div>
          ) : !isCheckingOut ? (
            // Cart Items List
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex gap-3.5 items-start"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{item.productName}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selected options */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="my-1 space-y-0.5">
                        {item.selectedOptions.map(opt => (
                          <div key={opt.optionId} className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <span>+ {opt.name}</span>
                            {opt.priceDelta > 0 && (
                              <span className="text-stone-400">({opt.priceDelta.toFixed(2)} DT)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className="text-[11px] text-amber-800 italic mt-0.5">
                        « {item.specialInstructions} »
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-stone-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-stone-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-stone-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-mono text-xs font-bold text-stone-900">
                        {item.itemTotal.toFixed(2)} DT
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Checkout Form
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: Sarra Mansour"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Téléphone tunisien (obligatoire) *</span>
                  <span className="text-[10px] text-stone-400">Format: +216 ou 8 chiffres</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full pl-9 p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    placeholder="+216 98 123 456"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Sera transformé en identifiant unique (ex: 0021698123456)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Gouvernorat / Ville *</label>
                  <select
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tunis">Tunis</option>
                    <option value="Ariana">Ariana</option>
                    <option value="La Marsa">La Marsa</option>
                    <option value="Carthage">Carthage</option>
                    <option value="Ben Arous">Ben Arous</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Frais de livraison</label>
                  <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl font-bold font-mono text-emerald-700">
                    5.00 DT (Fixe)
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Adresse exacte de livraison *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <textarea
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Numéro, Rue, Résidence, Bâtiment..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Instructions pour le livreur</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Étage, code interphone, repère..."
                />
              </div>

              {/* Payment Mode Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                <Bike className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900 text-xs">Paiement à la livraison (COD)</div>
                  <div className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                    Règlement en espèces directement auprès de votre livreur à la remise de votre repas sain.
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total</span>
                <span className="font-mono">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Livraison</span>
                <span className="font-mono">{deliveryFee.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>Total à régler (COD)</span>
                <span className="font-mono text-emerald-600 text-base">{totalAmount.toFixed(2)} DT</span>
              </div>
            </div>

            {!isCheckingOut ? (
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <span>Commander maintenant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-3 border border-stone-300 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-100 transition"
                >
                  Retour
                </button>
                <button
                  form="checkout-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Envoi de votre commande...</span>
                  ) : (
                    <span>Confirmer la commande ({totalAmount.toFixed(2)} DT)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
