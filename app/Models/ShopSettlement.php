<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopSettlement extends Model
{
    protected $fillable = [
        'inventory_location_id',
        'settlement_date',
        'opening_inventory',
        'production_received',
        'transfers_in',
        'transfers_out',
        'wastage_recorded',
        'items_counted',
        'items_sold',
        'expected_cash',
        'actual_cash',
        'discrepancy',
        'status',
        'notes',
    ];

    protected $casts = [
        'settlement_date' => 'date',
        'opening_inventory' => 'array',
        'production_received' => 'array',
        'transfers_in' => 'array',
        'transfers_out' => 'array',
        'wastage_recorded' => 'array',
        'items_counted' => 'array',
        'items_sold' => 'array',
        'expected_cash' => 'decimal:2',
        'actual_cash' => 'decimal:2',
        'discrepancy' => 'decimal:2',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }
}
