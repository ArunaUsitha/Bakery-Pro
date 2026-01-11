<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\RecipeBasePreparation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecipeController extends Controller
{
    /**
     * Get all recipes
     */
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::with(['product', 'ingredients.ingredient', 'basePreparations.basePreparation']);

        if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $recipes = $query->orderBy('name')->get();

        return response()->json($recipes);
    }

    /**
     * Create a new recipe
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'output_quantity' => 'required|integer|min:1',
            'instructions' => 'nullable|string',
            'preparation_time_minutes' => 'nullable|integer|min:0',
        ]);

        $recipe = Recipe::create($validated);

        return response()->json($recipe->load('product'), 201);
    }

    /**
     * Get a single recipe with full details
     */
    public function show(Recipe $recipe): JsonResponse
    {
        $recipe->load([
            'product',
            'ingredients.ingredient',
            'basePreparations.basePreparation.ingredients.ingredient'
        ]);

        return response()->json($recipe);
    }

    /**
     * Update a recipe
     */
    public function update(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'exists:products,id',
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'output_quantity' => 'integer|min:1',
            'instructions' => 'nullable|string',
            'preparation_time_minutes' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $recipe->update($validated);

        // Recalculate cost if output quantity changed
        if (isset($validated['output_quantity'])) {
            $recipe->calculateCost();
        }

        return response()->json($recipe->load('product'));
    }

    /**
     * Delete a recipe
     */
    public function destroy(Recipe $recipe): JsonResponse
    {
        $recipe->delete();
        return response()->json(['message' => 'Recipe deleted']);
    }

    /**
     * Add ingredient to recipe
     */
    public function addIngredient(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.0001',
            'notes' => 'nullable|string',
        ]);

        // Check if ingredient already exists in recipe
        $existing = $recipe->ingredients()->where('ingredient_id', $validated['ingredient_id'])->first();
        if ($existing) {
            return response()->json(['error' => 'Ingredient already in recipe'], 400);
        }

        $recipeIngredient = RecipeIngredient::create([
            'recipe_id' => $recipe->id,
            'ingredient_id' => $validated['ingredient_id'],
            'quantity' => $validated['quantity'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($recipeIngredient->load('ingredient'), 201);
    }

    /**
     * Update ingredient quantity in recipe
     */
    public function updateIngredient(Request $request, Recipe $recipe, RecipeIngredient $recipeIngredient): JsonResponse
    {
        if ($recipeIngredient->recipe_id !== $recipe->id) {
            return response()->json(['error' => 'Ingredient not in this recipe'], 400);
        }

        $validated = $request->validate([
            'quantity' => 'numeric|min:0.0001',
            'notes' => 'nullable|string',
        ]);

        $recipeIngredient->update($validated);

        return response()->json($recipeIngredient->load('ingredient'));
    }

    /**
     * Remove ingredient from recipe
     */
    public function removeIngredient(Recipe $recipe, RecipeIngredient $recipeIngredient): JsonResponse
    {
        if ($recipeIngredient->recipe_id !== $recipe->id) {
            return response()->json(['error' => 'Ingredient not in this recipe'], 400);
        }

        $recipeIngredient->delete();

        return response()->json(['message' => 'Ingredient removed from recipe']);
    }

    /**
     * Add base preparation to recipe
     */
    public function addBasePreparation(Request $request, Recipe $recipe): JsonResponse
    {
        $validated = $request->validate([
            'base_preparation_id' => 'required|exists:base_preparations,id',
            'weight_used_kg' => 'required|numeric|min:0.0001',
        ]);

        $recipeBasPrep = RecipeBasePreparation::create([
            'recipe_id' => $recipe->id,
            'base_preparation_id' => $validated['base_preparation_id'],
            'weight_used_kg' => $validated['weight_used_kg'],
        ]);

        return response()->json($recipeBasPrep->load('basePreparation'), 201);
    }

    /**
     * Remove base preparation from recipe
     */
    public function removeBasePreparation(Recipe $recipe, RecipeBasePreparation $recipeBasePreparation): JsonResponse
    {
        if ($recipeBasePreparation->recipe_id !== $recipe->id) {
            return response()->json(['error' => 'Base preparation not in this recipe'], 400);
        }

        $recipeBasePreparation->delete();

        return response()->json(['message' => 'Base preparation removed from recipe']);
    }

    /**
     * Duplicate a recipe
     */
    public function duplicate(Recipe $recipe): JsonResponse
    {
        $newRecipe = $recipe->replicate();
        $newRecipe->name = $recipe->name . ' (Copy)';
        $newRecipe->save();

        // Duplicate ingredients
        foreach ($recipe->ingredients as $ingredient) {
            RecipeIngredient::create([
                'recipe_id' => $newRecipe->id,
                'ingredient_id' => $ingredient->ingredient_id,
                'quantity' => $ingredient->quantity,
                'notes' => $ingredient->notes,
            ]);
        }

        // Duplicate base preparations
        foreach ($recipe->basePreparations as $basPrep) {
            RecipeBasePreparation::create([
                'recipe_id' => $newRecipe->id,
                'base_preparation_id' => $basPrep->base_preparation_id,
                'weight_used_kg' => $basPrep->weight_used_kg,
            ]);
        }

        $newRecipe->calculateCost();

        return response()->json($newRecipe->load(['ingredients.ingredient', 'basePreparations.basePreparation']), 201);
    }

    /**
     * Recalculate recipe cost
     */
    public function recalculateCost(Recipe $recipe): JsonResponse
    {
        // Recalculate each ingredient cost
        foreach ($recipe->ingredients as $ingredient) {
            $ingredient->calculateCost();
        }

        // Recalculate each base prep cost contribution
        foreach ($recipe->basePreparations as $basePrep) {
            $basePrep->calculateCostContribution();
        }

        $recipe->refresh();

        return response()->json($recipe);
    }
}
