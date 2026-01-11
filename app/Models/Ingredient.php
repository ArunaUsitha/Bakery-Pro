<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'category',
        'unit',
        'cost_per_unit',
        'stock_quantity',
        'minimum_stock',
        'supplier',
        'is_active'
    ];

    protected $casts = [
        'cost_per_unit' => 'decimal:2',
        'stock_quantity' => 'decimal:3',
        'minimum_stock' => 'decimal:3',
        'is_active' => 'boolean'
    ];

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(IngredientPurchase::class);
    }

    public function usage(): HasMany
    {
        return $this->hasMany(IngredientUsage::class);
    }

    public function basePreparationIngredients(): HasMany
    {
        return $this->hasMany(BasePreparationIngredient::class);
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->minimum_stock;
    }

    public function getTotalValueAttribute(): float
    {
        return $this->stock_quantity * $this->cost_per_unit;
    }
}
