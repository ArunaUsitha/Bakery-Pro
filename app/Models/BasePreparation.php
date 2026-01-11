<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BasePreparation extends Model
{
    protected $fillable = [
        'name',
        'description',
        'total_weight_kg',
        'total_cost',
        'cost_per_kg',
        'is_active'
    ];

    protected $casts = [
        'total_weight_kg' => 'decimal:3',
        'total_cost' => 'decimal:2',
        'cost_per_kg' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    public function ingredients(): HasMany
    {
        return $this->hasMany(BasePreparationIngredient::class);
    }

    public function recipeUsages(): HasMany
    {
        return $this->hasMany(RecipeBasePreparation::class);
    }

    /**
     * Calculate total cost and cost per kg from ingredients
     */
    public function calculateCost(): void
    {
        $this->total_cost = $this->ingredients()->sum('cost_for_preparation');
        
        if ($this->total_weight_kg > 0) {
            $this->cost_per_kg = $this->total_cost / $this->total_weight_kg;
        }
        
        $this->save();

        // Update all recipes that use this base preparation
        foreach ($this->recipeUsages as $usage) {
            $usage->calculateCostContribution();
        }
    }
}
