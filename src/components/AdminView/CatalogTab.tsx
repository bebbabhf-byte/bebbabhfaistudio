import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Utensils,
  Flame,
  Search,
  Check,
  X
} from 'lucide-react';

import { useToast } from '../../context/ToastContext';

export const CatalogTab: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories'>('products');
  const [search, setSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    description: '',
    basePrice: 22,
    calories: 450,
    protein: 30,
    carbs: 40,
    fat: 12,
    image: '',
    isAvailable: true
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        description: product.description || '',
        basePrice: product.basePrice,
        calories: product.calories || 450,
        protein: product.protein || 30,
        carbs: product.carbs || 40,
        fat: product.fat || 12,
        image: product.image,
        isAvailable: product.isAvailable
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: categories.length > 0 ? categories[0].name : 'Bowls Santé',
        description: '',
        basePrice: 22.0,
        calories: 450,
        protein: 30,
        carbs: 40,
        fat: 12,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        isAvailable: true
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        showSuccess(`Produit « ${productForm.name} » mis à jour.`);
      } else {
        await createProduct(productForm);
        showSuccess(`Produit « ${productForm.name} » créé avec succès.`);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur enregistrement produit');
    }
  };

  const handleToggleProductAvailability = async (product: Product) => {
    try {
      await updateProduct(product.id, { isAvailable: !product.isAvailable });
      showSuccess(`Produit « ${product.name} » marqué comme ${!product.isAvailable ? 'disponible' : 'en rupture'}.`);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur mise à jour disponibilité');
    }
  };

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        displayOrder: category.displayOrder
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        displayOrder: categories.length + 1
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        showSuccess(`Catégorie « ${categoryForm.name} » mise à jour.`);
      } else {
        await createCategory(categoryForm);
        showSuccess(`Catégorie « ${categoryForm.name} » créée avec succès.`);
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur enregistrement catégorie');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await deleteCategory(id);
      showSuccess('Catégorie supprimée avec succès.');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Erreur suppression catégorie');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCatFilter === 'all' || p.category === selectedCatFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'products'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Plats & Produits ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'categories'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Catégories ({categories.length})</span>
          </button>
        </div>

        {activeSubTab === 'products' ? (
          <button
            onClick={() => handleOpenProductModal()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Plat</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Catégorie</span>
          </button>
        )}
      </div>

      {/* PRODUCTS TAB */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher un plat sain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCatFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCatFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                Toutes ({products.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatFilter(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCatFilter === cat.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition overflow-hidden shadow-xs ${
                  p.isAvailable ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
                }`}
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-xs text-stone-800 shadow-xs">
                    {p.category}
                  </span>
                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      p.isAvailable ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {p.isAvailable ? 'En vente' : 'Épuisé'}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-stone-900 text-sm leading-snug">{p.name}</h3>
                    <div className="text-base font-black text-purple-700 whitespace-nowrap">
                      {p.basePrice.toFixed(2)} <span className="text-xs">DT</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2">{p.description}</p>

                  {/* Nutritional details */}
                  <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 bg-stone-50 rounded-xl text-center border border-stone-100 text-[10px]">
                    <div>
                      <span className="text-stone-400 block">Kcal</span>
                      <span className="font-bold text-stone-800">{p.calories || 400}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Prot</span>
                      <span className="font-bold text-emerald-600">{p.protein || 25}g</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Gluc</span>
                      <span className="font-bold text-amber-600">{p.carbs || 30}g</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Lip</span>
                      <span className="font-bold text-rose-600">{p.fat || 12}g</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleToggleProductAvailability(p)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        p.isAvailable
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {p.isAvailable ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{p.isAvailable ? 'Désactiver' : 'Activer'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenProductModal(p)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 font-bold text-sm text-stone-900 flex items-center justify-between">
            <span>Catégories du Menu</span>
            <span className="text-xs font-normal text-stone-500">{categories.length} catégories configurées</span>
          </div>

          <div className="divide-y divide-stone-100">
            {categories.map((cat, idx) => {
              const productCount = products.filter(p => p.category === cat.name).length;
              return (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      #{cat.displayOrder || idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        {cat.name}
                        {cat.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {cat.description || 'Pas de description'} • <span className="font-semibold text-stone-700">{productCount} plats</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Edit / Create Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingProduct ? 'Modifier le plat' : 'Nouveau plat santé'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom du plat *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Bowl Saumon Quinoa & Avocat"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Catégorie *</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Prix de base (DT) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={productForm.basePrice}
                    onChange={e => setProductForm({ ...productForm, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description & Ingrédients clés</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Saumon frais, quinoa bio, avocat, edamame, sésame..."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">URL de la photo</label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Nutritional values */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 block">Valeurs Nutritionnelles</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-500">Calories (kcal)</label>
                    <input
                      type="number"
                      value={productForm.calories}
                      onChange={e => setProductForm({ ...productForm, calories: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Protéines (g)</label>
                    <input
                      type="number"
                      value={productForm.protein}
                      onChange={e => setProductForm({ ...productForm, protein: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Glucides (g)</label>
                    <input
                      type="number"
                      value={productForm.carbs}
                      onChange={e => setProductForm({ ...productForm, carbs: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Lipides (g)</label>
                    <input
                      type="number"
                      value={productForm.fat}
                      onChange={e => setProductForm({ ...productForm, fat: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 border rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={productForm.isAvailable}
                  onChange={e => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <label htmlFor="availCheck" className="font-semibold text-stone-800">
                  Disponible immédiatement à la commande
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer le plat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit / Create Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nom de la catégorie *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Ex: Salades Gourmandes"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Courte description affichée aux clients..."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ordre d affichage</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={e => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-md shadow-purple-600/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
