<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BasePreparationIngredient extends Model
{
    protected $fillable = [
        'base_preparation_id',
        'ingredient_id',
        'quantity',
        'cost_for_preparation'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'cost_for_preparation' => 'decimal:2'
    ];

    public function basePreparation(): BelongsTo
    {
        return $this->belongsTo(BasePreparation::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    protected static function booted()
    {
        static::saving(function ($item) {
            if ($item->ingredient) {
                $item->cost_for_preparation = $item->quantity * $item->ingredient->cost_per_unit;
            }
        });

        static::saved(function ($item) {
            $item->basePreparation->calculateCost();
        });

        static::deleted(function ($item) {
            $item->basePreparation->calculateCost();
        });
    }
}
