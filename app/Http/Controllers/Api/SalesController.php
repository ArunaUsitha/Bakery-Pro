<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Inventory;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ShopSettlement;
use App\Models\VehicleSettlement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sale::with(['location', 'items.product']);

        if ($request->has('location_id')) {
            $query->where('inventory_location_id', $request->location_id);
        }

        if ($request->has('date')) {
            $query->whereDate('sale_date', $request->date);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sales = $query->orderByDesc('sale_date')->paginate(20);
        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'inventory_location_id' => 'required|exists:inventory_locations,id',
            'sale_date' => 'required|date',
        ]);

        $sale = Sale::create([
            'inventory_location_id' => $validated['inventory_location_id'],
            'sale_date' => $validated['sale_date'],
            'total_amount' => 0,
            'expected_amount' => 0,
            'status' => 'open',
        ]);

        return response()->json($sale, 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['location', 'items.product']);
        return response()->json($sale);
    }

    public function addItem(Request $request, Sale $sale): JsonResponse
    {
        if ($sale->status === 'closed') {
            return response()->json(['error' => 'Sale is already closed'], 400);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::find($validated['product_id']);
        $location = $sale->location;

        // Check inventory availability
        $inventoryQty = Inventory::where('product_id', $validated['product_id'])
            ->where('inventory_location_id', $sale->inventory_location_id)
            ->where('quantity', '>', 0)
            ->sum('quantity');

        if ($inventoryQty < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient inventory'], 400);
        }

        DB::transaction(function () use ($sale, $validated, $product, $location) {
            // Determine price based on location type
            $unitPrice = $location->isShop() ? $product->selling_price : $product->selling_price;
            $totalPrice = $unitPrice * $validated['quantity'];

            // Create sale item
            $saleItem = $sale->items()->create([
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
            ]);

            // Deduct from inventory (FIFO - oldest first)
            $remaining = $validated['quantity'];
            $inventories = Inventory::where('product_id', $validated['product_id'])
                ->where('inventory_location_id', $sale->inventory_location_id)
                ->where('quantity', '>', 0)
                ->orderBy('expiry_date')
                ->get();

            foreach ($inventories as $inventory) {
                if ($remaining <= 0) break;

                $deduct = min($inventory->quantity, $remaining);
                $inventory->quantity -= $deduct;
                $inventory->save();
                $remaining -= $deduct;
            }

            // Update sale totals
            $sale->total_amount += $totalPrice;
            $sale->expected_amount += $totalPrice;
            $sale->save();
        });

        $sale->load('items.product');
        return response()->json($sale);
    }

    public function recordCashCollection(Request $request, Sale $sale): JsonResponse
    {
        $validated = $request->validate([
            'actual_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $sale->actual_amount = $validated['actual_amount'];
        $sale->discrepancy = $validated['actual_amount'] - $sale->expected_amount;
        $sale->notes = $validated['notes'] ?? $sale->notes;
        $sale->status = 'verified';
        $sale->save();

        return response()->json($sale);
    }

    public function close(Sale $sale): JsonResponse
    {
        if ($sale->actual_amount === null) {
            return response()->json(['error' => 'Cash collection must be recorded first'], 400);
        }

        $sale->status = 'closed';
        $sale->save();

        return response()->json($sale);
    }

    public function getTodaySale(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:inventory_locations,id',
        ]);

        $locationId = $validated['location_id'];
        $location = InventoryLocation::findOrFail($locationId);



        // 1. Try to find a manual Sale record
        $sale = Sale::with(['location', 'items.product'])
            ->where('inventory_location_id', $locationId)
            ->whereDate('sale_date', today())
            ->first();

        // 2. If no manual sale or empty items, check for Settlements
        if (!$sale || $sale->items->isEmpty()) {
            $settlement = null;
            if ($location->type === 'shop') {
                $settlement = ShopSettlement::where('inventory_location_id', $locationId)
                    ->whereDate('settlement_date', today())
                    ->first();
            } else {
                $settlement = VehicleSettlement::where('inventory_location_id', $locationId)
                    ->whereDate('settlement_date', today())
                    ->first();
            }

            if ($settlement && !empty($settlement->items_sold)) {

                // Construct a virtual sale object for the frontend
                $items = collect($settlement->items_sold)->map(function($item) {
                    $pid = $item['product_id'] ?? null;
                    
                    return [
                        'id' => 's' . ($item['product_id'] ?? rand()),
                        'product_id' => $item['product_id'],
                        'quantity' => floatval($item['quantity_sold'] ?? $item['quantity'] ?? 0),
                        'unit_price' => floatval($item['price'] ?? ($item['quantity'] > 0 ? $item['total_price'] / $item['quantity'] : 0) ?? 0),
                        'total_price' => floatval($item['subtotal'] ?? $item['total_price'] ?? 0),
                        'product' => [
                            'name' => $item['product_name'] ?? 'Unknown Product'
                        ]
                    ];
                });

                return response()->json([
                    'id' => 'settlement-' . $settlement->id,
                    'inventory_location_id' => $locationId,
                    'sale_date' => $settlement->settlement_date,
                    'total_amount' => (float)$settlement->expected_cash,
                    'expected_amount' => (float)$settlement->expected_cash,
                    'actual_amount' => $settlement->actual_cash !== null ? (float)$settlement->actual_cash : null,
                    'discrepancy' => $settlement->discrepancy !== null ? (float)$settlement->discrepancy : 0, // Default to 0 instead of null if we want to avoid NaN in buggy frontend logic
                    'status' => $settlement->status === 'settled' ? 'closed' : 'open',
                    'notes' => $settlement->notes,
                    'items' => $items,
                    'location' => $location
                ]);
            }
        }



        // 3. Fallback: Return manual sale or create empty one
        if (!$sale) {
            $sale = Sale::create([
                'inventory_location_id' => $locationId,
                'sale_date' => today(),
                'total_amount' => 0,
                'expected_amount' => 0,
                'status' => 'open',
            ]);
            $sale->load(['location', 'items.product']);
        }

        // Ensure numeric fields are clean
        $sale->total_amount = (float)$sale->total_amount;
        $sale->expected_amount = (float)$sale->expected_amount;
        $sale->actual_amount = $sale->actual_amount !== null ? (float)$sale->actual_amount : null;
        $sale->discrepancy = $sale->discrepancy !== null ? (float)$sale->discrepancy : null;

        return response()->json($sale);
    }
}
