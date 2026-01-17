import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Trash2,
    ChevronRight,
    AlertTriangle,
    Package,
    Clock,
    DollarSign,
    X,
    Plus,
    Play,
    Store,
    Info,
    Loader2
} from 'lucide-react';
import {
    getWastages,
    recordWastage,
    processExpiredFoods,
    getLocations,
    getLocationInventory,
    getProducts
} from '../utils/api';
import { formatCurrency, formatDate, formatNumber, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    TrashBinIcon,
    BoxIconLine,
    ClockIcon,
} from "../theme/tailadmin/icons";
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

function Wastage() {
    const [wastages, setWastages] = useState([]);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        inventory_location_id: '',
        quantity: '',
        reason: 'expired',
        notes: ''
    });
    const toast = useToast();
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            fetchLocationInventory();
        }
    }, [selectedLocation]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [wastRes, locRes, prodRes] = await Promise.all([
                getWastages({ date: new Date().toISOString().split('T')[0] }),
                getLocations(),
                getProducts()
            ]);
            setWastages(wastRes.data.data || []);
            setLocations(locRes.data);
            setProducts(prodRes.data);

            const shop = locRes.data.find(l => l.type === 'shop');
            if (shop) {
                setSelectedLocation(shop.id);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationInventory = async () => {
        try {
            const response = await getLocationInventory(selectedLocation);
            setInventory(response.data);
        } catch (error) {
            console.error('Failed to fetch inventory');
        }
    };

    const handleRecordWastage = async (e) => {
        e.preventDefault();
        try {
            await recordWastage({
                ...formData,
                inventory_location_id: selectedLocation
            });
            toast.success('Wastage recorded');
            setShowAddModal(false);
            setFormData({
                product_id: '',
                inventory_location_id: '',
                quantity: '',
                reason: 'expired',
                notes: ''
            });
            fetchData();
            fetchLocationInventory();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to record wastage');
        }
    };

    const handleProcessExpired = async (forceAll = false) => {
        const message = forceAll
            ? 'This will remove ALL day foods (even if not expired) from the selected location. Continue?'
            : 'This will remove all expired day foods from the selected location. Continue?';

        if (!confirm(message)) return;

        try {
            const response = await processExpiredFoods(selectedLocation, { force_all: forceAll });
            toast.success(`Processed ${response.data.processed_items?.length || 0} items`);
            fetchData();
            fetchLocationInventory();
        } catch (error) {
            toast.error('Failed to process foods');
        }
    };

    const currentLocation = locations.find(l => l.id === selectedLocation);
    const totalWastageCost = wastages.reduce((sum, w) => sum + parseFloat(w.cost), 0);
    const totalWastageQty = wastages.reduce((sum, w) => sum + w.quantity, 0);

    const expiringItems = inventory.filter(item => {
        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 0;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Wastage Management</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Wastage</span>
                    </div>
                </div>
                <Button onClick={() => setShowAddModal(true)} startIcon={<PlusIcon />}>
                    Record Wastage
                </Button>
            </div>

            {/* 12PM Reminder Banner */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">12PM - Day Food Expiry Check</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Please verify remaining day foods and process expired items.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {expiringItems.length > 0 && (
                            <Button
                                variant="primary"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleProcessExpired(false)}
                                startIcon={<Play size={16} />}
                            >
                                Process {expiringItems.length} Expired
                            </Button>
                        )}
                        {inventory.some(i => i.product?.category === 'day_food') && (
                            <Button
                                variant="primary"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleProcessExpired(true)}
                                startIcon={<Trash2 size={16} />}
                            >
                                Clear All Day Foods
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today's Cost */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Cost</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(totalWastageCost)}</h4>
                        </div>
                    </div>
                </div>

                {/* Items Wasted */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Items Wasted</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatNumber(totalWastageQty)}</h4>
                        </div>
                    </div>
                </div>

                {/* Records Count */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Wastage Records</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{wastages.length}</h4>
                        </div>
                    </div>
                </div>

                {/* Expiring Count */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                            <ClockIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Now</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{expiringItems.length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Tabs */}
            <div className="flex flex-wrap gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 dark:border-white/[0.03] dark:bg-white/[0.03]">
                {locations.map(location => (
                    <button
                        key={location.id}
                        onClick={() => setSelectedLocation(location.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${selectedLocation === location.id ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
                    >
                        <Store size={16} />
                        {location.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Expiring Items Table */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                        <AlertTriangle size={20} className="text-orange-500" />
                        Expired / Expiring Items
                    </h4>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader px="px-4">Product</TableCell>
                                    <TableCell isHeader px="px-4">Qty</TableCell>
                                    <TableCell isHeader px="px-4">Expiry</TableCell>
                                    <TableCell isHeader px="px-4">Status</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory.filter(item => {
                                    const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                    return daysLeft <= 1;
                                }).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-20 text-center text-gray-500">
                                            No expiring items at this location
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    inventory.filter(item => {
                                        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        return daysLeft <= 1;
                                    }).map(item => {
                                        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 font-bold">
                                                            {item.product.name.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-gray-800 dark:text-white/90">{item.product.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 font-bold text-gray-800 dark:text-white/90">{item.quantity}</TableCell>
                                                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(item.expiry_date)}</TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <Badge variant="light" color={daysLeft <= 0 ? 'red' : 'orange'}>
                                                        {daysLeft <= 0 ? 'Expired' : '1 Day Left'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Today's Records Table */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                        <Trash2 size={20} className="text-red-500" />
                        Today's Wastage Records
                    </h4>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader px="px-4">Product</TableCell>
                                    <TableCell isHeader px="px-4">Qty</TableCell>
                                    <TableCell isHeader px="px-4">Cost</TableCell>
                                    <TableCell isHeader px="px-4">Reason</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {wastages.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-20 text-center text-gray-500">
                                            No wastage recorded today
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    wastages.map(wastage => (
                                        <TableRow key={wastage.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 font-bold">
                                                        {wastage.product.name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-gray-800 dark:text-white/90">{wastage.product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 font-bold text-gray-800 dark:text-white/90">{wastage.quantity}</TableCell>
                                            <TableCell className="px-4 py-3 font-bold text-red-500">{formatCurrency(wastage.cost)}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge variant="light" color="gray">
                                                    {wastage.reason}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Add Wastage Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Record Wastage"
            >
                <form onSubmit={handleRecordWastage} className="p-6">
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="product_id">Product *</Label>
                            <Select
                                id="product_id"
                                value={formData.product_id}
                                onChange={(val) => setFormData({ ...formData, product_id: val })}
                                placeholder="Select a product"
                                options={inventory.filter(inv => inv.quantity > 0).map(inv => ({
                                    value: inv.product_id,
                                    label: `${inv.product.name} (${inv.quantity} available)`
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="Enter quantity"
                                min="1"
                                max={inventory.find(i => i.product_id == formData.product_id)?.quantity || 999}
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Select
                                id="reason"
                                value={formData.reason}
                                onChange={(val) => setFormData({ ...formData, reason: val })}
                                options={[
                                    { value: 'expired', label: 'Expired' },
                                    { value: 'damaged', label: 'Damaged' },
                                    { value: 'quality_issue', label: 'Quality Issue' },
                                    { value: 'other', label: 'Other' }
                                ]}
                            />
                        </div>
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                placeholder="Additional notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                            />
                        </div>

                        {formData.product_id && formData.quantity && (
                            <div className="rounded-2xl bg-red-50 p-5 dark:bg-red-500/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-red-700 dark:text-red-300">Estimated Cost of Wastage:</span>
                                    <span className="text-2xl font-black text-red-600 dark:text-red-400">
                                        {formatCurrency(
                                            (products.find(p => p.id == formData.product_id)?.production_cost || 0) * parseInt(formData.quantity)
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 dark:border-white/[0.03]">
                            <Info size={20} className="shrink-0 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Recorded wastage will be immediately deducted from the inventory of the selected location.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" startIcon={<TrashBinIcon className="h-4 w-4" />}>
                            Record Wastage
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default Wastage;
