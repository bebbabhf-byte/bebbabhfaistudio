import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { MenuCatalog } from './components/ClientView/MenuCatalog';
import { CartDrawer } from './components/ClientView/CartDrawer';
import { OrderTrackingView } from './components/ClientView/OrderTrackingView';
import { CustomerClaimsView } from './components/ClientView/CustomerClaimsView';
import { ClientOrdersView } from './components/ClientView/ClientOrdersView';
import { KDSBoard } from './components/KDSView/KDSBoard';
import { DriverDashboard } from './components/DriverView/DriverDashboard';
import { AdminDashboard } from './components/AdminView/AdminDashboard';
import { Footer } from './components/Footer';
import { Order } from './types';
import { Heart } from 'lucide-react';

function MainApp() {
  const { currentRole } = useAuth();
  const { lastFavoriteToast } = useFavorites();
  const [currentTab, setCurrentTab] = useState<string>('menu');
  const [orderToClaim, setOrderToClaim] = useState<Order | null>(null);
  const [activeTrackingToken, setActiveTrackingToken] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="pb-16">
          {currentTab === 'menu' && (
            <MenuCatalog
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

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

      {/* Floating Favorite Notification Toast */}
      {lastFavoriteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 fade-in">
          <span className={`p-1.5 rounded-full ${lastFavoriteToast.type === 'add' ? 'bg-rose-500/20 text-rose-400' : 'bg-stone-800 text-stone-400'}`}>
            <Heart className="w-3.5 h-3.5 fill-current" />
          </span>
          <span>{lastFavoriteToast.message}</span>
        </div>
      )}

      {/* Footer */}
      <Footer setCurrentTab={setCurrentTab} />
    </div>
  );
}
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <MainApp />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
