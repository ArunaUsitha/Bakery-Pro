<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecipeBasePreparation extends Model
{
    protected $fillable = [
        'recipe_id',
        'base_preparation_id',
        'weight_used_kg',
        'cost_contribution'
    ];

    protected $casts = [
        'weight_used_kg' => 'decimal:4',
        'cost_contribution' => 'decimal:2'
    ];

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function basePreparation(): BelongsTo
    {
        return $this->belongsTo(BasePreparation::class);
    }

    /**
     * Calculate cost contribution based on weight used and base prep cost per kg
     */
    public function calculateCostContribution(): void
    {
        $this->cost_contribution = $this->weight_used_kg * $this->basePreparation->cost_per_kg;
        $this->save();
        $this->recipe->calculateCost();
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            if ($item->basePreparation) {
                $item->cost_contribution = $item->weight_used_kg * $item->basePreparation->cost_per_kg;
            }
        });

        static::saved(function ($item) {
            $item->recipe->calculateCost();
        });

        static::deleted(function ($item) {
            $item->recipe->calculateCost();
        });
    }
}
