import React, { useState, useEffect, useRef } from 'react';
import { Order, DriverProfile } from '../../types';
import { fetchOrders, updateOrderStatus, collectPayment, sendDriverLocation, fetchDrivers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Bike,
  Navigation,
  Phone,
  MapPin,
  CheckCircle2,
  DollarSign,
  Play,
  Check,
  Compass,
  AlertTriangle,
  RefreshCw,
  Radio,
  ExternalLink,
  Lock
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [realGpsActive, setRealGpsActive] = useState(false);
  const [currentGpsCoord, setCurrentGpsCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation timer
  const simIntervalRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 4000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const loadDriverData = async () => {
    try {
      const [allOrders, drivers] = await Promise.all([
        fetchOrders(),
        fetchDrivers()
      ]);
      setOrders(allOrders);

      const myProfile = drivers.find(d => d.userId === currentUser.id) || drivers[0];
      setDriverProfile(myProfile);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Missions assigned to this driver: active in transit OR delivered but waiting for payment collection
  const myMissions = orders.filter(
    o => (o.assignedDriverId === currentUser.id || !o.assignedDriverId) &&
         (o.orderStatus === 'ready' || o.orderStatus === 'waiting_for_driver' || o.orderStatus === 'delivering' || (o.orderStatus === 'delivered' && o.paymentStatus === 'to_collect'))
  );

  const activeMission = orders.find(
    o => o.assignedDriverId === currentUser.id && (o.orderStatus === 'delivering' || (o.orderStatus === 'delivered' && o.paymentStatus === 'to_collect'))
  ) || myMissions[0];

  const completedToday = orders.filter(
    o => o.assignedDriverId === currentUser.id && o.orderStatus === 'delivered'
  );

  const totalCollectedToday = completedToday
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.collectedAmount || o.totalAmount), 0);

  const toCollectTotal = orders
    .filter(o => o.assignedDriverId === currentUser.id && o.paymentStatus === 'to_collect' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Start Delivery & Launch GPS
  const handleStartDelivery = async (order: Order) => {
    try {
      await updateOrderStatus(order.id, 'delivering', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'driver'
      });
      showSuccess(`Livraison démarrée pour la commande ${order.orderNumber}`);
      loadDriverData();
      startGpsTracking(order.id);
    } catch (err: any) {
      showError(err.message || 'Erreur départ livraison');
    }
  };

  // Confirm Delivery (Remis au client)
  const handleConfirmDelivered = async (order: Order) => {
    try {
      await updateOrderStatus(order.id, 'delivered', {
        id: currentUser.id,
        name: currentUser.name,
        role: 'driver'
      });
      stopGpsTracking();
      showSuccess(`Commande ${order.orderNumber} remise au client avec succès !`);
      loadDriverData();
    } catch (err: any) {
      showError(err.message || 'Erreur confirmation');
    }
  };

  // Confirm Payment (Encaissement COD)
  const handleConfirmPayment = async (order: Order) => {
    // Vérification stricte : la livraison doit être confirmée au préalable
    if (order.orderStatus !== 'delivered') {
      showWarning("L'encaissement par le livreur ne peut être validé que si la livraison est confirmée (statut Livrée).");
      return;
    }

    try {
      await collectPayment(order.id, order.totalAmount, {
        name: currentUser.name,
        id: currentUser.id,
        role: 'driver'
      });
      stopGpsTracking();
      loadDriverData();
      showSuccess(`Paiement de ${order.totalAmount.toFixed(2)} DT encaissé avec succès.`);
    } catch (err: any) {
      showError(err.message || 'Erreur encaissement');
    }
  };

  // GPS Simulation Route (e.g. from Cuisine Centrale Lac 2 to Menzah 6 / Tunis)
  const simSteps = [
    { lat: 36.8485, lng: 10.2185, speed: 20 },
    { lat: 36.8460, lng: 10.2090, speed: 35 },
    { lat: 36.8430, lng: 10.1980, speed: 42 },
    { lat: 36.8405, lng: 10.1880, speed: 38 },
    { lat: 36.8385, lng: 10.1770, speed: 30 },
    { lat: 36.8398, lng: 10.1654, speed: 18 } // Arrivé chez client
  ];

  const startGpsTracking = (orderId: string) => {
    setIsSimulatingGps(true);
    let stepIndex = 0;

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(async () => {
      const point = simSteps[stepIndex % simSteps.length];
      stepIndex++;

      setCurrentGpsCoord({ lat: point.lat, lng: point.lng });

      try {
        await sendDriverLocation({
          orderId,
          latitude: point.lat,
          longitude: point.lng,
          accuracy: 6,
          heading: 65,
          speed: point.speed
        });
      } catch (e) {
        console.error('GPS transmit error', e);
      }
    }, 10000); // Règle #12 (§35, §163) : Intervalle strict de 10 secondes pendant le statut delivering
  };

  const stopGpsTracking = () => {
    setIsSimulatingGps(false);
    setRealGpsActive(false);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Real Browser Geolocation Activation
  const handleToggleRealGps = (orderId: string) => {
    if (!navigator.geolocation) {
      showWarning("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }

    if (activeMission.orderStatus !== 'delivering') {
      showWarning("Veuillez d'abord cliquer sur « Démarrer la livraison » pour activer la télémétrie GPS.");
      return;
    }

    if (realGpsActive) {
      stopGpsTracking();
      showInfo('Suivi GPS réel désactivé.');
    } else {
      setRealGpsActive(true);
      showSuccess('Transmission GPS réelle activée.');
      watchIdRef.current = navigator.geolocation.watchPosition(
        async pos => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          setCurrentGpsCoord({ lat: latitude, lng: longitude });

          try {
            await sendDriverLocation({
              orderId,
              latitude,
              longitude,
              accuracy: accuracy || 10,
              heading: heading || 0,
              speed: speed ? Math.round(speed * 3.6) : 25
            });
          } catch (e) {
            console.error('GPS error', e);
          }
        },
        err => {
          console.error(err);
          showInfo('Impossible d accéder au GPS réel. Activation du mode simulation.');
          startGpsTracking(orderId);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Driver Header */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl mb-6 shadow-xl border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">
                {currentUser.name}
              </h1>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 font-bold">
                Livreur BEBBA
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 font-mono">
              Véhicule : {driverProfile?.vehicleModel || 'Yamaha NMAX 125'} ({driverProfile?.vehiclePlate || '245-TUN-8812'})
            </p>
          </div>
        </div>

        <button
          onClick={loadDriverData}
          className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-2.5 rounded-xl transition"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards: Spec §44 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 text-center">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] sm:text-xs text-stone-400 font-bold uppercase tracking-wider">
            Livrées Aujourd hui
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            {completedToday.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">
            Encaissées Aujourd hui
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
            {totalCollectedToday.toFixed(2)} <span className="text-xs font-semibold">DT</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-[10px] sm:text-xs text-amber-600 font-bold uppercase tracking-wider">
            À Encaisser (COD)
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
            {toCollectTotal.toFixed(2)} <span className="text-xs font-semibold">DT</span>
          </div>
        </div>
      </div>

      {/* Active Mission Card */}
      {activeMission ? (
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-lg mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
              <span className="font-mono font-black text-sm text-stone-900">
                Mission active : {activeMission.orderNumber}
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {activeMission.orderStatus.toUpperCase()}
            </span>
          </div>

          {/* Client Details */}
          <div className="space-y-3 mb-6 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-stone-400 block">Client</span>
                <span className="font-bold text-stone-900 text-sm">{activeMission.clientName}</span>
              </div>
              <a
                href={`tel:${activeMission.clientPhone}`}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Appeler</span>
              </a>
            </div>

            <div>
              <span className="text-stone-400 block">Adresse de livraison</span>
              <div className="flex items-start gap-1.5 text-stone-900 font-medium mt-0.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  {activeMission.deliveryAddress}, {activeMission.deliveryCity}
                </span>
              </div>
              {activeMission.deliveryNotes && (
                <div className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded-lg mt-1">
                  « {activeMission.deliveryNotes} »
                </div>
              )}
            </div>

            {/* COD Cash Amount Alert */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-900">MONTANT COD À ENCAISSER</div>
                <div className="text-[11px] text-amber-700">Règlement en espèces à exiger</div>
              </div>
              <div className="font-mono text-xl font-black text-amber-900">
                {activeMission.totalAmount.toFixed(2)} DT
              </div>
            </div>
          </div>

          {/* GPS Broadcast Controls */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isSimulatingGps || realGpsActive ? 'text-emerald-500 animate-pulse' : 'text-stone-400'}`} />
                <span className="text-xs font-bold text-stone-800">
                  Partage de la Position GPS
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSimulatingGps || realGpsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
              }`}>
                {isSimulatingGps ? 'Simulation active (6s)' : realGpsActive ? 'GPS Smartphone actif' : 'Inactif'}
              </span>
            </div>

            {currentGpsCoord && (
              <div className="text-[11px] font-mono text-stone-600 bg-white p-2 rounded-lg border border-stone-200 flex justify-between">
                <span>Lat: {currentGpsCoord.lat.toFixed(4)}</span>
                <span>Lng: {currentGpsCoord.lng.toFixed(4)}</span>
                <span className="text-emerald-600 font-bold">● Envoi auto</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isSimulatingGps) {
                    stopGpsTracking();
                    showInfo('Simulation GPS arrêtée.');
                  } else {
                    if (activeMission.orderStatus !== 'delivering') {
                      showWarning("Veuillez d'abord cliquer sur « Démarrer la livraison » pour lancer la simulation GPS.");
                      return;
                    }
                    startGpsTracking(activeMission.id);
                    showSuccess('Simulation GPS active le long de l\'itinéraire.');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSimulatingGps
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                    : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isSimulatingGps ? 'Arrêter simulation' : 'Lancer simulation GPS (Tunis)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRealGps(activeMission.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  realGpsActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-900 hover:bg-black text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{realGpsActive ? 'Stop GPS Réel' : 'GPS Réel Téléphone'}</span>
              </button>
            </div>
          </div>

          {/* Delivered Status Notice */}
          {activeMission.orderStatus === 'delivered' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 mb-6 text-emerald-900 text-xs font-semibold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-emerald-800">Livraison confirmée avec succès ✓</div>
                <div className="text-[11px] text-emerald-700 font-normal mt-0.5">
                  {activeMission.paymentStatus === 'to_collect'
                    ? 'La livraison est validée. Vous pouvez maintenant procéder à l\'encaissement en espèces ci-dessous.'
                    : 'Commande réglée. La mission est complète !'}
                </div>
              </div>
            </div>
          )}

          {/* Workflow Action Buttons (Strict Status Pipeline) */}
          <div className="space-y-2">
            {activeMission.orderStatus !== 'delivering' && activeMission.orderStatus !== 'delivered' && (
              <button
                onClick={() => handleStartDelivery(activeMission)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Démarrer la livraison (Active le GPS)</span>
              </button>
            )}

            {activeMission.orderStatus === 'delivering' && (
              <button
                onClick={() => handleConfirmDelivered(activeMission)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer l arrivée & livraison au client</span>
              </button>
            )}

            {activeMission.paymentStatus === 'to_collect' && (
              activeMission.orderStatus === 'delivered' ? (
                <button
                  onClick={() => handleConfirmPayment(activeMission)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Confirmer encaissement ({activeMission.totalAmount.toFixed(2)} DT Cash)</span>
                </button>
              ) : (
                <div className="p-3.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-2.5 font-medium">
                  <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>
                    Encaissement de <strong className="font-bold text-stone-800">{activeMission.totalAmount.toFixed(2)} DT</strong> verrouillé : confirmez d abord la livraison au client pour débloquer l encaissement.
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs mb-8">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Bike className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1">Aucune mission en cours</h3>
          <p className="text-xs text-stone-500">
            Dès que l administration vous affecte une commande prête en cuisine, elle apparaîtra ici.
          </p>
        </div>
      )}

      {/* History of Deliveries Today */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
          Historique de vos livraisons aujourd hui ({completedToday.length})
        </h3>
        {completedToday.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-400">
            Aucune livraison terminée aujourd hui.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {completedToday.map(ord => (
              <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span>{ord.orderNumber}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Livrée
                    </span>
                  </div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Client : {ord.clientName} • {ord.deliveryAddress}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-stone-900">
                    {ord.totalAmount.toFixed(2)} DT
                  </div>
                  {ord.paymentStatus === 'paid' ? (
                    <div className="text-[10px] font-semibold text-emerald-600">
                      ✓ Encaissé
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConfirmPayment(ord)}
                      className="mt-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                      title="La livraison étant confirmée, vous pouvez encaisser le paiement"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Encaisser</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
