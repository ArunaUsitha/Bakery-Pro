<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    protected $fillable = [
        'report_date',
        'total_production_cost',
        'total_shop_sales',
        'total_vehicle_sales',
        'total_revenue',
        'total_wastage_cost',
        'total_discrepancy',
        'net_profit',
        'shop_inventory_at_noon',
        'end_of_day_summary',
        'status',
    ];

    protected $casts = [
        'report_date' => 'date',
        'total_production_cost' => 'decimal:2',
        'total_shop_sales' => 'decimal:2',
        'total_vehicle_sales' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'total_wastage_cost' => 'decimal:2',
        'total_discrepancy' => 'decimal:2',
        'net_profit' => 'decimal:2',
        'shop_inventory_at_noon' => 'array',
        'end_of_day_summary' => 'array',
    ];

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function calculateNetProfit(): void
    {
        $this->net_profit = $this->total_revenue - $this->total_production_cost - $this->total_wastage_cost + $this->total_discrepancy;
        $this->save();
    }
}
