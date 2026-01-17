<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryLocation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'description',
        'is_active',
        'float_cash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'float_cash' => 'decimal:2',
    ];

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(VehicleSettlement::class);
    }

    public function isShop(): bool
    {
        return $this->type === 'shop';
    }

    public function isVehicle(): bool
    {
        return $this->type === 'vehicle';
    }
}
