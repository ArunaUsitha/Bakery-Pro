<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'category',
        'production_cost',
        'shop_price',
        'selling_price',
        'shelf_life_days',
        'description',
        'image',
        'is_active',
    ];

    protected $casts = [
        'production_cost' => 'decimal:2',
        'shop_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function productionItems(): HasMany
    {
        return $this->hasMany(ProductionItem::class);
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function wastages(): HasMany
    {
        return $this->hasMany(Wastage::class);
    }

    public function isDayFood(): bool
    {
        return $this->category === 'day_food';
    }

    public function isPackedFood(): bool
    {
        return $this->category === 'packed_food';
    }
}
