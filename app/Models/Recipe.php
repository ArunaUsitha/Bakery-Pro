<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    protected $fillable = [
        'product_id',
        'name',
        'description',
        'output_quantity',
        'total_cost',
        'cost_per_item',
        'instructions',
        'preparation_time_minutes',
        'is_active'
    ];

    protected $casts = [
        'output_quantity' => 'integer',
        'total_cost' => 'decimal:2',
        'cost_per_item' => 'decimal:2',
        'preparation_time_minutes' => 'integer',
        'is_active' => 'boolean'
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function basePreparations(): HasMany
    {
        return $this->hasMany(RecipeBasePreparation::class);
    }

    public function usageLogs(): HasMany
    {
        return $this->hasMany(IngredientUsage::class);
    }

    /**
     * Calculate and update the total cost based on ingredients and base preparations
     */
    public function calculateCost(): void
    {
        $ingredientsCost = $this->ingredients()->sum('cost_for_recipe');
        $basePrepCost = $this->basePreparations()->sum('cost_contribution');
        
        $this->total_cost = $ingredientsCost + $basePrepCost;
        $this->cost_per_item = $this->output_quantity > 0 
            ? $this->total_cost / $this->output_quantity 
            : 0;
        $this->save();
    }
}
