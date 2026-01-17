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
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    addIngredientStock,
    getIngredientCategories
} from "../utils/api";
import { formatCurrency, formatNumber } from "../utils/formatters";
import { useToast } from "../context/ToastContext";
import { Package, AlertTriangle, ShoppingCart, DollarSign, Filter, ChevronRight, Loader2, Search } from "lucide-react";

export default function Ingredients() {
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "kg",
        cost_per_unit: "",
        stock_quantity: "",
        minimum_stock: "",
        supplier: ""
    });
    const [stockData, setStockData] = useState({
        quantity: "",
        cost_per_unit: "",
        supplier: "",
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ""
    });
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ingredientsRes, categoriesRes] = await Promise.all([
                getIngredients(),
                getIngredientCategories()
            ]);
            setIngredients(Array.isArray(ingredientsRes.data) ? ingredientsRes.data : []);
            setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        } catch (error) {
            toast.error("Failed to fetch ingredients");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateIngredient(editingItem.id, formData);
                toast.success("Ingredient updated");
            } else {
                await createIngredient(formData);
                toast.success("Ingredient created");
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save ingredient");
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            await addIngredientStock(selectedIngredient.id, stockData);
            toast.success("Stock added successfully");
            setShowStockModal(false);
            setStockData({
                quantity: "",
                cost_per_unit: "",
                supplier: "",
                purchase_date: new Date().toISOString().split('T')[0],
                notes: ""
            });
            fetchData();
        } catch (error) {
            toast.error("Failed to add stock");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this ingredient?")) return;
        try {
            await deleteIngredient(id);
            toast.success("Ingredient deleted");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Cannot delete ingredient");
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category || "",
            unit: item.unit,
            cost_per_unit: item.cost_per_unit,
            stock_quantity: item.stock_quantity,
            minimum_stock: item.minimum_stock,
            supplier: item.supplier || ""
        });
        setShowModal(true);
    };

    const openStockModal = (item) => {
        setSelectedIngredient(item);
        setStockData({
            ...stockData,
            cost_per_unit: item.cost_per_unit,
            supplier: item.supplier || ""
        });
        setShowStockModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            category: "",
            unit: "kg",
            cost_per_unit: "",
            stock_quantity: "",
            minimum_stock: "",
            supplier: ""
        });
    };

    const filteredIngredients = ingredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || item.category === filterCategory;
        const matchesLowStock = !showLowStockOnly || parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock);
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const lowStockCount = ingredients.filter(item =>
        parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock)
    ).length;

    const totalValue = ingredients.reduce((sum, item) =>
        sum + (parseFloat(item.stock_quantity) * parseFloat(item.cost_per_unit)), 0
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Ingredients</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Ingredients</span>
                    </div>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} startIcon={<PlusIcon />}>
                    Add Ingredient
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Ingredients</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{ingredients.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/10 text-success-500">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(totalValue)}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-error-50 rounded-xl dark:bg-error-500/10 text-error-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{lowStockCount}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-info-50 rounded-xl dark:bg-info-500/10 text-info-500">
                            <Filter size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{categories.length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select
                                className="w-44"
                                value={filterCategory}
                                onChange={setFilterCategory}
                                options={[
                                    { label: "All Categories", value: "all" },
                                    ...categories.map(cat => ({ label: cat, value: cat }))
                                ]}
                            />
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={showLowStockOnly}
                                    onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                                />
                                <span>Low Stock Only</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Ingredient
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Cost/Unit
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Stock Status
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total Value
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500 mx-auto mb-2"></div>
                                        Loading ingredients...
                                    </TableCell>
                                </TableRow>
                            ) : filteredIngredients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No ingredients found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredIngredients.map((item) => {
                                    const isLowStock = parseFloat(item.stock_quantity) <= parseFloat(item.minimum_stock);
                                    const value = parseFloat(item.stock_quantity) * parseFloat(item.cost_per_unit);
                                    return (
                                        <TableRow key={item.id} className={`${isLowStock ? 'bg-error-50/30 dark:bg-error-500/5' : ''} hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors`}>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg text-brand-500 font-bold">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{item.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">Unit: {item.unit}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <Badge color="light" size="sm">
                                                    {item.category || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-800 dark:text-white/90 font-medium">{formatCurrency(item.cost_per_unit)}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${isLowStock ? 'text-error-500' : 'text-gray-800 dark:text-white/90'}`}>
                                                        {formatNumber(item.stock_quantity)} {item.unit}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Min: {item.minimum_stock}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-success-600 dark:text-success-400 font-bold">{formatCurrency(value)}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openStockModal(item)}
                                                        className="p-2 text-gray-500 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 rounded-lg transition-colors"
                                                        title="Add Stock"
                                                    >
                                                        <ShoppingCart size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="size-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashBinIcon className="size-5" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                className="max-w-2xl"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                        {editingItem ? 'Edit Ingredient' : 'Add Ingredient'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {editingItem ? "Update ingredient details." : "Enter the details for the new ingredient."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Flour, Sugar..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <div className="relative">
                                <Input
                                    id="category"
                                    placeholder="e.g., flour, yeast, fats..."
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                                {/* Simple datalist-like dropdown could be added here if needed */}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="unit">Unit *</Label>
                            <Select
                                id="unit"
                                value={formData.unit}
                                onChange={(val) => setFormData({ ...formData, unit: val })}
                                options={[
                                    { label: "kg", value: "kg" },
                                    { label: "L (Liter)", value: "L" },
                                    { label: "piece", value: "piece" },
                                    { label: "packet", value: "packet" },
                                    { label: "g (gram)", value: "g" },
                                    { label: "ml", value: "ml" },
                                ]}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost_per_unit">Cost Per Unit (LKR) *</Label>
                            <Input
                                id="cost_per_unit"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.cost_per_unit}
                                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="stock_quantity">Current Stock</Label>
                            <Input
                                id="stock_quantity"
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="minimum_stock">Minimum Stock (Alert)</Label>
                            <Input
                                id="minimum_stock"
                                type="number"
                                step="0.001"
                                placeholder="0"
                                value={formData.minimum_stock}
                                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Input
                                id="supplier"
                                placeholder="Supplier name..."
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingItem ? 'Update' : 'Create'} Ingredient
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Stock Modal */}
            <Modal
                isOpen={showStockModal}
                onClose={() => setShowStockModal(false)}
                className="max-w-xl"
            >
                {selectedIngredient && (
                    <>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                                Add Stock - {selectedIngredient.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Record a new purchase for this ingredient.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-6 flex justify-between items-center border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Current Stock:</span>
                            <span className="font-bold text-gray-800 dark:text-white/90">{formatNumber(selectedIngredient.stock_quantity)} {selectedIngredient.unit}</span>
                        </div>

                        <form onSubmit={handleAddStock} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="stock_q">Quantity *</Label>
                                    <Input
                                        id="stock_q"
                                        type="number"
                                        step="0.001"
                                        placeholder="Quantity to add"
                                        value={stockData.quantity}
                                        onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="stock_cost">Cost Per Unit (LKR) *</Label>
                                    <Input
                                        id="stock_cost"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={stockData.cost_per_unit}
                                        onChange={(e) => setStockData({ ...stockData, cost_per_unit: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="stock_date">Purchase Date *</Label>
                                    <Input
                                        id="stock_date"
                                        type="date"
                                        value={stockData.purchase_date}
                                        onChange={(e) => setStockData({ ...stockData, purchase_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="stock_supplier">Supplier</Label>
                                    <Input
                                        id="stock_supplier"
                                        placeholder="Supplier name"
                                        value={stockData.supplier}
                                        onChange={(e) => setStockData({ ...stockData, supplier: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="stock_notes">Notes</Label>
                                    <textarea
                                        id="stock_notes"
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white/90"
                                        placeholder="Purchase notes..."
                                        value={stockData.notes}
                                        onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                            </div>

                            {stockData.quantity && stockData.cost_per_unit && (
                                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-900/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-brand-600 dark:text-brand-400 text-sm font-medium">Estimated Total Cost:</span>
                                        <span className="text-lg font-bold text-brand-700 dark:text-brand-300">
                                            {formatCurrency(parseFloat(stockData.quantity) * parseFloat(stockData.cost_per_unit))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button variant="outline" onClick={() => setShowStockModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" startIcon={<ShoppingCart size={18} />}>
                                    Add Stock
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </Modal>
        </div>
    );
}
