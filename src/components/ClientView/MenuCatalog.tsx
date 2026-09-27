import React, { useState, useEffect } from 'react';
import { Product, ProductOption } from '../../types';
import { fetchProducts } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Plus, Flame, Sparkles, Check, X, ShieldAlert, Heart, ShoppingBag, SlidersHorizontal, Search, RotateCcw } from 'lucide-react';

interface MenuCatalogProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = externalSetSearchQuery || setInternalSearchQuery;

  const {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    favoritesCount,
    showOnlyFavorites,
    setShowOnlyFavorites
  } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [batchAdded, setBatchAdded] = useState(false);

  // Sync category with showOnlyFavorites from context
  useEffect(() => {
    if (showOnlyFavorites && selectedCategory !== 'Favoris') {
      setSelectedCategory('Favoris');
    } else if (!showOnlyFavorites && selectedCategory === 'Favoris') {
      setSelectedCategory('Tous');
    }
  }, [showOnlyFavorites]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'Favoris') {
      setShowOnlyFavorites(true);
    } else {
      setShowOnlyFavorites(false);
    }
  };

  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
    const handleMenuUpdate = () => {
      loadProducts();
    };
    window.addEventListener('menu_updated', handleMenuUpdate);
    return () => {
      window.removeEventListener('menu_updated', handleMenuUpdate);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const defaultCategories = ['Tous', 'Healthy', 'Grillades', 'Enfants', 'Jus détox', 'Régime complet 30 jours'];
  const allProductCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categories = ['Tous', ...Array.from(new Set([...defaultCategories.filter(c => c !== 'Tous'), ...allProductCategories]))];

  const quickSearchSuggestions = [
    { label: '🍗 Poulet', query: 'poulet' },
    { label: '🐟 Saumon', query: 'saumon' },
    { label: '🥑 Avocat & Salades', query: 'avocat' },
    { label: '🥩 Grillades', query: 'grillade' },
    { label: '⚡ < 500 kcal', query: '< 500' },
    { label: '🥤 Jus Détox', query: 'détox' },
    { label: '💪 Protéiné', query: 'protéine' }
  ];

  const matchesSearch = (p: Product, query: string): boolean => {
    if (!query) return true;
    const q = query.trim().toLowerCase();

    // Title / Description / Category
    if (p.name && p.name.toLowerCase().includes(q)) return true;
    if (p.description && p.description.toLowerCase().includes(q)) return true;
    if (p.category && p.category.toLowerCase().includes(q)) return true;

    // Available options / ingredients
    if (p.availableOptions && p.availableOptions.some(opt =>
      opt.name.toLowerCase().includes(q) || opt.category.toLowerCase().includes(q)
    )) return true;

    // Numeric calories threshold: "< 500", "moins de 500"
    if (q.startsWith('<') || q.includes('moins de')) {
      const match = q.match(/\d+/);
      if (match) {
        const threshold = parseInt(match[0], 10);
        if (p.calories <= threshold) return true;
      }
    } else if (q.endsWith('kcal') || q.endsWith('calories')) {
      const match = q.match(/\d+/);
      if (match) {
        const targetCal = parseInt(match[0], 10);
        if (Math.abs(p.calories - targetCal) <= 80) return true;
      }
    }

    // High protein search
    if ((q.includes('prot') || q.includes('muscle')) && p.protein >= 25) {
      return true;
    }

    // Low carb / keto
    if ((q.includes('keto') || q.includes('low carb') || q.includes('faible glucide')) && p.carbs <= 25) {
      return true;
    }

    // Vegetarian
    if ((q.includes('veg') || q.includes('végé')) && (
      p.description.toLowerCase().includes('végé') ||
      p.name.toLowerCase().includes('salade') ||
      p.category.toLowerCase().includes('healthy') ||
      p.category.toLowerCase().includes('jus')
    )) {
      return true;
    }

    return false;
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'Favoris') {
      if (!favoriteIds.includes(p.id)) return false;
    } else if (selectedCategory !== 'Tous' && p.category !== selectedCategory) {
      return false;
    }
    return matchesSearch(p, searchQuery);
  });

  // Count how many products match search query regardless of category filter
  const allMatchingCount = searchQuery.trim()
    ? products.filter(p => {
        if (selectedCategory === 'Favoris') {
          return favoriteIds.includes(p.id) && matchesSearch(p, searchQuery);
        }
        return matchesSearch(p, searchQuery);
      }).length
    : selectedCategory === 'Favoris'
      ? products.filter(p => favoriteIds.includes(p.id)).length
      : products.length;

  const favoritesTotalDT = filteredProducts.reduce((sum, p) => sum + p.basePrice, 0);

  const handleAddAllFavoritesToCart = () => {
    if (filteredProducts.length === 0) return;
    filteredProducts
      .filter(p => p.isAvailable !== false)
      .forEach(prod => {
        addToCart(prod, 1, [], 'Commande rapide repas favori');
      });
    setBatchAdded(true);
    setTimeout(() => setBatchAdded(false), 2000);
  };

  const handleOpenCustomize = (prod: Product) => {
    if (prod.isAvailable === false) return;
    setSelectedProduct(prod);
    setSelectedOptions([]);
    setSpecialInstructions('');
    setQuantity(1);
  };

  const toggleOption = (opt: ProductOption) => {
    if (selectedOptions.some(o => o.id === opt.id)) {
      setSelectedOptions(selectedOptions.filter(o => o.id !== opt.id));
    } else {
      setSelectedOptions([...selectedOptions, opt]);
    }
  };

  const calculatedUnitPrice = selectedProduct
    ? selectedProduct.basePrice + selectedOptions.reduce((s, o) => s + o.priceDelta, 0)
    : 0;
  const calculatedTotal = parseFloat((calculatedUnitPrice * quantity).toFixed(2));

  const handleAddToCart = () => {
    if (!selectedProduct || selectedProduct.isAvailable === false) return;
    addToCart(selectedProduct, quantity, selectedOptions, specialInstructions);
    setSelectedProduct(null);
  };

  const handleQuickOrder = (prod: Product) => {
    if (prod.isAvailable === false) return;
    addToCart(prod, 1, [], '');
    setAddedProductId(prod.id);
    setTimeout(() => {
      setAddedProductId(current => (current === prod.id ? null : current));
    }, 1500);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-stone-900 text-white p-6 sm:p-8 lg:p-10 mb-10 shadow-2xl border border-emerald-800/40">
        {/* Ambient decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              100% Frais • Préparé minute en cuisine • Livraison rapide COD
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
              Vos Plats santé <br className="hidden sm:inline" />
              <span className="text-emerald-400">en un clic.</span>
            </h1>

            <p className="text-stone-200 text-sm sm:text-base mb-6 leading-relaxed">
              Repas équilibrés, viandes maigres grillées, menus enfants sains et jus détox pressés à froid.
              Suivez votre livreur en temps réel sur la carte Google Maps dès le départ de nos fourneaux !
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-300">
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                💵 Paiement à la livraison (COD)
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                📍 Grand Tunis & banlieues
              </span>
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                🥗 Macros & calories calculées
              </span>
            </div>
          </div>

          {/* Hero Visual Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 group">
              <img
                src="/src/assets/images/healthy_food_hero_1790141738489.jpg"
                alt="Vos Plats santé Bebba Healthy Food"
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-72 lg:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating badges on top of image */}
              <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Recettes Nutritionniste</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl border border-white/15 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-stone-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cuisine fraîche au quotidien
                </span>
                <span className="text-[11px] text-emerald-300 font-medium">Bebba Healthy Food</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="mb-6 bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-600">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('');
            }}
            placeholder="Recherche rapide : plat, ingrédient (saumon, poulet, avocat...), catégorie, calories..."
            className="w-full pl-11 pr-24 sm:pr-36 py-2.5 text-sm sm:text-base text-stone-900 placeholder-stone-400 bg-transparent rounded-xl focus:outline-hidden"
          />

          <div className="absolute right-2 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                title="Effacer la recherche (Échap)"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Result Count Badge */}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
              <span>{filteredProducts.length}</span>
              <span>{filteredProducts.length > 1 ? 'plats' : 'plat'}</span>
            </span>
          </div>
        </div>

        {/* Quick Suggestion Chips + Favorites Shortcut */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-stone-400 font-medium shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Suggestions rapides :
            </span>
            {quickSearchSuggestions.map((suggestion) => {
              const isActive = searchQuery.toLowerCase().trim() === suggestion.query.toLowerCase().trim();
              return (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    if (isActive) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(suggestion.query);
                    }
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>{suggestion.label}</span>
                  {isActive && <X className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Quick Favorites Shortcut Button */}
          <button
            onClick={() => handleCategoryClick(selectedCategory === 'Favoris' ? 'Tous' : 'Favoris')}
            className={`shrink-0 px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              selectedCategory === 'Favoris'
                ? 'bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
            title="Filtrer pour voir uniquement vos repas sains favoris"
          >
            <Heart className={`w-3.5 h-3.5 ${selectedCategory === 'Favoris' ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
            <span>Mes Favoris ({favoritesCount})</span>
          </button>
        </div>
      </div>

      {/* Category Pills with Dedicated Favorites Pill */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {/* Tous */}
        <button
          onClick={() => handleCategoryClick('Tous')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'Tous'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Tous
        </button>

        {/* Mes Favoris Pill */}
        <button
          onClick={() => handleCategoryClick(selectedCategory === 'Favoris' ? 'Tous' : 'Favoris')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            selectedCategory === 'Favoris'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/25 scale-105 font-bold'
              : 'bg-white hover:bg-rose-50/70 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200'
          }`}
        >
          <Heart className={`w-4 h-4 transition ${selectedCategory === 'Favoris' ? 'fill-white text-white' : 'fill-rose-500/20 text-rose-500'}`} />
          <span>Mes Favoris</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            selectedCategory === 'Favoris'
              ? 'bg-white/25 text-white'
              : 'bg-rose-100 text-rose-700'
          }`}>
            {favoritesCount}
          </span>
        </button>

        {/* Remaining categories */}
        {categories.filter(c => c !== 'Tous' && c !== 'Favoris').map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Favorites Highlight Banner */}
      {selectedCategory === 'Favoris' && (
        <div className="mb-6 bg-gradient-to-r from-rose-50 via-pink-50/70 to-amber-50/60 border border-rose-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-stone-900">Vos Repas Sains Favoris</h2>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {filteredProducts.length} {filteredProducts.length > 1 ? 'plats' : 'plat'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Accès direct à vos repas préférés. Commandez en 1 clic pour maintenir votre routine saine sans effort.
              </p>
            </div>
          </div>

          {filteredProducts.length > 0 && (
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <button
                onClick={handleAddAllFavoritesToCart}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap ${
                  batchAdded
                    ? 'bg-emerald-700 text-white shadow-emerald-700/20 scale-105'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
                title="Ajouter tous vos plats favoris en une seule fois dans le panier"
              >
                {batchAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Tous ajoutés au panier !</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Tout commander ({favoritesTotalDT.toFixed(2)} DT)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCategoryClick('Tous')}
                className="px-3 py-2.5 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 rounded-xl text-xs font-semibold border border-stone-200 transition cursor-pointer"
              >
                Tout le menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Search & Context Notice */}
      {searchQuery && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/80 border border-emerald-200/90 px-4 py-2.5 rounded-2xl text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <Search className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Résultats pour <strong className="font-bold">« {searchQuery} »</strong> :
              <span className="font-bold ml-1 text-emerald-700">
                {filteredProducts.length} plat{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </span>
              {selectedCategory !== 'Tous' && (
                <span className="text-emerald-800/80 font-normal"> dans la catégorie {selectedCategory}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedCategory !== 'Tous' && allMatchingCount > filteredProducts.length && (
              <button
                onClick={() => setSelectedCategory('Tous')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Voir dans toutes les catégories ({allMatchingCount})
              </button>
            )}
            <button
              onClick={() => setSearchQuery('')}
              className="text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium cursor-pointer transition shadow-xs"
            >
              Effacer la recherche
            </button>
          </div>
        </div>
      )}

      {/* Product Grid / Empty State */}
      {loading ? (
        <div className="text-center py-20 text-stone-500">Chargement de la carte BEBBA...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs max-w-lg mx-auto my-12 animate-in fade-in">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            selectedCategory === 'Favoris' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {selectedCategory === 'Favoris' ? (
              <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500" />
            ) : (
              <Search className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">
            {selectedCategory === 'Favoris'
              ? (searchQuery ? 'Aucun plat favori ne correspond à la recherche' : 'Aucun repas favori enregistré')
              : 'Aucun plat trouvé'}
          </h3>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">
            {selectedCategory === 'Favoris' ? (
              searchQuery ? (
                <>Aucun de vos favoris ne correspond à « <span className="font-semibold text-stone-800">{searchQuery}</span> ».</>
              ) : (
                <>Vous n'avez pas encore ajouté de plats à vos favoris. Cliquez sur le cœur ❤️ en haut à droite des repas sains qui vous plaisent pour les retrouver ici et les commander en un clic !</>
              )
            ) : (
              <>
                Aucun plat ne correspond à votre recherche « <span className="font-semibold text-stone-800">{searchQuery}</span> »
                {selectedCategory !== 'Tous' && (
                  <span> dans la catégorie <strong className="text-stone-700">{selectedCategory}</strong></span>
                )}.
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {selectedCategory === 'Favoris' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryClick('Tous');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Découvrir tous les plats santé
              </button>
            ) : (
              <>
                {selectedCategory !== 'Tous' && allMatchingCount > 0 && (
                  <button
                    onClick={() => handleCategoryClick('Tous')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Voir les {allMatchingCount} résultats dans toutes les catégories
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryClick('Tous');
                  }}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser la recherche
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-lg transition flex flex-col group"
            >
              <div className="relative h-52 overflow-hidden bg-stone-100">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    {prod.category}
                  </span>
                  {prod.isAvailable === false && (
                    <span className="bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                      Indisponible
                    </span>
                  )}
                </div>

                {/* Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(prod.id);
                  }}
                  className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 transform active:scale-90 cursor-pointer shadow-md z-10 ${
                    isFavorite(prod.id)
                      ? 'bg-rose-500 text-white shadow-rose-500/40 ring-2 ring-white scale-105'
                      : 'bg-white/90 hover:bg-white text-stone-400 hover:text-rose-500 hover:scale-110'
                  }`}
                  title={isFavorite(prod.id) ? 'Retirer de mes favoris' : 'Sauvegarder dans mes favoris'}
                  aria-label={isFavorite(prod.id) ? 'Retirer de mes favoris' : 'Ajouter à mes favoris'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isFavorite(prod.id) ? 'fill-white stroke-white' : ''
                    }`}
                  />
                </button>

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <div className="bg-white/90 backdrop-blur-md text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    {prod.calories} kcal
                  </div>
                  {isFavorite(prod.id) && (
                    <div className="bg-rose-900/85 backdrop-blur-md text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 border border-rose-500/30">
                      <Heart className="w-2.5 h-2.5 fill-rose-300 text-rose-300" />
                      <span>Favori</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 mb-1.5 line-clamp-1">{prod.name}</h3>
                  <p className="text-stone-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Macros Pills */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-stone-50 border border-stone-100 py-1 rounded-lg">
                      <div className="text-[10px] text-stone-400 font-medium">Protéines</div>
                      <div className="text-xs font-bold text-stone-800">{prod.protein}g</div>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 py-1 rounded-lg">
                      <div className="text-[10px] text-stone-400 font-medium">Glucides</div>
                      <div className="text-xs font-bold text-stone-800">{prod.carbs}g</div>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 py-1 rounded-lg">
                      <div className="text-[10px] text-stone-400 font-medium">Lipides</div>
                      <div className="text-xs font-bold text-stone-800">{prod.fat}g</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="shrink-0">
                    <span className="text-[10px] sm:text-xs text-stone-400 block font-medium">Prix unitaire</span>
                    <span className="text-base sm:text-lg font-black text-stone-900 font-mono">
                      {prod.basePrice.toFixed(2)} <span className="text-xs font-semibold text-emerald-600">DT</span>
                    </span>
                  </div>

                  {prod.isAvailable === false ? (
                    <span className="px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed select-none">
                      Indisponible
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Bouton Commander (situé entre Prix unitaire et le bouton Personnaliser) */}
                      <button
                        onClick={() => handleQuickOrder(prod)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                          addedProductId === prod.id
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title="Commander directement ce plat (recette standard)"
                      >
                        {addedProductId === prod.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Ajouté !</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Commander</span>
                          </>
                        )}
                      </button>

                      {/* Bouton Personnaliser */}
                      <button
                        onClick={() => handleOpenCustomize(prod)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-200 transition cursor-pointer"
                        title="Personnaliser les ingrédients et options"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                        <span>Personnaliser</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Customization Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 my-8">
            <div className="relative h-48 bg-stone-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedProduct.id)}
                  className={`p-2.5 rounded-full backdrop-blur-md transition shadow-md flex items-center justify-center cursor-pointer ${
                    isFavorite(selectedProduct.id)
                      ? 'bg-rose-500 text-white ring-2 ring-white/90 scale-105'
                      : 'bg-black/60 hover:bg-black/80 text-white hover:text-rose-300'
                  }`}
                  title={isFavorite(selectedProduct.id) ? 'Retirer des favoris' : 'Ajouter à vos favoris'}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(selectedProduct.id) ? 'fill-white stroke-white' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-4 bg-stone-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-2">
                <span>{selectedProduct.category} • {selectedProduct.calories} kcal</span>
                {isFavorite(selectedProduct.id) && (
                  <span className="text-rose-300 flex items-center gap-1 font-bold pl-2 border-l border-white/20">
                    <Heart className="w-3 h-3 fill-rose-400 text-rose-400" /> Favori
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xl font-black text-stone-900 leading-tight">{selectedProduct.name}</h2>
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedProduct.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isFavorite(selectedProduct.id)
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isFavorite(selectedProduct.id) ? 'Dans vos favoris' : 'Ajouter aux favoris'}</span>
                </button>
              </div>
              <p className="text-xs text-stone-500 mb-4">{selectedProduct.description}</p>

              {/* Options selection */}
              {selectedProduct.availableOptions && selectedProduct.availableOptions.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Personnalisations & Suppléments
                  </label>
                  <div className="space-y-2">
                    {selectedProduct.availableOptions.map(opt => {
                      const isSelected = selectedOptions.some(o => o.id === opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleOption(opt)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition text-left cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          <span className="font-mono text-emerald-700">
                            {opt.priceDelta > 0 ? `+${opt.priceDelta.toFixed(2)} DT` : 'Inclus'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special instructions */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">
                  Remarques pour la cuisine
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="Ex: Sans sel ajouté, sauce à part, bien cuit..."
                  rows={2}
                  className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Quantity Stepper & Add Button */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-stone-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold transition"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <span>Ajouter au panier</span>
                  <span className="font-mono">{calculatedTotal.toFixed(2)} DT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
