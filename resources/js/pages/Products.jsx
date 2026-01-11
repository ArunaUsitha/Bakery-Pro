import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Package,
    ChevronRight,
    X,
    Filter,
    Clock,
    DollarSign
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../utils/api';
import { formatCurrency, getCategoryBadge } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'day_food',
        production_cost: '',
        shop_price: '',
        selling_price: '',
        shelf_life_days: 1,
        description: ''
    });
    const toast = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
                toast.success('Product updated successfully');
            } else {
                await createProduct(formData);
                toast.success('Product created successfully');
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                production_cost: product.production_cost,
                shop_price: product.shop_price,
                selling_price: product.selling_price,
                shelf_life_days: product.shelf_life_days,
                description: product.description || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: 'day_food',
                production_cost: '',
                shop_price: '',
                selling_price: '',
                shelf_life_days: 1,
                description: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const dayFoods = products.filter(p => p.category === 'day_food');
    const packedFoods = products.filter(p => p.category === 'packed_food');

    return (
        <div className="products-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Products</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Products</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Stats Row */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Products</div>
                        <div className="stat-value">{products.length}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Day Foods</div>
                        <div className="stat-value">{dayFoods.length}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Packed Foods</div>
                        <div className="stat-value">{packedFoods.length}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body">
                    <div className="flex items-center gap-4">
                        <div className="header-search" style={{ minWidth: '300px' }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-muted" />
                            <select
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="day_food">Day Food</option>
                                <option value="packed_food">Packed Food</option>
                            </select>
                        </div>
                        <span className="text-muted ml-auto">
                            Showing {filteredProducts.length} of {products.length} products
                        </span>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Production Cost</th>
                                <th>Shop Price</th>
                                <th>Selling Price</th>
                                <th>Shelf Life</th>
                                <th>Status</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-6">
                                        <div className="spinner mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <Package size={40} />
                                            </div>
                                            <h3>No products found</h3>
                                            <p>Get started by adding your first product</p>
                                            <button className="btn btn-primary" onClick={() => openModal()}>
                                                <Plus size={18} />
                                                Add Product
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const categoryBadge = getCategoryBadge(product.category);
                                    return (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar sm">
                                                        {product.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.description && (
                                                            <div className="text-sm text-muted truncate" style={{ maxWidth: '200px' }}>
                                                                {product.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${categoryBadge.className}`}>
                                                    {categoryBadge.label}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(product.production_cost)}</td>
                                            <td>{formatCurrency(product.shop_price)}</td>
                                            <td className="font-semibold">{formatCurrency(product.selling_price)}</td>
                                            <td>{product.shelf_life_days} day{product.shelf_life_days > 1 ? 's' : ''}</td>
                                            <td>
                                                <span className={`badge ${product.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => openModal(product)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(product.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
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
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="btn-ghost btn-icon sm" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Product Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter product name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select
                                            className="form-select"
                                            value={formData.category}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                category: e.target.value,
                                                shelf_life_days: e.target.value === 'day_food' ? 1 : 3
                                            })}
                                        >
                                            <option value="day_food">Day Food (Fresh)</option>
                                            <option value="packed_food">Packed Food</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Shelf Life (Days) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="1"
                                            value={formData.shelf_life_days}
                                            onChange={(e) => setFormData({ ...formData, shelf_life_days: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Production Cost (LKR) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={formData.production_cost}
                                            onChange={(e) => setFormData({ ...formData, production_cost: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Shop Price (LKR) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={formData.shop_price}
                                            onChange={(e) => setFormData({ ...formData, shop_price: e.target.value })}
                                            required
                                        />
                                        <span className="text-xs text-muted mt-1 block">Discounted price for shop</span>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Selling Price (LKR) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={formData.selling_price}
                                            onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                            required
                                        />
                                        <span className="text-xs text-muted mt-1 block">Price to customers</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Enter product description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;
