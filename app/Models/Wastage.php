<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wastage extends Model
{
    protected $fillable = [
        'product_id',
        'inventory_location_id',
        'quantity',
        'cost',
        'reason',
        'wastage_date',
        'notes',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'wastage_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location_id');
    }
}
