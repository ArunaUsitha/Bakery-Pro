<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\ProductionBatch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::with(['product', 'location']);

        if ($request->has('location_id')) {
            $query->where('inventory_location_id', $request->location_id);
        }

        if ($request->has('date')) {
            $query->whereDate('production_date', $request->date);
        }

        $inventory = $query->where('quantity', '>', 0)->get();
        return response()->json($inventory);
    }

    public function locations(): JsonResponse
    {
        $locations = InventoryLocation::where('is_active', true)->get();
        return response()->json($locations);
    }

    public function createLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:shop,vehicle',
            'description' => 'nullable|string',
        ]);

        $location = InventoryLocation::create($validated);
        return response()->json($location, 201);
    }

    public function transferFromProduction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.location_id' => 'required|exists:inventory_locations,id',
        ]);



        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $productionDate = today();
                $expiryDate = today()->addDays($product->shelf_life_days ?? 1);

                // Find existing inventory or create new
                $inventory = Inventory::firstOrNew([
                    'product_id' => $item['product_id'],
                    'inventory_location_id' => $item['location_id'],
                    'production_date' => $productionDate,
                    'expiry_date' => $expiryDate,
                ], ['quantity' => 0]);

                $inventory->quantity += $item['quantity'];
                $inventory->save();


                // Record transfer
                StockTransfer::create([
                    'product_id' => $item['product_id'],
                    'from_location_id' => null,
                    'to_location_id' => $item['location_id'],
                    'quantity' => $item['quantity'],
                    'transfer_type' => 'production_to_location',
                ]);
            }
        });

        return response()->json(['message' => 'Transfer completed successfully']);
    }

    public function transferBetweenLocations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_location_id' => 'required|exists:inventory_locations,id',
            'to_location_id' => 'required|exists:inventory_locations,id|different:from_location_id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'transfer_type' => 'required|in:vehicle_to_shop,shop_to_vehicle',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $item) {
                // Deduct from source
                $sourceInventory = Inventory::where('product_id', $item['product_id'])
                    ->where('inventory_location_id', $validated['from_location_id'])
                    ->where('quantity', '>', 0)
                    ->orderBy('expiry_date')
                    ->first();

                if (!$sourceInventory || $sourceInventory->quantity < $item['quantity']) {
                    throw new \Exception("Insufficient inventory for product {$item['product_id']}");
                }

                $sourceInventory->quantity -= $item['quantity'];
                $sourceInventory->save();

                // Add to destination
                $destInventory = Inventory::firstOrNew([
                    'product_id' => $item['product_id'],
                    'inventory_location_id' => $validated['to_location_id'],
                    'production_date' => $sourceInventory->production_date,
                    'expiry_date' => $sourceInventory->expiry_date,
                ], ['quantity' => 0]);

                $destInventory->quantity += $item['quantity'];
                $destInventory->save();

                // Record transfer
                StockTransfer::create([
                    'product_id' => $item['product_id'],
                    'from_location_id' => $validated['from_location_id'],
                    'to_location_id' => $validated['to_location_id'],
                    'quantity' => $item['quantity'],
                    'transfer_type' => $validated['transfer_type'],
                ]);
            }
        });

        return response()->json(['message' => 'Transfer completed successfully']);
    }

    public function getLocationInventory($locationId): JsonResponse
    {
        // Try to find location with soft deletes included
        $location = InventoryLocation::withTrashed()->find($locationId);

        if (!$location) {
            return response()->json(['error' => 'Location not found'], 404);
        }


        $inventory = Inventory::with('product')
            ->where('inventory_location_id', $location->id)
            ->where('quantity', '>', 0)
            ->get();


        return response()->json($inventory);
    }

    public function getTransfers(Request $request): JsonResponse
    {
        $query = StockTransfer::with(['product', 'fromLocation', 'toLocation']);

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->has('type')) {
            $query->where('transfer_type', $request->type);
        }

        $transfers = $query->orderByDesc('created_at')->paginate(50);
        return response()->json($transfers);
    }
}
