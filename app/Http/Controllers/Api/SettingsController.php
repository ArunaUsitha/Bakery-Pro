<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\InventoryLocation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SettingsController extends Controller
{
    /**
     * Get all settings organized by group
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group');
        return response()->json($settings);
    }

    /**
     * Update a setting
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->firstOrFail();
        
        $validated = $request->validate([
            'value' => 'required',
        ]);

        $setting->value = $validated['value'];
        $setting->save();

        return response()->json($setting);
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::setValue($key, $value);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    // ==================== Vehicle Management ====================

    /**
     * Get all vehicles (for admin)
     */
    public function getVehicles(): JsonResponse
    {
        $vehicles = InventoryLocation::where('type', 'vehicle')
            ->withTrashed()
            ->get();
        return response()->json($vehicles);
    }

    /**
     * Create a new vehicle
     */
    public function createVehicle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:inventory_locations,name',
            'description' => 'nullable|string',
            'float_cash' => 'nullable|numeric|min:0',
        ]);

        $vehicle = InventoryLocation::create([
            'name' => $validated['name'],
            'type' => 'vehicle',
            'description' => $validated['description'] ?? null,
            'is_active' => true,
            'float_cash' => $validated['float_cash'] ?? Setting::getValue('default_vehicle_float', 2000),
        ]);

        return response()->json($vehicle, 201);
    }

    /**
     * Update a vehicle
     */
    public function updateVehicle(Request $request, $id): JsonResponse
    {
        $vehicle = InventoryLocation::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:inventory_locations,name,' . $id,
            'description' => 'nullable|string',
            'float_cash' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $vehicle->update($validated);

        return response()->json($vehicle);
    }

    /**
     * Soft delete a vehicle
     */
    public function deleteVehicle($id): JsonResponse
    {
        $vehicle = InventoryLocation::findOrFail($id);
        $vehicle->delete(); // Soft delete

        return response()->json(['message' => 'Vehicle deactivated successfully']);
    }

    /**
     * Restore a soft-deleted vehicle
     */
    public function restoreVehicle($id): JsonResponse
    {
        $vehicle = InventoryLocation::withTrashed()->findOrFail($id);
        $vehicle->restore();

        return response()->json($vehicle);
    }

    // ==================== User Management ====================

    /**
     * Get all users with roles
     */
    public function getUsers(): JsonResponse
    {
        $users = User::with('roles')->get();
        return response()->json($users);
    }

    /**
     * Get all roles
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::all();
        return response()->json($roles);
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['role']);
        $user->load('roles');

        return response()->json($user, 201);
    }

    /**
     * Update a user
     */
    public function updateUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $id,
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|string|exists:roles,name',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $role = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($role) {
            $user->syncRoles([$role]);
        }

        $user->load('roles');

        return response()->json($user);
    }

    /**
     * Delete a user
     */
    public function deleteUser($id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting the last admin
        if ($user->hasRole('admin')) {
            $adminCount = User::role('admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['error' => 'Cannot delete the last admin user'], 400);
            }
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    // ==================== Role & Permission Management ====================

    /**
     * Get all permissions
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = \Spatie\Permission\Models\Permission::all();
        return response()->json($permissions);
    }

    /**
     * Get permissions for a specific role
     */
    public function getRolePermissions($id): JsonResponse
    {
        $role = Role::findOrFail($id);
        return response()->json($role->permissions->pluck('name'));
    }

    /**
     * Create a new role
     */
    public function createRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        return response()->json($role, 201);
    }

    /**
     * Update a role
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
        ]);

        $role->update($validated);

        return response()->json($role);
    }

    /**
     * Delete a role
     */
    public function deleteRole($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, ['admin', 'supervisor', 'delivery_rider'])) {
            return response()->json(['error' => 'Cannot delete system-defined roles'], 400);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Sync permissions for a role
     */
    public function syncRolePermissions(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions']);

        return response()->json(['message' => 'Permissions updated successfully']);
    }
}
