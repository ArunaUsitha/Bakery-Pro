import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    PlusIcon,
    BoxIconLine,
    TrashBinIcon,
    PencilIcon,
    HorizontalDotIcon,
    ClockIcon,
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
} from "../utils/api";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { useToast } from "../context/ToastContext";
import {
    BookOpen,
    ChevronRight,
    DollarSign,
    Clock,
    Package,
    Copy,
    RefreshCw,
    Layers,
    X,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    Search
} from "lucide-react";

export default function Recipes() {
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
    const [formData, setFormData] = useState({
        product_id: "",
        name: "",
        description: "",
        output_quantity: "",
        instructions: "",
        preparation_time_minutes: ""
    });
    const [ingredientData, setIngredientData] = useState({
        ingredient_id: "",
        quantity: ""
    });
    const [basePrepData, setBasePrepData] = useState({
        base_preparation_id: "",
        weight_used_kg: ""
    });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
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
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipeDetails = async (id) => {
        try {
            const response = await getRecipe(id);
            setSelectedRecipe(response.data);
        } catch (error) {
            toast.error("Failed to fetch recipe details");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateRecipe(editingItem.id, formData);
                toast.success("Recipe updated");
            } else {
                await createRecipe(formData);
                toast.success("Recipe created");
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save recipe");
        }
    };

    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            await addRecipeIngredient(selectedRecipe.id, ingredientData);
            toast.success("Ingredient added");
            setShowAddIngredientModal(false);
            setIngredientData({ ingredient_id: "", quantity: "" });
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add ingredient");
        }
    };

    const handleRemoveIngredient = async (ingredientId) => {
        try {
            await removeRecipeIngredient(selectedRecipe.id, ingredientId);
            toast.success("Ingredient removed");
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove ingredient");
        }
    };

    const handleAddBasePrep = async (e) => {
        e.preventDefault();
        try {
            await addRecipeBasePreparation(selectedRecipe.id, basePrepData);
            toast.success("Base preparation added");
            setShowAddBasePrepModal(false);
            setBasePrepData({ base_preparation_id: "", weight_used_kg: "" });
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add base preparation");
        }
    };

    const handleRemoveBasePrep = async (prepId) => {
        try {
            await removeRecipeBasePreparation(selectedRecipe.id, prepId);
            toast.success("Base preparation removed");
            fetchRecipeDetails(selectedRecipe.id);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove base preparation");
        }
    };

    const handleDuplicate = async (e, id) => {
        e.stopPropagation();
        try {
            await duplicateRecipe(id);
            toast.success("Recipe duplicated");
            fetchData();
        } catch (error) {
            toast.error("Failed to duplicate recipe");
        }
    };

    const handleRecalculate = async (id) => {
        try {
            await recalculateRecipeCost(id);
            toast.success("Recipe cost recalculated");
            if (selectedRecipe?.id === id) {
                fetchRecipeDetails(id);
            }
            fetchData();
        } catch (error) {
            toast.error("Failed to recalculate cost");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Delete this recipe?")) return;
        try {
            await deleteRecipe(id);
            toast.success("Recipe deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete recipe");
        }
    };

    const openEditModal = (e, item) => {
        e.stopPropagation();
        setEditingItem(item);
        setFormData({
            product_id: item.product_id,
            name: item.name,
            description: item.description || "",
            output_quantity: item.output_quantity,
            instructions: item.instructions || "",
            preparation_time_minutes: item.preparation_time_minutes || ""
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
            product_id: "",
            name: "",
            description: "",
            output_quantity: "",
            instructions: "",
            preparation_time_minutes: ""
        });
    };

    const totalRecipeCost = recipes.reduce((sum, r) => sum + parseFloat(r.total_cost || 0), 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Recipe Cost Calculator</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Recipes</span>
                    </div>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} startIcon={<PlusIcon />}>
                    Create Recipe
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipes</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{recipes.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/10 text-success-500">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recipe Cost</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(totalRecipeCost)}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-info-50 rounded-xl dark:bg-info-500/10 text-info-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ingredients Used</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{ingredients.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/10 text-warning-500">
                            <Layers size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Base Preparations</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{basePreparations.length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-brand-500" size={40} />
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="col-span-full">
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full dark:bg-gray-800 mx-auto mb-4">
                                <BookOpen size={30} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-2">No recipes yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first recipe to start calculating costs</p>
                            <Button onClick={() => { resetForm(); setShowModal(true); }}>
                                Create Recipe
                            </Button>
                        </div>
                    </div>
                ) : (
                    recipes.map(recipe => (
                        <div
                            key={recipe.id}
                            className="group relative rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-500/50 hover:shadow-xl transition-all duration-300 dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer"
                            onClick={() => openDetailModal(recipe)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">{recipe.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                            {recipe.product?.name || "No product linked"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                                        onClick={(e) => openEditModal(e, recipe)}
                                        title="Edit"
                                    >
                                        <PencilIcon className="size-4" />
                                    </button>
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-info-500 hover:bg-info-50 dark:hover:bg-info-500/10 rounded-lg transition-colors"
                                        onClick={(e) => handleDuplicate(e, recipe.id)}
                                        title="Duplicate"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                                        onClick={(e) => handleDelete(e, recipe.id)}
                                        title="Delete"
                                    >
                                        <TrashBinIcon className="size-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Output</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white/90">{recipe.output_quantity} pcs</p>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Cost/Item</p>
                                    <p className="text-sm font-bold text-brand-500">{formatCurrency(recipe.cost_per_item)}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-success-50 dark:bg-success-500/5 border border-success-100 dark:border-success-900/20 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-success-700 dark:text-success-400 uppercase tracking-widest">Total Cost</span>
                                    <span className="text-lg font-bold text-success-700 dark:text-success-300">{formatCurrency(recipe.total_cost)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <ClockIcon className="size-3.5" />
                                    <span>{recipe.preparation_time_minutes || 0}m</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Layers size={14} />
                                    <span>{(recipe.ingredients?.length || 0) + (recipe.base_preparations?.length || 0)} Components</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Recipe Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                className="max-w-3xl"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                        {editingItem ? 'Edit Recipe' : 'Create Recipe'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {editingItem ? "Update recipe information." : "Step 1: Enter basic recipe information."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Label htmlFor="product">Product Linked *</Label>
                            <Select
                                id="product"
                                value={formData.product_id}
                                onChange={(val) => setFormData({ ...formData, product_id: val })}
                                options={products.map(p => ({ label: p.name, value: p.id }))}
                                placeholder="Select a product"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="name">Recipe Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Cream Bun Recipe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="output_quantity">Output Quantity *</Label>
                            <Input
                                id="output_quantity"
                                type="number"
                                placeholder="Number of items produced"
                                min="1"
                                value={formData.output_quantity}
                                onChange={(e) => setFormData({ ...formData, output_quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white/90"
                                placeholder="Recipe description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="prep_time">Preparation Time (minutes)</Label>
                            <Input
                                id="prep_time"
                                type="number"
                                placeholder="e.g., 60"
                                min="0"
                                value={formData.preparation_time_minutes}
                                onChange={(e) => setFormData({ ...formData, preparation_time_minutes: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="instructions">Instructions</Label>
                            <textarea
                                id="instructions"
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white/90"
                                placeholder="Step-by-step instructions..."
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                rows="4"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingItem ? 'Update' : 'Create'} Recipe
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Recipe Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                className="max-w-4xl"
            >
                {selectedRecipe && (
                    <>
                        <div className="flex items-start justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">{selectedRecipe.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Linked to: {selectedRecipe.product?.name || "No Product"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRecalculate(selectedRecipe.id)}
                                    startIcon={<RefreshCw size={16} />}
                                >
                                    Recalculate
                                </Button>
                                {/* More actions if needed */}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
                                <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Recipe Output</p>
                                <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">{selectedRecipe.output_quantity} <span className="text-sm font-normal text-gray-500">pcs</span></h4>
                            </div>
                            <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-900/20 text-center">
                                <p className="text-xs uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">Total Batch Cost</p>
                                <h4 className="text-2xl font-bold text-brand-700 dark:text-brand-300">{formatCurrency(selectedRecipe.total_cost)}</h4>
                            </div>
                            <div className="p-6 rounded-2xl bg-success-50 dark:bg-success-500/5 border border-success-100 dark:border-success-900/20 text-center">
                                <p className="text-xs uppercase tracking-widest text-success-600 dark:text-success-400 mb-2">Unit Production Cost</p>
                                <h4 className="text-2xl font-bold text-success-700 dark:text-success-300">{formatCurrency(selectedRecipe.cost_per_item)}</h4>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Ingredients Section */}
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                                    <h4 className="font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                                        <Package size={18} className="text-brand-500" />
                                        Direct Ingredients
                                    </h4>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowAddIngredientModal(true)}
                                        startIcon={<Plus size={16} />}
                                    >
                                        Add Ingredient
                                    </Button>
                                </div>
                                <div className="max-w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                                            <TableRow>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingredient</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost/Unit</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Cost</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest"></TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {(!selectedRecipe.ingredients || selectedRecipe.ingredients.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm italic">
                                                        No direct ingredients added to this recipe.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                selectedRecipe.ingredients.map(item => (
                                                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.ingredient?.name}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-800 dark:text-white/90">{formatNumber(item.quantity)} {item.ingredient?.unit}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                                            {formatCurrency(item.ingredient?.cost_per_unit)}/{item.ingredient?.unit}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-bold text-gray-800 dark:text-white/90">{formatCurrency(item.cost_for_recipe)}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => handleRemoveIngredient(item.id)}
                                                                className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Base Preparations Section */}
                            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                                    <h4 className="font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                                        <Layers size={18} className="text-warning-500" />
                                        Base Preparations
                                    </h4>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-warning-200 text-warning-600 hover:bg-warning-50 dark:border-warning-900/30 dark:text-warning-400 dark:hover:bg-warning-500/10"
                                        onClick={() => setShowAddBasePrepModal(true)}
                                        startIcon={<Plus size={16} />}
                                    >
                                        Add Base Prep
                                    </Button>
                                </div>
                                <div className="max-w-full overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                                            <TableRow>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preparation</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight Used</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost/kg</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contribution</TableCell>
                                                <TableCell isHeader className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest"></TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {(!selectedRecipe.base_preparations || selectedRecipe.base_preparations.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm italic">
                                                        No base preparations used in this recipe.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                selectedRecipe.base_preparations.map(item => (
                                                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.base_preparation?.name}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-800 dark:text-white/90">{formatNumber(item.weight_used_kg)} kg</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                                            {formatCurrency(item.base_preparation?.cost_per_kg)}/kg
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-bold text-warning-600 dark:text-warning-400">{formatCurrency(item.cost_contribution)}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => handleRemoveBasePrep(item.id)}
                                                                className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Instructions Section */}
                            {selectedRecipe.instructions && (
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <h4 className="font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400" />
                                        Instructions
                                    </h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <pre className="whitespace-pre-wrap font-sans text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl">
                                            {selectedRecipe.instructions}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* Add Ingredient to Recipe Modal */}
            <Modal
                isOpen={showAddIngredientModal}
                onClose={() => setShowAddIngredientModal(false)}
                className="max-w-xl"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Add Ingredient</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a direct ingredient to {selectedRecipe?.name}.</p>
                </div>

                <form onSubmit={handleAddIngredient} className="space-y-5">
                    <div>
                        <Label htmlFor="ing_id">Select Ingredient *</Label>
                        <Select
                            id="ing_id"
                            value={ingredientData.ingredient_id}
                            onChange={(val) => setIngredientData({ ...ingredientData, ingredient_id: val })}
                            options={ingredients.map(ing => ({
                                label: `${ing.name} (${formatCurrency(ing.cost_per_unit)}/${ing.unit})`,
                                value: ing.id
                            }))}
                            placeholder="Select an ingredient"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="ing_q">Quantity Required *</Label>
                        <Input
                            id="ing_q"
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            placeholder="Enter amount needed"
                            value={ingredientData.quantity}
                            onChange={(e) => setIngredientData({ ...ingredientData, quantity: e.target.value })}
                            required
                        />
                    </div>

                    {ingredientData.ingredient_id && ingredientData.quantity && (
                        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-900/20">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-brand-600 dark:text-brand-400">Estimated Cost:</span>
                                <span className="text-brand-700 dark:text-brand-300">
                                    {formatCurrency(
                                        parseFloat(ingredientData.quantity) *
                                        parseFloat(ingredients.find(i => i.id == ingredientData.ingredient_id)?.cost_per_unit || 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setShowAddIngredientModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Ingredient
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Base Preparation Modal */}
            <Modal
                isOpen={showAddBasePrepModal}
                onClose={() => setShowAddBasePrepModal(false)}
                className="max-w-xl"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Add Base Preparation</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a shared mixture or dough to {selectedRecipe?.name}.</p>
                </div>

                <form onSubmit={handleAddBasePrep} className="space-y-5">
                    <div>
                        <Label htmlFor="base_prep_id">Select Base Preparation *</Label>
                        <Select
                            id="base_prep_id"
                            value={basePrepData.base_preparation_id}
                            onChange={(val) => setBasePrepData({ ...basePrepData, base_preparation_id: val })}
                            options={basePreparations.map(prep => ({
                                label: `${prep.name} (${formatCurrency(prep.cost_per_kg)}/kg)`,
                                value: prep.id
                            }))}
                            placeholder="Select base preparation"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="base_weight">Weight Used (kg) *</Label>
                        <Input
                            id="base_weight"
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            placeholder="Enter weight in kg"
                            value={basePrepData.weight_used_kg}
                            onChange={(e) => setBasePrepData({ ...basePrepData, weight_used_kg: e.target.value })}
                            required
                        />
                    </div>

                    {basePrepData.base_preparation_id && basePrepData.weight_used_kg && (
                        <div className="p-4 rounded-xl bg-warning-50 dark:bg-warning-500/5 border border-warning-100 dark:border-warning-900/20">
                            <div className="flex justify-between items-center text-sm font-medium text-warning-700 dark:text-warning-400">
                                <span>Cost Contribution:</span>
                                <span className="font-bold">
                                    {formatCurrency(
                                        parseFloat(basePrepData.weight_used_kg) *
                                        parseFloat(basePreparations.find(p => p.id == basePrepData.base_preparation_id)?.cost_per_kg || 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setShowAddBasePrepModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-warning-500 hover:bg-warning-600 text-white border-none">
                            Add Base Prep
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
