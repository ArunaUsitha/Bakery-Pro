import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    ChevronRight,
    Truck,
    Users,
    Clock,
    Save,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Loader2,
    DollarSign,
    ShieldCheck,
    Lock,
    Palette,
    Layout
} from 'lucide-react';
import {
    getSettings,
    updateSetting,
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    restoreVehicle,
    getUsers,
    getRoles,
    createUser,
    updateUser,
    deleteUser,
    getPermissions,
    getRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    syncRolePermissions,
    bulkUpdateSettings
} from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import Button from "../theme/tailadmin/components/ui/button/Button";
import Modal from "../theme/tailadmin/components/ui/modal/Modal";
import Label from "../theme/tailadmin/components/form/Label";
import Input from "../theme/tailadmin/components/form/input/InputField";
import Badge from "../theme/tailadmin/components/ui/badge/Badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../theme/tailadmin/components/ui/table";

const TABS = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
];

function Settings() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});
    const [vehicles, setVehicles] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: '' });
    const [selectedRole, setSelectedRole] = useState(null);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [savingPermissions, setSavingPermissions] = useState(false);
    const [brandingForm, setBrandingForm] = useState({});
    const [savingBranding, setSavingBranding] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [vehicleForm, setVehicleForm] = useState({ name: '', description: '', float_cash: 2000 });
    const [userForm, setUserForm] = useState({ name: '', username: '', email: '', password: '', role: 'delivery_rider' });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, vehiclesRes, usersRes, rolesRes, permissionsRes] = await Promise.all([
                getSettings(),
                getVehicles(),
                getUsers(),
                getRoles(),
                getPermissions()
            ]);
            setSettings(settingsRes.data);
            setVehicles(vehiclesRes.data || []);
            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
            setPermissions(permissionsRes.data || []);

            // Initialize branding form
            const brandingObj = {};
            (settingsRes.data.branding || []).forEach(s => {
                brandingObj[s.key] = s.value || '';
            });
            setBrandingForm(brandingObj);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (key, value) => {
        try {
            await updateSetting(key, value);
            toast.success('Setting updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update setting');
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setValidationErrors({});
    };

    const renderError = (field) => {
        if (!validationErrors[field]) return null;
        return (
            <p className="mt-1 text-xs text-red-500">
                {validationErrors[field][0]}
            </p>
        );
    };

    // Vehicle handlers
    const openVehicleModal = (vehicle = null) => {
        setValidationErrors({});
        if (vehicle) {
            setEditingVehicle(vehicle);
            setVehicleForm({ name: vehicle.name, description: vehicle.description || '', float_cash: vehicle.float_cash || 2000 });
        } else {
            setEditingVehicle(null);
            setVehicleForm({ name: '', description: '', float_cash: 2000 });
        }
        setShowVehicleModal(true);
    };

    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, vehicleForm);
                toast.success('Vehicle updated');
            } else {
                await createVehicle(vehicleForm);
                toast.success('Vehicle created');
            }
            setShowVehicleModal(false);
            fetchData();
        } catch (error) {
            if (error.response?.status === 422) {
                setValidationErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to save vehicle');
            }
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (!confirm('Deactivate this vehicle? It can be restored later.')) return;
        try {
            await deleteVehicle(id);
            toast.success('Vehicle deactivated');
            fetchData();
        } catch (error) {
            toast.error('Failed to deactivate vehicle');
        }
    };

    const handleRestoreVehicle = async (id) => {
        try {
            await restoreVehicle(id);
            toast.success('Vehicle restored');
            fetchData();
        } catch (error) {
            toast.error('Failed to restore vehicle');
        }
    };

    // User handlers
    const openUserModal = (user = null) => {
        setValidationErrors({});
        if (user) {
            setEditingUser(user);
            setUserForm({
                name: user.name,
                username: user.username || '',
                email: user.email,
                password: '',
                role: user.roles?.[0]?.name || 'delivery_rider'
            });
        } else {
            setEditingUser(null);
            setUserForm({ name: '', username: '', email: '', password: '', role: 'delivery_rider' });
        }
        setShowUserModal(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        try {
            const data = { ...userForm };
            if (!data.password) delete data.password;

            if (editingUser) {
                await updateUser(editingUser.id, data);
                toast.success('User updated');
            } else {
                await createUser(data);
                toast.success('User created');
            }
            setShowUserModal(false);
            fetchData();
        } catch (error) {
            if (error.response?.status === 422) {
                setValidationErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to save user');
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await deleteUser(id);
            toast.success('User deleted');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
        }
    };

    // Role handlers
    const openRoleModal = (role = null) => {
        setValidationErrors({});
        if (role) {
            setEditingRole(role);
            setRoleForm({ name: role.name });
        } else {
            setEditingRole(null);
            setRoleForm({ name: '' });
        }
        setShowRoleModal(true);
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        setValidationErrors({});
        try {
            if (editingRole) {
                await updateRole(editingRole.id, roleForm);
                toast.success('Role updated');
            } else {
                await createRole(roleForm);
                toast.success('Role created');
            }
            setShowRoleModal(false);
            fetchData();
        } catch (error) {
            if (error.response?.status === 422) {
                setValidationErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || 'Failed to save role');
            }
        }
    };

    const handleDeleteRole = async (id) => {
        if (!confirm('Delete this role? This cannot be undone.')) return;
        try {
            await deleteRole(id);
            toast.success('Role deleted');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete role');
        }
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        try {
            const res = await getRolePermissions(role.id);
            setRolePermissions(res.data);
        } catch (error) {
            toast.error('Failed to load role permissions');
        }
    };

    const togglePermission = (permissionName) => {
        setRolePermissions(prev =>
            prev.includes(permissionName)
                ? prev.filter(p => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    const handleSyncPermissions = async () => {
        if (!selectedRole) return;
        setSavingPermissions(true);
        try {
            await syncRolePermissions(selectedRole.id, rolePermissions);
            toast.success('Permissions updated successfully');
        } catch (error) {
            toast.error('Failed to update permissions');
        } finally {
            setSavingPermissions(false);
        }
    };

    // Branding handlers
    const handleBrandingFormChange = (key, value) => {
        setBrandingForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        setValidationErrors({});
        try {
            await bulkUpdateSettings(brandingForm);
            toast.success('Branding settings updated');
            fetchData();
        } catch (error) {
            if (error.response?.status === 422) {
                setValidationErrors(error.response.data.errors);
            } else {
                toast.error('Failed to update branding settings');
            }
        } finally {
            setSavingBranding(false);
        }
    };

    const handleCancelBranding = () => {
        setValidationErrors({});
        const brandingObj = {};
        (settings.branding || []).forEach(s => {
            brandingObj[s.key] = s.value || '';
        });
        setBrandingForm(brandingObj);
        toast.info('Changes discarded');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={40} />
            </div>
        );
    }

    const generalSettings = settings.general || [];
    const shiftSettings = settings.shift || [];
    const brandingSettings = settings.branding || [];
    const businessSettings = settings.business || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Settings</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Settings</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-white/[0.05]">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-brand-500 text-brand-500'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                {/* General Settings */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">General Settings</h3>

                        <div className="grid gap-6 md:grid-cols-2">
                            {[...generalSettings, ...shiftSettings, ...businessSettings].map(setting => (
                                <div key={setting.key} className="space-y-2">
                                    <Label>{setting.description || setting.key}</Label>
                                    <Input
                                        type={setting.type === 'integer' ? 'number' : 'text'}
                                        value={setting.value || ''}
                                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Branding Settings */}
                {activeTab === 'branding' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Branding & Business Information</h3>
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" onClick={handleCancelBranding}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveBranding} loading={savingBranding} startIcon={<Save size={16} />}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {brandingSettings.map(setting => (
                                <div key={setting.key} className="space-y-2">
                                    <Label>{setting.description || setting.key}</Label>
                                    <Input
                                        type="text"
                                        value={brandingForm[setting.key] || ''}
                                        onChange={(e) => handleBrandingFormChange(setting.key, e.target.value)}
                                        placeholder={`Enter ${setting.description?.toLowerCase()}`}
                                    />
                                    {renderError(`settings.${setting.key}`)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vehicles Management */}
                {activeTab === 'vehicles' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Delivery Vehicles</h3>
                            <Button onClick={() => openVehicleModal()} startIcon={<Plus size={16} />}>
                                Add Vehicle
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader>Name</TableCell>
                                    <TableCell isHeader>Description</TableCell>
                                    <TableCell isHeader>Float Cash</TableCell>
                                    <TableCell isHeader>Status</TableCell>
                                    <TableCell isHeader>Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicles.map(vehicle => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                                        <TableCell>{vehicle.description || '-'}</TableCell>
                                        <TableCell>{formatCurrency(vehicle.float_cash || 0)}</TableCell>
                                        <TableCell>
                                            <Badge variant="light" color={vehicle.deleted_at ? 'red' : 'green'}>
                                                {vehicle.deleted_at ? 'Inactive' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <button onClick={() => openVehicleModal(vehicle)} className="text-gray-500 hover:text-brand-500">
                                                    <Pencil size={16} />
                                                </button>
                                                {vehicle.deleted_at ? (
                                                    <button onClick={() => handleRestoreVehicle(vehicle.id)} className="text-gray-500 hover:text-green-500">
                                                        <RotateCcw size={16} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-gray-500 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Users Management */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">User Management</h3>
                            <Button onClick={() => openUserModal()} startIcon={<Plus size={16} />}>
                                Add User
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader>Name</TableCell>
                                    <TableCell isHeader>Username</TableCell>
                                    <TableCell isHeader>Email</TableCell>
                                    <TableCell isHeader>Role</TableCell>
                                    <TableCell isHeader>Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.username || '-'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="light" color={
                                                user.roles?.[0]?.name === 'admin' ? 'purple' :
                                                    user.roles?.[0]?.name === 'supervisor' ? 'blue' : 'gray'
                                            }>
                                                {user.roles?.[0]?.name || 'No role'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <button onClick={() => openUserModal(user)} className="text-gray-500 hover:text-brand-500">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-gray-500 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Roles & Permissions Management */}
                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Roles & Permissions</h3>
                            <Button onClick={() => openRoleModal()} startIcon={<Plus size={16} />}>
                                Add Role
                            </Button>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Roles List */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Select Role</h4>
                                <div className="space-y-2">
                                    {roles.map(role => (
                                        <div
                                            key={role.id}
                                            onClick={() => handleSelectRole(role)}
                                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${selectedRole?.id === role.id
                                                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
                                                : 'border-gray-100 bg-white hover:border-brand-200 dark:border-white/[0.05] dark:bg-white/[0.03]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedRole?.id === role.id ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                                                    }`}>
                                                    <Lock size={16} />
                                                </div>
                                                <span className="font-medium text-gray-800 dark:text-white/90">
                                                    {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </div>
                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => openRoleModal(role)} className="text-gray-400 hover:text-brand-500">
                                                    <Pencil size={14} />
                                                </button>
                                                {!['admin', 'supervisor', 'delivery_rider'].includes(role.name) && (
                                                    <button onClick={() => handleDeleteRole(role.id)} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Permissions Matrix */}
                            <div className="lg:col-span-2 space-y-4">
                                {selectedRole ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Permissions for {selectedRole.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h4>
                                            <Button
                                                onClick={handleSyncPermissions}
                                                loading={savingPermissions}
                                                startIcon={<Save size={16} />}
                                                size="sm"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {permissions.map(permission => (
                                                <div
                                                    key={permission.id}
                                                    onClick={() => togglePermission(permission.name)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${rolePermissions.includes(permission.name)
                                                        ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-500/5'
                                                        : 'border-gray-100 bg-gray-50/50 hover:border-brand-200 dark:border-white/5 dark:bg-white/5'
                                                        }`}
                                                >
                                                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${rolePermissions.includes(permission.name)
                                                        ? 'border-brand-500 bg-brand-500 text-white'
                                                        : 'border-gray-300 bg-white dark:border-white/20 dark:bg-white/10'
                                                        }`}>
                                                        {rolePermissions.includes(permission.name) && (
                                                            <div className="h-2 w-2 bg-white rounded-full" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-100 rounded-3xl dark:border-white/5">
                                        <Lock className="text-gray-300 dark:text-gray-700 mb-4" size={48} />
                                        <p className="text-gray-500 dark:text-gray-400">Select a role to manage its permissions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Vehicle Modal */}
            <Modal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)} className="max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">
                        {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                    </h3>
                    <form onSubmit={handleSaveVehicle} className="space-y-4">
                        <div>
                            <Label>Vehicle Name *</Label>
                            <Input
                                value={vehicleForm.name}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                                required
                            />
                            {renderError('name')}
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                value={vehicleForm.description}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                            />
                            {renderError('description')}
                        </div>
                        <div>
                            <Label>Float Cash (LKR)</Label>
                            <Input
                                type="number"
                                value={vehicleForm.float_cash}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, float_cash: parseFloat(e.target.value) })}
                            />
                            {renderError('float_cash')}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowVehicleModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                {editingVehicle ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* User Modal */}
            <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} className="max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">
                        {editingUser ? 'Edit User' : 'Add User'}
                    </h3>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <Label>Full Name *</Label>
                            <Input
                                value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                required
                            />
                            {renderError('name')}
                        </div>
                        <div>
                            <Label>Username *</Label>
                            <Input
                                value={userForm.username}
                                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                required
                            />
                            {renderError('username')}
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                required
                            />
                            {renderError('email')}
                        </div>
                        <div>
                            <Label>{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
                            <Input
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                required={!editingUser}
                            />
                            {renderError('password')}
                        </div>
                        <div>
                            <Label>Role *</Label>
                            <select
                                value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-white/[0.05] dark:bg-white/[0.03]"
                            >
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>
                                        {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                            {renderError('role')}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUserModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                {editingUser ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Role Modal */}
            <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} className="max-w-md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">
                        {editingRole ? 'Edit Role' : 'Add Role'}
                    </h3>
                    <form onSubmit={handleSaveRole} className="space-y-4">
                        <div>
                            <Label>Role Name *</Label>
                            <Input
                                value={roleForm.name}
                                onChange={(e) => setRoleForm({ name: e.target.value })}
                                placeholder="e.g. manager, accountant"
                                required
                            />
                            {renderError('name')}
                            <p className="mt-1 text-xs text-gray-500"> Use lowercase and underscores for best compatibility.</p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowRoleModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                {editingRole ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default Settings;
