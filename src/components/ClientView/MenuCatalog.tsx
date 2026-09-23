import React, { useState, useEffect } from 'react';
import { Product, ProductOption } from '../../types';
import { fetchProducts } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Plus, Flame, Sparkles, Check, X, ShieldAlert, Heart, ShoppingBag, SlidersHorizontal } from 'lucide-react';

export const MenuCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
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

  const categories = ['Tous', 'Healthy', 'Grillades', 'Enfants', 'Jus détox', 'Régime complet 30 jours'];

  const filteredProducts = selectedCategory === 'Tous'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleOpenCustomize = (prod: Product) => {
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
    if (!selectedProduct) return;
    addToCart(selectedProduct, quantity, selectedOptions, specialInstructions);
    setSelectedProduct(null);
  };

  const handleQuickOrder = (prod: Product) => {
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

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
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

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20 text-stone-500">Chargement de la carte BEBBA...</div>
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
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                  {prod.category}
                </span>

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-stone-800 text-[11px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {prod.calories} kcal
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
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 bg-stone-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-semibold">
                {selectedProduct.category} • {selectedProduct.calories} kcal
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-black text-stone-900 mb-1">{selectedProduct.name}</h2>
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
