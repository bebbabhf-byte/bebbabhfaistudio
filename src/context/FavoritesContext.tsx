import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (show: boolean) => void;
  lastFavoriteToast: { message: string; type: 'add' | 'remove' } | null;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const storageKey = `bebba_favorites_${currentUser?.id || 'client'}`;

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading favorites from localStorage', e);
    }
    // Default initial seed for demo client (Sarra Mansour) to showcase the feature immediately
    if (!currentUser || currentUser.role === 'client') {
      return ['prod_healthy_1', 'prod_healthy_3'];
    }
    return [];
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [lastFavoriteToast, setLastFavoriteToast] = useState<{ message: string; type: 'add' | 'remove' } | null>(null);

  // Sync favorites when current user changes
  useEffect(() => {
    try {
      const userKey = `bebba_favorites_${currentUser?.id || 'client'}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setFavoriteIds(JSON.parse(saved));
      } else if (currentUser?.role === 'client') {
        // Seed default favorites for initial demo client
        setFavoriteIds(['prod_healthy_1', 'prod_healthy_3']);
      } else {
        setFavoriteIds([]);
      }
    } catch (e) {
      console.warn('Error syncing favorites on user switch', e);
    }
  }, [currentUser?.id]);

  // Persist favorites whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn('Error saving favorites to localStorage', e);
    }
  }, [favoriteIds, storageKey]);

  // Clear toast after 2.5s
  useEffect(() => {
    if (!lastFavoriteToast) return;
    const timer = setTimeout(() => {
      setLastFavoriteToast(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [lastFavoriteToast]);

  const isFavorite = (productId: string) => {
    return favoriteIds.includes(productId);
  };

  const addFavorite = (productId: string) => {
    if (!favoriteIds.includes(productId)) {
      setFavoriteIds(prev => [...prev, productId]);
      setLastFavoriteToast({ message: 'Plat ajouté à vos favoris ❤️', type: 'add' });
    }
  };

  const removeFavorite = (productId: string) => {
    if (favoriteIds.includes(productId)) {
      setFavoriteIds(prev => prev.filter(id => id !== productId));
      setLastFavoriteToast({ message: 'Plat retiré de vos favoris', type: 'remove' });
    }
  };

  const toggleFavorite = (productId: string) => {
    if (favoriteIds.includes(productId)) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  const clearFavorites = () => {
    setFavoriteIds([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        favoritesCount: favoriteIds.length,
        showOnlyFavorites,
        setShowOnlyFavorites,
        lastFavoriteToast
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
