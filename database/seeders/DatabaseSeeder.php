<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\InventoryLocation;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create inventory locations
        InventoryLocation::create([
            'name' => 'Main Shop',
            'type' => 'shop',
            'description' => 'Main bakery shop',
            'is_active' => true,
        ]);

        InventoryLocation::create([
            'name' => 'Delivery Vehicle 1',
            'type' => 'vehicle',
            'description' => 'Primary delivery vehicle',
            'is_active' => true,
        ]);

        InventoryLocation::create([
            'name' => 'Delivery Vehicle 2',
            'type' => 'vehicle',
            'description' => 'Secondary delivery vehicle',
            'is_active' => true,
        ]);

        // Products from Recipe Cost Calculator Excel sheet
        // Day Foods - 1 day shelf life
        $dayFoods = [
            // name, production_cost, shop_price (wholesale), selling_price (retail)
            ['name' => 'Bread', 'production_cost' => 33.98, 'shop_price' => 80, 'selling_price' => 130],
            ['name' => 'Sandwich Bread', 'production_cost' => 45, 'shop_price' => 90, 'selling_price' => 120],
            ['name' => 'Fish Bun', 'production_cost' => 13.97, 'shop_price' => 40, 'selling_price' => 50],
            ['name' => 'Wiyan Roll', 'production_cost' => 16.44, 'shop_price' => 30, 'selling_price' => 40],
            ['name' => 'Jam Bun', 'production_cost' => 16.01, 'shop_price' => 30, 'selling_price' => 40],
            ['name' => 'Roast Bread', 'production_cost' => 10.34, 'shop_price' => 25, 'selling_price' => 35],
            ['name' => 'Pizza', 'production_cost' => 27.46, 'shop_price' => 50, 'selling_price' => 70],
            ['name' => 'Sausages Bun', 'production_cost' => 25.00, 'shop_price' => 45, 'selling_price' => 60],
            ['name' => 'T-Bun', 'production_cost' => 31.70, 'shop_price' => 40, 'selling_price' => 50],
            ['name' => 'Cream Bun', 'production_cost' => 17.61, 'shop_price' => 45, 'selling_price' => 55],
            ['name' => 'Wandu', 'production_cost' => 23.79, 'shop_price' => 35, 'selling_price' => 50],
            ['name' => 'Cup Cake', 'production_cost' => 25.63, 'shop_price' => 45, 'selling_price' => 60],
            ['name' => 'Burger Bun', 'production_cost' => 15.00, 'shop_price' => 30, 'selling_price' => 40],
        ];

        foreach ($dayFoods as $food) {
            Product::create([
                'name' => $food['name'],
                'category' => 'day_food',
                'production_cost' => $food['production_cost'],
                'shop_price' => $food['shop_price'],
                'selling_price' => $food['selling_price'],
                'shelf_life_days' => 1,
                'description' => 'Fresh baked daily',
                'is_active' => true,
            ]);
        }

        // Packed Foods - longer shelf life
        $packedFoods = [
            ['name' => 'Wafers Cake', 'production_cost' => 26.71, 'shop_price' => 50, 'selling_price' => 65, 'shelf_life' => 7],
            ['name' => 'Butter Biscuit', 'production_cost' => 35.00, 'shop_price' => 60, 'selling_price' => 80, 'shelf_life' => 7],
            ['name' => 'Pieces Packet', 'production_cost' => 40.00, 'shop_price' => 70, 'selling_price' => 90, 'shelf_life' => 5],
        ];

        foreach ($packedFoods as $food) {
            Product::create([
                'name' => $food['name'],
                'category' => 'packed_food',
                'production_cost' => $food['production_cost'],
                'shop_price' => $food['shop_price'],
                'selling_price' => $food['selling_price'],
                'shelf_life_days' => $food['shelf_life'],
                'description' => 'Packed for extended freshness',
                'is_active' => true,
            ]);
        }

        // Resale Items - not produced, just for resale
        Product::create([
            'name' => 'Bread (For Resale)',
            'category' => 'packed_food',
            'production_cost' => 75.50, // Purchase cost
            'shop_price' => 100,
            'selling_price' => 110,
            'shelf_life_days' => 2,
            'description' => 'Purchased from supplier for resale',
            'is_active' => true,
        ]);

        // Run recipe seeder
        $this->call(RecipeSeeder::class);
    }
}
