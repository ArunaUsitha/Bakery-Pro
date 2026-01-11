<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionBatch;
use App\Models\ProductionItem;
use App\Models\Inventory;
use App\Models\InventoryLocation;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function index(): JsonResponse
    {
        $batches = ProductionBatch::with('items.product')
            ->orderByDesc('production_date')
            ->paginate(20);
        return response()->json($batches);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'production_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $batch = ProductionBatch::create([
            'production_date' => $validated['production_date'],
            'shift_start' => '05:00:00',
            'shift_end' => '12:00:00',
            'status' => 'in_progress',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($batch, 201);
    }

    public function show(ProductionBatch $production): JsonResponse
    {
        $production->load('items.product');
        return response()->json($production);
    }

    public function addItem(Request $request, ProductionBatch $production): JsonResponse
    {
        if ($production->isCompleted()) {
            return response()->json(['error' => 'Batch is already completed'], 400);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity_produced' => 'required|integer|min:1',
        ]);

        $item = $production->items()->create([
            'product_id' => $validated['product_id'],
            'quantity_produced' => $validated['quantity_produced'],
        ]);

        $item->load('product');
        return response()->json($item, 201);
    }

    public function complete(ProductionBatch $production): JsonResponse
    {
        if ($production->isCompleted()) {
            return response()->json(['error' => 'Batch is already completed'], 400);
        }

        DB::transaction(function () use ($production) {
            $production->update([
                'status' => 'completed',
            ]);

            // Update item completion times
            $production->items()->whereNull('completed_at')->update([
                'completed_at' => now()->format('H:i:s'),
            ]);
        });

        $production->load('items.product');
        return response()->json($production);
    }

    public function getTodayBatch(): JsonResponse
    {
        $batch = ProductionBatch::with('items.product')
            ->whereDate('production_date', today())
            ->first();

        if (!$batch) {
            $batch = ProductionBatch::create([
                'production_date' => today(),
                'shift_start' => '05:00:00',
                'shift_end' => '12:00:00',
                'status' => 'in_progress',
            ]);
        }

        $batch->load('items.product');
        return response()->json($batch);
    }

    public function removeItem(ProductionBatch $production, ProductionItem $item): JsonResponse
    {
        if ($production->isCompleted()) {
            return response()->json(['error' => 'Cannot modify completed batch'], 400);
        }

        if ($item->production_batch_id !== $production->id) {
            return response()->json(['error' => 'Item does not belong to this batch'], 400);
        }

        $item->delete();
        return response()->json(null, 204);
    }
}
