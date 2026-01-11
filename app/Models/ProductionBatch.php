<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionBatch extends Model
{
    protected $fillable = [
        'production_date',
        'shift_start',
        'shift_end',
        'status',
        'notes',
    ];

    protected $casts = [
        'production_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ProductionItem::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function complete(): void
    {
        $this->update(['status' => 'completed']);
    }
}
