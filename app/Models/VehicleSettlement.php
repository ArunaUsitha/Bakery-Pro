<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleSettlement extends Model
{
    protected $fillable = [
        'inventory_location_id',
        'settlement_date',
        'items_sent',
        'items_returned',
        'items_sold',
        'expected_cash',
        'float_cash',
        'expected_from_stock',
        'actual_cash',
        'discrepancy',
        'status',
        'notes',
    ];

    protected $casts = [
        'settlement_date' => 'date',
        'items_sent' => 'array',
        'items_returned' => 'array',
        'items_sold' => 'array',
        'expected_cash' => 'decimal:2',
        'float_cash' => 'decimal:2',
        'expected_from_stock' => 'decimal:2',
        'actual_cash' => 'decimal:2',
        'discrepancy' => 'decimal:2',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }

    public function calculateDiscrepancy(): void
    {
        if ($this->actual_cash !== null) {
            $this->discrepancy = $this->actual_cash - $this->expected_cash;
            $this->save();
        }
    }

    public function hasLoss(): bool
    {
        return $this->discrepancy !== null && $this->discrepancy < 0;
    }

    public function isSettled(): bool
    {
        return $this->status === 'settled';
    }
}
