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
        // Insert default branding settings
        DB::table('settings')->insert([
            ['key' => 'business_address', 'value' => '123 Bakery Street, Colombo, Sri Lanka', 'type' => 'string', 'group' => 'branding', 'description' => 'Business Address', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_phone', 'value' => '+94 11 234 5678', 'type' => 'string', 'group' => 'branding', 'description' => 'Business Phone Number', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_email', 'value' => 'contact@bakerypro.com', 'type' => 'string', 'group' => 'branding', 'description' => 'Business Email', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_website', 'value' => 'www.bakerypro.com', 'type' => 'string', 'group' => 'branding', 'description' => 'Business Website', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_logo', 'value' => null, 'type' => 'string', 'group' => 'branding', 'description' => 'Business Logo URL/Path', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_tagline', 'value' => 'Premium Quality Bakery Products', 'type' => 'string', 'group' => 'branding', 'description' => 'Business Tagline', 'created_at' => now(), 'updated_at' => now()],
        ]);
        
        // Update existing business_name group to branding
        DB::table('settings')->where('key', 'business_name')->update(['group' => 'branding']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->where('group', 'branding')->delete();
        // Reset business_name group
        DB::table('settings')->where('key', 'business_name')->update(['group' => 'general']);
    }
};
