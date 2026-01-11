<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientPurchase extends Model
{
    protected $fillable = [
        'ingredient_id',
        'quantity',
        'cost_per_unit',
        'total_cost',
        'supplier',
        'invoice_number',
        'purchase_date',
        'expiry_date',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'cost_per_unit' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'purchase_date' => 'date',
        'expiry_date' => 'date'
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    protected static function booted()
    {
        static::creating(function ($purchase) {
            $purchase->total_cost = $purchase->quantity * $purchase->cost_per_unit;
        });

        static::created(function ($purchase) {
            // Update ingredient stock and possibly cost per unit
            $ingredient = $purchase->ingredient;
            $ingredient->stock_quantity += $purchase->quantity;
            
            // Optionally update the cost per unit to the new purchase price
            if ($purchase->cost_per_unit > 0) {
                $ingredient->cost_per_unit = $purchase->cost_per_unit;
            }
            
            $ingredient->save();
        });
    }
}
