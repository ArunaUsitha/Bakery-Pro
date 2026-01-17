<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\Sale;
use App\Models\Wastage;
use App\Models\ProductionBatch;
use App\Models\VehicleSettlement;
use App\Models\ShopSettlement;
use App\Models\Product;
use App\Models\InventoryLocation;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DailyReport::query();

        if ($request->has('from_date')) {
            $query->whereDate('report_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('report_date', '<=', $request->to_date);
        }

        $reports = $query->orderByDesc('report_date')->paginate(30);
        return response()->json($reports);
    }

    public function show(DailyReport $report): JsonResponse
    {
        return response()->json($report);
    }

    public function generateDailyReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = $validated['date'];

        // Calculate production costs
        $productionBatch = ProductionBatch::with('items.product')
            ->whereDate('production_date', $date)
            ->first();

        $productionCost = 0;
        if ($productionBatch) {
            foreach ($productionBatch->items as $item) {
                $productionCost += $item->quantity_produced * $item->product->production_cost;
            }
        }

        // Calculate shop sales (from settlements primarily)
        $shop = InventoryLocation::where('type', 'shop')->first();
        $shopSales = ShopSettlement::whereDate('settlement_date', $date)->sum('expected_cash');
        
        // Add legacy sales if any
        $shopSales += Sale::where('inventory_location_id', $shop?->id)
            ->whereDate('sale_date', $date)
            ->sum('total_amount');

        // Calculate vehicle sales (from settlements)
        $vehicleSales = VehicleSettlement::whereDate('settlement_date', $date)->sum('expected_cash');
        $vehicleSales += Sale::whereHas('location', fn($q) => $q->where('type', 'vehicle'))
            ->whereDate('sale_date', $date)
            ->sum('total_amount');

        // Calculate wastage
        $wastageCost = Wastage::whereDate('wastage_date', $date)->sum('cost');

        // Calculate discrepancies (from vehicle and shop settlements)
        $vehicleDisc = VehicleSettlement::whereDate('settlement_date', $date)->sum('discrepancy');
        $shopDisc = ShopSettlement::whereDate('settlement_date', $date)->sum('discrepancy');

        // Sale discrepancies (legacy)
        $saleDiscrepancy = Sale::whereDate('sale_date', $date)
            ->whereNotNull('discrepancy')
            ->sum('discrepancy');

        $totalDiscrepancy = $vehicleDisc + $shopDisc + $saleDiscrepancy;

        $totalRevenue = $shopSales + $vehicleSales;
        $netProfit = $totalRevenue - $productionCost - $wastageCost + $totalDiscrepancy;

        // Get shop inventory snapshot
        $shopInventory = [];
        if ($shop) {
            $shopInventory = Inventory::with('product')
                ->where('inventory_location_id', $shop->id)
                ->where('quantity', '>', 0)
                ->get()
                ->map(fn($inv) => [
                    'product_id' => $inv->product_id,
                    'product_name' => $inv->product->name,
                    'quantity' => $inv->quantity,
                ])
                ->toArray();
        }

        $report = DailyReport::updateOrCreate(
            ['report_date' => $date],
            [
                'total_production_cost' => $productionCost,
                'total_shop_sales' => $shopSales,
                'total_vehicle_sales' => $vehicleSales,
                'total_revenue' => $totalRevenue,
                'total_wastage_cost' => $wastageCost,
                'total_discrepancy' => $totalDiscrepancy,
                'net_profit' => $netProfit,
                'shop_inventory_at_noon' => $shopInventory,
                'end_of_day_summary' => [
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'production_items' => $productionBatch?->items->count() ?? 0,
                ],
                'status' => 'completed',
            ]
        );

        return response()->json($report);
    }

    public function getDashboardStats(): JsonResponse
    {
        $today = today();
        $weekStart = today()->subDays(6);
        $monthStart = today()->startOfMonth();

        // 1. Sales Calculation Helper
        $calculateSales = function($startDate, $endDate = null) {
            $endDate = $endDate ?: $startDate;
            $shop = ShopSettlement::whereBetween('settlement_date', [$startDate, $endDate])->sum('expected_cash');
            $vehicle = VehicleSettlement::whereBetween('settlement_date', [$startDate, $endDate])->sum('expected_cash');
            $legacy = Sale::whereBetween('sale_date', [$startDate, $endDate])->sum('total_amount');
            return (float)($shop + $vehicle + $legacy);
        };

        // Today's stats
        $todaySales = $calculateSales($today);
        $todayWastage = (float)Wastage::whereDate('wastage_date', $today)->sum('cost');

        // This week's stats
        $weekSales = $calculateSales($weekStart, $today);
        $weekWastage = (float)Wastage::whereDate('wastage_date', '>=', $weekStart)->sum('cost');

        // This month's stats
        $monthSales = $calculateSales($monthStart, $today);
        $monthWastage = (float)Wastage::whereDate('wastage_date', '>=', $monthStart)->sum('cost');

        // Production status
        $todayBatch = ProductionBatch::whereDate('production_date', $today)->first();

        // Inventory value
        $totalInventoryValue = (float)Inventory::with('product')
            ->where('quantity', '>', 0)
            ->get()
            ->sum(fn($inv) => $inv->quantity * $inv->product->selling_price);

        // Pending settlements
        $pendingVehicles = VehicleSettlement::where('status', 'pending')->count();
        $pendingShops = ShopSettlement::where('status', 'pending')->count();
        $pendingSettlements = $pendingVehicles + $pendingShops;

        // Last 7 days sales trend
        $salesTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $dateStr = $date->toDateString();
            $salesTrend[] = [
                'date' => $date->format('M d'),
                'total' => $calculateSales($dateStr)
            ];
        }

        // Top selling products this week
        $productStats = [];
        
        // a. From Shop Settlements
        $shopSettlements = ShopSettlement::whereDate('settlement_date', '>=', $weekStart)->get();
        foreach ($shopSettlements as $s) {
            if ($s->items_sold) {
                foreach ($s->items_sold as $details) {
                    $pid = $details['product_id'];
                    $qty = $details['quantity_sold'] ?? 0;
                    $rev = $details['subtotal'] ?? 0;
                    $this->aggregate($productStats, $pid, $qty, $rev);
                }
            }
        }

        // b. From Vehicle Settlements
        $vehicleSettlements = VehicleSettlement::whereDate('settlement_date', '>=', $weekStart)->get();
        foreach ($vehicleSettlements as $s) {
            if ($s->items_sold) {
                foreach ($s->items_sold as $details) {
                    $pid = $details['product_id'];
                    $qty = $details['quantity'] ?? 0;
                    $rev = $details['total_price'] ?? 0;
                    $this->aggregate($productStats, $pid, $qty, $rev);
                }
            }
        }

        // c. From Legacy Sales
        $legacySales = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.sale_date', '>=', $weekStart)
            ->select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total_price) as rev'))
            ->groupBy('product_id')
            ->get();
        foreach ($legacySales as $s) {
            $this->aggregate($productStats, $s->product_id, $s->qty, $s->rev);
        }

        // Sort and Fetch names
        uasort($productStats, fn($a, $b) => $b['qty'] <=> $a['qty']);
        $top5 = array_slice($productStats, 0, 5, true);
        $pNames = Product::whereIn('id', array_keys($top5))->pluck('name', 'id');

        $finalTop = [];
        foreach ($top5 as $pid => $data) {
            $finalTop[] = [
                'name' => $pNames[$pid] ?? 'Unknown Product',
                'total_qty' => (int)$data['qty'],
                'total_revenue' => (float)$data['rev']
            ];
        }

        return response()->json([
            'today' => [
                'sales' => $todaySales,
                'wastage' => $todayWastage,
            ],
            'week' => [
                'sales' => $weekSales,
                'wastage' => $weekWastage,
            ],
            'month' => [
                'sales' => $monthSales,
                'wastage' => $monthWastage,
            ],
            'production_status' => $todayBatch?->status ?? 'not_started',
            'total_inventory_value' => $totalInventoryValue,
            'pending_settlements' => $pendingSettlements,
            'sales_trend' => $salesTrend,
            'top_products' => $finalTop,
        ]);
    }

    private function aggregate(&$stats, $pid, $qty, $rev)
    {
        if (!isset($stats[$pid])) {
            $stats[$pid] = ['qty' => 0, 'rev' => 0];
        }
        $stats[$pid]['qty'] += $qty;
        $stats[$pid]['rev'] += $rev;
    }
}
