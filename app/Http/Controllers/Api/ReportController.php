<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\Sale;
use App\Models\Wastage;
use App\Models\ProductionBatch;
use App\Models\VehicleSettlement;
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

        // Calculate shop sales
        $shop = InventoryLocation::where('type', 'shop')->first();
        $shopSales = Sale::where('inventory_location_id', $shop?->id)
            ->whereDate('sale_date', $date)
            ->sum('total_amount');

        // Calculate vehicle sales
        $vehicleSales = Sale::whereHas('location', fn($q) => $q->where('type', 'vehicle'))
            ->whereDate('sale_date', $date)
            ->sum('total_amount');

        // Calculate wastage
        $wastageCost = Wastage::whereDate('wastage_date', $date)->sum('cost');

        // Calculate discrepancies
        $discrepancy = VehicleSettlement::whereDate('settlement_date', $date)->sum('discrepancy');

        // Sale discrepancies
        $saleDiscrepancy = Sale::whereDate('sale_date', $date)
            ->whereNotNull('discrepancy')
            ->sum('discrepancy');

        $totalDiscrepancy = $discrepancy + $saleDiscrepancy;

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
        $weekStart = today()->startOfWeek();
        $monthStart = today()->startOfMonth();

        // Today's stats
        $todaySales = Sale::whereDate('sale_date', $today)->sum('total_amount');
        $todayWastage = Wastage::whereDate('wastage_date', $today)->sum('cost');

        // This week's stats
        $weekSales = Sale::whereDate('sale_date', '>=', $weekStart)->sum('total_amount');
        $weekWastage = Wastage::whereDate('wastage_date', '>=', $weekStart)->sum('cost');

        // This month's stats
        $monthSales = Sale::whereDate('sale_date', '>=', $monthStart)->sum('total_amount');
        $monthWastage = Wastage::whereDate('wastage_date', '>=', $monthStart)->sum('cost');

        // Production status
        $todayBatch = ProductionBatch::whereDate('production_date', $today)->first();

        // Inventory value
        $totalInventoryValue = Inventory::with('product')
            ->where('quantity', '>', 0)
            ->get()
            ->sum(fn($inv) => $inv->quantity * $inv->product->selling_price);

        // Pending settlements
        $pendingSettlements = VehicleSettlement::where('status', 'pending')->count();

        // Last 7 days sales trend
        $salesTrend = Sale::select(
            DB::raw('DATE(sale_date) as date'),
            DB::raw('SUM(total_amount) as total')
        )
            ->whereDate('sale_date', '>=', today()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top selling products this week
        $topProducts = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.sale_date', '>=', $weekStart)
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_qty'), DB::raw('SUM(sale_items.total_price) as total_revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

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
            'top_products' => $topProducts,
        ]);
    }
}
