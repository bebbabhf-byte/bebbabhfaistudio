import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { UserRole } from '../types';
import { fetchStoreStatus } from '../services/api';
import {
  ShoppingBag,
  ChefHat,
  Bike,
  ShieldCheck,
  User as UserIcon,
  MapPin,
  MessageSquareWarning,
  Flame,
  Layers,
  ChevronDown,
  Clock,
  Search,
  X,
  Heart
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  searchQuery = '',
  setSearchQuery
}) => {
  const { currentUser, currentRole, switchDemoRole } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { favoritesCount, showOnlyFavorites, setShowOnlyFavorites } = useFavorites();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
    tunisTime: string;
  } | null>(null);

  useEffect(() => {
    fetchStoreStatus()
      .then(st => setStoreStatus(st))
      .catch(console.error);

    const interval = setInterval(() => {
      fetchStoreStatus()
        .then(st => setStoreStatus(st))
        .catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const rolesConfig: { role: UserRole; label: string; desc: string; icon: any; color: string }[] = [
    { role: 'client', label: 'Client (Sarra)', desc: 'Commander, suivi GPS & réclamations', icon: UserIcon, color: 'bg-emerald-600' },
    { role: 'kitchen', label: 'Cuisine / KDS', desc: 'Préparation, recettes & déstockage', icon: ChefHat, color: 'bg-amber-600' },
    { role: 'driver', label: 'Livreur (Ahmed)', desc: 'Missions, transmission GPS & COD', icon: Bike, color: 'bg-blue-600' },
    { role: 'admin', label: 'Super Admin', desc: 'Supervision, affectation & chat', icon: ShieldCheck, color: 'bg-purple-600' }
  ];

  const currentRoleObj = rolesConfig.find(r => r.role === currentRole) || rolesConfig[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Banner with official slogan, store status and demo role switcher */}
      <div className="bg-stone-900 text-stone-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${storeStatus?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className="font-medium text-emerald-300">BEBBA Healthy Food</span>
          <span className="text-stone-400 hidden sm:inline">—</span>
          <span className="text-stone-300 italic hidden md:inline">« Vos Plats santé en un clic »</span>
          {storeStatus && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                storeStatus.isOpen
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              <Clock className="w-3 h-3" />
              {storeStatus.isOpen
                ? `Ouvert jusqu'à ${storeStatus.closingTime} (Tunis)`
                : `Fermé (Ouvre à ${storeStatus.openingTime})`}
            </span>
          )}
          <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-[11px] font-mono border border-stone-700">Tunisie • TND (DT)</span>
        </div>

        {/* Quick 1-click Role Selector */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1 rounded text-xs font-medium border border-stone-700 transition"
          >
            <span className="text-stone-400">Rôle actif :</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentRoleObj.color}`}></span>
              {currentRoleObj.label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white text-stone-900 rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Changer d utilisateur / Vue métier
              </div>
              {rolesConfig.map(rc => {
                const IconComponent = rc.icon;
                const isSelected = currentRole === rc.role;
                return (
                  <button
                    key={rc.role}
                    onClick={() => {
                      switchDemoRole(rc.role);
                      setIsRoleDropdownOpen(false);
                      if (rc.role === 'kitchen') setCurrentTab('kds');
                      else if (rc.role === 'driver') setCurrentTab('driver');
                      else if (rc.role === 'admin') setCurrentTab('admin');
                      else setCurrentTab('menu');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-stone-50 transition ${
                      isSelected ? 'bg-emerald-50/70 border-l-3 border-emerald-600' : ''
                    }`}
                  >
                    <div className={`p-1.5 rounded-md text-white ${rc.color} mt-0.5`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-stone-900 flex items-center gap-1">
                        {rc.label}
                        {isSelected && <span className="text-[10px] text-emerald-600 font-bold ml-1">(Actuel)</span>}
                      </div>
                      <div className="text-[11px] text-stone-500 leading-tight">{rc.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab(currentRole === 'kitchen' ? 'kds' : currentRole === 'driver' ? 'driver' : currentRole === 'admin' ? 'admin' : 'menu')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-stone-900 font-sans">
                  BEBBA<span className="text-emerald-600">.</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-stone-400">
                  HEALTHY FOOD V2
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links according to Role */}
          <nav className="hidden md:flex items-center gap-1">
            {currentRole === 'client' && (
              <>
                <button
                  onClick={() => {
                    setShowOnlyFavorites(false);
                    setCurrentTab('menu');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'menu' && !showOnlyFavorites ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Carte & Menus
                </button>
                <button
                  onClick={() => {
                    setShowOnlyFavorites(true);
                    setCurrentTab('menu');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    currentTab === 'menu' && showOnlyFavorites
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-rose-600 hover:bg-stone-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${currentTab === 'menu' && showOnlyFavorites ? 'fill-white text-white' : 'fill-rose-500/20 text-rose-500'}`} />
                  <span>Favoris</span>
                  {favoritesCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      currentTab === 'menu' && showOnlyFavorites ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentTab('tracking')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    currentTab === 'tracking' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Suivi GPS en direct
                </button>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    currentTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Mes Commandes
                </button>
                <button
                  onClick={() => setCurrentTab('claims')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    currentTab === 'claims' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                  Réclamations & Chat
                </button>
              </>
            )}

            {currentRole === 'kitchen' && (
              <>
                <button
                  onClick={() => setCurrentTab('kds')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                    currentTab === 'kds' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-700 hover:bg-amber-50'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  Écran Cuisine KDS
                </button>
                <button
                  onClick={() => setCurrentTab('menu')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  Consulter la Carte
                </button>
              </>
            )}

            {currentRole === 'driver' && (
              <>
                <button
                  onClick={() => setCurrentTab('driver')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                    currentTab === 'driver' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-700 hover:bg-blue-50'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  Espace Livreur & Missions
                </button>
                <button
                  onClick={() => setCurrentTab('tracking')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Aperçu Carte Client
                </button>
              </>
            )}

            {currentRole === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    currentTab === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Administration
                </button>
                <button
                  onClick={() => setCurrentTab('kds')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                    currentTab === 'kds' ? 'bg-purple-600 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  Vue KDS
                </button>
                <button
                  onClick={() => setCurrentTab('tracking')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  Suivi GPS
                </button>
                <button
                  onClick={() => setCurrentTab('claims')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 flex items-center gap-1"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500" />
                  Réclamations
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Quick Search + Favorites + Cart + User indicator */}
          <div className="flex items-center gap-3">
            {currentRole === 'client' && setSearchQuery && (
              <div className="hidden lg:flex items-center relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Recherche rapide de plats..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentTab !== 'menu') setCurrentTab('menu');
                  }}
                  className="w-48 xl:w-60 pl-8 pr-7 py-1.5 text-xs bg-stone-100 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all shadow-inner focus:shadow-xs text-stone-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full hover:bg-stone-200 transition"
                    title="Effacer la recherche"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {currentRole === 'client' && (
              <button
                onClick={() => {
                  setShowOnlyFavorites(true);
                  setCurrentTab('menu');
                }}
                className={`relative p-2.5 rounded-xl flex items-center gap-2 font-medium text-sm transition border cursor-pointer ${
                  currentTab === 'menu' && showOnlyFavorites
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                }`}
                title="Accéder directement à vos repas sains favoris"
              >
                <Heart className={`w-5 h-5 ${currentTab === 'menu' && showOnlyFavorites ? 'fill-white text-white' : 'text-rose-600 fill-rose-500/20'}`} />
                <span className="hidden sm:inline font-semibold">Favoris</span>
                {favoritesCount > 0 && (
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    currentTab === 'menu' && showOnlyFavorites ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'
                  }`}>
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {currentRole === 'client' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 font-medium text-sm transition border border-emerald-200"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span className="hidden sm:inline font-semibold">Panier</span>
                {itemCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-xs text-stone-700 border border-stone-300">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-stone-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-stone-500 font-mono">{currentUser.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="md:hidden flex items-center overflow-x-auto border-t border-stone-100 px-3 py-2 gap-2 text-xs bg-stone-50">
        {currentRole === 'client' && (
          <>
            <button
              onClick={() => {
                setShowOnlyFavorites(false);
                setCurrentTab('menu');
              }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'menu' && !showOnlyFavorites ? 'bg-emerald-600 text-white' : 'text-stone-600'
              }`}
            >
              Carte
            </button>
            <button
              onClick={() => {
                setShowOnlyFavorites(true);
                setCurrentTab('menu');
              }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 shrink-0 ${
                currentTab === 'menu' && showOnlyFavorites ? 'bg-rose-600 text-white' : 'text-stone-600 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${currentTab === 'menu' && showOnlyFavorites ? 'fill-white text-white' : 'text-rose-500 fill-rose-500/20'}`} />
              <span>Favoris ({favoritesCount})</span>
            </button>
            <button
              onClick={() => setCurrentTab('tracking')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'tracking' ? 'bg-emerald-600 text-white' : 'text-stone-600'
              }`}
            >
              Suivi GPS
            </button>
            <button
              onClick={() => setCurrentTab('orders')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-stone-600'
              }`}
            >
              Commandes
            </button>
            <button
              onClick={() => setCurrentTab('claims')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
                currentTab === 'claims' ? 'bg-emerald-600 text-white' : 'text-stone-600'
              }`}
            >
              Réclamations
            </button>
            {setSearchQuery && (
              <div className="relative shrink-0 flex items-center ml-auto">
                <Search className="w-3 h-3 text-stone-400 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentTab !== 'menu') setCurrentTab('menu');
                  }}
                  className="w-32 pl-6 pr-5 py-1 text-[11px] bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 text-stone-400 p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {currentRole === 'kitchen' && (
          <button
            onClick={() => setCurrentTab('kds')}
            className="px-3 py-1.5 rounded-md font-semibold bg-amber-600 text-white"
          >
            Écran KDS Cuisine
          </button>
        )}

        {currentRole === 'driver' && (
          <>
            <button
              onClick={() => setCurrentTab('driver')}
              className="px-3 py-1.5 rounded-md font-semibold bg-blue-600 text-white"
            >
              Espace Livreur
            </button>
            <button
              onClick={() => setCurrentTab('tracking')}
              className="px-3 py-1.5 rounded-md font-medium text-stone-600"
            >
              Carte
            </button>
          </>
        )}

        {currentRole === 'admin' && (
          <>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap font-semibold ${
                currentTab === 'admin' ? 'bg-purple-600 text-white' : 'text-stone-700'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setCurrentTab('kds')}
              className="px-3 py-1.5 rounded-md whitespace-nowrap font-medium text-stone-600"
            >
              KDS
            </button>
            <button
              onClick={() => setCurrentTab('claims')}
              className="px-3 py-1.5 rounded-md whitespace-nowrap font-medium text-stone-600"
            >
              Réclamations
            </button>
          </>
        )}
      </div>
    </header>
  );
};
