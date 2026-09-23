import React, { useState, useEffect, useRef } from 'react';
import { DriverProfile, Vehicle } from '../../types';
import { fetchDeliveries, fetchDrivers, fetchVehicles } from '../../services/api';
import {
  MapPin,
  Bike,
  Navigation,
  Phone,
  RefreshCw,
  Clock,
  Compass,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_KEY = 'AIzaSyBE0_VhQhFOs9vlWRLCvWF2DApVQZDpTbY';

export const LiveMapTab: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [delData, drvData, vehData] = await Promise.all([
        fetchDeliveries(),
        fetchDrivers(),
        fetchVehicles()
      ]);
      setDeliveries(delData.deliveries || []);
      setDrivers(drvData);
      setVehicles(vehData);
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamically load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setMapError(true);
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 300);
      return () => clearInterval(checkInterval);
    }
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
      // Center on Tunis / Lac 2
      const center = { lat: 36.8385, lng: 10.2285 };
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
      updateMarkers(map);
    } catch (e) {
      console.error('Error initializing map:', e);
      setMapError(true);
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      updateMarkers(mapInstanceRef.current);
    }
  }, [deliveries, mapLoaded]);

  const updateMarkers = (map: any) => {
    if (!window.google?.maps) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // 1. BEBBA Kitchen Central Hub Marker
    const hubPos = { lat: 36.8385, lng: 10.2285 };
    const hubMarker = new window.google.maps.Marker({
      position: hubPos,
      map,
      title: 'BEBBA Healthy Food - Cuisine Centrale (Lac 2)',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#9333ea',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff'
      }
    });
    markersRef.current.push(hubMarker);

    // 2. Active Deliveries & Drivers
    deliveries.forEach(del => {
      // Driver GPS Pin
      if (del.currentLocation) {
        const driverPos = {
          lat: del.currentLocation.latitude,
          lng: del.currentLocation.longitude
        };

        const driverMarker = new window.google.maps.Marker({
          position: driverPos,
          map,
          title: `Livreur: ${del.driverName || 'Livreur Bebba'} (${del.orderNumber})`,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            rotation: del.currentLocation.heading || 0
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="color: #2563eb;">Livreur: ${del.driverName || 'Ahmed'}</strong><br/>
              <span>Course : ${del.orderNumber}</span><br/>
              <span>Client : ${del.clientName} (${del.deliveryAddress})</span><br/>
              <strong>Montant COD : ${del.totalAmount} DT</strong>
            </div>
          `
        });

        driverMarker.addListener('click', () => {
          infoWindow.open(map, driverMarker);
          setSelectedDelivery(del);
        });

        markersRef.current.push(driverMarker);
      }

      // Customer Destination Pin
      if (del.deliveryLat && del.deliveryLng) {
        const destPos = { lat: del.deliveryLat, lng: del.deliveryLng };
        const destMarker = new window.google.maps.Marker({
          position: destPos,
          map,
          title: `Client: ${del.clientName}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#16a34a',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        destMarker.addListener('click', () => {
          setSelectedDelivery(del);
        });

        markersRef.current.push(destMarker);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Supervision Cartographique & Flotte en Direct</h3>
            <p className="text-xs text-stone-500">
              Positions GPS des livreurs, statuts des tournées et points de livraison Grand Tunis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span>{deliveries.length} livraison(s) en transit</span>
          </span>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map + Fleet Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Interactive Map */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs relative min-h-[520px] flex flex-col">
          {/* Map canvas */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[520px] flex-1 bg-stone-100"></div>

          {/* Interactive Fallback if Google Maps is loading or blocked */}
          {(!mapLoaded || mapError) && (
            <div className="absolute inset-0 bg-stone-900/90 text-white flex flex-col items-center justify-center p-6 text-center">
              <Compass className="w-12 h-12 text-blue-400 animate-spin mb-3" />
              <h4 className="font-bold text-base mb-1">Connexion à la carte GPS Grand Tunis...</h4>
              <p className="text-xs text-stone-400 max-w-md mb-4">
                Affichage des positions GPS transmises en temps réel par les smartphones des livreurs BEBBA.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-stone-300">
                <span>Hub Lac 2 (36.8385, 10.2285)</span>
                <span>•</span>
                <span>{deliveries.length} pings actifs</span>
              </div>
            </div>
          )}

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-stone-200 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="font-bold text-stone-900">Hub BEBBA (Lac 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span className="text-stone-700">Livreurs en transit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-stone-700">Adresses clients</span>
            </div>
          </div>
        </div>

        {/* Right Side: Active Fleet & Deliveries List */}
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Bike className="w-4 h-4 text-purple-600" />
              <span>Flotte & Courses ({drivers.length})</span>
            </h4>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {drivers.filter(d => d.status === 'busy').length} en mission • {drivers.filter(d => d.status === 'available').length} disponibles
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
            {drivers.map(drv => {
              const activeDel = deliveries.find(d => d.driverId === drv.userId);
              const isSelected = selectedDelivery?.driverId === drv.userId;

              return (
                <div
                  key={drv.id}
                  onClick={() => {
                    if (activeDel) setSelectedDelivery(activeDel);
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                      : drv.status === 'busy'
                      ? 'border-blue-200 bg-blue-50/30 hover:border-blue-300'
                      : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{drv.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            drv.status === 'busy' ? 'bg-blue-600 animate-pulse' : 'bg-emerald-500'
                          }`}
                        ></span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">{drv.phone}</div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        drv.status === 'busy'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {drv.status === 'busy' ? 'En course' : 'Libre'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200/60">
                    <span>{drv.vehicleModel || 'Scooter'} ({drv.vehiclePlate || 'Tunis'})</span>
                    <span className="font-bold text-stone-800 font-mono">
                      {drv.collectedAmountToday || 0} DT
                    </span>
                  </div>

                  {activeDel && (
                    <div className="p-2 rounded-xl bg-purple-100/50 border border-purple-200 text-[11px] text-purple-900 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>{activeDel.orderNumber}</span>
                        <span>{activeDel.totalAmount} DT</span>
                      </div>
                      <div className="text-[10px] text-purple-700 truncate">
                        Dest: {activeDel.deliveryAddress}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
