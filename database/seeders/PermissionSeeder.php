<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view_dashboard',
            'manage_production',
            'manage_inventory',
            'manage_sales',
            'manage_settlements',
            'manage_wastage',
            'manage_products',
            'manage_ingredients',
            'manage_recipes',
            'manage_base_preparations',
            'manage_reports',
            'manage_users',
            'manage_settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions($permissions); // Admin gets everything
        }

        $supervisor = Role::where('name', 'supervisor')->first();
        if ($supervisor) {
            $supervisor->syncPermissions([
                'view_dashboard',
                'manage_production',
                'manage_inventory',
                'manage_products',
                'manage_ingredients',
                'manage_recipes',
                'manage_base_preparations',
                'manage_reports',
            ]);
        }

        $rider = Role::where('name', 'delivery_rider')->first();
        if ($rider) {
            $rider->syncPermissions([
                'view_dashboard',
                'manage_sales',
                'manage_settlements',
            ]);
        }
    }
}
