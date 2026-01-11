<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeIngredient extends Model
{
    protected $fillable = [
        'recipe_id',
        'ingredient_id',
        'quantity',
        'cost_for_recipe',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'cost_for_recipe' => 'decimal:2'
    ];

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * Calculate cost based on ingredient cost per unit and quantity
     */
    public function calculateCost(): void
    {
        $this->cost_for_recipe = $this->quantity * $this->ingredient->cost_per_unit;
        $this->save();
    }

    protected static function booted()
    {
        static::saving(function ($recipeIngredient) {
            if ($recipeIngredient->ingredient) {
                $recipeIngredient->cost_for_recipe = $recipeIngredient->quantity * $recipeIngredient->ingredient->cost_per_unit;
            }
        });

        static::saved(function ($recipeIngredient) {
            $recipeIngredient->recipe->calculateCost();
        });

        static::deleted(function ($recipeIngredient) {
            $recipeIngredient->recipe->calculateCost();
        });
    }
}
