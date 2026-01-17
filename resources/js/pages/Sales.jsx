import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingCart,
    Plus,
    ChevronRight,
    Store,
    Truck,
    DollarSign,
    X,
    CheckCircle,
    Wallet,
    AlertTriangle,
    Trash2,
    Loader2
} from 'lucide-react';
import {
    getLocations,
    getTodaySale,
    getLocationInventory,
    addSaleItem,
    recordCashCollection,
    closeSale,
    getProducts
} from '../utils/api';
import { formatCurrency, formatNumber, getStatusBadge, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
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

function Sales() {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [sale, setSale] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCollectModal, setShowCollectModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [actualAmount, setActualAmount] = useState('');
    const [collectNotes, setCollectNotes] = useState('');
    const toast = useToast();
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            fetchSaleData();
        }
    }, [selectedLocation]);

    const fetchLocations = async () => {
        try {
            const [locRes, prodRes] = await Promise.all([
                getLocations(),
                getProducts()
            ]);
            setLocations(locRes.data);
            setProducts(prodRes.data);

            const shop = locRes.data.find(l => l.type === 'shop');
            if (shop) {
                setSelectedLocation(shop.id);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        }
    };

    const fetchSaleData = async () => {
        setLoading(true);
        try {
            const [saleRes, invRes] = await Promise.all([
                getTodaySale(selectedLocation),
                getLocationInventory(selectedLocation)
            ]);
            setSale(saleRes.data);
            setInventory(invRes.data);
        } catch (error) {
            toast.error('Failed to fetch sale data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            await addSaleItem(sale.id, {
                product_id: selectedProduct,
                quantity: parseInt(quantity)
            });
            toast.success('Item added to sale');
            fetchSaleData();
            setShowAddModal(false);
            setSelectedProduct('');
            setQuantity('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add item');
        }
    };

    const handleCashCollection = async (e) => {
        e.preventDefault();
        try {
            await recordCashCollection(sale.id, {
                actual_amount: parseFloat(actualAmount),
                notes: collectNotes
            });
            toast.success('Cash collection recorded');
            fetchSaleData();
            setShowCollectModal(false);
            setActualAmount('');
            setCollectNotes('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to record collection');
        }
    };

    const handleCloseSale = async () => {
        if (!confirm('Close this sale? This action cannot be undone.')) return;
        try {
            await closeSale(sale.id);
            toast.success('Sale closed successfully');
            fetchSaleData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to close sale');
        }
    };

    const currentLocation = locations.find(l => l.id === selectedLocation);
    const isShop = currentLocation?.type === 'shop';
    const availableProducts = inventory.filter(inv =>
        inv.quantity > 0 && !sale?.items?.some(item => item.product_id === inv.product_id)
    );

    if (loading && !selectedLocation) {
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Sales Management</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Sales</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="light" color={shiftStatus.color === 'green' ? 'green' : 'orange'}>
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4" />
                            {shiftStatus.label}
                        </div>
                    </Badge>
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

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="animate-spin text-brand-500" size={40} />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                                    <ShoppingCart size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Items Sold</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{sale?.items?.length || 0}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                                    <DollarSign size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 truncate">{formatCurrency(sale?.total_amount || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                                    <Wallet size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Expected Cash</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 truncate">{formatCurrency(sale?.expected_amount || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03] ${sale?.discrepancy && sale?.discrepancy < 0 ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${sale?.discrepancy && sale?.discrepancy < 0 ? 'bg-red-100 text-red-500 dark:bg-red-500/20' : 'bg-orange-50 text-orange-500 dark:bg-orange-500/10'}`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Discrepancy</p>
                                    <h4 className={`text-xl font-bold truncate ${sale?.discrepancy && sale?.discrepancy < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white/90'}`}>
                                        {sale?.discrepancy !== null ? formatCurrency(sale.discrepancy) : '-'}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shop Collection Banner */}
                    {isShop && sale?.status === 'open' && (
                        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Shop Cash Collection</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Daily cash collection is recorded at 8PM. Ensure all sales are logged before collecting.
                                        </p>
                                    </div>
                                </div>
                                {sale?.items?.length > 0 && (
                                    <Button onClick={() => setShowCollectModal(true)} startIcon={<Wallet size={16} />}>
                                        Collect Cash (8PM)
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sales Table */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
                                <ShoppingCart size={20} className="text-brand-500" />
                                Today's Sales - {currentLocation?.name}
                            </h4>
                            <div className="flex items-center gap-3">
                                {sale && (
                                    <Badge
                                        variant="light"
                                        color={getStatusBadge(sale.status).className.includes('success') ? 'green' : 'orange'}
                                    >
                                        {getStatusBadge(sale.status).label}
                                    </Badge>
                                )}
                                {sale?.status === 'open' && (
                                    <Button size="sm" onClick={() => setShowAddModal(true)} startIcon={<PlusIcon />}>
                                        Add Sale
                                    </Button>
                                )}
                                {sale?.status === 'verified' && (
                                    <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={handleCloseSale} startIcon={<CheckCircle size={16} />}>
                                        Close Sale
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableCell isHeader px="px-4">Product</TableCell>
                                        <TableCell isHeader px="px-4 text-center">Quantity</TableCell>
                                        <TableCell isHeader px="px-4 text-right">Unit Price</TableCell>
                                        <TableCell isHeader px="px-4 text-right">Total Price</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!sale?.items?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <ShoppingCart className="mb-4 text-gray-300" size={48} />
                                                    <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">No sales yet today</h5>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record sales as customers purchase items</p>
                                                    {sale?.status === 'open' && (
                                                        <Button size="sm" onClick={() => setShowAddModal(true)} className="mt-6" startIcon={<PlusIcon />}>
                                                            Record First Sale
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sale.items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5 font-bold">
                                                            {item.product.name.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-gray-800 dark:text-white/90">{item.product.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-center font-bold text-gray-800 dark:text-white/90">
                                                    {formatNumber(item.quantity)}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(item.unit_price)}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right font-black text-green-600">
                                                    {formatCurrency(item.total_price)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {sale?.items?.length > 0 && (
                            <div className="mt-6 flex justify-end border-t border-gray-100 pt-6 dark:border-white/[0.03]">
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales Amount:</span>
                                    <span className="text-3xl font-black text-green-600 dark:text-green-400">{formatCurrency(sale.total_amount)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collection Summary */}
                    {sale?.actual_amount !== null && (
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                                <Wallet size={20} className="text-brand-500" />
                                Cash Collection Summary
                            </h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl bg-gray-50 p-5 dark:bg-white/5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Expected</p>
                                    <p className="mt-2 text-2xl font-black text-gray-800 dark:text-white/90">{formatCurrency(sale.expected_amount)}</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 p-5 dark:bg-white/5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Collected</p>
                                    <p className="mt-2 text-2xl font-black text-gray-800 dark:text-white/90">{formatCurrency(sale.actual_amount)}</p>
                                </div>
                                <div className={`rounded-2xl p-5 ${sale.discrepancy >= 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                                    <p className={`text-xs font-semibold uppercase tracking-wider ${sale.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>Discrepancy</p>
                                    <p className={`mt-2 text-2xl font-black ${sale.discrepancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {sale.discrepancy >= 0 ? '+' : ''}{formatCurrency(sale.discrepancy)}
                                    </p>
                                </div>
                            </div>
                            {sale.notes && (
                                <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 dark:border-white/10">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Collection Notes:</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{sale.notes}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Add Sale Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Record Sale"
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
                                options={availableProducts.map(inv => ({
                                    value: inv.product_id,
                                    label: `${inv.product.name} (${inv.quantity} available)`
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity">Quantity Sold *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="Enter quantity"
                                min="1"
                                max={availableProducts.find(p => p.product_id == selectedProduct)?.quantity || 999}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>

                        {selectedProduct && (
                            <div className="rounded-2xl bg-green-50 p-5 dark:bg-green-500/10">
                                <div className="flex items-center justify-between py-1 border-b border-green-100 dark:border-green-500/20 mb-3">
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Price per unit:</span>
                                    <span className="font-bold text-green-800 dark:text-green-200">
                                        {formatCurrency(products.find(p => p.id == selectedProduct)?.selling_price || 0)}
                                    </span>
                                </div>
                                {quantity && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-green-700 dark:text-green-300">Total Sale Value:</span>
                                        <span className="text-2xl font-black text-green-600 dark:text-green-400">
                                            {formatCurrency((products.find(p => p.id == selectedProduct)?.selling_price || 0) * parseInt(quantity))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" startIcon={<PlusIcon />}>
                            Record Sale
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Collect Cash Modal */}
            <Modal
                isOpen={showCollectModal}
                onClose={() => setShowCollectModal(false)}
                title="Cash Collection (8PM)"
            >
                <form onSubmit={handleCashCollection} className="p-6">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-blue-50/50 p-5 text-center dark:bg-blue-500/5">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Expected Amount Based on Sales:</p>
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(sale?.expected_amount || 0)}</p>
                        </div>

                        <div>
                            <Label htmlFor="actual_amount">Actual Amount Collected (LKR) *</Label>
                            <Input
                                id="actual_amount"
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={actualAmount}
                                onChange={(e) => setActualAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Collection Notes</Label>
                            <textarea
                                id="notes"
                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                placeholder="Any notes about the collection or discrepancies..."
                                value={collectNotes}
                                onChange={(e) => setCollectNotes(e.target.value)}
                                rows="3"
                            />
                        </div>

                        {actualAmount && (
                            <div className={`rounded-xl p-4 flex justify-between items-center ${parseFloat(actualAmount) >= (sale?.expected_amount || 0) ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                <span className="text-sm font-bold">Projected Discrepancy:</span>
                                <span className="text-lg font-black italic">
                                    {parseFloat(actualAmount) >= (sale?.expected_amount || 0) ? '+' : ''}
                                    {formatCurrency(parseFloat(actualAmount) - (sale?.expected_amount || 0))}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCollectModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" startIcon={<CheckCircle size={16} />}>
                            Finalize Collection
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default Sales;
