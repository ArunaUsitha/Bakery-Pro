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
        Schema::create('shop_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_location_id')->constrained()->onDelete('cascade');
            $table->date('settlement_date');
            
            // JSON fields for itemized tracking
            $table->json('opening_inventory')->nullable();
            $table->json('production_received')->nullable();
            $table->json('transfers_in')->nullable();
            $table->json('transfers_out')->nullable();
            $table->json('wastage_recorded')->nullable();
            $table->json('items_counted')->nullable(); // Final physical count
            $table->json('items_sold')->nullable();    // Calculated sales
            
            // Financials
            $table->decimal('expected_cash', 12, 2)->default(0);
            $table->decimal('actual_cash', 12, 2)->default(0);
            $table->decimal('discrepancy', 12, 2)->default(0);
            
            $table->string('status')->default('pending'); // pending, settled
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Unique settlement per location per day
            $table->unique(['inventory_location_id', 'settlement_date'], 'unique_shop_settlement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_settlements');
    }
};
