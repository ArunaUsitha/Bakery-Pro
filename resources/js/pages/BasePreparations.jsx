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
    Scale,
    Info,
    Loader2
} from 'lucide-react';
import {
    PlusIcon,
    PencilIcon,
    TrashBinIcon,
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
import Select from "../theme/tailadmin/components/form/Select";
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
        setLoading(true);
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Base Preparations</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <Link to="/recipes" className="hover:text-brand-500">Recipes</Link>
                        <ChevronRight size={14} />
                        <span>Base Preparations</span>
                    </div>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} startIcon={<PlusIcon />}>
                    Create Base Preparation
                </Button>
            </div>

            {/* Info Banner */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                        <Info className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">What are Base Preparations?</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Base preparations are shared doughs, mixtures, or batters that are used across multiple recipes.
                            For example, a "Bun Dough Base" can be used to make both T-Buns and Cream Buns,
                            with the cost distributed proportionally based on weight used.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Preparations */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                            <Layers className="text-brand-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Preparations</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{preparations.length}</h4>
                        </div>
                    </div>
                </div>

                {/* Total Cost */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10">
                            <DollarSign className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(totalPrepsCost)}</h4>
                        </div>
                    </div>
                </div>

                {/* Available Ingredients */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10">
                            <Package className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Available Ingredients</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{ingredients.length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preparations Grid */}
            {preparations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center dark:border-gray-800">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50">
                        <Layers className="text-gray-400" size={32} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">No base preparations yet</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Create a base preparation like "Bun Dough Base" to share across recipes</p>
                    <Button onClick={() => { resetForm(); setShowModal(true); }} className="mt-6" startIcon={<PlusIcon />}>
                        Create Base Preparation
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {preparations.map(prep => (
                        <div key={prep.id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-lg dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-500/10">
                                            <Layers className="text-warning-500" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white/90">{prep.name}</h4>
                                            {prep.description && (
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{prep.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
                                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <Scale size={12} />
                                            Weight
                                        </div>
                                        <div className="mt-1 text-sm font-bold text-gray-800 dark:text-white/90">{formatNumber(prep.total_weight_kg)} kg</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Cost/kg</div>
                                        <div className="mt-1 text-sm font-bold text-brand-500">{formatCurrency(prep.cost_per_kg)}</div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/5">
                                    <div className="flex items-center justify-between font-bold">
                                        <span className="text-sm text-amber-900 dark:text-amber-200">Total Cost</span>
                                        <span className="text-lg text-amber-600 dark:text-amber-400">{formatCurrency(prep.total_cost)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <Badge variant="light" color="blue">
                                        <Package size={12} className="mr-1" />
                                        {prep.ingredients?.length || 0} ingredients
                                    </Badge>
                                </div>

                                <div className="mt-6 flex items-center gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => openDetailModal(prep)}
                                    >
                                        View & Manage
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRecalculate(prep.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                                            title="Recalculate Cost"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(prep)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                                            title="Edit"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(prep.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                                            title="Delete"
                                        >
                                            <TrashBinIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Base Preparation' : 'Create Base Preparation'}>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="e.g., Bun Dough Base, Cake Batter..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                                placeholder="What is this preparation used for?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>
                        <div>
                            <Label htmlFor="total_weight_kg">Total Weight (kg) *</Label>
                            <Input
                                id="total_weight_kg"
                                type="number"
                                placeholder="Total weight when prepared"
                                step="0.001"
                                min="0.001"
                                value={formData.total_weight_kg}
                                onChange={(e) => setFormData({ ...formData, total_weight_kg: e.target.value })}
                                required
                            />
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                The total weight of the finished preparation (used to calculate cost per kg)
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingItem ? 'Update Preparation' : 'Create Preparation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedPrep?.name}
                size="lg"
            >
                {selectedPrep && (
                    <div className="p-6">
                        {/* Action Header in Modal */}
                        <div className="mb-6 flex items-center justify-between">
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">Details & Ingredients</h4>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecalculate(selectedPrep.id)}
                                startIcon={<RefreshCw className="h-3.5 w-3.5" />}
                            >
                                Recalculate
                            </Button>
                        </div>

                        {/* Cost Summary Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
                            <div className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-white/[0.03]">
                                <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Weight</p>
                                <h5 className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">{formatNumber(selectedPrep.total_weight_kg)} <span className="text-sm font-normal text-gray-400">kg</span></h5>
                            </div>
                            <div className="rounded-2xl bg-brand-50 p-4 text-center dark:bg-brand-500/10">
                                <p className="text-xs uppercase tracking-wider text-brand-500 dark:text-brand-400">Total Cost</p>
                                <h5 className="mt-1 text-xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(selectedPrep.total_cost)}</h5>
                            </div>
                            <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-500/10">
                                <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">Cost/kg</p>
                                <h5 className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(selectedPrep.cost_per_kg)}</h5>
                            </div>
                        </div>

                        {/* Ingredients Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 font-bold text-gray-800 dark:text-white/90">
                                    <Package size={20} className="text-brand-500" />
                                    Composition
                                </h4>
                                <Button
                                    size="sm"
                                    onClick={() => setShowAddIngredientModal(true)}
                                    startIcon={<PlusIcon className="h-3.5 w-3.5" />}
                                >
                                    Add Ingredient
                                </Button>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell isHeader px="px-4">Ingredient</TableCell>
                                            <TableCell isHeader px="px-4">Qty</TableCell>
                                            <TableCell isHeader px="px-4">Cost/Unit</TableCell>
                                            <TableCell isHeader px="px-4">Total</TableCell>
                                            <TableCell isHeader px="px-4"></TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(!selectedPrep.ingredients || selectedPrep.ingredients.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                                                    No ingredients added yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            selectedPrep.ingredients.map(item => (
                                                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                                    <TableCell className="font-medium text-gray-800 dark:text-white/90 px-4 py-3">
                                                        {item.ingredient?.name}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 dark:text-gray-400 px-4 py-3">
                                                        {formatNumber(item.quantity)} <span className="text-[10px] uppercase">{item.ingredient?.unit}</span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 dark:text-gray-400 px-4 py-3">
                                                        {formatCurrency(item.ingredient?.cost_per_unit)}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-brand-500 px-4 py-3">
                                                        {formatCurrency(item.cost_for_preparation)}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleRemoveIngredient(item.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <TrashBinIcon className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                    {selectedPrep.ingredients && selectedPrep.ingredients.length > 0 && (
                                        <tfoot className="bg-gray-50/50 dark:bg-white/[0.01]">
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-right font-bold text-gray-800 dark:text-white/90 px-4 py-3">Total:</TableCell>
                                                <TableCell className="font-bold text-brand-500 px-4 py-3">{formatCurrency(selectedPrep.total_cost)}</TableCell>
                                                <TableCell className="px-4 py-3"></TableCell>
                                            </TableRow>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        </div>

                        {/* Used In Recipes */}
                        {selectedPrep.recipe_usages && selectedPrep.recipe_usages.length > 0 && (
                            <div className="mt-8 space-y-3">
                                <h4 className="font-bold text-gray-800 dark:text-white/90">Used In</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPrep.recipe_usages.map(usage => (
                                        <Link
                                            key={usage.id}
                                            to="/recipes"
                                            className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                                        >
                                            {usage.recipe?.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex">
                            <Button variant="outline" className="w-full" onClick={() => setShowDetailModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Ingredient Modal */}
            <Modal
                isOpen={showAddIngredientModal}
                onClose={() => setShowAddIngredientModal(false)}
                title="Add Ingredient"
            >
                <form onSubmit={handleAddIngredient} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="ingredient_id">Ingredient *</Label>
                            <Select
                                id="ingredient_id"
                                value={ingredientData.ingredient_id}
                                onChange={(val) => setIngredientData({ ...ingredientData, ingredient_id: val })}
                                placeholder="Select ingredient"
                                options={ingredients.map(ing => ({
                                    value: ing.id,
                                    label: `${ing.name} (${formatCurrency(ing.cost_per_unit)}/${ing.unit})`
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="Amount needed"
                                step="0.0001"
                                min="0.0001"
                                value={ingredientData.quantity}
                                onChange={(e) => setIngredientData({ ...ingredientData, quantity: e.target.value })}
                                required
                            />
                        </div>
                        {ingredientData.ingredient_id && ingredientData.quantity && (
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.03] dark:bg-white/[0.01]">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Estimated Cost:</span>
                                    <span className="font-bold text-brand-500">
                                        {formatCurrency(
                                            parseFloat(ingredientData.quantity) *
                                            parseFloat(ingredients.find(i => i.id == ingredientData.ingredient_id)?.cost_per_unit || 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowAddIngredientModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Add Ingredient
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default BasePreparations;
