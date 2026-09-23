import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { MenuCatalog } from './components/ClientView/MenuCatalog';
import { CartDrawer } from './components/ClientView/CartDrawer';
import { OrderTrackingView } from './components/ClientView/OrderTrackingView';
import { CustomerClaimsView } from './components/ClientView/CustomerClaimsView';
import { ClientOrdersView } from './components/ClientView/ClientOrdersView';
import { KDSBoard } from './components/KDSView/KDSBoard';
import { DriverDashboard } from './components/DriverView/DriverDashboard';
import { AdminDashboard } from './components/AdminView/AdminDashboard';
import { Order } from './types';

function MainApp() {
  const { currentRole } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('menu');
  const [orderToClaim, setOrderToClaim] = useState<Order | null>(null);
  const [activeTrackingToken, setActiveTrackingToken] = useState<string>('');

  const handleOrderPlaced = (newOrder: Order) => {
    setActiveTrackingToken(newOrder.trackingToken);
    setCurrentTab('tracking');
  };

  const handleOpenClaimForOrder = (order: Order) => {
    setOrderToClaim(order);
    setCurrentTab('claims');
  };

  const handleTrackOrder = (order: Order) => {
    setActiveTrackingToken(order.trackingToken);
    setCurrentTab('tracking');
  };

  return (
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 flex flex-col justify-between">
      <div>
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="pb-16">
          {currentTab === 'menu' && <MenuCatalog />}

          {currentTab === 'tracking' && (
            <OrderTrackingView
              initialToken={activeTrackingToken}
              onOpenClaim={handleOpenClaimForOrder}
            />
          )}

          {currentTab === 'orders' && (
            <ClientOrdersView
              onTrackOrder={handleTrackOrder}
              onOpenClaim={handleOpenClaimForOrder}
            />
          )}

          {currentTab === 'claims' && (
            <CustomerClaimsView initialOrderForClaim={orderToClaim} />
          )}

          {currentTab === 'kds' && <KDSBoard />}

          {currentTab === 'driver' && <DriverDashboard />}

          {currentTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer onOrderPlaced={handleOrderPlaced} />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">BEBBA Healthy Food</span>
            <span>—</span>
            <span className="italic">« Vos Plats santé en un clic »</span>
          </div>
          <div className="text-stone-400">
            Grand Tunis • Paiement à la livraison (COD) • Google Maps Live GPS
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
