import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Store,
    ChevronRight,
    DollarSign,
    Package,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    X,
    Clock,
    Wallet,
    Info,
    Loader2,
    BarChart3,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2
} from 'lucide-react';
import {
    getLocations,
    getShopSettlements,
    getShopSettlement,
    initiateShopSettlement,
    recordShopCount,
    settleShop,
    getProducts
} from '../utils/api';
import { formatCurrency, formatNumber, formatDate, getStatusBadge, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
    PlusIcon,
    CheckIcon,
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

function ShopSettlement() {
    const [locations, setLocations] = useState([]);
    const [shopLocation, setShopLocation] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentSettlement, setCurrentSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showCountModal, setShowCountModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Form states
    const [countedQuantities, setCountedQuantities] = useState({});
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');

    const toast = useToast();
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, settRes, prodRes] = await Promise.all([
                getLocations(),
                getShopSettlements({ date: new Date().toISOString().split('T')[0] }),
                getProducts()
            ]);

            const shop = locRes.data.find(l => l.type === 'shop');
            setLocations(locRes.data);
            setShopLocation(shop);
            setSettlements(settRes.data.data || []);
            setProducts(prodRes.data);

        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiate = async () => {
        if (!shopLocation) return;
        try {
            const response = await initiateShopSettlement(shopLocation.id);
            setCurrentSettlement(response.data);
            toast.success('Shop settlement initiated');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to initiate');
        }
    };

    const openCountModal = (settlement) => {
        setCurrentSettlement(settlement);
        // Map current items_counted or empty
        const currentCount = settlement.items_counted || {};
        const initialCount = {};

        // Include products that had any activity
        const relevantPids = new Set([
            ...Object.keys(settlement.opening_inventory || {}),
            ...Object.keys(settlement.production_received || {}),
            ...Object.keys(settlement.transfers_in || {}),
            ...Object.keys(settlement.transfers_out || {}),
            ...Object.keys(settlement.wastage_recorded || {})
        ]);

        relevantPids.forEach(pid => {
            initialCount[pid] = currentCount[pid] || 0;
        });

        setCountedQuantities(initialCount);
        setShowCountModal(true);
    };

    const handleCountChange = (pid, val) => {
        setCountedQuantities(prev => ({
            ...prev,
            [pid]: parseInt(val) || 0
        }));
    };

    const handleSaveCounts = async () => {
        try {
            await recordShopCount(currentSettlement.id, { items_counted: countedQuantities });
            toast.success('Stock counts saved!');
            setShowCountModal(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save counts');
        }
    };

    const openSettleModal = (settlement) => {
        setCurrentSettlement(settlement);
        setActualCash('');
        setNotes('');
        setShowSettleModal(true);
    };

    const handleSettle = async (e) => {
        e.preventDefault();
        try {
            await settleShop(currentSettlement.id, {
                actual_cash: parseFloat(actualCash),
                notes: notes
            });
            toast.success('Shop settlement completed!');
            setShowSettleModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Settlement failed');
        }
    };

    const viewDetails = async (settlement) => {
        setCurrentSettlement(settlement);
        setShowDetailModal(true);
    };

    const getProductName = (id) => products.find(p => p.id == id)?.name || `ID: ${id}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={40} />
            </div>
        );
    }

    const todaySettlement = settlements.find(s =>
        s.inventory_location_id === shopLocation?.id &&
        formatDate(s.settlement_date) === formatDate(new Date())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Shop Settlement</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Shop Settlement</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="light" color={shiftStatus.color === 'success' ? 'green' : 'orange'}>
                        {shiftStatus.label}
                    </Badge>
                </div>
            </div>

            {/* Reconciliation Concept Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                        <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Stock Reconciliation</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Calculate sales using the formula: <span className="font-bold text-blue-700 dark:text-blue-300">Opening Stock + Inflow (Production/Transfers) - Outflow (Wastage/Transfers) - Closing Count = Sales.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Status Card */}
                <div className="lg:col-span-1 rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">Today's Settlement</h4>

                    {!todaySettlement ? (
                        <div className="py-6 text-center">
                            <Store className="mx-auto mb-4 text-gray-300" size={48} />
                            <p className="text-sm text-gray-500 mb-6">No settlement initiated for today yet.</p>
                            <Button className="w-full" onClick={handleInitiate} startIcon={<Clock size={16} />}>
                                Start Reconciliation
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Status</span>
                                <Badge variant="light" color={todaySettlement.status === 'settled' ? 'green' : 'orange'}>
                                    {todaySettlement.status === 'settled' ? 'Finalized' : 'In Progress'}
                                </Badge>
                            </div>

                            {todaySettlement.status === 'pending' && (
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => openCountModal(todaySettlement)}
                                        startIcon={<Package size={16} />}
                                    >
                                        Record Stock Count
                                    </Button>
                                    <Button
                                        className="w-full"
                                        disabled={!todaySettlement.items_counted}
                                        onClick={() => openSettleModal(todaySettlement)}
                                        startIcon={<CheckCircle size={16} />}
                                    >
                                        Finalize Settlement
                                    </Button>
                                    {!todaySettlement.items_counted && (
                                        <p className="text-[10px] text-center text-orange-500 italic">
                                            * Complete stock count before finalizing
                                        </p>
                                    )}
                                </div>
                            )}

                            {todaySettlement.status === 'settled' && (
                                <div className="rounded-xl bg-green-50 p-4 dark:bg-green-500/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-green-700">Expected Sales</span>
                                        <span className="text-sm font-bold text-green-800">{formatCurrency(todaySettlement.expected_cash)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-green-700">Actual Cash</span>
                                        <span className="text-sm font-bold text-green-800">{formatCurrency(todaySettlement.actual_cash)}</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-green-200">
                                        <Button size="sm" variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-100" onClick={() => viewDetails(todaySettlement)}>
                                            View Report
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">Recent Settlements</h4>
                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader px="px-4">Date</TableCell>
                                    <TableCell isHeader px="px-4">Expected</TableCell>
                                    <TableCell isHeader px="px-4">Actual</TableCell>
                                    <TableCell isHeader px="px-4">Discrepancy</TableCell>
                                    <TableCell isHeader px="px-4">Status</TableCell>
                                    <TableCell isHeader px="px-4 text-right">Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {settlements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                                            No prior settlements found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    settlements.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="px-4 py-3">{formatDate(s.settlement_date)}</TableCell>
                                            <TableCell className="px-4 py-3 font-medium">{formatCurrency(s.expected_cash)}</TableCell>
                                            <TableCell className="px-4 py-3 font-medium">{formatCurrency(s.actual_cash)}</TableCell>
                                            <TableCell className="px-4 py-3">
                                                <span className={`font-bold ${s.discrepancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {s.discrepancy >= 0 ? '+' : ''}{formatCurrency(s.discrepancy)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge variant="light" color={s.status === 'settled' ? 'green' : 'orange'}>
                                                    {s.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-right">
                                                <button onClick={() => viewDetails(s)} className="text-brand-500 hover:underline text-sm">
                                                    View
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Count Modal */}
            <Modal
                isOpen={showCountModal}
                onClose={() => setShowCountModal(false)}
                title="End of Day Stock Count"
                size="lg"
            >
                <div className="p-6">
                    <div className="mb-6 rounded-xl bg-orange-50 p-4 dark:bg-orange-500/10">
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                            Enter the quantities of each item remaining in the shop. This will be used to calculate today's sales.
                        </p>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                        {Object.keys(countedQuantities).length === 0 ? (
                            <p className="text-center py-10 text-gray-500">No active products to count</p>
                        ) : (
                            Object.keys(countedQuantities).map(pid => (
                                <div key={pid} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-white/[0.03]">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white/90">{getProductName(pid)}</p>
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-[10px] text-gray-500">Op: {currentSettlement.opening_inventory?.[pid] || 0}</span>
                                            <span className="text-[10px] text-green-500">+In: {(currentSettlement.production_received?.[pid] || 0) + (currentSettlement.transfers_in?.[pid] || 0)}</span>
                                            <span className="text-[10px] text-red-500">-Out: {(currentSettlement.transfers_out?.[pid] || 0) + (currentSettlement.wastage_recorded?.[pid] || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={countedQuantities[pid]}
                                            onChange={(e) => handleCountChange(pid, e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCountModal(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSaveCounts} startIcon={<CheckIcon size={16} />}>
                            Save Stock Count
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Final Settle Modal */}
            <Modal
                isOpen={showSettleModal}
                onClose={() => setShowSettleModal(false)}
                title="Finalize Shop Settlement"
            >
                <form onSubmit={handleSettle} className="p-6">
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10 text-center">
                            <p className="text-sm text-brand-700 dark:text-brand-300 mb-1">Stock Count has been recorded.</p>
                            <p className="text-xs text-gray-500">Enter cash collection to finish reconciliation.</p>
                        </div>

                        <div>
                            <Label htmlFor="shop_actual_cash">Actual Cash Collection (LKR) *</Label>
                            <Input
                                id="shop_actual_cash"
                                type="number"
                                placeholder="Enter collected cash"
                                step="0.01"
                                min="0"
                                value={actualCash}
                                onChange={(e) => setActualCash(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="shop_notes">Notes</Label>
                            <textarea
                                id="shop_notes"
                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03]"
                                placeholder="Discrepancy reasons, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="3"
                            />
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-amber-100 p-4 dark:border-amber-500/20">
                            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                FINALIZING: This will calculate sales across all items and lock the record for today.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowSettleModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" startIcon={<CheckCircle size={16} />}>
                            Finalize & Save
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Details Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Settlement Report: ${currentSettlement ? formatDate(currentSettlement.settlement_date) : ''}`}
                size="xl"
            >
                <div className="p-6">
                    {currentSettlement && (
                        <div className="space-y-6">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                                    <p className="text-[10px] uppercase text-gray-500 mb-1">Expected Sales</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentSettlement.expected_cash)}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                                    <p className="text-[10px] uppercase text-gray-500 mb-1">Actual Cash</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentSettlement.actual_cash)}</p>
                                </div>
                                <div className={`rounded-xl p-4 ${currentSettlement.discrepancy >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} dark:bg-white/[0.03]`}>
                                    <p className="text-[10px] uppercase mb-1">Discrepancy</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentSettlement.discrepancy)}</p>
                                </div>
                            </div>

                            {/* Itemized Sales Table */}
                            <div>
                                <h5 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <ListIcon size={16} className="text-brand-500" />
                                    Calculated Item Sales
                                </h5>
                                <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.03]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableCell isHeader px="px-4">Product</TableCell>
                                                <TableCell isHeader px="px-4 text-center">Movement (Op+In-Out)</TableCell>
                                                <TableCell isHeader px="px-4 text-center">Closing</TableCell>
                                                <TableCell isHeader px="px-4 text-center">Sold</TableCell>
                                                <TableCell isHeader px="px-4 text-right">Subtotal</TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentSettlement.items_sold?.map((item, idx) => {
                                                const pid = item.product_id;
                                                const op = currentSettlement.opening_inventory?.[pid] || 0;
                                                const inflow = (currentSettlement.production_received?.[pid] || 0) + (currentSettlement.transfers_in?.[pid] || 0);
                                                const outflow = (currentSettlement.transfers_out?.[pid] || 0) + (currentSettlement.wastage_recorded?.[pid] || 0);
                                                const counted = currentSettlement.items_counted?.[pid] || 0;

                                                return (
                                                    <TableRow key={idx}>
                                                        <TableCell className="px-4 py-2 text-xs font-semibold">{item.product_name}</TableCell>
                                                        <TableCell className="px-4 py-2 text-xs text-center">
                                                            {op} + {inflow} - {outflow} = {op + inflow - outflow}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-2 text-xs text-center font-bold">{counted}</TableCell>
                                                        <TableCell className="px-4 py-2 text-xs text-center font-bold text-brand-600">{item.quantity_sold}</TableCell>
                                                        <TableCell className="px-4 py-2 text-xs text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {currentSettlement.notes && (
                                <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.03]">
                                    <p className="text-[10px] uppercase text-gray-500 mb-2">Notes</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{currentSettlement.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8">
                        <Button variant="outline" className="w-full" onClick={() => setShowDetailModal(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Internal icons helper since Sidebar uses components/icons but pages uses lucide or local imports.
// I'll used lucide-react ones for simplicity here as they are already imported.
const ListIcon = ({ size, className }) => <Package size={size} className={className} />;

export default ShopSettlement;
