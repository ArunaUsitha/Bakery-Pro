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
    Store
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

    const handleProcessExpired = async () => {
        if (!confirm('This will remove all expired day foods from the selected location. Continue?')) return;

        try {
            const response = await processExpiredFoods(selectedLocation);
            toast.success(`Processed ${response.data.processed_items?.length || 0} expired items`);
            fetchData();
            fetchLocationInventory();
        } catch (error) {
            toast.error('Failed to process expired foods');
        }
    };

    const currentLocation = locations.find(l => l.id === selectedLocation);
    const totalWastageCost = wastages.reduce((sum, w) => sum + parseFloat(w.cost), 0);
    const totalWastageQty = wastages.reduce((sum, w) => sum + w.quantity, 0);

    const expiringItems = inventory.filter(item => {
        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 0;
    });

    return (
        <div className="wastage-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Wastage Management</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Wastage</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Record Wastage
                    </button>
                </div>
            </div>

            {/* 12PM Reminder */}
            <div className="card mb-6" style={{
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                border: '1px solid #ef4444'
            }}>
                <div className="card-body flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon danger">
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="font-semibold text-danger-700">12PM - Day Food Expiry Check</div>
                            <div className="text-sm text-danger-600">
                                At 12PM each day, take note of remaining day foods and remove expired items.
                            </div>
                        </div>
                    </div>
                    {expiringItems.length > 0 && (
                        <button className="btn btn-danger" onClick={handleProcessExpired}>
                            <Play size={16} />
                            Process {expiringItems.length} Expired Items
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card danger">
                    <div className="stat-icon danger">
                        <Trash2 size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Today's Wastage</div>
                        <div className="stat-value">{formatCurrency(totalWastageCost)}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Items Wasted</div>
                        <div className="stat-value">{formatNumber(totalWastageQty)}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Wastage Records</div>
                        <div className="stat-value">{wastages.length}</div>
                    </div>
                </div>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Expiring Now</div>
                        <div className="stat-value">{expiringItems.length}</div>
                    </div>
                </div>
            </div>

            {/* Location Selection */}
            <div className="card mb-6">
                <div className="tabs">
                    {locations.map(location => (
                        <button
                            key={location.id}
                            className={`tab ${selectedLocation === location.id ? 'active' : ''}`}
                            onClick={() => setSelectedLocation(location.id)}
                        >
                            <Store size={16} />
                            <span className="ml-2">{location.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid-2">
                {/* Expiring Items */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <AlertTriangle size={20} className="text-warning" />
                            Expired / Expiring Items
                        </h4>
                    </div>
                    <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Expiry</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.filter(item => {
                                    const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                    return daysLeft <= 1;
                                }).length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center p-6 text-muted">
                                            No expiring items at this location
                                        </td>
                                    </tr>
                                ) : (
                                    inventory.filter(item => {
                                        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        return daysLeft <= 1;
                                    }).map(item => {
                                        const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="avatar sm">{item.product.name.charAt(0)}</div>
                                                        <span className="font-medium">{item.product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="font-semibold">{item.quantity}</td>
                                                <td>{formatDate(item.expiry_date)}</td>
                                                <td>
                                                    <span className={`badge ${daysLeft <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                                                        {daysLeft <= 0 ? 'Expired' : '1 Day Left'}
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

                {/* Today's Wastage Records */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <Trash2 size={20} className="text-danger" />
                            Today's Wastage Records
                        </h4>
                    </div>
                    <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Cost</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wastages.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center p-6 text-muted">
                                            No wastage recorded today
                                        </td>
                                    </tr>
                                ) : (
                                    wastages.map(wastage => (
                                        <tr key={wastage.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="avatar sm" style={{ background: 'var(--gradient-danger)' }}>
                                                        {wastage.product.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium">{wastage.product.name}</span>
                                                </div>
                                            </td>
                                            <td className="font-semibold">{wastage.quantity}</td>
                                            <td className="text-danger font-semibold">{formatCurrency(wastage.cost)}</td>
                                            <td>
                                                <span className="badge badge-secondary">{wastage.reason}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Wastage Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Record Wastage</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRecordWastage}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product *</label>
                                    <select
                                        className="form-select"
                                        value={formData.product_id}
                                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a product</option>
                                        {inventory.filter(inv => inv.quantity > 0).map(inv => (
                                            <option key={inv.product_id} value={inv.product_id}>
                                                {inv.product.name} ({inv.quantity} available)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter quantity"
                                        min="1"
                                        max={inventory.find(i => i.product_id == formData.product_id)?.quantity || 999}
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason</label>
                                    <select
                                        className="form-select"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    >
                                        <option value="expired">Expired</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="quality_issue">Quality Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Additional notes..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                {formData.product_id && formData.quantity && (
                                    <div className="p-3 rounded-lg bg-danger-50" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                        <div className="flex justify-between">
                                            <span>Estimated Cost:</span>
                                            <span className="font-bold text-danger">
                                                {formatCurrency(
                                                    (products.find(p => p.id == formData.product_id)?.production_cost || 0) * parseInt(formData.quantity)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-danger">
                                    <Trash2 size={16} />
                                    Record Wastage
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Wastage;
