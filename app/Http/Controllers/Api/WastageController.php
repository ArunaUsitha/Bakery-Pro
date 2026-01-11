<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wastage;
use App\Models\Inventory;
use App\Models\DailyReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WastageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Wastage::with(['product', 'location']);

        if ($request->has('date')) {
            $query->whereDate('wastage_date', $request->date);
        }

        if ($request->has('location_id')) {
            $query->where('inventory_location_id', $request->location_id);
        }

        $wastages = $query->orderByDesc('wastage_date')->paginate(20);
        return response()->json($wastages);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'inventory_location_id' => 'required|exists:inventory_locations,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        // Check available inventory
        $inventory = Inventory::where('product_id', $validated['product_id'])
            ->where('inventory_location_id', $validated['inventory_location_id'])
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date')
            ->first();

        if (!$inventory || $inventory->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Insufficient inventory for wastage record'], 400);
        }

        DB::transaction(function () use ($validated, $inventory) {
            // Calculate cost
            $cost = $inventory->product->production_cost * $validated['quantity'];

            // Create wastage record
            Wastage::create([
                'product_id' => $validated['product_id'],
                'inventory_location_id' => $validated['inventory_location_id'],
                'quantity' => $validated['quantity'],
                'cost' => $cost,
                'reason' => $validated['reason'] ?? 'expired',
                'wastage_date' => today(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Deduct from inventory
            $inventory->quantity -= $validated['quantity'];
            $inventory->save();
        });

        return response()->json(['message' => 'Wastage recorded successfully'], 201);
    }

    public function processExpiredDayFoods(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:inventory_locations,id',
        ]);

        // Find all expired day foods at the location (at 12pm)
        $expiredItems = Inventory::with('product')
            ->where('inventory_location_id', $validated['location_id'])
            ->where('quantity', '>', 0)
            ->whereHas('product', function ($q) {
                $q->where('category', 'day_food');
            })
            ->where('expiry_date', '<', today())
            ->get();

        $totalWastage = 0;
        $processedItems = [];

        DB::transaction(function () use ($expiredItems, $validated, &$totalWastage, &$processedItems) {
            foreach ($expiredItems as $inventory) {
                $cost = $inventory->product->production_cost * $inventory->quantity;

                Wastage::create([
                    'product_id' => $inventory->product_id,
                    'inventory_location_id' => $validated['location_id'],
                    'quantity' => $inventory->quantity,
                    'cost' => $cost,
                    'reason' => 'expired',
                    'wastage_date' => today(),
                    'notes' => 'Auto-processed at noon',
                ]);

                $processedItems[] = [
                    'product_name' => $inventory->product->name,
                    'quantity' => $inventory->quantity,
                    'cost' => $cost,
                ];

                $totalWastage += $cost;
                $inventory->quantity = 0;
                $inventory->save();
            }
        });

        return response()->json([
            'message' => 'Expired day foods processed',
            'total_wastage' => $totalWastage,
            'processed_items' => $processedItems,
        ]);
    }

    public function getShopInventorySnapshot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:inventory_locations,id',
        ]);

        $inventory = Inventory::with('product')
            ->where('inventory_location_id', $validated['location_id'])
            ->where('quantity', '>', 0)
            ->get()
            ->map(fn($inv) => [
                'product_id' => $inv->product_id,
                'product_name' => $inv->product->name,
                'category' => $inv->product->category,
                'quantity' => $inv->quantity,
                'production_date' => $inv->production_date->format('Y-m-d'),
                'expiry_date' => $inv->expiry_date->format('Y-m-d'),
                'value' => $inv->quantity * $inv->product->selling_price,
            ]);

        return response()->json([
            'snapshot_time' => now()->format('Y-m-d H:i:s'),
            'items' => $inventory,
            'total_value' => $inventory->sum('value'),
        ]);
    }
}
