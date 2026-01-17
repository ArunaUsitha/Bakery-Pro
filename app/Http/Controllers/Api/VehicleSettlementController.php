<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VehicleSettlement;
use App\Models\Inventory;
use App\Models\InventoryLocation;
use App\Models\StockTransfer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VehicleSettlementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VehicleSettlement::with('location');

        if ($request->has('vehicle_id')) {
            $query->where('inventory_location_id', $request->vehicle_id);
        }

        if ($request->has('date')) {
            $query->whereDate('settlement_date', $request->date);
        }

        $settlements = $query->orderByDesc('settlement_date')->paginate(20);
        return response()->json($settlements);
    }

    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:inventory_locations,id',
        ]);

        $vehicle = InventoryLocation::findOrFail($validated['vehicle_id']);

        if (!$vehicle->isVehicle()) {
            return response()->json(['error' => 'Selected location is not a vehicle'], 400);
        }

        // Check for existing pending settlement for this vehicle today
        $existingSettlement = VehicleSettlement::where('inventory_location_id', $vehicle->id)
            ->whereDate('settlement_date', today())
            ->where('status', 'pending')
            ->first();

        if ($existingSettlement) {
            // Recalculate items_returned with fresh data
            $currentInventory = Inventory::where('inventory_location_id', $vehicle->id)
                ->where('quantity', '>', 0)
                ->with('product')
                ->get()
                ->mapWithKeys(fn($inv) => [$inv->product_id => $inv]);

            $itemsSent = StockTransfer::where('to_location_id', $vehicle->id)
                ->whereDate('created_at', today())
                ->whereIn('transfer_type', ['production_to_location', 'shop_to_vehicle'])
                ->with('product')
                ->get()
                ->groupBy('product_id')
                ->map(function($transfers) {
                    $product = $transfers->first()->product;
                    return [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $transfers->sum('quantity'),
                        'selling_price' => $product->selling_price,
                    ];
                })
                ->values();

            // Build map of previous return counts to preserve them
            $previousReturnsMap = collect($existingSettlement->items_returned)->mapWithKeys(fn($item) => [$item['product_id'] => $item['quantity_returned']]);

            $itemsReturned = $itemsSent->map(function ($sentItem) use ($currentInventory, $previousReturnsMap) {
                // If we already had a return count for this item, keep it. 
                // Otherwise, default to current stock on vehicle.
                if ($previousReturnsMap->has($sentItem['product_id'])) {
                    $qtyReturned = $previousReturnsMap[$sentItem['product_id']];
                } else {
                    $qtyReturned = $currentInventory->has($sentItem['product_id']) 
                        ? $currentInventory[$sentItem['product_id']]->quantity 
                        : 0;
                }
                
                // Always fetch the latest price
                $product = \App\Models\Product::find($sentItem['product_id']);
                $price = $product ? $product->selling_price : 0;

                return [
                    'product_id' => $sentItem['product_id'],
                    'product_name' => $sentItem['product_name'],
                    'quantity_sent' => $sentItem['quantity'],
                    'quantity_returned' => $qtyReturned,
                    'selling_price' => $price,
                ];
            });

            // Recalculate expected amounts based on fresh data
            $expectedFromSales = $itemsReturned->sum(function ($item) {
                $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
                return $soldQty * ($item['selling_price'] ?? 0);
            });

            $expectedFromStock = $itemsReturned->sum(function ($item) {
                return ($item['quantity_returned'] ?? 0) * ($item['selling_price'] ?? 0);
            });

            $floatCash = $existingSettlement->float_cash ?? 0;
            $expectedCash = $expectedFromSales + $floatCash;



            // Create the calculated items sold list for the header/UI
            $itemsSoldCalculated = $itemsReturned->map(function ($item) {
                $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
                return [
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $soldQty,
                    'total_price' => $soldQty * ($item['selling_price'] ?? 0),
                ];
            })->filter(fn($item) => $item['quantity'] > 0)->values();

            // Update settlement with fresh data
            $existingSettlement->update([
                'items_sent' => $itemsSent,
                'items_returned' => $itemsReturned,
                'items_sold' => $itemsSoldCalculated,
                'expected_from_stock' => $expectedFromStock,
                'expected_cash' => $expectedCash,
            ]);

            \Log::info("Existing settlement refreshed. ID: {$existingSettlement->id}, Expected: {$expectedCash}");


            $existingSettlement->load('location');
            return response()->json($existingSettlement, 200);
        }


        // Get items currently on vehicle
        $currentInventory = Inventory::where('inventory_location_id', $vehicle->id)
            ->where('quantity', '>', 0)
            ->with('product')
            ->get()
            ->mapWithKeys(fn($inv) => [$inv->product_id => $inv]);

        // Get items sent out today (including shop to vehicle)
        $itemsSent = StockTransfer::where('to_location_id', $vehicle->id)
            ->whereDate('created_at', today())
            ->whereIn('transfer_type', ['production_to_location', 'shop_to_vehicle'])
            ->with('product')
            ->get()
            ->groupBy('product_id')
            ->map(function($transfers) {
                $product = $transfers->first()->product;

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $transfers->sum('quantity'),
                    'selling_price' => $product->selling_price,
                ];
            })
            ->values();

        // Build items_returned from itemsSent with current inventory for default returned values
        $itemsReturned = $itemsSent->map(function ($sentItem) use ($currentInventory) {
            $currentQty = $currentInventory->has($sentItem['product_id']) 
                ? $currentInventory[$sentItem['product_id']]->quantity 
                : 0;
            
            // Always fetch latest price
            $product = \App\Models\Product::find($sentItem['product_id']);
            $price = $product ? $product->selling_price : 0;

            return [
                'product_id' => $sentItem['product_id'],
                'product_name' => $sentItem['product_name'],
                'quantity_sent' => $sentItem['quantity'],
                'quantity_returned' => $currentQty, // Default to current stock
                'selling_price' => $price,
            ];
        });

        // Get today's sales from vehicle
        $sale = Sale::with('items.product')
            ->where('inventory_location_id', $vehicle->id)
            ->whereDate('sale_date', today())
            ->first();

        $itemsSold = $sale ? $sale->items->map(fn($item) => [
            'product_id' => $item->product_id,
            'product_name' => $item->product->name,
            'quantity' => $item->quantity,
            'total_price' => $item->total_price,
        ]) : collect();

        // Calculate expected cash from sales (items sent minus items currently on vehicle)
        $expectedFromSales = $itemsReturned->sum(function ($item) {
            $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
            return $soldQty * ($item['selling_price'] ?? 0);
        });
        
        // Calculate expected value of stocked items (what should be physically on vehicle)
        $expectedFromStock = $itemsReturned->sum(function ($item) {
            return ($item['quantity_returned'] ?? 0) * ($item['selling_price'] ?? 0);
        });

        // Get vehicle's float cash (starting cash)
        $floatCash = $vehicle->float_cash ?? 0;

        // Total expected = (Sent - Returned) value + float cash
        $expectedCash = $expectedFromSales + $floatCash;

        // Create the calculated items sold list
        $itemsSoldCalculated = $itemsReturned->map(function ($item) {
            $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
            return [
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'quantity' => $soldQty,
                'total_price' => $soldQty * ($item['selling_price'] ?? 0),
            ];
        })->filter(fn($item) => $item['quantity'] > 0)->values();

        $settlement = VehicleSettlement::create([
            'inventory_location_id' => $vehicle->id,
            'settlement_date' => today(),
            'items_sent' => $itemsSent,
            'items_returned' => $itemsReturned,
            'items_sold' => $itemsSoldCalculated, // Use calculated instead of recorded
            'float_cash' => $floatCash,
            'expected_from_stock' => $expectedFromStock,
            'expected_cash' => $expectedCash,
            'status' => 'pending',
        ]);


        $settlement->load('location');
        return response()->json($settlement, 201);
    }


    public function recordReturn(Request $request, $settlementId): JsonResponse
    {
        $settlement = VehicleSettlement::findOrFail($settlementId);
        
        if ($settlement->status === 'settled') {
            return response()->json(['error' => 'Settlement already completed'], 400);
        }

        $validated = $request->validate([
            'items_returned' => 'required|array',
            'items_returned.*.product_id' => 'required|exists:products,id',
            'items_returned.*.product_name' => 'required|string',
            'items_returned.*.quantity_sent' => 'required|integer|min:0',
            'items_returned.*.quantity_returned' => 'required|integer|min:0',
        ]);

        // Recalculate expected amounts based on new return counts
        $itemsReturned = collect($validated['items_returned'])->map(function($item) {
            // Fetch latest price to be safe
            $product = \App\Models\Product::find($item['product_id']);
            $item['selling_price'] = $product ? $product->selling_price : 0;
            return $item;
        });
        
        $expectedFromSales = $itemsReturned->sum(function ($item) {
            $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
            return $soldQty * ($item['selling_price'] ?? 0);
        });

        $expectedFromStock = $itemsReturned->sum(function ($item) {
            return ($item['quantity_returned'] ?? 0) * ($item['selling_price'] ?? 0);
        });

        $floatCash = $settlement->float_cash ?? 0;
        $expectedCash = $expectedFromSales + $floatCash;

        // Update items_sold based on actual differences
        $itemsSold = $itemsReturned->map(function ($item) {
            $soldQty = max(0, $item['quantity_sent'] - $item['quantity_returned']);
            return [
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'quantity' => $soldQty,
                'total_price' => $soldQty * ($item['selling_price'] ?? 0),
            ];
        })->filter(fn($item) => $item['quantity'] > 0)->values();

        $settlement->update([
            'items_returned' => $itemsReturned->toArray(),
            'items_sold' => $itemsSold->toArray(),
            'expected_from_stock' => (float)$expectedFromStock,
            'expected_cash' => (float)$expectedCash,
        ]);

        \Log::info("Return recorded for settlement {$settlement->id}. Expected now: {$settlement->expected_cash}");

        return response()->json($settlement);
    }


    public function settle(Request $request, $settlementId): JsonResponse
    {
        $settlement = VehicleSettlement::findOrFail($settlementId);
        
        if ($settlement->status === 'settled') {
            return response()->json(['error' => 'Settlement already completed'], 400);
        }

        $validated = $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($settlement, $validated) {
            $settlement->actual_cash = $validated['actual_cash'];
            $settlement->discrepancy = $validated['actual_cash'] - $settlement->expected_cash;
            $settlement->notes = $validated['notes'] ?? null;
            $settlement->status = 'settled';
            $settlement->save();

            // Transfer remaining items back to shop
            $shop = InventoryLocation::where('type', 'shop')->first();
            if ($shop && $settlement->items_returned) {
                foreach ($settlement->items_returned as $item) {
                    $productId = $item['product_id'];
                    $qtyReturned = $item['quantity_returned'] ?? $item['quantity'] ?? 0;
                    
                    if ($qtyReturned > 0) {
                        // 1. Move returned items from vehicle to shop
                        $remainingToTransfer = $qtyReturned;
                        $vehicleEntries = Inventory::where('product_id', $productId)
                            ->where('inventory_location_id', $settlement->inventory_location_id)
                            ->where('quantity', '>', 0)
                            ->orderBy('expiry_date', 'asc')
                            ->get();

                        foreach ($vehicleEntries as $entry) {
                            if ($remainingToTransfer <= 0) break;
                            
                            $transferQty = min($entry->quantity, $remainingToTransfer);
                            $entry->quantity -= $transferQty;
                            $entry->save();

                            // Add to shop
                            $shopInventory = Inventory::firstOrNew([
                                'product_id' => $productId,
                                'inventory_location_id' => $shop->id,
                                'production_date' => $entry->production_date,
                                'expiry_date' => $entry->expiry_date,
                            ], ['quantity' => 0]);

                            $shopInventory->quantity += $transferQty;
                            $shopInventory->save();

                            // Record transfer
                            StockTransfer::create([
                                'product_id' => $productId,
                                'from_location_id' => $settlement->inventory_location_id,
                                'to_location_id' => $shop->id,
                                'quantity' => $transferQty,
                                'transfer_type' => 'vehicle_to_shop',
                            ]);

                            $remainingToTransfer -= $transferQty;
                        }
                    }

                    // 2. CLEAR REMAINING STOCK ON VEHICLE (These are the items sold)
                    // After transfer, any remaining inventory for this product on this vehicle should be 0
                    Inventory::where('product_id', $productId)
                        ->where('inventory_location_id', $settlement->inventory_location_id)
                        ->update(['quantity' => 0]);
                }
            }
        });

        return response()->json($settlement);
    }

    public function show($settlementId): JsonResponse
    {
        $settlement = VehicleSettlement::findOrFail($settlementId);
        $settlement->load('location');
        return response()->json($settlement);
    }
}
