import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Factory,
    Package,
    ChevronRight,
    Clock,
    CheckCircle,
    Play,
    Trash2,
    Send,
    X,
    AlertCircle
} from 'lucide-react';
import {
    getTodayBatch,
    getProducts,
    addProductionItem,
    removeProductionItem,
    completeBatch,
    getLocations,
    transferFromProduction
} from '../utils/api';
import { formatTime, formatNumber, getCurrentShiftStatus } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

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
        const items = batch.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product.name,
            available: item.quantity_produced,
            shop_qty: 0,
            vehicle_qty: 0
        }));
        setTransferItems(items);
        setShowTransferModal(true);
    };

    const handleTransfer = async () => {
        const transferData = [];
        const shop = locations.find(l => l.type === 'shop');
        const vehicles = locations.filter(l => l.type === 'vehicle');

        transferItems.forEach(item => {
            if (item.shop_qty > 0 && shop) {
                transferData.push({
                    product_id: item.product_id,
                    quantity: item.shop_qty,
                    location_id: shop.id
                });
            }
            if (item.vehicle_qty > 0 && vehicles.length > 0) {
                transferData.push({
                    product_id: item.product_id,
                    quantity: item.vehicle_qty,
                    location_id: vehicles[0].id
                });
            }
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
        updated[index][field] = parseInt(value) || 0;
        setTransferItems(updated);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    const isShiftActive = shiftStatus.status === 'production';
    const totalProduced = batch?.items?.reduce((sum, item) => sum + item.quantity_produced, 0) || 0;

    return (
        <div className="production-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Production</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Production</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="time-indicator">
                        <span className={`dot ${shiftStatus.color}`}></span>
                        <span>{shiftStatus.label}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Factory size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Batch Status</div>
                        <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                            {batch?.status === 'completed' ? 'Completed' : 'In Progress'}
                        </div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Items Produced</div>
                        <div className="stat-value">{batch?.items?.length || 0}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Quantity</div>
                        <div className="stat-value">{formatNumber(totalProduced)}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Shift Time</div>
                        <div className="stat-value" style={{ fontSize: '1.25rem' }}>5AM - 12PM</div>
                    </div>
                </div>
            </div>

            {/* Shift Alert */}
            {!isShiftActive && batch?.status !== 'completed' && (
                <div className="card mb-6" style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    border: '1px solid #f59e0b'
                }}>
                    <div className="card-body flex items-center gap-3">
                        <AlertCircle size={24} className="text-warning" />
                        <div>
                            <div className="font-semibold text-warning-700">Production Shift Ended</div>
                            <div className="text-sm text-warning-600">
                                Production shift is from 5AM to 12PM. You can still view and manage items.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid-2">
                {/* Production Items */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h4 className="card-title">
                            <Factory size={20} className="text-primary" />
                            Today's Production Items
                        </h4>
                        <div className="flex gap-2">
                            {batch?.status !== 'completed' && (
                                <>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                    {batch?.items?.length > 0 && (
                                        <button className="btn btn-success btn-sm" onClick={handleCompleteBatch}>
                                            <CheckCircle size={16} />
                                            Complete Batch
                                        </button>
                                    )}
                                </>
                            )}
                            {batch?.status === 'completed' && batch?.items?.length > 0 && (
                                <button className="btn btn-info btn-sm" onClick={openTransferModal}>
                                    <Send size={16} />
                                    Transfer to Stock
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Quantity Produced</th>
                                    <th>Completed At</th>
                                    <th>Status</th>
                                    {batch?.status !== 'completed' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {!batch?.items?.length ? (
                                    <tr>
                                        <td colSpan={batch?.status !== 'completed' ? 6 : 5}>
                                            <div className="empty-state">
                                                <div className="empty-state-icon">
                                                    <Factory size={40} />
                                                </div>
                                                <h3>No production items yet</h3>
                                                <p>Start adding items that are being produced today</p>
                                                {batch?.status !== 'completed' && (
                                                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                                        <Plus size={18} />
                                                        Add First Item
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    batch.items.map((item) => (
                                        <tr key={item.id}>
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
                                            <td className="font-semibold">{formatNumber(item.quantity_produced)}</td>
                                            <td>{item.completed_at ? formatTime(item.completed_at) : '-'}</td>
                                            <td>
                                                <span className={`badge ${item.completed_at ? 'badge-success' : 'badge-warning'}`}>
                                                    {item.completed_at ? 'Ready' : 'In Progress'}
                                                </span>
                                            </td>
                                            {batch?.status !== 'completed' && (
                                                <td>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Production Item</h3>
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
                                        {products.filter(p => p.is_active).map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.category === 'day_food' ? 'Day Food' : 'Packed'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity Produced *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter quantity"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} />
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Transfer to Stock Locations</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowTransferModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted mb-4">
                                Distribute produced items between the shop and delivery vehicles.
                            </p>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Available</th>
                                            <th>To Shop</th>
                                            <th>To Vehicle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="font-medium">{item.product_name}</td>
                                                <td>{item.available}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '100px' }}
                                                        min="0"
                                                        max={item.available - item.vehicle_qty}
                                                        value={item.shop_qty}
                                                        onChange={(e) => updateTransferQty(idx, 'shop_qty', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: '100px' }}
                                                        min="0"
                                                        max={item.available - item.shop_qty}
                                                        value={item.vehicle_qty}
                                                        onChange={(e) => updateTransferQty(idx, 'vehicle_qty', e.target.value)}
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
                                <Send size={16} />
                                Transfer Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Production;
