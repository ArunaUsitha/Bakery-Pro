import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    PlusIcon,
    BoxIconLine,
    TrashBinIcon,
    PencilIcon,
    HorizontaLDots,
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
import { getProducts, createProduct, updateProduct, deleteProduct } from "../utils/api";
import { formatCurrency, getCategoryBadge } from "../utils/formatters";
import { useToast } from "../context/ToastContext";
import { Package, Clock, ChevronRight, Search } from "lucide-react";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "day_food",
        production_cost: "",
        shop_price: "",
        selling_price: "",
        shelf_life_days: 1,
        description: "",
    });
    const toast = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await getProducts();
            setProducts(response.data);
        } catch (error) {
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
                toast.success("Product updated successfully");
            } else {
                await createProduct(formData);
                toast.success("Product created successfully");
            }
            fetchProducts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save product");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            toast.success("Product deleted successfully");
            fetchProducts();
        } catch (error) {
            toast.error("Failed to delete product");
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
                description: product.description || "",
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                category: "day_food",
                production_cost: "",
                shop_price: "",
                selling_price: "",
                shelf_life_days: 1,
                description: "",
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesCategory =
            categoryFilter === "all" || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const dayFoods = products.filter((p) => p.category === "day_food");
    const packedFoods = products.filter((p) => p.category === "packed_food");

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Products</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Products</span>
                    </div>
                </div>
                <Button onClick={() => openModal()} startIcon={<PlusIcon />}>
                    Add Product
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{products.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/10 text-warning-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Day Foods</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{dayFoods.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-info-50 rounded-xl dark:bg-info-500/10 text-info-500">
                            <BoxIconLine size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Packed Foods</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{packedFoods.length}</h4>
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
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select
                                className="w-44"
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                options={[
                                    { label: "All Categories", value: "all" },
                                    { label: "Day Food", value: "day_food" },
                                    { label: "Packed Food", value: "packed_food" },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Product Details
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Pricing
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Shelf Life
                                </TableCell>
                                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
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
                                        Loading products...
                                    </TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No products found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => {
                                    const categoryBadge = getCategoryBadge(product.category);
                                    return (
                                        <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg text-brand-500 font-bold">
                                                        {product.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{product.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{product.description}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <Badge color={product.category === "day_food" ? "warning" : "info"} size="sm">
                                                    {product.category.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-800 dark:text-white/90 font-medium">Selling: {formatCurrency(product.selling_price)}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Cost: {formatCurrency(product.production_cost)}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-800 dark:text-white/90">{product.shelf_life_days} Days</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap">
                                                <Badge color={product.is_active ? "success" : "light"} size="sm">
                                                    {product.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                                                    >
                                                        <PencilIcon className="size-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
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
                onClose={closeModal}
                className="max-w-2xl"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                        {editingProduct ? "Edit Product" : "Add New Product"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {editingProduct ? "Update product details below." : "Enter the details for the new product."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                                id="name"
                                placeholder="Enter product name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                id="category"
                                value={formData.category}
                                onChange={(val) => setFormData({
                                    ...formData,
                                    category: val,
                                    shelf_life_days: val === 'day_food' ? 1 : 3
                                })}
                                options={[
                                    { label: "Day Food (Fresh)", value: "day_food" },
                                    { label: "Packed Food", value: "packed_food" },
                                ]}
                            />
                        </div>

                        <div>
                            <Label htmlFor="shelf_life">Shelf Life (Days) *</Label>
                            <Input
                                id="shelf_life"
                                type="number"
                                min="1"
                                value={formData.shelf_life_days}
                                onChange={(e) => setFormData({ ...formData, shelf_life_days: parseInt(e.target.value) })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="production_cost">Production Cost (LKR) *</Label>
                            <Input
                                id="production_cost"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.production_cost}
                                onChange={(e) => setFormData({ ...formData, production_cost: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="shop_price">Shop Price (LKR) *</Label>
                            <Input
                                id="shop_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.shop_price}
                                onChange={(e) => setFormData({ ...formData, shop_price: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="selling_price">Selling Price (LKR) *</Label>
                            <Input
                                id="selling_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.selling_price}
                                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white/90"
                                rows="3"
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingProduct ? "Update Product" : "Create Product"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
