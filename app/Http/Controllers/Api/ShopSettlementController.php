<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ShopSettlement;
use App\Models\StockTransfer;
use App\Models\Wastage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopSettlementController extends Controller
{
    public function index(): JsonResponse
    {
        $settlements = ShopSettlement::with('location')
            ->orderByDesc('settlement_date')
            ->paginate(15);
        return response()->json($settlements);
    }

    public function show($id): JsonResponse
    {
        $settlement = ShopSettlement::findOrFail($id);
        return response()->json($settlement->load('location'));
    }

    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:inventory_locations,id',
            'date' => 'nullable|date',
        ]);

        $locationId = $validated['location_id'];
        $date = $validated['date'] ?? today()->toDateString();

        $settlement = ShopSettlement::firstOrCreate(
            ['inventory_location_id' => $locationId, 'settlement_date' => $date],
            ['status' => 'pending']
        );

        if ($settlement->status === 'pending') {
            // 2. Production Received Today
            $production = StockTransfer::where('to_location_id', $locationId)
                ->where('transfer_type', 'production_to_location')
                ->whereDate('created_at', $date)
                ->get()
                ->groupBy('product_id')
                ->map(fn($group) => $group->sum('quantity'))
                ->toArray();
            $settlement->production_received = $production;

            // 3. Transfers In
            $transfersIn = StockTransfer::where('to_location_id', $locationId)
                ->whereIn('transfer_type', ['vehicle_to_shop', 'transfer_in'])
                ->whereDate('created_at', $date)
                ->get()
                ->groupBy('product_id')
                ->map(fn($group) => $group->sum('quantity'))
                ->toArray();
            $settlement->transfers_in = $transfersIn;

            // 4. Transfers Out
            $transfersOut = StockTransfer::where('from_location_id', $locationId)
                ->whereIn('transfer_type', ['shop_to_vehicle', 'transfer_out'])
                ->whereDate('created_at', $date)
                ->get()
                ->groupBy('product_id')
                ->map(fn($group) => $group->sum('quantity'))
                ->toArray();
            $settlement->transfers_out = $transfersOut;

            // 5. Wastage recorded
            $wastage = Wastage::where('inventory_location_id', $locationId)
                ->whereDate('wastage_date', $date)
                ->get()
                ->groupBy('product_id')
                ->map(fn($group) => $group->sum('quantity'))
                ->toArray();
            $settlement->wastage_recorded = $wastage;

            // 1. Get Opening Inventory (Start of Day)
            // First, try to get yesterday's closing inventory from the previous settlement
            $yesterday = date('Y-m-d', strtotime('-1 day', strtotime($date)));
            $prevSettlement = ShopSettlement::where('inventory_location_id', $locationId)
                ->where('settlement_date', $yesterday)
                ->first();

            if ($prevSettlement && $prevSettlement->items_counted) {
                $settlement->opening_inventory = $prevSettlement->items_counted;
            } else {
                // DERIVE Opening Stock from Current Stock
                // Formula: Opening = Current - Inflows + Outflows
                $current = Inventory::where('inventory_location_id', $locationId)
                    ->get()
                    ->mapWithKeys(fn($i) => [$i->product_id => $i->quantity]);
                
                $opening = [];
                $pids = $current->keys()
                    ->merge(array_keys($production))
                    ->merge(array_keys($transfersIn))
                    ->merge(array_keys($transfersOut))
                    ->merge(array_keys($wastage))
                    ->unique();

                foreach ($pids as $pid) {
                    $curQty = floatval($current->get($pid, 0));
                    $inQty = floatval($production[$pid] ?? 0) + floatval($transfersIn[$pid] ?? 0);
                    $outQty = floatval($transfersOut[$pid] ?? 0) + floatval($wastage[$pid] ?? 0);
                    
                    $opening[$pid] = max(0, $curQty - $inQty + $outQty);
                }
                $settlement->opening_inventory = $opening;
            }

            $this->calculateExpected($settlement);
            $settlement->save();
        }

        return response()->json($settlement->load('location'));
    }

    public function recordCount(Request $request, $id): JsonResponse
    {
        $settlement = ShopSettlement::findOrFail($id);
        
        $validated = $request->validate([
            'items_counted' => 'required|array',
        ]);

        if ($settlement->status === 'settled') {
            return response()->json(['error' => 'Settlement is already finalized'], 422);
        }

        $settlement->items_counted = $validated['items_counted'];
        
        // Calculate expected sales immediately so user sees them
        $this->calculateExpected($settlement);
        
        $settlement->save();

        return response()->json($settlement);
    }

    protected function calculateExpected(ShopSettlement $settlement)
    {
        // Calculation: Opening + In - Out - Counted = Sales
        $opening = collect($settlement->opening_inventory);
        $prod = collect($settlement->production_received);
        $tIn = collect($settlement->transfers_in);
        $tOut = collect($settlement->transfers_out);
        $waste = collect($settlement->wastage_recorded);
        $counted = collect($settlement->items_counted);

        $productIds = $opening->keys()
            ->merge($prod->keys())
            ->merge($tIn->keys())
            ->merge($tOut->keys())
            ->merge($waste->keys())
            ->merge($counted->keys())
            ->unique();

        $itemsSold = [];
        $expectedCash = 0;

        foreach ($productIds as $pid) {
            $product = Product::find($pid);
            if (!$product) continue;

            $openingQty = floatval($opening->get($pid, 0));
            $prodQty = floatval($prod->get($pid, 0));
            $tInQty = floatval($tIn->get($pid, 0));
            $tOutQty = floatval($tOut->get($pid, 0));
            $wasteQty = floatval($waste->get($pid, 0));
            $countedQty = floatval($counted->get($pid, 0));

            $in = $openingQty + $prodQty + $tInQty;
            $out = $tOutQty + $wasteQty + $countedQty;
            
            $soldQty = $in - $out;
            if ($soldQty > 0) {
                $price = $product->shop_price ?? $product->selling_price;
                $itemsSold[] = [
                    'product_id' => $pid,
                    'product_name' => $product->name,
                    'quantity_sold' => $soldQty,
                    'price' => $price,
                    'subtotal' => $soldQty * $price
                ];
                $expectedCash += $soldQty * $price;
            }
        }

        $settlement->items_sold = $itemsSold;
        $settlement->expected_cash = $expectedCash;
    }

    public function settle(Request $request, $id): JsonResponse
    {
        $settlement = ShopSettlement::findOrFail($id);
        
        $validated = $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($settlement->status === 'settled') {
            return response()->json(['error' => 'Settlement is already finalized'], 422);
        }

        return DB::transaction(function () use ($settlement, $validated) {
            // 1. Ensure calculation is fresh
            $this->calculateExpected($settlement);
            
            // 2. Update settlement record
            $settlement->actual_cash = $validated['actual_cash'];
            $settlement->discrepancy = $settlement->actual_cash - $settlement->expected_cash;
            $settlement->notes = $validated['notes'];
            $settlement->status = 'settled';
            $settlement->save();

            // 3. UPDATE LIVE INVENTORY
            // The physical closing stock in the shop is $settlement->items_counted.
            // We must adjust the shop's inventory table to match this reality.
            if ($settlement->items_counted) {
                foreach ($settlement->items_counted as $productId => $countedQty) {
                    $totalInDB = Inventory::where('inventory_location_id', $settlement->inventory_location_id)
                        ->where('product_id', $productId)
                        ->sum('quantity');
                    
                    $difference = $countedQty - $totalInDB;
                    
                    if ($difference < 0) {
                        // We have LESS stock than the DB thinks (Sales occurred)
                        // Deduct from oldest stock first (FEFO)
                        $toDeduct = abs($difference);
                        $entries = Inventory::where('inventory_location_id', $settlement->inventory_location_id)
                            ->where('product_id', $productId)
                            ->where('quantity', '>', 0)
                            ->orderBy('expiry_date', 'asc')
                            ->get();
                            
                        foreach ($entries as $entry) {
                            if ($toDeduct <= 0) break;
                            $deductFromThis = min($entry->quantity, $toDeduct);
                            $entry->quantity -= $deductFromThis;
                            $entry->save();
                            $toDeduct -= $deductFromThis;
                        }
                    } elseif ($difference > 0) {
                        // We have MORE stock than the DB thinks (Over-count or missing record)
                        // Adjust the latest entry or create one
                        $latestEntry = Inventory::where('inventory_location_id', $settlement->inventory_location_id)
                            ->where('product_id', $productId)
                            ->orderBy('expiry_date', 'desc')
                            ->first();

                        if ($latestEntry) {
                            $latestEntry->quantity += $difference;
                            $latestEntry->save();
                        } else {
                            // Rare case: No record at all, create a dummy one
                            Inventory::create([
                                'inventory_location_id' => $settlement->inventory_location_id,
                                'product_id' => $productId,
                                'quantity' => $difference,
                                'production_date' => now(),
                                'expiry_date' => now()->addDay(),
                            ]);
                        }
                    }
                }
            }

            return response()->json($settlement);
        });
    }
}
