<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Products/Foods table
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // 'day_food', 'packed_food'
            $table->decimal('production_cost', 10, 2);
            $table->decimal('shop_price', 10, 2); // discounted price for shop
            $table->decimal('selling_price', 10, 2); // final selling price to customers
            $table->integer('shelf_life_days')->default(1); // 1 for day foods, 3-4 for packed
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Production batches - created during shift (5am - 12pm)
        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->date('production_date');
            $table->time('shift_start')->default('05:00:00');
            $table->time('shift_end')->default('12:00:00');
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Production items - individual items in a batch
        Schema::create('production_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity_produced');
            $table->time('completed_at')->nullable();
            $table->timestamps();
        });

        // Inventory locations
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 'shop', 'vehicle_1', 'vehicle_2', etc.
            $table->enum('type', ['shop', 'vehicle']);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Inventory - tracking stock at each location
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_location_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->date('production_date'); // to track freshness
            $table->date('expiry_date');
            $table->timestamps();
        });

        // Stock transfers
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('from_location_id')->nullable()->constrained('inventory_locations')->onDelete('cascade');
            $table->foreignId('to_location_id')->constrained('inventory_locations')->onDelete('cascade');
            $table->integer('quantity');
            $table->enum('transfer_type', ['production_to_location', 'vehicle_to_shop', 'shop_to_vehicle']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Sales transactions
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_location_id')->constrained()->onDelete('cascade');
            $table->date('sale_date');
            $table->decimal('total_amount', 12, 2);
            $table->decimal('expected_amount', 12, 2); // calculated from sold items
            $table->decimal('actual_amount', 12, 2)->nullable(); // money collected
            $table->decimal('discrepancy', 12, 2)->nullable(); // difference (loss/gain)
            $table->enum('status', ['open', 'pending_verification', 'verified', 'closed'])->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Sale items
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 12, 2);
            $table->timestamps();
        });

        // Daily reports - summary for each day
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date')->unique();
            $table->decimal('total_production_cost', 12, 2)->default(0);
            $table->decimal('total_shop_sales', 12, 2)->default(0);
            $table->decimal('total_vehicle_sales', 12, 2)->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->decimal('total_wastage_cost', 12, 2)->default(0);
            $table->decimal('total_discrepancy', 12, 2)->default(0);
            $table->decimal('net_profit', 12, 2)->default(0);
            $table->json('shop_inventory_at_noon')->nullable(); // 12pm snapshot
            $table->json('end_of_day_summary')->nullable();
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->timestamps();
        });

        // Wastage tracking - for expired day foods
        Schema::create('wastages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_location_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('cost', 12, 2);
            $table->string('reason')->default('expired');
            $table->date('wastage_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Vehicle settlement - end of day verification
        Schema::create('vehicle_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_location_id')->constrained()->onDelete('cascade');
            $table->date('settlement_date');
            $table->json('items_sent')->nullable(); // items sent out in morning
            $table->json('items_returned')->nullable(); // items returned to shop
            $table->json('items_sold')->nullable(); // calculated sold items
            $table->decimal('expected_cash', 12, 2);
            $table->decimal('actual_cash', 12, 2)->nullable();
            $table->decimal('discrepancy', 12, 2)->nullable();
            $table->enum('status', ['pending', 'settled', 'disputed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_settlements');
        Schema::dropIfExists('wastages');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('inventory_locations');
        Schema::dropIfExists('production_items');
        Schema::dropIfExists('production_batches');
        Schema::dropIfExists('products');
    }
};
