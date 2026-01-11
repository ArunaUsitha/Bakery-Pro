import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Layers,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    X,
    DollarSign,
    Package,
    RefreshCw,
    Scale
} from 'lucide-react';
import {
    getBasePreparations,
    getBasePreparation,
    createBasePreparation,
    updateBasePreparation,
    deleteBasePreparation,
    addBasePrepIngredient,
    removeBasePrepIngredient,
    recalculateBasePrepCost,
    getIngredients
} from '../utils/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

function BasePreparations() {
    const [preparations, setPreparations] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedPrep, setSelectedPrep] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        total_weight_kg: ''
    });
    const [ingredientData, setIngredientData] = useState({
        ingredient_id: '',
        quantity: ''
    });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prepsRes, ingredientsRes] = await Promise.all([
                getBasePreparations(),
                getIngredients()
            ]);
            setPreparations(prepsRes.data);
            setIngredients(ingredientsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrepDetails = async (id) => {
        try {
            const response = await getBasePreparation(id);
            setSelectedPrep(response.data);
        } catch (error) {
            toast.error('Failed to fetch details');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateBasePreparation(editingItem.id, formData);
                toast.success('Base preparation updated');
            } else {
                await createBasePreparation(formData);
                toast.success('Base preparation created');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            await addBasePrepIngredient(selectedPrep.id, ingredientData);
            toast.success('Ingredient added');
            setShowAddIngredientModal(false);
            setIngredientData({ ingredient_id: '', quantity: '' });
            fetchPrepDetails(selectedPrep.id);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add ingredient');
        }
    };

    const handleRemoveIngredient = async (ingredientId) => {
        try {
            await removeBasePrepIngredient(selectedPrep.id, ingredientId);
            toast.success('Ingredient removed');
            fetchPrepDetails(selectedPrep.id);
            fetchData();
        } catch (error) {
            toast.error('Failed to remove ingredient');
        }
    };

    const handleRecalculate = async (id) => {
        try {
            await recalculateBasePrepCost(id);
            toast.success('Cost recalculated');
            if (selectedPrep?.id === id) {
                fetchPrepDetails(id);
            }
            fetchData();
        } catch (error) {
            toast.error('Failed to recalculate cost');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this base preparation?')) return;
        try {
            await deleteBasePreparation(id);
            toast.success('Base preparation deleted');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Cannot delete base preparation');
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            total_weight_kg: item.total_weight_kg || ''
        });
        setShowModal(true);
    };

    const openDetailModal = async (item) => {
        await fetchPrepDetails(item.id);
        setShowDetailModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            description: '',
            total_weight_kg: ''
        });
    };

    const totalPrepsCost = preparations.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="base-preparations-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Base Preparations</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <Link to="/recipes">Recipes</Link>
                        <ChevronRight size={14} />
                        <span>Base Preparations</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    Create Base Preparation
                </button>
            </div>

            {/* Info Banner */}
            <div className="card mb-6" style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05))',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div className="card-body">
                    <div className="flex items-center gap-4">
                        <div className="stat-icon warning" style={{ width: 48, height: 48 }}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">What are Base Preparations?</h3>
                            <p className="text-muted text-sm mb-0">
                                Base preparations are shared doughs, mixtures, or batters that are used across multiple recipes.
                                For example, a "Bun Dough Base" can be used to make both T-Buns and Cream Buns,
                                with the cost distributed proportionally based on weight used.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <Layers size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Preparations</div>
                        <div className="stat-value">{preparations.length}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Cost</div>
                        <div className="stat-value">{formatCurrency(totalPrepsCost)}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Available Ingredients</div>
                        <div className="stat-value">{ingredients.length}</div>
                    </div>
                </div>
            </div>

            {/* Preparations Grid */}
            <div className="grid-3 gap-6">
                {preparations.length === 0 ? (
                    <div className="card" style={{ gridColumn: 'span 3' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <Layers size={40} />
                            </div>
                            <h3>No base preparations yet</h3>
                            <p>Create a base preparation like "Bun Dough Base" to share across recipes</p>
                            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus size={18} />
                                Create Base Preparation
                            </button>
                        </div>
                    </div>
                ) : (
                    preparations.map(prep => (
                        <div key={prep.id} className="card hover-lift">
                            <div className="card-body">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="stat-icon warning" style={{ width: 44, height: 44 }}>
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{prep.name}</h4>
                                            {prep.description && (
                                                <span className="text-sm text-muted">{prep.description}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-2 gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-tertiary text-center">
                                        <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                                            <Scale size={12} />
                                            Total Weight
                                        </div>
                                        <div className="font-bold">{formatNumber(prep.total_weight_kg)} kg</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-tertiary text-center">
                                        <div className="text-xs text-muted mb-1">Cost/kg</div>
                                        <div className="font-bold text-primary">{formatCurrency(prep.cost_per_kg)}</div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted">Total Cost</span>
                                        <span className="text-lg font-bold text-warning">{formatCurrency(prep.total_cost)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="badge badge-secondary">
                                        <Package size={12} className="mr-1" />
                                        {prep.ingredients?.length || 0} ingredients
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-sm btn-primary flex-1"
                                        onClick={() => openDetailModal(prep)}
                                    >
                                        View & Manage
                                    </button>
                                    <button
                                        className="btn btn-sm btn-info"
                                        onClick={() => handleRecalculate(prep.id)}
                                        title="Recalculate Cost"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => openEditModal(prep)}
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(prep.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Base Preparation' : 'Create Base Preparation'}</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Bun Dough Base, Cake Batter..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="What is this preparation used for?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Weight (kg) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Total weight when prepared"
                                        step="0.001"
                                        min="0.001"
                                        value={formData.total_weight_kg}
                                        onChange={(e) => setFormData({ ...formData, total_weight_kg: e.target.value })}
                                        required
                                    />
                                    <div className="form-hint">
                                        The total weight of the finished preparation (used to calculate cost per kg)
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedPrep && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <h3>{selectedPrep.name}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleRecalculate(selectedPrep.id)}
                                >
                                    <RefreshCw size={14} />
                                    Recalculate
                                </button>
                                <button className="btn-ghost btn-icon sm" onClick={() => setShowDetailModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="modal-body">
                            {/* Cost Summary */}
                            <div className="grid-3 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-tertiary text-center">
                                    <div className="text-sm text-muted mb-1">Total Weight</div>
                                    <div className="text-2xl font-bold">{formatNumber(selectedPrep.total_weight_kg)}</div>
                                    <div className="text-xs text-muted">kg</div>
                                </div>
                                <div className="p-4 rounded-xl bg-tertiary text-center">
                                    <div className="text-sm text-muted mb-1">Total Cost</div>
                                    <div className="text-2xl font-bold text-primary">{formatCurrency(selectedPrep.total_cost)}</div>
                                </div>
                                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                                    <div className="text-sm text-muted mb-1">Cost Per kg</div>
                                    <div className="text-2xl font-bold text-warning">{formatCurrency(selectedPrep.cost_per_kg)}</div>
                                </div>
                            </div>

                            {/* Ingredients */}
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Package size={18} className="text-primary" />
                                    Ingredients
                                </h4>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowAddIngredientModal(true)}
                                >
                                    <Plus size={14} />
                                    Add Ingredient
                                </button>
                            </div>
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Ingredient</th>
                                        <th>Quantity</th>
                                        <th>Unit</th>
                                        <th>Cost/Unit</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!selectedPrep.ingredients || selectedPrep.ingredients.length === 0) ? (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted p-4">
                                                No ingredients added yet
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedPrep.ingredients.map(item => (
                                            <tr key={item.id}>
                                                <td className="font-medium">{item.ingredient?.name}</td>
                                                <td>{formatNumber(item.quantity)}</td>
                                                <td>{item.ingredient?.unit}</td>
                                                <td className="text-muted">{formatCurrency(item.ingredient?.cost_per_unit)}</td>
                                                <td className="font-semibold text-primary">{formatCurrency(item.cost_for_preparation)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemoveIngredient(item.id)}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {selectedPrep.ingredients && selectedPrep.ingredients.length > 0 && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="text-right font-semibold">Total:</td>
                                            <td className="font-bold text-success">{formatCurrency(selectedPrep.total_cost)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>

                            {/* Used In Recipes */}
                            {selectedPrep.recipe_usages && selectedPrep.recipe_usages.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3">Used In Recipes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPrep.recipe_usages.map(usage => (
                                            <span key={usage.id} className="badge badge-primary">
                                                {usage.recipe?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Ingredient Modal */}
            {showAddIngredientModal && selectedPrep && (
                <div className="modal-overlay" onClick={() => setShowAddIngredientModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Ingredient</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowAddIngredientModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddIngredient}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Ingredient *</label>
                                    <select
                                        className="form-select"
                                        value={ingredientData.ingredient_id}
                                        onChange={(e) => setIngredientData({ ...ingredientData, ingredient_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select ingredient</option>
                                        {ingredients.map(ing => (
                                            <option key={ing.id} value={ing.id}>
                                                {ing.name} ({formatCurrency(ing.cost_per_unit)}/{ing.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Amount needed"
                                        step="0.0001"
                                        min="0.0001"
                                        value={ingredientData.quantity}
                                        onChange={(e) => setIngredientData({ ...ingredientData, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                {ingredientData.ingredient_id && ingredientData.quantity && (
                                    <div className="p-3 rounded-lg bg-tertiary">
                                        <div className="flex justify-between">
                                            <span>Estimated Cost:</span>
                                            <span className="font-bold">
                                                {formatCurrency(
                                                    parseFloat(ingredientData.quantity) *
                                                    parseFloat(ingredients.find(i => i.id == ingredientData.ingredient_id)?.cost_per_unit || 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddIngredientModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Ingredient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BasePreparations;
