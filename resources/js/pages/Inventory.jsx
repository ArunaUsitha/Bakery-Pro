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
    Calendar
} from 'lucide-react';
import {
    getInventory,
    getLocations,
    transferBetweenLocations,
    getLocationInventory
} from '../utils/api';
import { formatCurrency, formatDate, formatNumber, isExpired } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

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

    const shop = locations.find(l => l.type === 'shop');
    const vehicles = locations.filter(l => l.type === 'vehicle');

    return (
        <div className="inventory-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Inventory</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Inventory</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openTransferModal} disabled={inventory.length === 0}>
                    <ArrowRightLeft size={18} />
                    Transfer Stock
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Warehouse size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Items</div>
                        <div className="stat-value">{formatNumber(totalItems)}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Product Types</div>
                        <div className="stat-value">{inventory.length}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Store size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Inventory Value</div>
                        <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(totalValue)}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Expiring Today</div>
                        <div className="stat-value">{expiringItems.length}</div>
                    </div>
                </div>
            </div>

            {/* Location Tabs */}
            <div className="card mb-6">
                <div className="tabs">
                    {locations.map(location => (
                        <button
                            key={location.id}
                            className={`tab ${selectedLocation === location.id ? 'active' : ''}`}
                            onClick={() => setSelectedLocation(location.id)}
                        >
                            {location.type === 'shop' ? <Store size={16} /> : <Truck size={16} />}
                            <span className="ml-2">{location.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">
                        {currentLocation?.type === 'shop' ? <Store size={20} className="text-primary" /> : <Truck size={20} className="text-primary" />}
                        {currentLocation?.name || 'All Locations'} Inventory
                    </h4>
                    <span className="text-muted text-sm">
                        {inventory.length} product types • {formatNumber(totalItems)} total items
                    </span>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Production Date</th>
                                <th>Expiry Date</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-6">
                                        <div className="spinner mx-auto"></div>
                                    </td>
                                </tr>
                            ) : inventory.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <Warehouse size={40} />
                                            </div>
                                            <h3>No inventory at this location</h3>
                                            <p>Transfer stock from production or another location</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                inventory.map((item) => {
                                    const expired = isExpired(item.expiry_date);
                                    const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr key={item.id} className={expired ? 'opacity-50' : ''}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar sm">{item.product.name.charAt(0)}</div>
                                                    <span className="font-medium">{item.product.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${item.product.category === 'day_food' ? 'badge-warning' : 'badge-info'}`}>
                                                    {item.product.category === 'day_food' ? 'Day Food' : 'Packed'}
                                                </span>
                                            </td>
                                            <td className="font-semibold">{formatNumber(item.quantity)}</td>
                                            <td>{formatDate(item.production_date)}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-muted" />
                                                    {formatDate(item.expiry_date)}
                                                </div>
                                            </td>
                                            <td className="font-semibold">{formatCurrency(item.quantity * item.product.selling_price)}</td>
                                            <td>
                                                {expired ? (
                                                    <span className="badge badge-danger">Expired</span>
                                                ) : daysLeft === 0 ? (
                                                    <span className="badge badge-warning">Expires Today</span>
                                                ) : daysLeft === 1 ? (
                                                    <span className="badge badge-warning">1 Day Left</span>
                                                ) : (
                                                    <span className="badge badge-success">{daysLeft} Days Left</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Transfer Stock</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowTransferModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row mb-4">
                                <div className="form-group">
                                    <label className="form-label">From Location</label>
                                    <select
                                        className="form-select"
                                        value={transferData.from_location_id}
                                        onChange={(e) => setTransferData({
                                            ...transferData,
                                            from_location_id: e.target.value,
                                            transfer_type: locations.find(l => l.id == e.target.value)?.type === 'vehicle'
                                                ? 'vehicle_to_shop'
                                                : 'shop_to_vehicle'
                                        })}
                                    >
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">To Location</label>
                                    <select
                                        className="form-select"
                                        value={transferData.to_location_id}
                                        onChange={(e) => setTransferData({ ...transferData, to_location_id: e.target.value })}
                                    >
                                        {locations.filter(l => l.id != transferData.from_location_id).map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Available</th>
                                            <th>Transfer Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferData.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="font-medium">{item.product_name}</td>
                                                <td>{item.available}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '100px' }}
                                                        min="0"
                                                        max={item.available}
                                                        value={item.quantity}
                                                        onChange={(e) => updateTransferQty(idx, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleTransfer}>
                                <ArrowRightLeft size={16} />
                                Transfer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Inventory;
