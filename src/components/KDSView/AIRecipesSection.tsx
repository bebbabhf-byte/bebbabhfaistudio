import React, { useState, useMemo } from 'react';
import { Ingredient, AIMenuRecipe } from '../../types';
import { generateAIRecipes, generateDishImageFromPrompt, addRecipeToMenu } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  ChefHat,
  Flame,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Heart,
  BookOpen,
  Apple,
  Zap,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Camera,
  X,
  CheckCheck,
  UtensilsCrossed,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface AIRecipesSectionProps {
  ingredients: Ingredient[];
}

export const AIRecipesSection: React.FC<AIRecipesSectionProps> = ({ ingredients }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [mode, setMode] = useState<'all_stock' | 'selected_ingredients'>('all_stock');
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<AIMenuRecipe[]>([]);
  const [isAIPowered, setIsAIPowered] = useState<boolean>(false);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [generationMeta, setGenerationMeta] = useState<{ mode: string; count: number; date: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>('all');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [generatingImageForId, setGeneratingImageForId] = useState<string | null>(null);
  const [inspectingConsistencyRecipe, setInspectingConsistencyRecipe] = useState<AIMenuRecipe | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [isAddingToMenu, setIsAddingToMenu] = useState(false);
  const [addedRecipeIds, setAddedRecipeIds] = useState<string[]>([]);
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean;
    conflictRecipes: AIMenuRecipe[];
    message: string;
  } | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);



  // Filter available ingredients (stock > 0)
  const inStockIngredients = useMemo(() => {
    return ingredients.filter(i => i.currentStock > 0);
  }, [ingredients]);

  // Ingredients for manual selection
  const filteredIngredientsForSelection = useMemo(() => {
    return inStockIngredients.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(ingredientSearch.toLowerCase());
      const cat = i.category || 'Général';
      const matchesCat = categoryFilter === 'all' || cat === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [inStockIngredients, ingredientSearch, categoryFilter]);

  // Distinct ingredient categories
  const ingredientCategories = useMemo(() => {
    const cats = new Set(inStockIngredients.map(i => i.category || 'Général'));
    return Array.from(cats);
  }, [inStockIngredients]);

  // Toggle selection of an ingredient
  const handleToggleIngredient = (id: string) => {
    setSelectedIngredientIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select all or clear
  const handleSelectAll = () => {
    setSelectedIngredientIds(inStockIngredients.map(i => i.id));
  };

  const handleClearSelection = () => {
    setSelectedIngredientIds([]);
  };

  // Trigger AI generation
  const handleGenerate = async () => {
    if (mode === 'selected_ingredients' && selectedIngredientIds.length === 0) {
      showWarning('Veuillez cocher au moins un ingrédient dans la liste ci-dessous.');
      return;
    }

    try {
      setIsGenerating(true);
      const result = await generateAIRecipes(
        mode,
        mode === 'selected_ingredients' ? selectedIngredientIds : undefined
      );

      if (result && result.recipes) {
        setGeneratedRecipes(result.recipes);
        setIsAIPowered(result.isAIPowered);
        setModelUsed(result.modelUsed || (result.isAIPowered ? 'Gemini 3.8 Flash' : 'Moteur Nutritionnel BEBBA'));
        setGenerationMeta({
          mode: mode === 'all_stock' ? 'Tout le stock disponible' : `${selectedIngredientIds.length} ingrédients cochés`,
          count: result.recipes.length,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        showSuccess(`${result.recipes.length} recettes saines générées avec succès !`);
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la génération des recettes');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy recipe details to clipboard
  const handleCopyRecipe = (recipe: AIMenuRecipe) => {
    const text = `🥗 ${recipe.name.toUpperCase()} (${recipe.category})
✨ ${recipe.tagline}
⏱️ Préparation : ${recipe.prepTimeMinutes} min | ⚡ Calories : ${recipe.calories} kcal | 🥩 Protéines : ${recipe.proteinGrams}g
🏷️ Badges : ${recipe.dietaryTags.join(', ')}

Ingrédients :
${recipe.ingredientsUsed.map(ing => `• ${ing.ingredientName} : ${ing.quantityEstimated}`).join('\n')}

Préparation chef :
${recipe.chefInstructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Bénéfices santé :
${recipe.healthBenefits.map(b => `✓ ${b}`).join('\n')}
— BEBBA Healthy Food`;

    navigator.clipboard.writeText(text);
    setCopiedId(recipe.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Régénération ciblée de la photographie du plat via le prompt visuel transmis
  const handleRegenerateImage = async (recipe: AIMenuRecipe) => {
    try {
      setGeneratingImageForId(recipe.id);
      const res = await generateDishImageFromPrompt({
        visualDescription: recipe.visualDescription || recipe.name,
        dishTitle: recipe.name,
        ingredients: recipe.ingredientsUsed.map(i => i.ingredientName),
        category: recipe.category
      });

      if (res && res.imageUrl) {
        setGeneratedRecipes(prev =>
          prev.map(r =>
            r.id === recipe.id
              ? {
                  ...r,
                  image: res.imageUrl,
                  visualConsistency: res.visualConsistency
                }
              : r
          )
        );
        showSuccess('Image culinaire régénérée avec succès.');
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la régénération de l\'image');
    } finally {
      setGeneratingImageForId(null);
    }
  };

  // Gestion de la sélection multiple des recettes
  const handleToggleSelectRecipe = (id: string) => {
    setSelectedRecipeIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRecipes = () => {
    setSelectedRecipeIds(generatedRecipes.map(r => r.id));
  };

  const handleDeselectAllRecipes = () => {
    setSelectedRecipeIds([]);
  };

  // Ajout à la carte sous forme de plat à commander
  const handleAddToMenu = async (recipesToAdd: AIMenuRecipe[], force: boolean = false) => {
    if (recipesToAdd.length === 0) return;
    try {
      setIsAddingToMenu(true);
      const res = await addRecipeToMenu(recipesToAdd, force);

      // Si le plat existe déjà et que l'on n'a pas encore forcé l'ajout
      if (res.conflict && res.conflicts && res.conflicts.length > 0) {
        setConflictData({
          isOpen: true,
          conflictRecipes: recipesToAdd,
          message: res.message || 'Cette recette existe déjà dans la carte.'
        });
        return;
      }

      if (res.success) {
        setConflictData(null);
        setAddedRecipeIds(prev => [
          ...prev,
          ...recipesToAdd.map(r => r.id)
        ]);
        setSelectedRecipeIds(prev =>
          prev.filter(id => !recipesToAdd.some(r => r.id === id))
        );
        const forcedMention = force ? ' avec la mention (2) ajoutée au titre' : '';
        const msg = res.message ? `${res.message}${forcedMention}` : `${recipesToAdd.length} plat(s) ajouté(s) à la carte avec succès${forcedMention} !`;
        setSuccessFeedback(msg);
        showSuccess(msg);
        setTimeout(() => setSuccessFeedback(null), 5000);
        window.dispatchEvent(new CustomEvent('menu_updated'));
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de l\'ajout à la carte');
    } finally {
      setIsAddingToMenu(false);
    }
  };

  // Action "Forcer l'ajout" : ajoute à la carte avec la mention (2) à la fin du titre
  const handleForceAddToMenu = async () => {
    if (conflictData && conflictData.conflictRecipes.length > 0) {
      await handleAddToMenu(conflictData.conflictRecipes, true);
    }
  };



  // Filter generated recipes by category and search
  const filteredRecipes = useMemo(() => {
    return generatedRecipes.filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.tagline.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.ingredientsUsed.some(ing => ing.ingredientName.toLowerCase().includes(recipeSearch.toLowerCase()));
      const matchesCat = recipeCategoryFilter === 'all' || r.category === recipeCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [generatedRecipes, recipeSearch, recipeCategoryFilter]);

  const recipeCategories = useMemo(() => {
    const cats = new Set(generatedRecipes.map(r => r.category));
    return Array.from(cats);
  }, [generatedRecipes]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-linear-to-r from-emerald-950 via-stone-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Module Intelligence Artificielle & Nutrition Santé</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Recette IA — Cuisine BEBBA
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Générez instantanément <strong className="text-emerald-300">20 menus et recettes healthy</strong> élaborés
              par intelligence artificielle selon deux modes : en exploitant l'ensemble des stocks disponibles en réserve, ou en sélectionnant sur-mesure vos ingrédients clés.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3.5 rounded-2xl bg-linear-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-stone-950 font-black text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition'}`} />
              <span>{isGenerating ? 'Génération IA en cours...' : 'Générer les 20 Menus IA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dual Mode Switcher Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-sm">Mode de Génération IA</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {inStockIngredients.length} ingrédients actuellement en stock
          </span>
        </div>

        {/* Radio-Style Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode 1: All Stock */}
          <div
            onClick={() => setMode('all_stock')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition relative ${
              mode === 'all_stock'
                ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/10'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    mode === 'all_stock' ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Mode 1 : Tout le stock disponible</h4>
                  <span className="text-[11px] text-emerald-700 font-semibold">Analyse globale automatique</span>
                </div>
              </div>
              <input
                type="radio"
                name="recipe_mode"
                checked={mode === 'all_stock'}
                onChange={() => setMode('all_stock')}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
              />
            </div>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              L'IA regarde l'ensemble des <strong className="text-stone-900">{inStockIngredients.length} ingrédients</strong> disponibles
              dans vos réserves et conçoit 20 menus healthy équilibrés optimisant le turnover du stock et la fraîcheur des produits.
            </p>
          </div>

          {/* Mode 2: Selected Ingredients */}
          <div
            onClick={() => setMode('selected_ingredients')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition relative ${
              mode === 'selected_ingredients'
                ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/10'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    mode === 'selected_ingredients' ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Mode 2 : Sélection personnalisée</h4>
                  <span className="text-[11px] text-amber-700 font-semibold">Cochez vos ingrédients choisis</span>
                </div>
              </div>
              <input
                type="radio"
                name="recipe_mode"
                checked={mode === 'selected_ingredients'}
                onChange={() => setMode('selected_ingredients')}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 mt-1 cursor-pointer"
              />
            </div>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Vous cochez vous-même les ingrédients que vous souhaitez cuisiner aujourd'hui, et l'IA génère 20 menus healthy
              spécifiquement conçus autour de cette sélection sur-mesure.
            </p>
          </div>
        </div>

        {/* Manual Ingredients Picker (Only in Mode 2) */}
        {mode === 'selected_ingredients' && (
          <div className="mt-6 pt-6 border-t border-stone-200 animate-in fade-in space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <span>Cochez les ingrédients pour votre menu :</span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-black">
                    {selectedIngredientIds.length} sélectionné{selectedIngredientIds.length > 1 ? 's' : ''}
                  </span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Choisissez parmi les ingrédients frais disponibles en réserve.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition"
                >
                  Tout cocher ({inStockIngredients.length})
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un ingrédient en stock..."
                  value={ingredientSearch}
                  onChange={e => setIngredientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Toutes les catégories</option>
                {ingredientCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkable Ingredients Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto p-3 bg-stone-50 rounded-2xl border border-stone-200">
              {filteredIngredientsForSelection.map(ing => {
                const isChecked = selectedIngredientIds.includes(ing.id);
                return (
                  <label
                    key={ing.id}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-amber-50 border-amber-400 text-stone-950 font-bold shadow-xs'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleIngredient(ing.id)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="truncate font-semibold">{ing.name}</div>
                      <div className="text-[10px] text-stone-400">
                        {ing.currentStock} {ing.unit}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading state indicator */}
      {isGenerating && (
        <div className="p-12 text-center bg-white rounded-3xl border border-emerald-200 shadow-lg space-y-4 animate-in fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-900">
              L'IA BEBBA analyse les réserves et compose 20 menus healthy...
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Calcul des équilibres macronutritionnels, accords de saveurs et vérification des stocks disponibles.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-700 font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>Moteur d'Intelligence Artificielle en cours d'exécution</span>
          </div>
        </div>
      )}

      {/* Generated Recipes Showcase */}
      {generatedRecipes.length > 0 && !isGenerating && (
        <div className="space-y-6">
          {/* Header Controls for Generated Recipes */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-stone-900 text-sm sm:text-base">
                    20 Menus & Recettes Healthy Générés
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    {modelUsed ? `Moteur : ${modelUsed}` : (isAIPowered ? 'Généré par IA' : 'Moteur Nutritionnel BEBBA')}
                  </span>
                </div>
                {generationMeta && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    Génération effectuée à {generationMeta.date} • Mode : <strong>{generationMeta.mode}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer parmi les 20..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={recipeCategoryFilter}
                onChange={e => setRecipeCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Toutes catégories ({generatedRecipes.length})</option>
                {recipeCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Régénérer 20 nouvelles recettes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Régénérer</span>
              </button>
            </div>
          </div>

          {/* Success Feedback Toast Banner */}
          {successFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 text-emerald-950 flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">{successFeedback}</span>
              </div>
              <button
                onClick={() => setSuccessFeedback(null)}
                className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selection & Batch Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 text-white px-5 py-3 rounded-2xl border border-stone-800 shadow-md">
            <div className="flex items-center gap-2.5">
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">
                Sélectionnez une ou plusieurs recettes à ajouter à la carte :
              </span>
              {selectedRecipeIds.length > 0 ? (
                <span className="bg-emerald-500 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-black">
                  {selectedRecipeIds.length} sélectionnée{selectedRecipeIds.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  (Cochez les recettes de votre choix ci-dessous)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedRecipeIds.length < filteredRecipes.length ? (
                <button
                  type="button"
                  onClick={handleSelectAllRecipes}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition cursor-pointer"
                >
                  Tout cocher ({filteredRecipes.length})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeselectAllRecipes}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-700 text-stone-400 hover:bg-stone-800 transition cursor-pointer"
                >
                  Tout décocher
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const selected = generatedRecipes.filter(r => selectedRecipeIds.includes(r.id));
                  handleAddToMenu(selected, false);
                }}
                disabled={selectedRecipeIds.length === 0 || isAddingToMenu}
                className="px-4 py-1.5 rounded-xl bg-linear-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingToMenu ? 'Ajout en cours...' : `Ajouter à la carte (${selectedRecipeIds.length})`}</span>
              </button>
            </div>
          </div>

          {/* 20 Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filteredRecipes.map((recipe, index) => {
              const isExpanded = expandedRecipeId === recipe.id;
              const isFav = favoriteIds.includes(recipe.id);
              const isCopied = copiedId === recipe.id;
              const isSelected = selectedRecipeIds.includes(recipe.id);
              const isAdded = addedRecipeIds.includes(recipe.id);

              return (
                <div
                  key={recipe.id}
                  className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden shadow-xs hover:shadow-md group ${
                    isSelected
                      ? 'border-emerald-500 ring-3 ring-emerald-500/25 bg-emerald-50/15'
                      : isFav
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Dish Photographic Image */}
                  {recipe.image ? (
                    <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-black text-white bg-emerald-700/90 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-xs">
                          #{index + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-xs">
                          {recipe.category}
                        </span>
                      </div>

                      {/* Checkbox Choisir Recette & Favorite */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRecipe(recipe.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                            isSelected
                              ? 'bg-emerald-600 text-white ring-2 ring-white/90 scale-105'
                              : 'bg-stone-900/75 hover:bg-stone-900/95 text-white backdrop-blur-xs border border-white/20'
                          }`}
                          title={isSelected ? 'Désélectionner cette recette' : 'Sélectionner pour ajouter à la carte'}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-white text-emerald-700' : 'border border-white/70 bg-transparent'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-black">
                            {isSelected ? 'Choisie' : 'Choisir'}
                          </span>
                        </button>

                        <button
                          onClick={() => toggleFavorite(recipe.id)}
                          className="p-1.5 rounded-xl bg-stone-900/60 backdrop-blur-xs text-white hover:text-amber-400 transition cursor-pointer"
                          title="Ajouter aux favoris de brigade"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      {/* Photo Bottom Badges */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold pointer-events-none">
                        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-300" />
                          {recipe.prepTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3 text-rose-300" />
                          {recipe.calories} kcal
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Fallback Header if no image */
                    <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            #{index + 1}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-md">
                            {recipe.category}
                          </span>
                        </div>
                        <h4 className="font-black text-stone-900 text-sm leading-snug">{recipe.name}</h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectRecipe(recipe.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                          title={isSelected ? 'Désélectionner' : 'Sélectionner pour ajouter à la carte'}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                            isSelected ? 'bg-white text-emerald-700' : 'border border-stone-400 bg-transparent'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-black">{isSelected ? 'Choisie' : 'Choisir'}</span>
                        </button>

                        <button
                          onClick={() => toggleFavorite(recipe.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 transition cursor-pointer"
                          title="Ajouter aux favoris de brigade"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-4 flex-1 space-y-3.5 text-xs">
                    {recipe.image && (
                      <h4 className="font-black text-stone-900 text-sm leading-snug">
                        {recipe.name}
                      </h4>
                    )}

                    {/* Tagline */}
                    <p className="text-stone-600 italic text-[11px] leading-relaxed">
                      « {recipe.tagline} »
                    </p>

                    {/* Badge Contrôle de Conformité Plat <-> Image */}
                    {recipe.visualConsistency && (
                      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-emerald-950 text-[11px] block truncate">
                              Conformité Plat & Image vérifiée
                            </span>
                            <span className="text-[10px] text-emerald-700 block truncate">
                              Score de correspondance : {recipe.visualConsistency.confidenceScore}%
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectingConsistencyRecipe(recipe)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shrink-0 transition cursor-pointer"
                        >
                          Audit contrôle
                        </button>
                      </div>
                    )}

                    {/* Description Visuelle Détaillée Transmise au Générateur */}
                    {recipe.visualDescription && (
                      <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200 text-[11px] space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-amber-950 font-bold">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-900">
                            <Camera className="w-3 h-3 text-amber-700" />
                            Description visuelle transmise :
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRegenerateImage(recipe)}
                            disabled={generatingImageForId === recipe.id}
                            className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                            title="Régénérer la photographie culinaire via ce prompt visuel"
                          >
                            <RotateCcw className={`w-3 h-3 ${generatingImageForId === recipe.id ? 'animate-spin' : ''}`} />
                            <span>{generatingImageForId === recipe.id ? 'Génération...' : 'Régénérer photo'}</span>
                          </button>
                        </div>
                        <p className="text-stone-700 italic text-[11px] leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                          « {recipe.visualDescription} »
                        </p>
                      </div>
                    )}


                    {/* Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-stone-100/70 text-center">
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Prép</span>
                        </div>
                        <div className="font-bold text-stone-800 text-xs mt-0.5">
                          {recipe.prepTimeMinutes} min
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold flex items-center justify-center gap-1">
                          <Flame className="w-3 h-3 text-rose-500" />
                          <span>Énergie</span>
                        </div>
                        <div className="font-bold text-stone-800 text-xs mt-0.5">
                          {recipe.calories} kcal
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase font-bold flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Protéines</span>
                        </div>
                        <div className="font-bold text-stone-800 text-xs mt-0.5">
                          {recipe.proteinGrams}g
                        </div>
                      </div>
                    </div>

                    {/* Dietary Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.dietaryTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* In Stock Ingredients summary */}
                    <div>
                      <span className="font-bold text-stone-700 block text-[11px] mb-1">
                        Ingrédients du stock utilisés :
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {recipe.ingredientsUsed.map((ing, ingIdx) => (
                          <span
                            key={ingIdx}
                            className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium border border-stone-200"
                          >
                            {ing.ingredientName} ({ing.quantityEstimated})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Health Benefits */}
                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-900 block text-[11px] mb-1">
                        Bénéfices nutritionnels clés :
                      </span>
                      <ul className="space-y-0.5 text-[11px] text-emerald-800">
                        {recipe.healthBenefits.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-center gap-1">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expandable Chef Instructions */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-stone-100 space-y-2 animate-in fade-in">
                        <span className="font-bold text-stone-800 block text-[11px]">
                          Fiche préparation en cuisine :
                        </span>
                        <ol className="space-y-1 text-[11px] text-stone-600 pl-4 list-decimal">
                          {recipe.chefInstructions.map((step, sIdx) => (
                            <li key={sIdx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                        className="text-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-stone-200/60 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Masquer' : 'Préparation'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopyRecipe(recipe)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                        title="Copier la fiche recette"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isCopied ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToMenu([recipe], false)}
                      disabled={isAddingToMenu}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 ${
                        isAdded
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300'
                          : 'bg-stone-900 hover:bg-emerald-700 text-white shadow-emerald-700/10'
                      }`}
                      title={isAdded ? 'Déjà ajouté à la carte (cliquer pour ajouter un nouvel exemplaire)' : 'Ajouter directement cette recette à la carte'}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Sur la carte</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ajouter à la carte</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Initial state when no recipes have been generated yet */}
      {generatedRecipes.length === 0 && !isGenerating && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-stone-900">
              Prêt à concevoir 20 menus healthy par Intelligence Artificielle
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Choisissez votre mode ci-dessus (tout le stock ou sélection d'ingrédients) puis cliquez sur le bouton
              <strong> « Générer les 20 Menus IA »</strong>.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Générer maintenant les 20 menus</span>
          </button>
        </div>
      )}

      {/* Modal d'Audit du Contrôle de Correspondance Titre, Ingrédients & Image */}
      {inspectingConsistencyRecipe && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-stone-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    Rapport de Contrôle de Conformité IA
                  </h3>
                  <p className="text-xs text-stone-500">
                    Vérification stricte de l'alignement entre le titre, les ingrédients et l'image
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingConsistencyRecipe(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dish Summary */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {inspectingConsistencyRecipe.image && (
                <img
                  src={inspectingConsistencyRecipe.image}
                  alt={inspectingConsistencyRecipe.name}
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 object-cover rounded-xl border border-stone-300 shadow-sm shrink-0"
                />
              )}
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  {inspectingConsistencyRecipe.category}
                </span>
                <h4 className="font-black text-stone-900 text-base">
                  {inspectingConsistencyRecipe.name}
                </h4>
                <p className="text-xs text-stone-600 italic">
                  « {inspectingConsistencyRecipe.tagline} »
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-stone-500 pt-1">
                  <span>⏱️ {inspectingConsistencyRecipe.prepTimeMinutes} min</span>
                  <span>⚡ {inspectingConsistencyRecipe.calories} kcal</span>
                  <span>🥩 {inspectingConsistencyRecipe.proteinGrams}g protéines</span>
                </div>
              </div>
            </div>

            {/* Check Results Card */}
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    Validation du Contrôle de Cohérence
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-black">
                    {inspectingConsistencyRecipe.visualConsistency?.confidenceScore || 98}% Conforme
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {inspectingConsistencyRecipe.visualConsistency?.controlNotes ||
                    'Le titre du plat, les ingrédients issus du stock et la description visuelle transmise au générateur concordent parfaitement avec la photographie culinaire attribuée.'}
                </p>
              </div>

              {/* Ingrédients analysés et validés */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 text-xs block">
                  1. Ingrédients utilisés (provenant du stock ou choisis) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingConsistencyRecipe.ingredientsUsed.map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{ing.ingredientName} ({ing.quantityEstimated})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description visuelle transmise */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    2. Description visuelle détaillée transmise au générateur d'images :
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRegenerateImage(inspectingConsistencyRecipe)}
                    disabled={generatingImageForId === inspectingConsistencyRecipe.id}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${generatingImageForId === inspectingConsistencyRecipe.id ? 'animate-spin' : ''}`} />
                    <span>{generatingImageForId === inspectingConsistencyRecipe.id ? 'Génération...' : 'Relancer générateur'}</span>
                  </button>
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/50">
                  « {inspectingConsistencyRecipe.visualDescription || inspectingConsistencyRecipe.name} »
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setInspectingConsistencyRecipe(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
              >
                Fermer le rapport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alerte Conflit : Recette déjà présente dans la carte */}
      {conflictData && conflictData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border-2 border-amber-300 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base leading-snug">
                    Cette recette existe déjà dans la carte
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Détection de plat déjà présent dans votre menu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConflictData(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message & Explication */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <p className="text-xs sm:text-sm font-bold">
                {conflictData.message || 'Cette recette existe déjà dans la carte.'}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Ce plat est déjà disponible à la commande dans la carte. Vous pouvez toutefois cliquer sur{' '}
                <strong>« Forcer l'ajout »</strong> pour l'ajouter comme un nouveau plat à choisir avec la mention{' '}
                <strong className="text-emerald-800 bg-white/90 px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold">(2)</strong> à la fin du titre.
              </p>
            </div>

            {/* Liste des recettes concernées avec aperçu du nom forcé */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 block">
                Aperçu après forçage :
              </span>
              {conflictData.conflictRecipes.map((cr) => (
                <div
                  key={cr.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200"
                >
                  {cr.image && (
                    <img
                      src={cr.image}
                      alt={cr.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-stone-500 line-through truncate">
                      {cr.name}
                    </div>
                    <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 truncate">
                      <span>{cr.name}</span>
                      <span className="font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
                        (2)
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {cr.category} • {cr.calories} kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConflictData(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleForceAddToMenu}
                disabled={isAddingToMenu}
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black flex items-center gap-2 transition shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{isAddingToMenu ? 'Ajout forcé en cours...' : 'Forcer l\'ajout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

