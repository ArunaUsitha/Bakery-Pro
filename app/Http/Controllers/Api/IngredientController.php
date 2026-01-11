<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\IngredientPurchase;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IngredientController extends Controller
{
    /**
     * Get all ingredients
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::query();

        if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('low_stock')) {
            $query->whereRaw('stock_quantity <= minimum_stock');
        }

        $ingredients = $query->orderBy('name')->get();

        return response()->json($ingredients);
    }

    /**
     * Create a new ingredient
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'unit' => 'required|string|max:50',
            'cost_per_unit' => 'required|numeric|min:0',
            'stock_quantity' => 'numeric|min:0',
            'minimum_stock' => 'numeric|min:0',
            'supplier' => 'nullable|string|max:255',
        ]);

        $ingredient = Ingredient::create($validated);

        return response()->json($ingredient, 201);
    }

    /**
     * Get a single ingredient
     */
    public function show(Ingredient $ingredient): JsonResponse
    {
        $ingredient->load(['recipeIngredients.recipe', 'purchases', 'usage']);
        return response()->json($ingredient);
    }

    /**
     * Update an ingredient
     */
    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'category' => 'nullable|string|max:100',
            'unit' => 'string|max:50',
            'cost_per_unit' => 'numeric|min:0',
            'stock_quantity' => 'numeric|min:0',
            'minimum_stock' => 'numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $oldCost = $ingredient->cost_per_unit;
        $ingredient->update($validated);

        // If cost changed, recalculate all recipes using this ingredient
        if (isset($validated['cost_per_unit']) && $validated['cost_per_unit'] != $oldCost) {
            foreach ($ingredient->recipeIngredients as $recipeIngredient) {
                $recipeIngredient->calculateCost();
            }
            foreach ($ingredient->basePreparationIngredients as $bpIngredient) {
                $bpIngredient->cost_for_preparation = $bpIngredient->quantity * $ingredient->cost_per_unit;
                $bpIngredient->save();
            }
        }

        return response()->json($ingredient);
    }

    /**
     * Delete an ingredient
     */
    public function destroy(Ingredient $ingredient): JsonResponse
    {
        // Check if ingredient is used in any recipes
        if ($ingredient->recipeIngredients()->count() > 0) {
            return response()->json([
                'error' => 'Cannot delete ingredient that is used in recipes'
            ], 400);
        }

        $ingredient->delete();
        return response()->json(['message' => 'Ingredient deleted']);
    }

    /**
     * Get ingredient categories
     */
    public function categories(): JsonResponse
    {
        $categories = Ingredient::whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return response()->json($categories);
    }

    /**
     * Add stock (purchase)
     */
    public function addStock(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.001',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'invoice_number' => 'nullable|string|max:100',
            'purchase_date' => 'required|date',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['ingredient_id'] = $ingredient->id;

        $purchase = IngredientPurchase::create($validated);
        $ingredient->refresh();

        return response()->json([
            'purchase' => $purchase,
            'ingredient' => $ingredient
        ], 201);
    }

    /**
     * Get purchase history
     */
    public function purchaseHistory(Ingredient $ingredient): JsonResponse
    {
        $purchases = $ingredient->purchases()
            ->orderBy('purchase_date', 'desc')
            ->paginate(20);

        return response()->json($purchases);
    }

    /**
     * Get low stock ingredients
     */
    public function lowStock(): JsonResponse
    {
        $ingredients = Ingredient::where('is_active', true)
            ->whereRaw('stock_quantity <= minimum_stock')
            ->orderBy('name')
            ->get();

        return response()->json($ingredients);
    }

    /**
     * Adjust stock (for corrections)
     */
    public function adjustStock(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric',
            'reason' => 'required|string|max:255',
        ]);

        $ingredient->stock_quantity += $validated['quantity'];
        $ingredient->save();

        return response()->json($ingredient);
    }
}
