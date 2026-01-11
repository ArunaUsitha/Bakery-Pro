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
    Wallet
} from 'lucide-react';
import {
    getLocations,
    getSettlements,
    initiateSettlement,
    settleVehicle
} from '../utils/api';
import { formatCurrency, formatNumber, formatDate, getStatusBadge, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

function VehicleSettlement() {
    const [locations, setLocations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [currentSettlement, setCurrentSettlement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');
    const toast = useToast();
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="settlement-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Vehicle Settlement</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Vehicle Settlement</span>
                    </div>
                </div>
                <div className="time-indicator">
                    <span className={`dot ${shiftStatus.color}`}></span>
                    <span>{shiftStatus.label}</span>
                </div>
            </div>

            {/* Info Banner */}
            <div className="card mb-6" style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #f59e0b'
            }}>
                <div className="card-body flex items-center gap-4">
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="font-semibold text-warning-700">End of Day Settlement</div>
                        <div className="text-sm text-warning-600">
                            At the end of each day, settle delivery vehicles. Items are returned to shop and cash is verified.
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Cards */}
            <div className="grid-3 mb-6">
                {vehicles.map(vehicle => {
                    const settlement = getVehicleSettlement(vehicle.id);
                    const isSettled = settlement?.status === 'settled';
                    const isPending = settlement?.status === 'pending';

                    return (
                        <div key={vehicle.id} className={`card ${selectedVehicle === vehicle.id ? 'border-primary' : ''}`}
                            style={{
                                borderColor: selectedVehicle === vehicle.id ? 'var(--primary-500)' : undefined,
                                cursor: 'pointer'
                            }}
                            onClick={() => setSelectedVehicle(vehicle.id)}
                        >
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`stat-icon ${isSettled ? 'success' : isPending ? 'warning' : 'info'}`}>
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{vehicle.name}</h4>
                                            <span className="text-sm text-muted">{vehicle.description}</span>
                                        </div>
                                    </div>
                                    <span className={`badge ${isSettled ? 'badge-success' : isPending ? 'badge-warning' : 'badge-secondary'}`}>
                                        {isSettled ? 'Settled' : isPending ? 'Pending' : 'Not Started'}
                                    </span>
                                </div>

                                {settlement && (
                                    <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-color-light)' }}>
                                        <div className="grid-2 gap-3">
                                            <div className="p-3 rounded-lg bg-tertiary">
                                                <div className="text-xs text-muted mb-1">Expected Cash</div>
                                                <div className="font-bold">{formatCurrency(settlement.expected_cash)}</div>
                                            </div>
                                            {isSettled && (
                                                <div className="p-3 rounded-lg bg-tertiary">
                                                    <div className="text-xs text-muted mb-1">Actual Cash</div>
                                                    <div className="font-bold">{formatCurrency(settlement.actual_cash)}</div>
                                                </div>
                                            )}
                                        </div>

                                        {isSettled && settlement.discrepancy !== 0 && (
                                            <div className={`p-3 rounded-lg mt-3 ${settlement.discrepancy >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}
                                                style={{
                                                    background: settlement.discrepancy >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={16} className={settlement.discrepancy >= 0 ? 'text-success' : 'text-danger'} />
                                                    <span className={`font-semibold ${settlement.discrepancy >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        Discrepancy: {settlement.discrepancy >= 0 ? '+' : ''}{formatCurrency(settlement.discrepancy)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {isPending && (
                                            <button
                                                className="btn btn-primary w-full mt-4"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSettleModal(settlement);
                                                }}
                                            >
                                                <CheckCircle size={16} />
                                                Settle Now
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!settlement && (
                                    <button
                                        className="btn btn-outline w-full mt-4"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleInitiateSettlement();
                                        }}
                                    >
                                        <Clock size={16} />
                                        Initiate Settlement
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Process Flow */}
            <div className="card mb-6">
                <div className="card-header">
                    <h4 className="card-title">
                        <Truck size={20} className="text-primary" />
                        Settlement Process
                    </h4>
                </div>
                <div className="card-body">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 p-4 rounded-xl bg-tertiary text-center">
                            <div className="stat-icon primary mx-auto mb-3" style={{ width: 48, height: 48 }}>
                                <Truck size={20} />
                            </div>
                            <h5 className="font-semibold mb-1">1. Vehicle Returns</h5>
                            <p className="text-sm text-muted">Driver returns with remaining items</p>
                        </div>
                        <ArrowRight size={24} className="text-muted" />
                        <div className="flex-1 p-4 rounded-xl bg-tertiary text-center">
                            <div className="stat-icon warning mx-auto mb-3" style={{ width: 48, height: 48 }}>
                                <Package size={20} />
                            </div>
                            <h5 className="font-semibold mb-1">2. Count Items</h5>
                            <p className="text-sm text-muted">Count unsold items returned</p>
                        </div>
                        <ArrowRight size={24} className="text-muted" />
                        <div className="flex-1 p-4 rounded-xl bg-tertiary text-center">
                            <div className="stat-icon info mx-auto mb-3" style={{ width: 48, height: 48 }}>
                                <Wallet size={20} />
                            </div>
                            <h5 className="font-semibold mb-1">3. Verify Cash</h5>
                            <p className="text-sm text-muted">Count and verify cash collected</p>
                        </div>
                        <ArrowRight size={24} className="text-muted" />
                        <div className="flex-1 p-4 rounded-xl bg-tertiary text-center">
                            <div className="stat-icon success mx-auto mb-3" style={{ width: 48, height: 48 }}>
                                <Store size={20} />
                            </div>
                            <h5 className="font-semibold mb-1">4. Return to Shop</h5>
                            <p className="text-sm text-muted">Items transferred back to shop</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settlement History */}
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">
                        <Clock size={20} className="text-primary" />
                        Today's Settlements
                    </h4>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Items Sent</th>
                                <th>Items Returned</th>
                                <th>Expected Cash</th>
                                <th>Actual Cash</th>
                                <th>Discrepancy</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaySettlements.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <Truck size={40} />
                                            </div>
                                            <h3>No settlements today</h3>
                                            <p>Initiate settlement when vehicles return</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                todaySettlements.map(settlement => {
                                    const vehicle = vehicles.find(v => v.id === settlement.inventory_location_id);
                                    const itemsSent = settlement.items_sent?.length || 0;
                                    const itemsReturned = settlement.items_returned?.length || 0;

                                    return (
                                        <tr key={settlement.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar sm">
                                                        <Truck size={14} />
                                                    </div>
                                                    <span className="font-medium">{vehicle?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td>{itemsSent} types</td>
                                            <td>{itemsReturned} types</td>
                                            <td className="font-semibold">{formatCurrency(settlement.expected_cash)}</td>
                                            <td className="font-semibold">
                                                {settlement.actual_cash !== null ? formatCurrency(settlement.actual_cash) : '-'}
                                            </td>
                                            <td>
                                                {settlement.discrepancy !== null ? (
                                                    <span className={`font-semibold ${settlement.discrepancy >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {settlement.discrepancy >= 0 ? '+' : ''}{formatCurrency(settlement.discrepancy)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(settlement.status).className}`}>
                                                    {getStatusBadge(settlement.status).label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Settle Modal */}
            {showSettleModal && currentSettlement && (
                <div className="modal-overlay" onClick={() => setShowSettleModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Settle Vehicle</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowSettleModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSettle}>
                            <div className="modal-body">
                                <div className="p-4 rounded-xl bg-tertiary mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Truck size={20} className="text-primary" />
                                        <span className="font-semibold">
                                            {locations.find(l => l.id === currentSettlement.inventory_location_id)?.name}
                                        </span>
                                    </div>
                                    <div className="grid-2 gap-3">
                                        <div>
                                            <div className="text-sm text-muted">Items Sent</div>
                                            <div className="font-semibold">{currentSettlement.items_sent?.length || 0} types</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted">Items Sold</div>
                                            <div className="font-semibold">{currentSettlement.items_sold?.length || 0} types</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-primary-50 mb-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Expected Cash:</span>
                                        <span className="text-xl font-bold">{formatCurrency(currentSettlement.expected_cash)}</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Actual Cash Collected (LKR) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter actual amount"
                                        step="0.01"
                                        min="0"
                                        value={actualCash}
                                        onChange={(e) => setActualCash(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Any notes about discrepancy or issues..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows="3"
                                    />
                                </div>

                                {actualCash && (
                                    <div className={`p-3 rounded-lg ${parseFloat(actualCash) >= currentSettlement.expected_cash ? 'bg-success-50' : 'bg-danger-50'}`}
                                        style={{
                                            background: parseFloat(actualCash) >= currentSettlement.expected_cash ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <span>Discrepancy:</span>
                                            <span className={`font-bold ${parseFloat(actualCash) >= currentSettlement.expected_cash ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(parseFloat(actualCash) - currentSettlement.expected_cash)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 rounded-lg bg-tertiary mt-4">
                                    <div className="flex items-center gap-2 text-sm text-muted">
                                        <Store size={16} />
                                        <span>Remaining items will be automatically transferred back to the shop.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSettleModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <CheckCircle size={16} />
                                    Complete Settlement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VehicleSettlement;
