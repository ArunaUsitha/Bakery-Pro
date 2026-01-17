import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck,
    ChevronRight,
    DollarSign,
    Package,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    X,
    Clock,
    Store,
    Wallet,
    Info,
    Loader2
} from 'lucide-react';
import {
    getLocations,
    getSettlements,
    initiateSettlement,
    recordReturn,
    settleVehicle
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

function VehicleSettlement() {
    const [locations, setLocations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [currentSettlement, setCurrentSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showCountModal, setShowCountModal] = useState(false);
    const [returnedItems, setReturnedItems] = useState([]);
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
            const [locRes, settRes] = await Promise.all([
                getLocations(),
                getSettlements({ date: new Date().toISOString().split('T')[0] })
            ]);
            setLocations(locRes.data);
            setVehicles(locRes.data.filter(l => l.type === 'vehicle'));
            setSettlements(settRes.data.data || []);

            if (locRes.data.filter(l => l.type === 'vehicle').length > 0) {
                setSelectedVehicle(locRes.data.filter(l => l.type === 'vehicle')[0].id);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateSettlement = async () => {
        if (!selectedVehicle) {
            toast.warning('Please select a vehicle');
            return;
        }

        try {
            const response = await initiateSettlement(selectedVehicle);
            setCurrentSettlement(response.data);
            toast.success('Settlement initiated');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to initiate settlement');
        }
    };

    const openSettleModal = (settlement) => {
        setCurrentSettlement(settlement);
        setActualCash(settlement.expected_cash?.toString() || '');
        setShowSettleModal(true);
    };

    const openCountModal = (settlement) => {
        setCurrentSettlement(settlement);
        // Initialize returned items from the settlement data
        const items = Array.isArray(settlement.items_returned) ? settlement.items_returned : [];
        setReturnedItems(items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity_sent: item.quantity_sent || item.quantity || 0,
            quantity_returned: item.quantity_returned ?? item.quantity ?? 0,
        })));
        setShowCountModal(true);
    };

    const handleReturnedQuantityChange = (index, value) => {
        const updated = [...returnedItems];
        updated[index].quantity_returned = parseInt(value) || 0;
        setReturnedItems(updated);
    };

    const handleSaveReturnedItems = async () => {
        try {
            await recordReturn(currentSettlement.id, { items_returned: returnedItems });
            toast.success('Return counts saved!');
            setShowCountModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save return counts');
        }
    };

    const handleSettle = async (e) => {
        e.preventDefault();
        try {
            await settleVehicle(currentSettlement.id, {
                actual_cash: parseFloat(actualCash),
                notes: notes
            });
            toast.success('Vehicle settled successfully! Items returned to shop.');
            setShowSettleModal(false);
            setActualCash('');
            setNotes('');
            setCurrentSettlement(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Settlement failed');
        }
    };

    const todaySettlements = settlements.filter(s =>
        formatDate(s.settlement_date) === formatDate(new Date())
    );

    const getVehicleSettlement = (vehicleId) => {
        return todaySettlements.find(s => s.inventory_location_id === vehicleId);
    };

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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Vehicle Settlement</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Vehicle Settlement</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-2 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className={`h-2.5 w-2.5 rounded-full bg-${shiftStatus.color === 'success' ? 'green' : shiftStatus.color === 'warning' ? 'orange' : 'gray'}-500 animate-pulse`}></div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{shiftStatus.label}</span>
                </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                        <Clock className="text-amber-600 dark:text-amber-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">End of Day Settlement</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            At the end of each day, settle delivery vehicles. Unsold items are returned to the shop inventory and cash collections are verified for accuracy.
                        </p>
                    </div>
                </div>
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map(vehicle => {
                    const settlement = getVehicleSettlement(vehicle.id);
                    const isSettled = settlement?.status === 'settled';
                    const isPending = settlement?.status === 'pending';
                    const isSelected = selectedVehicle === vehicle.id;

                    return (
                        <div
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle.id)}
                            className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg ${isSelected ? 'border-brand-500 bg-brand-50/30' : 'border-gray-100 bg-white dark:border-white/[0.03] dark:bg-white/[0.03]'} cursor-pointer`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isSettled ? 'bg-green-50 text-green-500 dark:bg-green-500/10' : isPending ? 'bg-orange-50 text-orange-500 dark:bg-orange-500/10' : 'bg-brand-50 text-brand-500 dark:bg-brand-500/10'}`}>
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white/90">{vehicle.name}</h4>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{vehicle.description}</p>
                                        </div>
                                    </div>
                                    <Badge variant="light" color={isSettled ? 'green' : isPending ? 'orange' : 'gray'}>
                                        {isSettled ? 'Settled' : isPending ? 'Pending' : 'Available'}
                                    </Badge>
                                </div>

                                {settlement ? (
                                    <div className="mt-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Expected</p>
                                                <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white/90">{formatCurrency(settlement.expected_cash)}</p>
                                            </div>
                                            {isSettled && (
                                                <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Actual</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white/90">{formatCurrency(settlement.actual_cash)}</p>
                                                </div>
                                            )}
                                        </div>

                                        {isSettled && settlement.discrepancy !== 0 && (
                                            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${settlement.discrepancy >= 0 ? 'bg-green-50 text-green-700 dark:bg-green-500/5 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/5 dark:text-red-400'}`}>
                                                <AlertTriangle size={16} />
                                                Discrepancy: {settlement.discrepancy >= 0 ? '+' : ''}{formatCurrency(settlement.discrepancy)}
                                            </div>
                                        )}

                                        {isPending && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openCountModal(settlement);
                                                    }}
                                                    startIcon={<Package size={16} />}
                                                >
                                                    Count Items
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="flex-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openSettleModal(settlement);
                                                    }}
                                                    startIcon={<CheckIcon className="h-4 w-4" />}
                                                >
                                                    Settle
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInitiateSettlement();
                                            }}
                                            startIcon={<Clock size={16} />}
                                        >
                                            Initiate Settlement
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Process Flow */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                    <Truck size={20} className="text-brand-500" />
                    Settlement Process
                </h4>

                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between lg:px-10">
                    <div className="flex flex-1 flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                            <Truck size={24} />
                        </div>
                        <h5 className="font-semibold text-gray-800 dark:text-white/90">Vehicle Returns</h5>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Driver returns with unsold items</p>
                    </div>

                    <ArrowRight className="hidden rotate-90 text-gray-300 md:block md:rotate-0" size={24} />

                    <div className="flex flex-1 flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                            <BoxIconLine size={24} />
                        </div>
                        <h5 className="font-semibold text-gray-800 dark:text-white/90">Count Items</h5>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Verify unsold inventory</p>
                    </div>

                    <ArrowRight className="hidden rotate-90 text-gray-300 md:block md:rotate-0" size={24} />

                    <div className="flex flex-1 flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10">
                            <Wallet size={24} />
                        </div>
                        <h5 className="font-semibold text-gray-800 dark:text-white/90">Verify Cash</h5>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Account for cash collections</p>
                    </div>

                    <ArrowRight className="hidden rotate-90 text-gray-300 md:block md:rotate-0" size={24} />

                    <div className="flex flex-1 flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-500 dark:bg-green-500/10">
                            <Store size={24} />
                        </div>
                        <h5 className="font-semibold text-gray-800 dark:text-white/90">Restock Items</h5>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Transfer back to main shop</p>
                    </div>
                </div>
            </div>

            {/* Today's Table */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                    <Clock size={20} className="text-brand-500" />
                    Today's Settlements
                </h4>

                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell isHeader px="px-4">Vehicle</TableCell>
                                <TableCell isHeader px="px-4">Items</TableCell>
                                <TableCell isHeader px="px-4">Expected Cash</TableCell>
                                <TableCell isHeader px="px-4">Actual Cash</TableCell>
                                <TableCell isHeader px="px-4">Discrepancy</TableCell>
                                <TableCell isHeader px="px-4">Status</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {todaySettlements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Truck className="mb-4 text-gray-300" size={48} />
                                            <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">No settlements today</h5>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Active settlements will appear here</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                todaySettlements.map(settlement => {
                                    const vehicle = locations.find(v => v.id === settlement.inventory_location_id);
                                    const itemsSent = settlement.items_sent?.length || 0;
                                    const itemsReturned = settlement.items_returned?.length || 0;
                                    const badge = getStatusBadge(settlement.status);

                                    return (
                                        <TableRow key={settlement.id}>
                                            <TableCell className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-white/5">
                                                        <Truck size={16} />
                                                    </div>
                                                    <span className="font-semibold text-gray-800 dark:text-white/90">{vehicle?.name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{itemsSent} sent</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{itemsReturned} returned</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 font-bold text-gray-800 dark:text-white/90">
                                                {formatCurrency(settlement.expected_cash)}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 font-bold text-gray-800 dark:text-white/90">
                                                {settlement.actual_cash !== null ? formatCurrency(settlement.actual_cash) : '-'}
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                {settlement.discrepancy !== null ? (
                                                    <span className={`font-bold ${settlement.discrepancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {settlement.discrepancy >= 0 ? '+' : ''}{formatCurrency(settlement.discrepancy)}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <Badge
                                                    variant="light"
                                                    color={settlement.status === 'settled' ? 'green' : settlement.status === 'pending' ? 'orange' : 'gray'}
                                                >
                                                    {badge.label}
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

            {/* Settle Modal */}
            <Modal
                isOpen={showSettleModal}
                onClose={() => setShowSettleModal(false)}
                title="Complete Settlement"
            >
                {currentSettlement && (
                    <form onSubmit={handleSettle} className="p-6">
                        <div className="space-y-6">
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm dark:bg-white/5">
                                        <Truck size={20} />
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-white/90">
                                        {locations.find(l => l.id === currentSettlement.inventory_location_id)?.name}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Items Sent</p>
                                        <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white/90">{currentSettlement.items_sent?.length || 0} types</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Items Sold</p>
                                        <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white/90">{currentSettlement.items_sold?.length || 0} types</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-brand-50 p-5 dark:bg-brand-500/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Expected Cash Transfer:</span>
                                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(currentSettlement.expected_cash)}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="actual_cash">Actual Cash Collected (LKR) *</Label>
                                    <Input
                                        id="actual_cash"
                                        type="number"
                                        placeholder="Enter actual amount"
                                        step="0.01"
                                        min="0"
                                        value={actualCash}
                                        onChange={(e) => setActualCash(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                        placeholder="Any notes about discrepancy or issues..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {actualCash && (
                                <div className={`flex items-center justify-between rounded-xl p-4 font-bold ${parseFloat(actualCash) >= currentSettlement.expected_cash ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        <span>Discrepancy:</span>
                                    </div>
                                    <span className="text-lg">
                                        {formatCurrency(parseFloat(actualCash) - currentSettlement.expected_cash)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 dark:border-white/[0.03]">
                                <Store size={20} className="shrink-0 text-gray-400" />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Remaining items on the vehicle will be automatically transferred back to the shop's inventory upon completion.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowSettleModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" startIcon={<CheckIcon className="h-4 w-4" />}>
                                Complete Settlement
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Count Items Modal */}
            <Modal
                isOpen={showCountModal}
                onClose={() => setShowCountModal(false)}
                className="max-w-lg"
            >
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Count Returned Items</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Verify the actual quantity of items returned from the vehicle.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {returnedItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No items to count
                            </div>
                        ) : (
                            returnedItems.map((item, index) => (
                                <div key={item.product_id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-white/[0.03]">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white/90">{item.product_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Sent: {item.quantity_sent} units
                                        </p>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="0"
                                            max={item.quantity_sent}
                                            value={item.quantity_returned}
                                            onChange={(e) => handleReturnedQuantityChange(index, e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCountModal(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSaveReturnedItems} startIcon={<CheckIcon className="h-4 w-4" />}>
                            Save Counts
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default VehicleSettlement;
