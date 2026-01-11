<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'inventory_location_id',
        'sale_date',
        'total_amount',
        'expected_amount',
        'actual_amount',
        'discrepancy',
        'status',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'total_amount' => 'decimal:2',
        'expected_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'discrepancy' => 'decimal:2',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function calculateDiscrepancy(): void
    {
        if ($this->actual_amount !== null) {
            $this->discrepancy = $this->actual_amount - $this->expected_amount;
            $this->save();
        }
    }

    public function hasLoss(): bool
    {
        return $this->discrepancy !== null && $this->discrepancy < 0;
    }
}
