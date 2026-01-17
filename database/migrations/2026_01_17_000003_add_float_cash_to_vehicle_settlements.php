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
        Schema::table('vehicle_settlements', function (Blueprint $table) {
            $table->decimal('float_cash', 10, 2)->default(0)->after('expected_cash');
            $table->decimal('expected_from_stock', 10, 2)->default(0)->after('float_cash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_settlements', function (Blueprint $table) {
            $table->dropColumn(['float_cash', 'expected_from_stock']);
        });
    }
};
