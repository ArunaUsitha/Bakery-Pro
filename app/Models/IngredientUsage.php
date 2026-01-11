<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientUsage extends Model
{
    protected $table = 'ingredient_usage';

    protected $fillable = [
        'ingredient_id',
        'production_batch_id',
        'recipe_id',
        'quantity_used',
        'cost',
        'usage_date',
        'notes'
    ];

    protected $casts = [
        'quantity_used' => 'decimal:4',
        'cost' => 'decimal:2',
        'usage_date' => 'date'
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    protected static function booted()
    {
        static::creating(function ($usage) {
            // Calculate cost based on ingredient cost
            if ($usage->ingredient) {
                $usage->cost = $usage->quantity_used * $usage->ingredient->cost_per_unit;
            }
        });

        static::created(function ($usage) {
            // Deduct from ingredient stock
            $ingredient = $usage->ingredient;
            $ingredient->stock_quantity -= $usage->quantity_used;
            $ingredient->save();
        });

        static::deleted(function ($usage) {
            // Return to stock if deleted
            $ingredient = $usage->ingredient;
            $ingredient->stock_quantity += $usage->quantity_used;
            $ingredient->save();
        });
    }
}
