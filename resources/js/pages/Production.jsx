import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    X,
    AlertCircle,
    Loader2,
    Edit,
    ChevronRight,
    Clock,
    Factory,
    Package,
    CheckCircle,
    Send
} from 'lucide-react';
import {
    transferFromProduction,
    updateProductionItem,
    getTodayBatch,
    getProducts,
    getLocations,
    addProductionItem,
    removeProductionItem,
    completeBatch
} from '../utils/api';
import { formatTime, formatNumber, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    TrashBinIcon,
    BoxIconLine,
    ClockIcon,
} from "../theme/tailadmin/icons";
import { useAuth } from '../context/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../theme/tailadmin/components/ui/table";
import Badge from "../theme/tailadmin/components/ui/badge/Badge";
import Button from "../theme/tailadmin/components/ui/button/Button";
import Modal from "../theme/tailadmin/components/ui/modal/Modal";
import Label from "../theme/tailadmin/components/form/Label";
import Input from "../theme/tailadmin/components/form/input/InputField";
import Select from "../theme/tailadmin/components/form/Select";

function Production() {
    const [batch, setBatch] = useState(null);
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [transferItems, setTransferItems] = useState([]);

    // Edit Production Item State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({
        quantity: '',
        password: '',
        reason: ''
    });

    const { user } = useAuth();
    const isAdmin = user?.roles?.some(r => r.name === 'admin');
    const toast = useToast();
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [batchRes, productsRes, locationsRes] = await Promise.all([
                getTodayBatch(),
                getProducts(),
                getLocations()
            ]);
            setBatch(batchRes.data);
            setProducts(productsRes.data);
            setLocations(locationsRes.data);
        } catch (error) {
            toast.error('Failed to fetch production data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await addProductionItem(batch.id, {
                product_id: selectedProduct,
                quantity_produced: parseInt(quantity)
            });
            toast.success('Item added to production');
            fetchData();
            setShowAddModal(false);
            setSelectedProduct('');
            setQuantity('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add item');
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!confirm('Remove this item from production?')) return;
        try {
            await removeProductionItem(batch.id, itemId);
            toast.success('Item removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditForm({
            quantity: item.quantity_produced.toString(),
            password: '',
            reason: ''
        });
        setShowEditModal(true);
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            await updateProductionItem(batch.id, editingItem.id, {
                quantity_produced: parseInt(editForm.quantity),
                admin_password: editForm.password,
                reason: editForm.reason
            });
            toast.success('Production item updated successfully');
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update item');
        }
    };

    const handleCompleteBatch = async () => {
        if (!confirm('Complete production batch? This action cannot be undone.')) return;
        try {
            await completeBatch(batch.id);
            toast.success('Production batch completed!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to complete batch');
        }
    };

    const openTransferModal = () => {
        const vehicles = locations.filter(l => l.type === 'vehicle');
        const items = batch.items.map(item => {
            // Create an object with shop_qty and one qty field per vehicle
            const itemData = {
                product_id: item.product_id,
                product_name: item.product.name,
                available: item.quantity_produced,
                shop_qty: 0,
            };
            // Add a qty field for each vehicle
            vehicles.forEach(v => {
                itemData[`vehicle_${v.id}`] = 0;
            });
            return itemData;
        });
        setTransferItems(items);
        setShowTransferModal(true);
    };

    const handleTransfer = async () => {
        const transferData = [];
        const shop = locations.find(l => l.type === 'shop');
        const vehicles = locations.filter(l => l.type === 'vehicle');

        transferItems.forEach(item => {
            // Shop transfer
            if (item.shop_qty > 0 && shop) {
                transferData.push({
                    product_id: item.product_id,
                    quantity: item.shop_qty,
                    location_id: shop.id
                });
            }
            // Vehicle transfers
            vehicles.forEach(v => {
                const qty = item[`vehicle_${v.id}`] || 0;
                if (qty > 0) {
                    transferData.push({
                        product_id: item.product_id,
                        quantity: qty,
                        location_id: v.id
                    });
                }
            });
        });

        if (transferData.length === 0) {
            toast.warning('No items to transfer');
            return;
        }

        try {
            await transferFromProduction({ items: transferData });
            toast.success('Stock transferred successfully!');
            setShowTransferModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transfer failed');
        }
    };

    const updateTransferQty = (index, field, value) => {
        const updated = [...transferItems];
        const item = updated[index];
        const vehicles = locations.filter(l => l.type === 'vehicle');

        const newValue = Math.max(0, parseInt(value) || 0);

        // Calculate current total excluding the field being edited
        let currentTotal = item.shop_qty;
        vehicles.forEach(v => {
            if (`vehicle_${v.id}` !== field) {
                currentTotal += item[`vehicle_${v.id}`] || 0;
            }
        });
        if (field === 'shop_qty') {
            currentTotal -= item.shop_qty;
        }

        // Clamp value to not exceed remaining available
        const maxAllowed = item.available - currentTotal;
        item[field] = Math.min(newValue, maxAllowed);

        setTransferItems(updated);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={40} />
            </div>
        );
    }

    const isShiftActive = shiftStatus.status === 'production';
    const totalProduced = batch?.items?.reduce((sum, item) => sum + item.quantity_produced, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Production Management</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Production</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="light" color={shiftStatus.color === 'green' ? 'green' : 'orange'}>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {shiftStatus.label}
                        </div>
                    </Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Batch Status */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                            <Factory size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Batch Status</p>
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                                {batch?.status === 'completed' ? 'Completed' : 'In Progress'}
                            </h4>
                        </div>
                    </div>
                </div>

                {/* Product Count */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Items Produced</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{batch?.items?.length || 0}</h4>
                        </div>
                    </div>
                </div>

                {/* Total Quantity */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                            <BoxIconLine className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatNumber(totalProduced)}</h4>
                        </div>
                    </div>
                </div>

                {/* Shift Time */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Shift Time</p>
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">5AM - 12PM</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shift End Warning */}
            {!isShiftActive && batch?.status !== 'completed' && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-500/20 dark:bg-orange-500/5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Production Shift Ended</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Production shift is from 5AM to 12PM. You can still view and manage items.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Items Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
                        <Factory size={20} className="text-brand-500" />
                        Today's Production Batch
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {batch?.status !== 'completed' && (
                            <>
                                <Button size="sm" onClick={() => setShowAddModal(true)} startIcon={<PlusIcon />}>
                                    Add Item
                                </Button>
                                {batch?.items?.length > 0 && (
                                    <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={handleCompleteBatch} startIcon={<CheckCircle size={16} />}>
                                        Complete Batch
                                    </Button>
                                )}
                            </>
                        )}
                        {batch?.status === 'completed' && batch?.items?.length > 0 && (
                            <Button size="sm" onClick={openTransferModal} startIcon={<Send size={16} />}>
                                Transfer to Stock
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell isHeader px="px-4">Product</TableCell>
                                <TableCell isHeader px="px-4">Category</TableCell>
                                <TableCell isHeader px="px-4">Qty Produced</TableCell>
                                <TableCell isHeader px="px-4">Completed</TableCell>
                                <TableCell isHeader px="px-4">Status</TableCell>
                                {(batch?.status !== 'completed' || isAdmin) && <TableCell isHeader px="px-4 text-right">Actions</TableCell>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!batch?.items?.length ? (
                                <TableRow>
                                    <TableCell colSpan={batch?.status !== 'completed' ? 6 : 5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Factory className="mb-4 text-gray-300" size={48} />
                                            <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">No production items yet</h5>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start adding items produced today</p>
                                            {batch?.status !== 'completed' && (
                                                <Button size="sm" onClick={() => setShowAddModal(true)} className="mt-6" startIcon={<PlusIcon />}>
                                                    Add First Item
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                batch.items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 font-bold">
                                                    {item.product.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-800 dark:text-white/90">{item.product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="light" color={item.product.category === 'day_food' ? 'orange' : 'blue'}>
                                                {item.product.category === 'day_food' ? 'Day Food' : 'Packed'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 font-bold text-gray-800 dark:text-white/90">{formatNumber(item.quantity_produced)}</TableCell>
                                        <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {item.completed_at ? formatTime(item.completed_at) : '-'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="light" color={item.completed_at ? 'green' : 'orange'}>
                                                {item.completed_at ? 'Ready' : 'In Progress'}
                                            </Badge>
                                        </TableCell>
                                        {(batch?.status !== 'completed' || isAdmin) && (
                                            <TableCell className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                                                            title="Edit quantity"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    {batch?.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <TrashBinIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add Item Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Production Item"
            >
                <form onSubmit={handleAddItem} className="p-6">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="product">Product *</Label>
                            <Select
                                id="product"
                                value={selectedProduct}
                                onChange={(val) => setSelectedProduct(val)}
                                placeholder="Select a product"
                                options={products.filter(p => p.is_active).map(product => ({
                                    value: product.id,
                                    label: `${product.name} (${product.category === 'day_food' ? 'Day Food' : 'Packed'})`
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity">Quantity Produced *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="Enter quantity"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" startIcon={<PlusIcon />}>
                            Add to Batch
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Item Modal (Admin Only) */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Edit Production: ${editingItem?.product?.name || ''}`}
            >
                <form onSubmit={handleUpdateItem} className="p-6">
                    <div className="space-y-6">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                            <div className="flex gap-3">
                                <AlertCircle className="text-blue-500 shrink-0" size={18} />
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    You are altering a production record. This action will be logged for audit purposes.
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-quantity">Corrected Quantity *</Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                placeholder="Enter correct quantity"
                                min="0"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="admin-password">Admin Password *</Label>
                            <Input
                                id="admin-password"
                                type="password"
                                placeholder="Enter your password to verify"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                required
                            />
                            <p className="mt-1 text-[10px] text-gray-400">
                                Required to authorize this change.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="edit-reason">Reason for Change *</Label>
                            <textarea
                                id="edit-reason"
                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                placeholder="e.g., miscount, data entry error..."
                                value={editForm.reason}
                                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                rows="3"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-brand-500" startIcon={<CheckCircle size={16} />}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Transfer Modal */}
            <Modal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title="Transfer to Stock"
                size="xl"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5 mb-6">
                        <Send size={20} className="text-blue-500 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Distribute produced items between the shop and delivery vehicles.
                        </p>
                    </div>

                    <div className="max-h-[400px] overflow-x-auto overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.03]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader px="px-4">Product</TableCell>
                                    <TableCell isHeader px="px-4 text-center">Available</TableCell>
                                    <TableCell isHeader px="px-4 text-center">
                                        {locations.find(l => l.type === 'shop')?.name || 'Shop'}
                                    </TableCell>
                                    {locations.filter(l => l.type === 'vehicle').map(vehicle => (
                                        <TableCell key={vehicle.id} isHeader px="px-4 text-center">
                                            {vehicle.name}
                                        </TableCell>
                                    ))}
                                    <TableCell isHeader px="px-4 text-center">Remaining</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transferItems.map((item, idx) => {
                                    const vehicles = locations.filter(l => l.type === 'vehicle');
                                    const totalAllocated = item.shop_qty + vehicles.reduce((sum, v) => sum + (item[`vehicle_${v.id}`] || 0), 0);
                                    const remaining = item.available - totalAllocated;

                                    return (
                                        <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                            <TableCell className="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">
                                                {item.product_name}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center font-bold text-gray-800 dark:text-white/90">
                                                {item.available}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03]"
                                                    min="0"
                                                    max={item.available}
                                                    value={item.shop_qty}
                                                    onChange={(e) => updateTransferQty(idx, 'shop_qty', e.target.value)}
                                                />
                                            </TableCell>
                                            {vehicles.map(vehicle => (
                                                <TableCell key={vehicle.id} className="px-4 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03]"
                                                        min="0"
                                                        max={item.available}
                                                        value={item[`vehicle_${vehicle.id}`] || 0}
                                                        onChange={(e) => updateTransferQty(idx, `vehicle_${vehicle.id}`, e.target.value)}
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="px-4 py-3 text-center">
                                                <span className={`font-bold ${remaining === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                                    {remaining}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleTransfer} startIcon={<Send size={16} />}>
                            Confirm Transfers
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Production;

