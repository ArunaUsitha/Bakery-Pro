import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Warehouse,
    Package,
    ChevronRight,
    Store,
    Truck,
    ArrowRightLeft,
    Plus,
    X,
    AlertTriangle,
    Calendar,
    Loader2
} from 'lucide-react';
import {
    getInventory,
    getLocations,
    transferBetweenLocations,
    getLocationInventory
} from '../utils/api';
import { formatCurrency, formatDate, formatNumber, isExpired } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    BoxIconLine,
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

function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({
        from_location_id: '',
        to_location_id: '',
        items: []
    });
    const toast = useToast();

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            fetchLocationInventory(selectedLocation);
        } else {
            fetchAllInventory();
        }
    }, [selectedLocation]);

    const fetchLocations = async () => {
        try {
            const response = await getLocations();
            setLocations(response.data);
            if (response.data.length > 0) {
                const shop = response.data.find(l => l.type === 'shop');
                setSelectedLocation(shop?.id || response.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to fetch locations');
        }
    };

    const fetchAllInventory = async () => {
        setLoading(true);
        try {
            const response = await getInventory();
            setInventory(response.data);
        } catch (error) {
            toast.error('Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationInventory = async (locationId) => {
        setLoading(true);
        try {
            const response = await getLocationInventory(locationId);
            setInventory(response.data);
        } catch (error) {
            toast.error('Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const openTransferModal = () => {
        const shop = locations.find(l => l.type === 'shop');
        const vehicle = locations.find(l => l.type === 'vehicle');

        setTransferData({
            from_location_id: vehicle?.id || '',
            to_location_id: shop?.id || '',
            transfer_type: 'vehicle_to_shop',
            items: inventory.map(item => ({
                product_id: item.product_id,
                product_name: item.product.name,
                available: item.quantity,
                quantity: 0
            }))
        });
        setShowTransferModal(true);
    };

    const handleTransfer = async () => {
        const itemsToTransfer = transferData.items.filter(item => item.quantity > 0);

        if (itemsToTransfer.length === 0) {
            toast.warning('Please select items to transfer');
            return;
        }

        try {
            await transferBetweenLocations({
                from_location_id: transferData.from_location_id,
                to_location_id: transferData.to_location_id,
                transfer_type: transferData.transfer_type,
                items: itemsToTransfer.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }))
            });
            toast.success('Transfer completed successfully!');
            setShowTransferModal(false);
            if (selectedLocation) {
                fetchLocationInventory(selectedLocation);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transfer failed');
        }
    };

    const updateTransferQty = (index, value) => {
        const updated = [...transferData.items];
        updated[index].quantity = parseInt(value) || 0;
        setTransferData({ ...transferData, items: updated });
    };

    const currentLocation = locations.find(l => l.id === selectedLocation);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.product.selling_price), 0);
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const expiringItems = inventory.filter(item => {
        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 1 && daysLeft >= 0;
    });

    if (loading && locations.length === 0) {
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Inventory Management</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Inventory</span>
                    </div>
                </div>
                <Button onClick={openTransferModal} disabled={inventory.length === 0} startIcon={<ArrowRightLeft size={18} />}>
                    Transfer Stock
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Items */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                            <Warehouse size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatNumber(totalItems)}</h4>
                        </div>
                    </div>
                </div>

                {/* Product Types */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Product Types</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{inventory.length}</h4>
                        </div>
                    </div>
                </div>

                {/* Inventory Value */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                            <Store size={24} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Stock Value</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 truncate">{formatCurrency(totalValue)}</h4>
                        </div>
                    </div>
                </div>

                {/* Expiring Today */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Today</p>
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
                        {location.type === 'shop' ? <Store size={16} /> : <Truck size={16} />}
                        {location.name}
                    </button>
                ))}
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
                        {currentLocation?.type === 'shop' ? <Store size={20} className="text-brand-500" /> : <Truck size={20} className="text-brand-500" />}
                        {currentLocation?.name || 'Inventory Overview'}
                    </h4>
                    <span className="rounded-lg bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                        {inventory.length} products • {formatNumber(totalItems)} items
                    </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell isHeader px="px-4">Product</TableCell>
                                <TableCell isHeader px="px-4">Category</TableCell>
                                <TableCell isHeader px="px-4">Qty</TableCell>
                                <TableCell isHeader px="px-4">Production</TableCell>
                                <TableCell isHeader px="px-4">Expiry</TableCell>
                                <TableCell isHeader px="px-4">Value</TableCell>
                                <TableCell isHeader px="px-4">Status</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <Loader2 className="mx-auto animate-spin text-brand-500" size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : inventory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Warehouse className="mb-4 text-gray-300" size={48} />
                                            <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">No inventory found</h5>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Location has no stock at the moment</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inventory.map((item) => {
                                    const expired = isExpired(item.expiry_date);
                                    const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <TableRow key={item.id} className={`${expired ? 'opacity-50' : ''} hover:bg-gray-50 dark:hover:bg-white/[0.01]`}>
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
                                            <TableCell className="px-4 py-3 font-bold text-gray-800 dark:text-white/90">{formatNumber(item.quantity)}</TableCell>
                                            <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(item.production_date)}</TableCell>
                                            <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Calendar size={14} />
                                                    {formatDate(item.expiry_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 font-bold text-brand-500">{formatCurrency(item.quantity * item.product.selling_price)}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                {expired ? (
                                                    <Badge variant="light" color="red">Expired</Badge>
                                                ) : daysLeft === 0 ? (
                                                    <Badge variant="light" color="red">Expires Today</Badge>
                                                ) : daysLeft === 1 ? (
                                                    <Badge variant="light" color="orange">1 Day Left</Badge>
                                                ) : (
                                                    <Badge variant="light" color="green">{daysLeft} Days Left</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Transfer Modal */}
            <Modal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title="Transfer Stock"
                size="lg"
            >
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
                        <div>
                            <Label htmlFor="from_location">From Location</Label>
                            <Select
                                id="from_location"
                                value={transferData.from_location_id}
                                onChange={(val) => setTransferData({
                                    ...transferData,
                                    from_location_id: val,
                                    transfer_type: locations.find(l => l.id == val)?.type === 'vehicle'
                                        ? 'vehicle_to_shop'
                                        : 'shop_to_vehicle'
                                })}
                                options={locations.map(loc => ({
                                    value: loc.id,
                                    label: loc.name
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="to_location">To Location</Label>
                            <Select
                                id="to_location"
                                value={transferData.to_location_id}
                                onChange={(val) => setTransferData({ ...transferData, to_location_id: val })}
                                options={locations.filter(l => l.id != transferData.from_location_id).map(loc => ({
                                    value: loc.id,
                                    label: loc.name
                                }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-800 dark:text-white/90">Select Items to Transfer</h4>
                        <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.03]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableCell isHeader px="px-4">Product</TableCell>
                                        <TableCell isHeader px="px-4 text-center">Available</TableCell>
                                        <TableCell isHeader px="px-4 text-center">Transfer Qty</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transferData.items.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                            <TableCell className="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">
                                                {item.product_name}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                                {item.available}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                                    min="0"
                                                    max={item.available}
                                                    value={item.quantity}
                                                    onChange={(e) => updateTransferQty(idx, e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowTransferModal(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleTransfer} startIcon={<ArrowRightLeft size={16} />}>
                            Complete Transfer
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Inventory;
