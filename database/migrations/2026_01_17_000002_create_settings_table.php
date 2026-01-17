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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json
            $table->string('group')->default('general'); // general, shift, business
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            ['key' => 'shift_start_time', 'value' => '05:00', 'type' => 'string', 'group' => 'shift', 'description' => 'Morning shift start time', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'shift_end_time', 'value' => '18:00', 'type' => 'string', 'group' => 'shift', 'description' => 'Evening shift end time', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'default_vehicle_float', 'value' => '2000', 'type' => 'integer', 'group' => 'business', 'description' => 'Default float cash for vehicles (LKR)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'currency_symbol', 'value' => 'LKR', 'type' => 'string', 'group' => 'general', 'description' => 'Currency symbol', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_name', 'value' => 'Bakery Pro', 'type' => 'string', 'group' => 'general', 'description' => 'Business name', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
