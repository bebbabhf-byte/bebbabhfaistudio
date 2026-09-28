import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../../types';
import { fetchOrders, fetchTrackingByToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MapPin,
  Bike,
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  AlertCircle,
  Phone,
  Navigation,
  Sparkles,
  MessageSquareWarning,
  RefreshCw,
  Eye
} from 'lucide-react';

interface OrderTrackingViewProps {
  initialToken?: string;
  onOpenClaim: (order: Order) => void;
}

const GOOGLE_MAPS_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBE0_VhQhFOs9vlWRLCvWF2DApVQZDpTbY';

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialToken,
  onOpenClaim
}) => {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [loading, setLoading] = useState(true);
  const [lastGpsAge, setLastGpsAge] = useState<number>(0);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Poll / SSE for updates
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update GPS timer age (e.g. "Dernière position : il y a 8s")
  useEffect(() => {
    const ageInterval = setInterval(() => {
      if (selectedOrder?.currentLocation?.timestamp) {
        const diffSec = Math.round(
          (Date.now() - new Date(selectedOrder.currentLocation.timestamp).getTime()) / 1000
        );
        setLastGpsAge(Math.max(0, diffSec));
      }
    }, 1000);
    return () => clearInterval(ageInterval);
  }, [selectedOrder]);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);

      if (!selectedOrder && data.length > 0) {
        // Prefer the currently delivering or most recent order
        const delivering = data.find(o => o.orderStatus === 'delivering');
        setSelectedOrder(delivering || data[0]);
      } else if (selectedOrder) {
        const fresh = data.find(o => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      setLoading(true);
      const trackingData = await fetchTrackingByToken(tokenInput.trim().toUpperCase());
      const matched = orders.find(o => o.trackingToken === tokenInput.trim().toUpperCase());
      if (matched) {
        setSelectedOrder(matched);
      } else {
        // Construct temporary order representation
        setSelectedOrder(trackingData as any);
      }
      showSuccess(`Commande ${trackingData?.orderNumber || tokenInput} trouvée.`);
    } catch (err: any) {
      showError(err.message || 'Code de suivi introuvable. Vérifiez votre saisie.');
    } finally {
      setLoading(false);
    }
  };

  // Google Maps SDK Initialization
  useEffect(() => {
    if (!mapContainerRef.current || !selectedOrder) return;

    // Load Google Maps script if not loaded
    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript && GOOGLE_MAPS_KEY) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleMap();
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    } else if ((window as any).google?.maps) {
      initGoogleMap();
    }
  }, [selectedOrder?.id]);

  // Update markers when driver location changes
  useEffect(() => {
    if (!googleMapInstanceRef.current || !selectedOrder) return;
    updateMapPositions();
  }, [selectedOrder?.currentLocation?.latitude, selectedOrder?.currentLocation?.longitude]);

  const initGoogleMap = () => {
    try {
      if (!mapContainerRef.current || !(window as any).google?.maps) return;

      const google = (window as any).google;
      const clientLat = selectedOrder?.deliveryLat || 36.8398;
      const clientLng = selectedOrder?.deliveryLng || 10.1654;

      const mapOptions = {
        center: { lat: clientLat, lng: clientLng },
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
          { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'on' }] }
        ]
      };

      const map = new google.maps.Map(mapContainerRef.current, mapOptions);
      googleMapInstanceRef.current = map;

      // Destination Marker
      destinationMarkerRef.current = new google.maps.Marker({
        position: { lat: clientLat, lng: clientLng },
        map,
        title: 'Destination Client',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(42, 42)
        }
      });

      updateMapPositions();
    } catch (e) {
      console.error('Google Maps init error:', e);
      setMapError(true);
    }
  };

  const updateMapPositions = () => {
    try {
      const google = (window as any).google;
      if (!google?.maps || !googleMapInstanceRef.current || !selectedOrder) return;

      const map = googleMapInstanceRef.current;
      const isDelivering = selectedOrder.orderStatus === 'delivering';
      const driverLoc = selectedOrder.currentLocation;

      if (isDelivering && driverLoc) {
        const driverPos = { lat: driverLoc.latitude, lng: driverLoc.longitude };
        const destPos = {
          lat: selectedOrder.deliveryLat || 36.8398,
          lng: selectedOrder.deliveryLng || 10.1654
        };

        // Driver Marker
        if (!driverMarkerRef.current) {
          driverMarkerRef.current = new google.maps.Marker({
            position: driverPos,
            map,
            title: `Livreur : ${selectedOrder.assignedDriverName || 'Bebba'}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });
        } else {
          driverMarkerRef.current.setPosition(driverPos);
        }

        // Polyline connecting Driver to Client
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }

        routePolylineRef.current = new google.maps.Polyline({
          path: [
            ...(selectedOrder.locationHistory || []).map(p => ({ lat: p.latitude, lng: p.longitude })),
            driverPos,
            destPos
          ],
          geodesic: true,
          strokeColor: '#059669',
          strokeOpacity: 0.8,
          strokeWeight: 4
        });
        routePolylineRef.current.setMap(map);

        // Fit bounds to show both
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(driverPos);
        bounds.extend(destPos);
        map.fitBounds(bounds, 50);
      } else {
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setMap(null);
          driverMarkerRef.current = null;
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }
      }
    } catch (e) {
      console.warn('Map update error:', e);
    }
  };

  const getTimelineSteps = (status: OrderStatus) => {
    const steps = [
      { key: 'received', label: 'Commande reçue', icon: CheckCircle2, desc: 'Enregistrée & transmise en cuisine' },
      { key: 'preparing', label: 'En préparation', icon: ChefHat, desc: 'Cuisine saine minute' },
      { key: 'ready', label: 'Commande prête', icon: PackageCheck, desc: 'Emballée & en attente livreur' },
      { key: 'waiting_for_driver', label: 'Livreur affecté', icon: Bike, desc: 'Affectation confirmée' },
      { key: 'delivering', label: 'Livraison en cours', icon: Navigation, desc: 'Suivi GPS activé en temps réel' },
      { key: 'delivered', label: 'Commande livrée', icon: CheckCircle2, desc: 'Remise au client' }
    ];

    const orderIndex: Record<OrderStatus, number> = {
      received: 0,
      preparing: 1,
      ready: 2,
      waiting_for_driver: 3,
      delivering: 4,
      delivered: 5,
      cancelled: -1
    };

    const currentIdx = orderIndex[status] ?? 0;

    return steps.map((step, idx) => ({
      ...step,
      isCompleted: idx <= currentIdx && status !== 'cancelled',
      isCurrent: idx === currentIdx && status !== 'cancelled'
    }));
  };

  const isDelivering = selectedOrder?.orderStatus === 'delivering';
  const isDelivered = selectedOrder?.orderStatus === 'delivered';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Token Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Tracking BEBBA Temps Réel
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Suivi GPS & Statut de Livraison
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Visualisez le parcours de votre livreur sur Google Maps en direct de la cuisine à votre porte.
          </p>
        </div>

        {/* Token Search Bar */}
        <form onSubmit={handleTrackByToken} className="flex gap-2">
          <input
            type="text"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value.toUpperCase())}
            placeholder="Code de suivi (ex: AB7K92QX)"
            maxLength={8}
            className="w-48 sm:w-56 p-2.5 text-xs font-mono font-bold tracking-widest uppercase border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Suivre
          </button>
        </form>
      </div>

      {/* Select Recent Orders Quick Switcher */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap mr-1">Commandes récentes :</span>
          {orders.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                selectedOrder?.id === o.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>{o.orderNumber}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  o.orderStatus === 'delivering'
                    ? 'bg-blue-400 animate-ping'
                    : o.orderStatus === 'delivered'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {selectedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Interactive Map & Live Driver Telemetry */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-md">
              {/* Map Header Status Banner */}
              <div className="p-4 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>Livreur : {selectedOrder.assignedDriverName || 'Affectation en cours'}</span>
                      {selectedOrder.assignedVehicle && (
                        <span className="text-[11px] text-stone-400 font-normal">
                          ({selectedOrder.assignedVehicle})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Commande #{selectedOrder.orderNumber} • Code {selectedOrder.trackingToken}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isDelivering ? (
                    <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-full font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>GPS en direct</span>
                      <span className="text-stone-400">|</span>
                      <span>il y a {lastGpsAge}s</span>
                    </div>
                  ) : isDelivered ? (
                    <div className="bg-stone-800 text-stone-300 text-xs px-3 py-1 rounded-full">
                      ✓ Livraison terminée
                    </div>
                  ) : (
                    <div className="bg-amber-950/70 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-800">
                      En attente de départ
                    </div>
                  )}
                </div>
              </div>

              {/* Map Canvas / Google Maps container */}
              <div className="relative h-96 w-full bg-stone-100 overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Overlay telemetry panel when delivering */}
                {isDelivering && selectedOrder.currentLocation && (
                  <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-stone-900">
                      <Navigation className="w-4 h-4 text-emerald-600 animate-spin" />
                      <span>Télémétrie Livreur</span>
                    </div>
                    <div className="font-mono text-[11px] text-stone-600">
                      Lat: {selectedOrder.currentLocation.latitude.toFixed(4)} • Lng:{' '}
                      {selectedOrder.currentLocation.longitude.toFixed(4)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <span>Vitesse : {selectedOrder.currentLocation.speed || 30} km/h</span>
                      <span>Précision : ±{selectedOrder.currentLocation.accuracy || 8}m</span>
                    </div>
                  </div>
                )}

                {/* Privacy disclaimer overlay when not delivering */}
                {!isDelivering && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                      {isDelivered ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <ChefHat className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-base mb-1">
                      {isDelivered
                        ? 'Commande Livrée avec Succès !'
                        : 'Préparation en Cuisine en Cours'}
                    </h3>
                    <p className="text-xs text-stone-300 max-w-md mb-4">
                      {isDelivered
                        ? 'Le suivi GPS temps réel est arrêté conformément aux règles de confidentialité BEBBA.'
                        : 'La position GPS de votre livreur s affichera automatiquement sur Google Maps dès le départ de la cuisine.'}
                    </p>
                    <div className="text-[11px] font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                      Statut actuel : {selectedOrder.orderStatus.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Address & Notes Banner */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900 block">Adresse de livraison :</span>
                    <span className="text-stone-600">
                      {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}
                    </span>
                    {selectedOrder.deliveryNotes && (
                      <span className="text-stone-400 block italic">« {selectedOrder.deliveryNotes} »</span>
                    )}
                  </div>
                </div>

                {/* Direct claim button */}
                <button
                  onClick={() => onOpenClaim(selectedOrder)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                  Signaler un problème / Réclamation
                </button>
              </div>
            </div>

            {/* Order Items Breakdown Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider mb-4">
                Détail des Repas & Boissons
              </h3>
              <div className="divide-y divide-stone-100">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {it.productImage && (
                        <img
                          src={it.productImage}
                          alt={it.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                        />
                      )}
                      <div>
                        <div className="font-bold text-stone-900">
                          {it.quantity}x {it.productName}
                        </div>
                        {it.selectedOptions && it.selectedOptions.length > 0 && (
                          <div className="text-[11px] text-emerald-700">
                            {it.selectedOptions.map(o => o.name).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-stone-900">
                      {it.itemTotal.toFixed(2)} DT
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-200 mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Sous-total</span>
                  <span className="font-mono">{selectedOrder.subtotal.toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Livraison</span>
                  <span className="font-mono">{selectedOrder.deliveryFee.toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between font-black text-stone-900 text-sm pt-2 border-t border-stone-200">
                  <span>Montant total (COD)</span>
                  <span className="font-mono text-emerald-600 text-base">
                    {selectedOrder.totalAmount.toFixed(2)} DT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Timeline & Payment Status */}
          <div className="space-y-6">
            {/* Payment & Collection Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Paiement & Encaissement
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-stone-600 font-medium">Mode de paiement :</span>
                <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                  Cash On Delivery (COD)
                </span>
              </div>

              <div className="mt-4 p-4 rounded-2xl border flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-stone-400 font-medium">Statut encaissement</div>
                  <div className="text-sm font-bold mt-0.5">
                    {selectedOrder.paymentStatus === 'paid' ? (
                      <span className="text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Encaissé (PAID)
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> À encaisser (TO_COLLECT)
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-mono font-black text-lg text-stone-900">
                  {selectedOrder.totalAmount.toFixed(2)} DT
                </div>
              </div>

              {selectedOrder.paidAt && (
                <div className="mt-2 text-[11px] text-stone-500 text-right">
                  Encaissé le {new Date(selectedOrder.paidAt).toLocaleTimeString()} par {selectedOrder.paidBy}
                </div>
              )}
            </div>

            {/* Official Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider mb-6">
                Progression de la Commande
              </h3>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {getTimelineSteps(selectedOrder.orderStatus).map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 z-10 transition ${
                          step.isCompleted
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : step.isCurrent
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-stone-200 text-stone-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            step.isCompleted || step.isCurrent
                              ? 'text-stone-900'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[11px] text-stone-500 leading-tight">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-stone-400">Aucune commande sélectionnée.</div>
      )}
    </div>
  );
};
