import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    X,
    DollarSign,
    Clock,
    Package,
    Copy,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Layers
} from 'lucide-react';
import {
    getRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addRecipeIngredient,
    removeRecipeIngredient,
    duplicateRecipe,
    recalculateRecipeCost,
    getIngredients,
    getProducts,
    getBasePreparations,
    addRecipeBasePreparation,
    removeRecipeBasePreparation
} from '../utils/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

function Recipes() {
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [basePreparations, setBasePreparations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [showAddBasePrepModal, setShowAddBasePrepModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [expandedRecipe, setExpandedRecipe] = useState(null);
    const [formData, setFormData] = useState({
        product_id: '',
        name: '',
        description: '',
        output_quantity: '',
        instructions: '',
        preparation_time_minutes: ''
    });
    const [ingredientData, setIngredientData] = useState({
        ingredient_id: '',
        quantity: ''
    });
    const [basePrepData, setBasePrepData] = useState({
        base_preparation_id: '',
        weight_used_kg: ''
    });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [recipesRes, productsRes, ingredientsRes, basePrepRes] = await Promise.all([
                getRecipes(),
                getProducts(),
                getIngredients(),
                getBasePreparations()
            ]);
            setRecipes(recipesRes.data);
            setProducts(productsRes.data);
            setIngredients(ingredientsRes.data);
            setBasePreparations(basePrepRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipeDetails = async (id) => {
        try {
            const response = await getRecipe(id);
            setSelectedRecipe(response.data);
        } catch (error) {
            toast.error('Failed to fetch recipe details');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRecipe(editingItem.id, formData);
                toast.success('Recipe updated');
            } else {
                await createRecipe(formData);
                toast.success('Recipe created');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save recipe');
        }
    };

    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            await addRecipeIngredient(selectedRecipe.id, ingredientData);
            toast.success('Ingredient added');
            setShowAddIngredientModal(false);
            setIngredientData({ ingredient_id: '', quantity: '' });
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add ingredient');
        }
    };

    const handleRemoveIngredient = async (ingredientId) => {
        try {
            await removeRecipeIngredient(selectedRecipe.id, ingredientId);
            toast.success('Ingredient removed');
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error('Failed to remove ingredient');
        }
    };

    const handleAddBasePrep = async (e) => {
        e.preventDefault();
        try {
            await addRecipeBasePreparation(selectedRecipe.id, basePrepData);
            toast.success('Base preparation added');
            setShowAddBasePrepModal(false);
            setBasePrepData({ base_preparation_id: '', weight_used_kg: '' });
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add base preparation');
        }
    };

    const handleRemoveBasePrep = async (prepId) => {
        try {
            await removeRecipeBasePreparation(selectedRecipe.id, prepId);
            toast.success('Base preparation removed');
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error('Failed to remove base preparation');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            await duplicateRecipe(id);
            toast.success('Recipe duplicated');
            fetchData();
        } catch (error) {
            toast.error('Failed to duplicate recipe');
        }
    };

    const handleRecalculate = async (id) => {
        try {
            await recalculateRecipeCost(id);
            toast.success('Recipe cost recalculated');
            if (selectedRecipe?.id === id) {
                fetchRecipeDetails(id);
            }
            fetchData();
        } catch (error) {
            toast.error('Failed to recalculate cost');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this recipe?')) return;
        try {
            await deleteRecipe(id);
            toast.success('Recipe deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete recipe');
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            product_id: item.product_id,
            name: item.name,
            description: item.description || '',
            output_quantity: item.output_quantity,
            instructions: item.instructions || '',
            preparation_time_minutes: item.preparation_time_minutes || ''
        });
        setShowModal(true);
    };

    const openDetailModal = async (item) => {
        await fetchRecipeDetails(item.id);
        setShowDetailModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            product_id: '',
            name: '',
            description: '',
            output_quantity: '',
            instructions: '',
            preparation_time_minutes: ''
        });
    };

    const totalRecipeCost = recipes.reduce((sum, r) => sum + parseFloat(r.total_cost || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="recipes-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Recipe Cost Calculator</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Recipes</span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    Create Recipe
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Recipes</div>
                        <div className="stat-value">{recipes.length}</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Recipe Cost</div>
                        <div className="stat-value">{formatCurrency(totalRecipeCost)}</div>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Ingredients Used</div>
                        <div className="stat-value">{ingredients.length}</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <Layers size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Base Preparations</div>
                        <div className="stat-value">{basePreparations.length}</div>
                    </div>
                </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid-3 mb-6">
                {recipes.length === 0 ? (
                    <div className="card" style={{ gridColumn: 'span 3' }}>
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <BookOpen size={40} />
                            </div>
                            <h3>No recipes yet</h3>
                            <p>Create your first recipe to start calculating costs</p>
                            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus size={18} />
                                Create Recipe
                            </button>
                        </div>
                    </div>
                ) : (
                    recipes.map(recipe => (
                        <div key={recipe.id} className="card hover-lift" style={{ cursor: 'pointer' }}>
                            <div className="card-body">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="stat-icon primary" style={{ width: 44, height: 44 }}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{recipe.name}</h4>
                                            <span className="text-sm text-muted">
                                                {recipe.product?.name || 'No product linked'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-2 gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-tertiary text-center">
                                        <div className="text-xs text-muted mb-1">Output</div>
                                        <div className="font-bold">{recipe.output_quantity} pcs</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-tertiary text-center">
                                        <div className="text-xs text-muted mb-1">Cost/Item</div>
                                        <div className="font-bold text-primary">{formatCurrency(recipe.cost_per_item)}</div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-success-50 mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted">Total Cost</span>
                                        <span className="text-lg font-bold text-success">{formatCurrency(recipe.total_cost)}</span>
                                    </div>
                                </div>

                                {recipe.preparation_time_minutes && (
                                    <div className="flex items-center gap-2 text-sm text-muted mb-4">
                                        <Clock size={14} />
                                        <span>{recipe.preparation_time_minutes} minutes</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-sm btn-primary flex-1"
                                        onClick={() => openDetailModal(recipe)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => openEditModal(recipe)}
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-info"
                                        onClick={() => handleDuplicate(recipe.id)}
                                        title="Duplicate"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(recipe.id)}
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

            {/* Base Preparations Section */}
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">
                        <Layers size={20} className="text-primary" />
                        Base Preparations (Shared Doughs & Mixtures)
                    </h4>
                    <Link to="/base-preparations" className="btn btn-sm btn-primary">
                        Manage Base Preparations
                    </Link>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Total Weight</th>
                                <th>Total Cost</th>
                                <th>Cost/kg</th>
                                <th>Ingredients</th>
                            </tr>
                        </thead>
                        <tbody>
                            {basePreparations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center p-6 text-muted">
                                        No base preparations created yet
                                    </td>
                                </tr>
                            ) : (
                                basePreparations.map(prep => (
                                    <tr key={prep.id}>
                                        <td className="font-medium">{prep.name}</td>
                                        <td>{formatNumber(prep.total_weight_kg)} kg</td>
                                        <td className="font-semibold text-primary">{formatCurrency(prep.total_cost)}</td>
                                        <td>{formatCurrency(prep.cost_per_kg)}</td>
                                        <td>
                                            <span className="badge badge-secondary">
                                                {prep.ingredients?.length || 0} items
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Recipe Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem ? 'Edit Recipe' : 'Create Recipe'}</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
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
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Recipe Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., Cream Bun Recipe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Output Quantity *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Number of items produced"
                                            min="1"
                                            value={formData.output_quantity}
                                            onChange={(e) => setFormData({ ...formData, output_quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Recipe description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preparation Time (minutes)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 60"
                                        min="0"
                                        value={formData.preparation_time_minutes}
                                        onChange={(e) => setFormData({ ...formData, preparation_time_minutes: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Instructions</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Step-by-step instructions..."
                                        value={formData.instructions}
                                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Update' : 'Create'} Recipe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Recipe Detail Modal */}
            {showDetailModal && selectedRecipe && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <h3>{selectedRecipe.name}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => handleRecalculate(selectedRecipe.id)}
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
                                    <div className="text-sm text-muted mb-1">Output</div>
                                    <div className="text-2xl font-bold">{selectedRecipe.output_quantity}</div>
                                    <div className="text-xs text-muted">pieces</div>
                                </div>
                                <div className="p-4 rounded-xl bg-tertiary text-center">
                                    <div className="text-sm text-muted mb-1">Total Cost</div>
                                    <div className="text-2xl font-bold text-primary">{formatCurrency(selectedRecipe.total_cost)}</div>
                                </div>
                                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <div className="text-sm text-muted mb-1">Cost Per Item</div>
                                    <div className="text-2xl font-bold text-success">{formatCurrency(selectedRecipe.cost_per_item)}</div>
                                </div>
                            </div>

                            {/* Direct Ingredients */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Package size={18} className="text-primary" />
                                        Direct Ingredients
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
                                            <th>Cost</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!selectedRecipe.ingredients || selectedRecipe.ingredients.length === 0) ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted p-4">
                                                    No direct ingredients added
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedRecipe.ingredients.map(item => (
                                                <tr key={item.id}>
                                                    <td className="font-medium">{item.ingredient?.name}</td>
                                                    <td>{formatNumber(item.quantity)}</td>
                                                    <td>{item.ingredient?.unit}</td>
                                                    <td className="font-semibold">{formatCurrency(item.cost_for_recipe)}</td>
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
                                </table>
                            </div>

                            {/* Base Preparations */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Layers size={18} className="text-warning" />
                                        Base Preparations Used
                                    </h4>
                                    <button
                                        className="btn btn-sm btn-warning"
                                        onClick={() => setShowAddBasePrepModal(true)}
                                    >
                                        <Plus size={14} />
                                        Add Base Preparation
                                    </button>
                                </div>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Preparation</th>
                                            <th>Weight Used</th>
                                            <th>Cost/kg</th>
                                            <th>Cost Contribution</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!selectedRecipe.base_preparations || selectedRecipe.base_preparations.length === 0) ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted p-4">
                                                    No base preparations used
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedRecipe.base_preparations.map(item => (
                                                <tr key={item.id}>
                                                    <td className="font-medium">{item.base_preparation?.name}</td>
                                                    <td>{formatNumber(item.weight_used_kg)} kg</td>
                                                    <td>{formatCurrency(item.base_preparation?.cost_per_kg)}</td>
                                                    <td className="font-semibold text-warning">{formatCurrency(item.cost_contribution)}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleRemoveBasePrep(item.id)}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Instructions */}
                            {selectedRecipe.instructions && (
                                <div className="p-4 rounded-xl bg-tertiary">
                                    <h4 className="font-semibold mb-2">Instructions</h4>
                                    <pre className="whitespace-pre-wrap text-sm">{selectedRecipe.instructions}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Ingredient to Recipe Modal */}
            {showAddIngredientModal && selectedRecipe && (
                <div className="modal-overlay" onClick={() => setShowAddIngredientModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Ingredient to Recipe</h3>
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

            {/* Add Base Preparation Modal */}
            {showAddBasePrepModal && selectedRecipe && (
                <div className="modal-overlay" onClick={() => setShowAddBasePrepModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Base Preparation</h3>
                            <button className="btn-ghost btn-icon sm" onClick={() => setShowAddBasePrepModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddBasePrep}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Base Preparation *</label>
                                    <select
                                        className="form-select"
                                        value={basePrepData.base_preparation_id}
                                        onChange={(e) => setBasePrepData({ ...basePrepData, base_preparation_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select base preparation</option>
                                        {basePreparations.map(prep => (
                                            <option key={prep.id} value={prep.id}>
                                                {prep.name} ({formatCurrency(prep.cost_per_kg)}/kg)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Weight Used (kg) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Weight in kg"
                                        step="0.0001"
                                        min="0.0001"
                                        value={basePrepData.weight_used_kg}
                                        onChange={(e) => setBasePrepData({ ...basePrepData, weight_used_kg: e.target.value })}
                                        required
                                    />
                                </div>
                                {basePrepData.base_preparation_id && basePrepData.weight_used_kg && (
                                    <div className="p-3 rounded-lg bg-tertiary">
                                        <div className="flex justify-between">
                                            <span>Estimated Cost:</span>
                                            <span className="font-bold">
                                                {formatCurrency(
                                                    parseFloat(basePrepData.weight_used_kg) *
                                                    parseFloat(basePreparations.find(p => p.id == basePrepData.base_preparation_id)?.cost_per_kg || 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBasePrepModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-warning">
                                    Add Base Preparation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Recipes;
