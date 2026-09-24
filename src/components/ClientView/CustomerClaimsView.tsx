import React, { useState, useEffect, useRef } from 'react';
import { Claim, Order, ClaimType } from '../../types';
import { fetchClaims, fetchOrders, createClaim, sendClaimMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquareWarning,
  Plus,
  Send,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ShieldCheck,
  User,
  Paperclip
} from 'lucide-react';

interface CustomerClaimsViewProps {
  initialOrderForClaim?: Order | null;
}

export const CustomerClaimsView: React.FC<CustomerClaimsViewProps> = ({ initialOrderForClaim }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(!!initialOrderForClaim);
  const [loading, setLoading] = useState(true);

  // New claim form state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderForClaim?.id || '');
  const [claimType, setClaimType] = useState<ClaimType>('Produit incorrect');
  const [claimDescription, setClaimDescription] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadClaimsData, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialOrderForClaim) {
      setSelectedOrderId(initialOrderForClaim.id);
      setIsModalOpen(true);
    }
  }, [initialOrderForClaim]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedClaim?.messages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsData, ordersData] = await Promise.all([
        fetchClaims({ clientId: currentUser.id }),
        fetchOrders({ clientId: currentUser.id })
      ]);
      setClaims(claimsData);
      setOrders(ordersData);
      if (claimsData.length > 0 && !selectedClaim) {
        setSelectedClaim(claimsData[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadClaimsData = async () => {
    try {
      const claimsData = await fetchClaims({ clientId: currentUser.id });
      setClaims(claimsData);
      if (selectedClaim) {
        const fresh = claimsData.find(c => c.id === selectedClaim.id);
        if (fresh) setSelectedClaim(fresh);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const claimTypes: ClaimType[] = [
    'Produit incorrect',
    'Produit manquant',
    'Produit endommagé',
    'Quantité incorrecte',
    'Problème de qualité',
    'Commande incomplète',
    'Problème de livraison',
    'Problème de paiement',
    'Autre'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setUploadedPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !claimDescription.trim()) {
      alert('Veuillez sélectionner une commande et décrire le problème rencontré.');
      return;
    }

    try {
      setIsSubmitting(true);
      const matchedOrder = orders.find(o => o.id === selectedOrderId);
      const newClaim = await createClaim({
        orderId: selectedOrderId,
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phone,
        type: claimType,
        description: claimDescription.trim(),
        photos: uploadedPhotos
      });

      setClaims(prev => [newClaim, ...prev]);
      setSelectedClaim(newClaim);
      setIsModalOpen(false);
      setClaimDescription('');
      setUploadedPhotos([]);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la réclamation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || (!chatInput.trim() && !chatAttachment)) return;

    try {
      setIsSendingMessage(true);
      const sent = await sendClaimMessage(selectedClaim.id, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'client',
        message: chatInput.trim(),
        attachments: chatAttachment ? [chatAttachment] : undefined
      });

      setSelectedClaim(prev => (prev ? { ...prev, messages: [...prev.messages, sent] } : null));
      setChatInput('');
      setChatAttachment(null);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'OPEN':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Ouverte</span>;
      case 'IN_REVIEW':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">En traitement</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Attente réponse client</span>;
      case 'RESOLVED':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">Résolue</span>;
      case 'CLOSED':
        return <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Fermée</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Service Qualité & Réclamations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Réclamations & Support Client
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Un problème avec votre repas ? Ouvrez une réclamation avec photo et échangez en direct avec la direction BEBBA.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Réclamation</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-400">Chargement de vos réclamations...</div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">Aucune réclamation en cours</h3>
          <p className="text-xs text-stone-500 mb-6">
            Tous vos repas sains ont été livrés en bonne conformité. Si vous rencontrez le moindre souci, n hésitez pas à nous le signaler.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
          >
            Ouvrir une réclamation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Claims List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Vos dossiers ({claims.length})
            </h3>
            {claims.map(claim => {
              const isSelected = selectedClaim?.id === claim.id;
              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-stone-900">{claim.claimNumber}</span>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div className="text-xs font-semibold text-stone-800 mb-1">{claim.type}</div>
                  <div className="text-[11px] text-stone-500 line-clamp-1 mb-2">
                    Commande #{claim.orderNumber} : {claim.description}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-stone-100">
                    <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                    <span>{claim.messages?.length || 0} message(s)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat & Claim Details View */}
          {selectedClaim && (
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
              {/* Claim Header */}
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900">
                      {selectedClaim.claimNumber}
                    </span>
                    {getStatusBadge(selectedClaim.status)}
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Motif : <strong className="text-stone-900">{selectedClaim.type}</strong> • Commande #{selectedClaim.orderNumber}
                  </div>
                </div>

                {/* Resolution banner if resolved */}
                {selectedClaim.resolution && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-emerald-900">
                    <strong>Décision :</strong> {selectedClaim.resolution}
                    {selectedClaim.resolutionNotes && (
                      <span className="text-emerald-700 block text-[11px]">{selectedClaim.resolutionNotes}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Photos Gallery if attached to claim */}
              {selectedClaim.photos && selectedClaim.photos.length > 0 && (
                <div className="p-4 bg-stone-100/70 border-b border-stone-200">
                  <div className="text-[11px] font-bold text-stone-600 mb-2">Photos justificatives transmises :</div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedClaim.photos.map((p, idx) => (
                      <a key={idx} href={p} target="_blank" rel="noreferrer">
                        <img
                          src={p}
                          alt="Preuve réclamation"
                          className="w-16 h-16 rounded-xl object-cover border border-stone-300 hover:scale-105 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/50">
                {selectedClaim.messages.map(msg => {
                  const isClient = msg.senderRole === 'client';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-1 px-1">
                        {isClient ? (
                          <>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-semibold text-stone-600">Vous</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span className="font-semibold text-purple-900">Bebba Direction</span>
                            <span>• {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs shadow-xs leading-relaxed ${
                          isClient
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none'
                        }`}
                      >
                        {msg.message}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, aIdx) => (
                              <img
                                key={aIdx}
                                src={att}
                                alt="Pièce jointe"
                                className="rounded-lg max-h-40 w-auto object-cover border border-white/20"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Écrivez votre message à la direction BEBBA..."
                  className="flex-1 text-xs p-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <label className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setChatAttachment(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {chatAttachment && (
                  <div className="relative">
                    <img src={chatAttachment} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setChatAttachment(null)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-[8px]"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingMessage || (!chatInput.trim() && !chatAttachment)}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Claim */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">Nouvelle Réclamation BEBBA</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="p-6 space-y-4 text-xs">
              {/* Select order */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-800">Commande concernée *</label>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Max 3h après livraison (Règle #15 & #16)
                  </span>
                </div>
                <select
                  required
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Sélectionnez votre commande livrée</option>
                  {orders.map(o => {
                    const alreadyClaimed = claims.some(c => c.orderId === o.id || c.orderNumber === o.orderNumber);
                    const isDelivered = o.orderStatus === 'delivered';
                    const delivTime = new Date(o.deliveredAt || o.updatedAt).getTime();
                    const isWithin3Hours = Date.now() - delivTime <= 3 * 3600 * 1000;
                    const isEligible = isDelivered && isWithin3Hours && !alreadyClaimed;

                    let tag = '';
                    if (!isDelivered) tag = ' (En cours - Non éligible)';
                    else if (alreadyClaimed) tag = ' (Réclamation déjà déposée)';
                    else if (!isWithin3Hours) tag = ' (Délai de 3h dépassé)';
                    else tag = ' (Éligible ✓)';

                    return (
                      <option key={o.id} value={o.id} disabled={!isEligible}>
                        {o.orderNumber} — {o.totalAmount} DT{tag}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select type */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Motif de la réclamation *</label>
                <select
                  value={claimType}
                  onChange={e => setClaimType(e.target.value as ClaimType)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {claimTypes.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">Description détaillée *</label>
                <textarea
                  required
                  rows={3}
                  value={claimDescription}
                  onChange={e => setClaimDescription(e.target.value)}
                  placeholder="Décrivez précisément ce qui ne correspond pas (ex: sauce manquante, emballage endommagé...)"
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Photos upload (Camera / Gallery) */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Photos & Preuves visuelles (fortement recommandé)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Prendre photo / Galerie</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <span className="text-[11px] text-stone-400">JPEG, PNG, WEBP</span>
                </div>

                {uploadedPhotos.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                    {uploadedPhotos.map((photo, i) => (
                      <div key={i} className="relative shrink-0">
                        <img
                          src={photo}
                          alt="Upload preview"
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-stone-300 text-stone-700 font-bold rounded-xl hover:bg-stone-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isSubmitting ? 'Transmission...' : 'Envoyer la réclamation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
