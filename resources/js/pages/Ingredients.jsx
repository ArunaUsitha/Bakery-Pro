import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    Search,
    X,
    ShoppingCart,
    DollarSign,
    Filter
} from 'lucide-react';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    addIngredientStock,
    getIngredientCategories
} from '../utils/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

function Ingredients() {
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit: 'kg',
        cost_per_unit: '',
        stock_quantity: '',
        minimum_stock: '',
        supplier: ''
    });
    const [stockData, setStockData] = useState({
        quantity: '',
        cost_per_unit: '',
        supplier: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ingredientsRes, categoriesRes] = await Promise.all([
                getIngredients(),
                getIngredientCategories()
            ]);
            setIngredients(ingredientsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            toast.error('Failed to fetch ingredients');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateIngredient(editingItem.id, formData);
                toast.success('Ingredient updated');
            } else {
                await createIngredient(formData);
                toast.success('Ingredient created');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save ingredient');
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            await addIngredientStock(selectedIngredient.id, stockData);
            toast.success('Stock added successfully');
            setShowStockModal(false);
            setStockData({
                quantity: '',
                cost_per_unit: '',
                supplier: '',
                purchase_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            fetchData();
        } catch (error) {
            toast.error('Failed to add stock');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this ingredient?')) return;
        try {
            await deleteIngredient(id);
            toast.success('Ingredient deleted');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Cannot delete ingredient');
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category || '',
            unit: item.unit,
            cost_per_unit: item.cost_per_unit,
            stock_quantity: item.stock_quantity,
            minimum_stock: item.minimum_stock,
            supplier: item.supplier || ''
        });
        setShowModal(true);
    };

    const openStockModal = (item) => {
        setSelectedIngredient(item);
        setStockData({
            ...stockData,
            cost_per_unit: item.cost_per_unit,
            supplier: item.supplier || ''
        });
        setShowStockModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            category: '',
            unit: 'kg',
            cost_per_unit: '',
            stock_quantity: '',
            minimum_stock: '',
            supplier: ''
        });
    };

    const filteredIngredients = ingredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || item.category === filterCategory;
        const matchesLowStock = !showLowStockOnly || parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock);
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const lowStockCount = ingredients.filter(item =>
        parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock)
    ).length;

    const totalValue = ingredients.reduce((sum, item) =>
        sum + (parseFloat(item.stock_quantity) * parseFloat(item.cost_per_unit)), 0
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="ingredients-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Ingredients</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Ingredients</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    Add Ingredient
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Ingredients</div>
                        <div className="stat-value">{ingredients.length}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Inventory Value</div>
                        <div className="stat-value">{formatCurrency(totalValue)}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Low Stock Items</div>
                        <div className="stat-value">{lowStockCount}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Filter size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Categories</div>
                        <div className="stat-value">{categories.length}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="input-group" style={{ flex: 1, minWidth: 250 }}>
                            <span className="input-icon"><Search size={18} /></span>
                            <input
                                type="text"
                                className="form-input with-icon"
                                placeholder="Search ingredients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ width: 200 }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLowStockOnly}
                                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span className="text-sm">Low Stock Only</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Ingredients Table */}
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">
                        <Package size={20} className="text-primary" />
                        Ingredients List ({filteredIngredients.length})
                    </h4>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Unit</th>
                                <th>Cost/Unit</th>
                                <th>Stock</th>
                                <th>Min. Stock</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIngredients.length === 0 ? (
                                <tr>
                                    <td colSpan="9">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <Package size={40} />
                                            </div>
                                            <h3>No ingredients found</h3>
                                            <p>Add some ingredients to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredIngredients.map(item => {
                                    const isLowStock = parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock);
                                    const value = parseFloat(item.stock_quantity) * parseFloat(item.cost_per_unit);

                                    return (
                                        <tr key={item.id} className={isLowStock ? 'row-warning' : ''}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar sm">{item.name.charAt(0)}</div>
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-secondary">{item.category || '-'}</span>
                                            </td>
                                            <td>{item.unit}</td>
                                            <td className="font-semibold">{formatCurrency(item.cost_per_unit)}</td>
                                            <td className={`font-semibold ${isLowStock ? 'text-danger' : ''}`}>
                                                {formatNumber(item.stock_quantity)}
                                            </td>
                                            <td className="text-muted">{formatNumber(item.minimum_stock)}</td>
                                            <td className="font-semibold text-success">{formatCurrency(value)}</td>
                                            <td>
                                                {isLowStock ? (
                                                    <span className="badge badge-danger">
                                                        <AlertTriangle size={12} className="mr-1" />
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-success">In Stock</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => openStockModal(item)}
                                                        title="Add Stock"
                                                    >
                                                        <ShoppingCart size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Ingredient' : 'Add Ingredient'}</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., Flour, Sugar..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., flour, yeast, fats..."
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            list="categories"
                                        />
                                        <datalist id="categories">
                                            {categories.map(cat => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit *</label>
                                        <select
                                            className="form-select"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            required
                                        >
                                            <option value="kg">kg</option>
                                            <option value="L">L (Liter)</option>
                                            <option value="piece">piece</option>
                                            <option value="packet">packet</option>
                                            <option value="g">g (gram)</option>
                                            <option value="ml">ml</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost Per Unit (LKR) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={formData.cost_per_unit}
                                            onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Current Stock</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            step="0.001"
                                            min="0"
                                            value={formData.stock_quantity}
                                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Minimum Stock (Alert)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            step="0.001"
                                            min="0"
                                            value={formData.minimum_stock}
                                            onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Supplier</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Supplier name..."
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Update' : 'Create'} Ingredient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showStockModal && selectedIngredient && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Stock - {selectedIngredient.name}</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowStockModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddStock}>
                            <div className="modal-body">
                                <div className="p-4 rounded-xl bg-tertiary mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Current Stock:</span>
                                        <span className="font-bold">{formatNumber(selectedIngredient.stock_quantity)} {selectedIngredient.unit}</span>
                                    </div>
                                </div>
                                <div className="grid-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Quantity *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Quantity to add"
                                            step="0.001"
                                            min="0.001"
                                            value={stockData.quantity}
                                            onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cost Per Unit (LKR) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={stockData.cost_per_unit}
                                            onChange={(e) => setStockData({ ...stockData, cost_per_unit: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={stockData.purchase_date}
                                            onChange={(e) => setStockData({ ...stockData, purchase_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Supplier</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Supplier name"
                                            value={stockData.supplier}
                                            onChange={(e) => setStockData({ ...stockData, supplier: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Purchase notes..."
                                        value={stockData.notes}
                                        onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                {stockData.quantity && stockData.cost_per_unit && (
                                    <div className="p-3 rounded-lg bg-tertiary">
                                        <div className="flex justify-between">
                                            <span className="text-muted">Total Cost:</span>
                                            <span className="font-bold text-primary">
                                                {formatCurrency(parseFloat(stockData.quantity) * parseFloat(stockData.cost_per_unit))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <ShoppingCart size={16} />
                                    Add Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ingredients;
