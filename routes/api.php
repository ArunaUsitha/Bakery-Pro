<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\VehicleSettlementController;
use App\Http\Controllers\Api\WastageController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\BasePreparationController;
use App\Http\Controllers\Api\AuthController;

// Authentication (Public)
Route::post('login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('admin/stats', function () {
            return response()->json(['message' => 'Admin eyes only!']);
        });
        
        // Reports
        Route::get('reports/dashboard', [ReportController::class, 'getDashboardStats']);
        Route::post('reports/generate', [ReportController::class, 'generateDailyReport']);
        Route::apiResource('reports', ReportController::class)->only(['index', 'show']);
    });

    // Admin & Manager
    Route::middleware('role:admin|manager')->group(function () {
        Route::apiResource('products', ProductController::class);
        Route::apiResource('ingredients', IngredientController::class);
        
        // Ingredients extras
        Route::get('ingredients/categories', [IngredientController::class, 'categories']);
        Route::get('ingredients/low-stock', [IngredientController::class, 'lowStock']);
        Route::post('ingredients/{ingredient}/add-stock', [IngredientController::class, 'addStock']);
        Route::get('ingredients/{ingredient}/purchases', [IngredientController::class, 'purchaseHistory']);
        Route::post('ingredients/{ingredient}/adjust-stock', [IngredientController::class, 'adjustStock']);

        // Recipes & Base Preparations
        Route::apiResource('recipes', RecipeController::class);
        Route::post('recipes/{recipe}/ingredients', [RecipeController::class, 'addIngredient']);
        Route::put('recipes/{recipe}/ingredients/{recipeIngredient}', [RecipeController::class, 'updateIngredient']);
        Route::delete('recipes/{recipe}/ingredients/{recipeIngredient}', [RecipeController::class, 'removeIngredient']);
        Route::post('recipes/{recipe}/base-preparations', [RecipeController::class, 'addBasePreparation']);
        Route::delete('recipes/{recipe}/base-preparations/{recipeBasePreparation}', [RecipeController::class, 'removeBasePreparation']);
        Route::post('recipes/{recipe}/duplicate', [RecipeController::class, 'duplicate']);
        Route::post('recipes/{recipe}/recalculate', [RecipeController::class, 'recalculateCost']);

        Route::apiResource('base-preparations', BasePreparationController::class);
        Route::post('base-preparations/{basePreparation}/ingredients', [BasePreparationController::class, 'addIngredient']);
        Route::put('base-preparations/{basePreparation}/ingredients/{basePreparationIngredient}', [BasePreparationController::class, 'updateIngredient']);
        Route::delete('base-preparations/{basePreparation}/ingredients/{basePreparationIngredient}', [BasePreparationController::class, 'removeIngredient']);
        Route::post('base-preparations/{basePreparation}/recalculate', [BasePreparationController::class, 'recalculateCost']);
        
        // Advanced Inventory
        Route::post('inventory/locations', [InventoryController::class, 'createLocation']);
    });

    // General Staff (Sales, Production, Inventory)
    Route::apiResource('production', ProductionController::class)->except(['update', 'destroy']);
    Route::get('production/today', [ProductionController::class, 'getTodayBatch']);
    Route::post('production/{production}/items', [ProductionController::class, 'addItem']);
    Route::delete('production/{production}/items/{item}', [ProductionController::class, 'removeItem']);
    Route::post('production/{production}/complete', [ProductionController::class, 'complete']);

    Route::apiResource('sales', SalesController::class)->except(['update', 'destroy']);
    Route::get('sales/today', [SalesController::class, 'getTodaySale']);
    Route::post('sales/{sale}/items', [SalesController::class, 'addItem']);
    Route::post('sales/{sale}/collect-cash', [SalesController::class, 'recordCashCollection']);
    Route::post('sales/{sale}/close', [SalesController::class, 'close']);

    Route::get('inventory', [InventoryController::class, 'index']);
    Route::get('inventory/locations', [InventoryController::class, 'locations']);
    Route::get('inventory/locations/{location}', [InventoryController::class, 'getLocationInventory']);
    Route::post('inventory/transfer-from-production', [InventoryController::class, 'transferFromProduction']);
    Route::post('inventory/transfer', [InventoryController::class, 'transferBetweenLocations']);
    Route::get('inventory/transfers', [InventoryController::class, 'getTransfers']);

    Route::apiResource('settlements', VehicleSettlementController::class)->only(['index', 'show']);
    Route::post('settlements/initiate', [VehicleSettlementController::class, 'initiate']);
    Route::post('settlements/{settlement}/record-return', [VehicleSettlementController::class, 'recordReturn']);
    Route::post('settlements/{settlement}/settle', [VehicleSettlementController::class, 'settle']);

    Route::apiResource('wastage', WastageController::class)->only(['index', 'store']);
    Route::post('wastage/process-expired', [WastageController::class, 'processExpiredDayFoods']);
    Route::get('wastage/shop-snapshot', [WastageController::class, 'getShopInventorySnapshot']);
});
