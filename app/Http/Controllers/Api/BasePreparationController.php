<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BasePreparation;
use App\Models\BasePreparationIngredient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BasePreparationController extends Controller
{
    /**
     * Get all base preparations
     */
    public function index(Request $request): JsonResponse
    {
        $query = BasePreparation::with('ingredients.ingredient');

        if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        $preparations = $query->orderBy('name')->get();

        return response()->json($preparations);
    }

    /**
     * Create a new base preparation
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'total_weight_kg' => 'nullable|numeric|min:0',
        ]);

        $preparation = BasePreparation::create($validated);

        return response()->json($preparation, 201);
    }

    /**
     * Get a single base preparation
     */
    public function show(BasePreparation $basePreparation): JsonResponse
    {
        $basePreparation->load(['ingredients.ingredient', 'recipeUsages.recipe']);
        return response()->json($basePreparation);
    }

    /**
     * Update a base preparation
     */
    public function update(Request $request, BasePreparation $basePreparation): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'total_weight_kg' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $basePreparation->update($validated);

        // Recalculate cost if weight changed
        if (isset($validated['total_weight_kg'])) {
            $basePreparation->calculateCost();
        }

        return response()->json($basePreparation);
    }

    /**
     * Delete a base preparation
     */
    public function destroy(BasePreparation $basePreparation): JsonResponse
    {
        // Check if used in any recipes
        if ($basePreparation->recipeUsages()->count() > 0) {
            return response()->json([
                'error' => 'Cannot delete base preparation that is used in recipes'
            ], 400);
        }

        $basePreparation->delete();
        return response()->json(['message' => 'Base preparation deleted']);
    }

    /**
     * Add ingredient to base preparation
     */
    public function addIngredient(Request $request, BasePreparation $basePreparation): JsonResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.0001',
        ]);

        // Check if ingredient already exists
        $existing = $basePreparation->ingredients()
            ->where('ingredient_id', $validated['ingredient_id'])
            ->first();

        if ($existing) {
            return response()->json(['error' => 'Ingredient already in preparation'], 400);
        }

        $bpIngredient = BasePreparationIngredient::create([
            'base_preparation_id' => $basePreparation->id,
            'ingredient_id' => $validated['ingredient_id'],
            'quantity' => $validated['quantity'],
        ]);

        return response()->json($bpIngredient->load('ingredient'), 201);
    }

    /**
     * Update ingredient in base preparation
     */
    public function updateIngredient(
        Request $request, 
        BasePreparation $basePreparation, 
        BasePreparationIngredient $basePreparationIngredient
    ): JsonResponse {
        if ($basePreparationIngredient->base_preparation_id !== $basePreparation->id) {
            return response()->json(['error' => 'Ingredient not in this preparation'], 400);
        }

        $validated = $request->validate([
            'quantity' => 'numeric|min:0.0001',
        ]);

        $basePreparationIngredient->update($validated);

        return response()->json($basePreparationIngredient->load('ingredient'));
    }

    /**
     * Remove ingredient from base preparation
     */
    public function removeIngredient(
        BasePreparation $basePreparation, 
        BasePreparationIngredient $basePreparationIngredient
    ): JsonResponse {
        if ($basePreparationIngredient->base_preparation_id !== $basePreparation->id) {
            return response()->json(['error' => 'Ingredient not in this preparation'], 400);
        }

        $basePreparationIngredient->delete();

        return response()->json(['message' => 'Ingredient removed from preparation']);
    }

    /**
     * Recalculate cost
     */
    public function recalculateCost(BasePreparation $basePreparation): JsonResponse
    {
        foreach ($basePreparation->ingredients as $ingredient) {
            $ingredient->cost_for_preparation = $ingredient->quantity * $ingredient->ingredient->cost_per_unit;
            $ingredient->save();
        }

        $basePreparation->calculateCost();
        $basePreparation->refresh();

        return response()->json($basePreparation->load('ingredients.ingredient'));
    }
}
