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
            $existingSettlement->load('location');
            return response()->json($existingSettlement, 200);
        }

        // Get items currently on vehicle
        $currentInventory = Inventory::where('inventory_location_id', $vehicle->id)
            ->where('quantity', '>', 0)
            ->with('product')
            ->get()
            ->map(fn($inv) => [
                'product_id' => $inv->product_id,
                'product_name' => $inv->product->name,
                'quantity_sent' => $inv->quantity,
                'quantity_returned' => $inv->quantity, // Default to same as sent
                'selling_price' => $inv->product->selling_price,
            ]);

        // Get items sent out today
        $itemsSent = StockTransfer::where('to_location_id', $vehicle->id)
            ->whereDate('created_at', today())
            ->where('transfer_type', 'production_to_location')
            ->with('product')
            ->get()
            ->groupBy('product_id')
            ->map(fn($transfers) => [
                'product_id' => $transfers->first()->product_id,
                'product_name' => $transfers->first()->product->name,
                'quantity' => $transfers->sum('quantity'),
            ])
            ->values();

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

        // Calculate expected cash from sales
        $expectedFromSales = $sale ? $sale->total_amount : 0;
        
        // Calculate expected cash from stocked items (current inventory value at selling price)
        $expectedFromStock = $currentInventory->sum(function ($item) {
            return ($item['quantity_sent'] ?? 0) * ($item['selling_price'] ?? 0);
        });

        // Get vehicle's float cash (starting cash)
        $floatCash = $vehicle->float_cash ?? 0;

        // Total expected = sales + float cash (stock items are returned, not sold)
        $expectedCash = $expectedFromSales + $floatCash;

        $settlement = VehicleSettlement::create([
            'inventory_location_id' => $vehicle->id,
            'settlement_date' => today(),
            'items_sent' => $itemsSent,
            'items_returned' => $currentInventory,
            'items_sold' => $itemsSold,
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

        $settlement->items_returned = $validated['items_returned'];
        $settlement->save();

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
                    $qtyReturned = $item['quantity_returned'] ?? $item['quantity'] ?? 0;
                    if ($qtyReturned > 0) {
                        // Deduct from vehicle
                        $vehicleInventory = Inventory::where('product_id', $item['product_id'])
                            ->where('inventory_location_id', $settlement->inventory_location_id)
                            ->where('quantity', '>', 0)
                            ->first();

                        if ($vehicleInventory) {
                            $transferQty = min($vehicleInventory->quantity, $qtyReturned);
                            $vehicleInventory->quantity -= $transferQty;
                            $vehicleInventory->save();

                            // Add to shop
                            $shopInventory = Inventory::firstOrNew([
                                'product_id' => $item['product_id'],
                                'inventory_location_id' => $shop->id,
                                'production_date' => $vehicleInventory->production_date,
                                'expiry_date' => $vehicleInventory->expiry_date,
                            ], ['quantity' => 0]);

                            $shopInventory->quantity += $transferQty;
                            $shopInventory->save();

                            // Record transfer
                            StockTransfer::create([
                                'product_id' => $item['product_id'],
                                'from_location_id' => $settlement->inventory_location_id,
                                'to_location_id' => $shop->id,
                                'quantity' => $transferQty,
                                'transfer_type' => 'vehicle_to_shop',
                            ]);
                        }
                    }
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
