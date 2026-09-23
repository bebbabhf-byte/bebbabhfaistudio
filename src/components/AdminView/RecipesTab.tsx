import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, Product } from '../../types';
import { fetchRecipes, fetchIngredients, fetchProducts, createRecipe, updateRecipe, deleteRecipe } from '../../services/api';
import {
  ChefHat,
  Plus,
  Trash2,
  DollarSign,
  PieChart,
  Percent,
  Search,
  X,
  Layers,
  Edit2
} from 'lucide-react';

export const RecipesTab: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; quantity: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, ings, prods] = await Promise.all([
        fetchRecipes(),
        fetchIngredients(),
        fetchProducts()
      ]);
      setRecipes(recs);
      setIngredients(ings);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setSelectedProductId(recipe.productId);
      setRecipeItems(
        recipe.ingredients.map(i => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity
        }))
      );
    } else {
      setEditingRecipe(null);
      const availableProd = products.find(p => !recipes.some(r => r.productId === p.id)) || products[0];
      setSelectedProductId(availableProd ? availableProd.id : '');
      setRecipeItems([{ ingredientId: ingredients[0]?.id || '', quantity: 100 }]);
    }
    setIsModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([...recipeItems, { ingredientId: ingredients[0].id, quantity: 50 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientRow = (index: number, field: 'ingredientId' | 'quantity', value: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeItems(updated);
  };

  // Real-time calculation of modal food cost
  const modalCalculatedCost = recipeItems.reduce((sum, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (!ing) return sum;
    return sum + (item.quantity * ing.unitCost);
  }, 0);

  const selectedProductObj = products.find(p => p.id === selectedProductId);
  const modalMargin = selectedProductObj
    ? selectedProductObj.basePrice - modalCalculatedCost
    : 0;
  const modalMarginPercent = selectedProductObj && selectedProductObj.basePrice > 0
    ? (modalMargin / selectedProductObj.basePrice) * 100
    : 0;

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || recipeItems.length === 0) return;

    const prod = products.find(p => p.id === selectedProductId);
    const payload = {
      productId: selectedProductId,
      productName: prod ? prod.name : 'Plat',
      ingredients: recipeItems.map(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          ingredientName: ing ? ing.name : 'Ingrédient',
          quantity: parseFloat(item.quantity as any) || 0,
          unit: ing ? ing.unit : 'g',
          unitCost: ing ? ing.unitCost : 0
        };
      })
    };

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, payload);
      } else {
        await createRecipe(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement recette');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm('Supprimer cette fiche technique ?')) return;
    try {
      await deleteRecipe(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const filteredRecipes = recipes.filter(r =>
    r.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Fiches Techniques & Coûts Théoriques (Food Cost)</h3>
            <p className="text-xs text-stone-500">
              Déstockage automatique en cuisine & calcul des marges brutes par portion.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Fiche Recette</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Rechercher une recette par nom de plat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Grid of Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map(recipe => {
          const product = products.find(p => p.id === recipe.productId);
          const price = product ? product.basePrice : 24;
          const cost = recipe.theoreticalCost || 0;
          const margin = price - cost;
          const marginPct = price > 0 ? (margin / price) * 100 : 0;

          return (
            <div key={recipe.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-amber-200 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{recipe.productName}</h4>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {recipe.ingredients.length} ingrédient(s) dosé(s)
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(recipe)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">Prix Vente</span>
                  <span className="font-black text-stone-900 font-mono">{price.toFixed(2)} DT</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">Coût Matière</span>
                  <span className="font-black text-amber-700 font-mono">{cost.toFixed(2)} DT</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold uppercase">Marge Brute</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {marginPct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Ingredients list */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                  Composition par portion
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {recipe.ingredients.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const itemCost = ing ? (item.quantity * ing.unitCost).toFixed(2) : '0.00';
                    return (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-stone-50 text-[11px]">
                        <span className="text-stone-700 font-medium">
                          {item.ingredientName || ing?.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-500">
                            {item.quantity} {item.unit || ing?.unit}
                          </span>
                          <span className="font-mono text-amber-800 text-[10px] bg-amber-50 px-1.5 py-0.5 rounded">
                            {itemCost} DT
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-stone-900 text-base">
                {editingRecipe ? 'Modifier la fiche technique' : 'Nouvelle fiche technique'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Plat concerné *</label>
                <select
                  value={selectedProductId}
                  disabled={!!editingRecipe}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.basePrice.toFixed(2)} DT)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic ingredient rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700">Matières premières & portions</label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un ingrédient</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recipeItems.map((item, index) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200">
                        <select
                          value={item.ingredientId}
                          onChange={e => handleUpdateIngredientRow(index, 'ingredientId', e.target.value)}
                          className="flex-1 px-2 py-1.5 border rounded-lg bg-white text-xs"
                        >
                          {ingredients.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unitCost} DT / {i.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 w-28">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={item.quantity}
                            onChange={e => handleUpdateIngredientRow(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs font-mono"
                          />
                          <span className="text-[11px] text-stone-500 font-mono w-6">
                            {ing?.unit || 'g'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(index)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Food Cost Live Preview */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 grid grid-cols-3 text-center text-xs">
                <div>
                  <span className="text-[10px] text-amber-700 block font-bold uppercase">Coût Théorique</span>
                  <span className="text-base font-black text-amber-900 font-mono">
                    {modalCalculatedCost.toFixed(2)} DT
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block font-bold uppercase">Marge Brute</span>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    {modalMargin.toFixed(2)} DT
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block font-bold uppercase">Taux de Marge</span>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    {modalMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md shadow-amber-600/20"
                >
                  Enregistrer la recette
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
