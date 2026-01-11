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
    Trash2
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

    return (
        <div className="sales-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Sales</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Sales</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="time-indicator">
                        <span className={`dot ${shiftStatus.color}`}></span>
                        <span>{shiftStatus.label}</span>
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

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <div className="stat-card primary">
                            <div className="stat-icon primary">
                                <ShoppingCart size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Items Sold</div>
                                <div className="stat-value">{sale?.items?.length || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon success">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Total Sales</div>
                                <div className="stat-value">{formatCurrency(sale?.total_amount || 0)}</div>
                            </div>
                        </div>
                        <div className="stat-card info">
                            <div className="stat-icon info">
                                <Wallet size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Expected Cash</div>
                                <div className="stat-value">{formatCurrency(sale?.expected_amount || 0)}</div>
                            </div>
                        </div>
                        <div className={`stat-card ${sale?.discrepancy && sale?.discrepancy < 0 ? 'danger' : 'warning'}`}>
                            <div className={`stat-icon ${sale?.discrepancy && sale?.discrepancy < 0 ? 'danger' : 'warning'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Discrepancy</div>
                                <div className="stat-value">
                                    {sale?.discrepancy !== null ? formatCurrency(sale.discrepancy) : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shop Info Banner */}
                    {isShop && (
                        <div className="card mb-6" style={{
                            background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                            border: '1px solid #6366f1'
                        }}>
                            <div className="card-body flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Store size={24} className="text-primary" />
                                    <div>
                                        <div className="font-semibold text-primary-700">Shop Cash Collection</div>
                                        <div className="text-sm text-primary-600">
                                            Cash collection is done at 8PM each day. Record actual collected amount.
                                        </div>
                                    </div>
                                </div>
                                {sale?.status === 'open' && sale?.items?.length > 0 && (
                                    <button className="btn btn-primary" onClick={() => setShowCollectModal(true)}>
                                        <Wallet size={16} />
                                        Collect Cash (8PM)
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sales Content */}
                    <div className="grid-2">
                        {/* Sale Items */}
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h4 className="card-title">
                                    <ShoppingCart size={20} className="text-primary" />
                                    Today's Sales - {currentLocation?.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                    {sale && (
                                        <span className={`badge ${getStatusBadge(sale.status).className}`}>
                                            {getStatusBadge(sale.status).label}
                                        </span>
                                    )}
                                    {sale?.status === 'open' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                                            <Plus size={16} />
                                            Add Sale
                                        </button>
                                    )}
                                    {sale?.status === 'verified' && (
                                        <button className="btn btn-success btn-sm" onClick={handleCloseSale}>
                                            <CheckCircle size={16} />
                                            Close Sale
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!sale?.items?.length ? (
                                            <tr>
                                                <td colSpan="4">
                                                    <div className="empty-state">
                                                        <div className="empty-state-icon">
                                                            <ShoppingCart size={40} />
                                                        </div>
                                                        <h3>No sales yet today</h3>
                                                        <p>Record sales as customers purchase items</p>
                                                        {sale?.status === 'open' && (
                                                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                                                <Plus size={18} />
                                                                Record First Sale
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            sale.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar sm">{item.product.name.charAt(0)}</div>
                                                            <span className="font-medium">{item.product.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="font-semibold">{formatNumber(item.quantity)}</td>
                                                    <td>{formatCurrency(item.unit_price)}</td>
                                                    <td className="font-semibold text-success">{formatCurrency(item.total_price)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {sale?.items?.length > 0 && (
                                        <tfoot>
                                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                                                <td colSpan="3" className="text-right font-semibold">Grand Total:</td>
                                                <td className="font-bold text-lg text-success">
                                                    {formatCurrency(sale.total_amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Cash Collection Summary */}
                    {sale?.actual_amount !== null && (
                        <div className="card mt-6">
                            <div className="card-header">
                                <h4 className="card-title">
                                    <Wallet size={20} className="text-primary" />
                                    Cash Collection Summary
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="grid-3">
                                    <div className="p-4 rounded-xl bg-tertiary text-center">
                                        <div className="text-sm text-muted mb-1">Expected Amount</div>
                                        <div className="text-2xl font-bold">{formatCurrency(sale.expected_amount)}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-tertiary text-center">
                                        <div className="text-sm text-muted mb-1">Actual Collected</div>
                                        <div className="text-2xl font-bold">{formatCurrency(sale.actual_amount)}</div>
                                    </div>
                                    <div className={`p-4 rounded-xl text-center ${sale.discrepancy >= 0 ? 'bg-success-50' : 'bg-danger-50'}`} style={{
                                        background: sale.discrepancy >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                    }}>
                                        <div className="text-sm text-muted mb-1">Discrepancy</div>
                                        <div className={`text-2xl font-bold ${sale.discrepancy >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {sale.discrepancy >= 0 ? '+' : ''}{formatCurrency(sale.discrepancy)}
                                        </div>
                                    </div>
                                </div>
                                {sale.notes && (
                                    <div className="mt-4 p-3 rounded-lg bg-tertiary">
                                        <span className="text-sm text-muted">Notes: </span>
                                        <span>{sale.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add Sale Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Record Sale</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddItem}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product *</label>
                                    <select
                                        className="form-select"
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a product</option>
                                        {availableProducts.map(inv => (
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
                                        max={availableProducts.find(p => p.product_id == selectedProduct)?.quantity || 999}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                                {selectedProduct && (
                                    <div className="p-3 rounded-lg bg-tertiary mt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted">Price per unit:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(products.find(p => p.id == selectedProduct)?.selling_price || 0)}
                                            </span>
                                        </div>
                                        {quantity && (
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-muted">Total:</span>
                                                <span className="font-bold text-success">
                                                    {formatCurrency((products.find(p => p.id == selectedProduct)?.selling_price || 0) * parseInt(quantity))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} />
                                    Add Sale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Collect Cash Modal */}
            {showCollectModal && (
                <div className="modal-overlay" onClick={() => setShowCollectModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cash Collection (8PM)</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowCollectModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCashCollection}>
                            <div className="modal-body">
                                <div className="p-4 rounded-xl bg-tertiary mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Expected Amount:</span>
                                        <span className="text-xl font-bold">{formatCurrency(sale?.expected_amount || 0)}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Actual Amount Collected (LKR) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter actual amount"
                                        step="0.01"
                                        min="0"
                                        value={actualAmount}
                                        onChange={(e) => setActualAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Any notes about discrepancy..."
                                        value={collectNotes}
                                        onChange={(e) => setCollectNotes(e.target.value)}
                                        rows="3"
                                    />
                                </div>
                                {actualAmount && (
                                    <div className={`p-3 rounded-lg ${parseFloat(actualAmount) >= (sale?.expected_amount || 0) ? 'bg-success-50' : 'bg-danger-50'}`}
                                        style={{
                                            background: parseFloat(actualAmount) >= (sale?.expected_amount || 0) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <span>Discrepancy:</span>
                                            <span className={`font-bold ${parseFloat(actualAmount) >= (sale?.expected_amount || 0) ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(parseFloat(actualAmount) - (sale?.expected_amount || 0))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCollectModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <CheckCircle size={16} />
                                    Record Collection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sales;
