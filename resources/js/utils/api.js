import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Production
export const getTodayBatch = () => api.get('/production/today');
export const getProductionBatches = () => api.get('/production');
export const createBatch = (data) => api.post('/production', data);
export const addProductionItem = (batchId, data) => api.post(`/production/${batchId}/items`, data);
export const removeProductionItem = (batchId, itemId) => api.delete(`/production/${batchId}/items/${itemId}`);
export const completeBatch = (batchId) => api.post(`/production/${batchId}/complete`);

// Inventory
export const getInventory = (params) => api.get('/inventory', { params });
export const getLocations = () => api.get('/inventory/locations');
export const createLocation = (data) => api.post('/inventory/locations', data);
export const getLocationInventory = (locationId) => api.get(`/inventory/locations/${locationId}`);
export const transferFromProduction = (data) => api.post('/inventory/transfer-from-production', data);
export const transferBetweenLocations = (data) => api.post('/inventory/transfer', data);
export const getTransfers = (params) => api.get('/inventory/transfers', { params });

// Sales
export const getSales = (params) => api.get('/sales', { params });
export const getTodaySale = (locationId) => api.get('/sales/today', { params: { location_id: locationId } });
export const createSale = (data) => api.post('/sales', data);
export const addSaleItem = (saleId, data) => api.post(`/sales/${saleId}/items`, data);
export const recordCashCollection = (saleId, data) => api.post(`/sales/${saleId}/collect-cash`, data);
export const closeSale = (saleId) => api.post(`/sales/${saleId}/close`);

// Settlements
export const getSettlements = (params) => api.get('/settlements', { params });
export const initiateSettlement = (vehicleId) => api.post('/settlements/initiate', { vehicle_id: vehicleId });
export const recordReturn = (settlementId, data) => api.post(`/settlements/${settlementId}/record-return`, data);
export const settleVehicle = (settlementId, data) => api.post(`/settlements/${settlementId}/settle`, data);

// Wastage
export const getWastages = (params) => api.get('/wastage', { params });
export const recordWastage = (data) => api.post('/wastage', data);
export const processExpiredFoods = (locationId) => api.post('/wastage/process-expired', { location_id: locationId });
export const getShopSnapshot = (locationId) => api.get('/wastage/shop-snapshot', { params: { location_id: locationId } });

// Reports
export const getDashboardStats = () => api.get('/reports/dashboard');
export const getReports = (params) => api.get('/reports', { params });
export const generateDailyReport = (date) => api.post('/reports/generate', { date });

// Ingredients
export const getIngredients = (params) => api.get('/ingredients', { params });
export const getIngredient = (id) => api.get(`/ingredients/${id}`);
export const createIngredient = (data) => api.post('/ingredients', data);
export const updateIngredient = (id, data) => api.put(`/ingredients/${id}`, data);
export const deleteIngredient = (id) => api.delete(`/ingredients/${id}`);
export const getIngredientCategories = () => api.get('/ingredients/categories');
export const getLowStockIngredients = () => api.get('/ingredients/low-stock');
export const addIngredientStock = (id, data) => api.post(`/ingredients/${id}/add-stock`, data);
export const getIngredientPurchases = (id) => api.get(`/ingredients/${id}/purchases`);
export const adjustIngredientStock = (id, data) => api.post(`/ingredients/${id}/adjust-stock`, data);

// Recipes
export const getRecipes = (params) => api.get('/recipes', { params });
export const getRecipe = (id) => api.get(`/recipes/${id}`);
export const createRecipe = (data) => api.post('/recipes', data);
export const updateRecipe = (id, data) => api.put(`/recipes/${id}`, data);
export const deleteRecipe = (id) => api.delete(`/recipes/${id}`);
export const addRecipeIngredient = (recipeId, data) => api.post(`/recipes/${recipeId}/ingredients`, data);
export const updateRecipeIngredient = (recipeId, ingredientId, data) => api.put(`/recipes/${recipeId}/ingredients/${ingredientId}`, data);
export const removeRecipeIngredient = (recipeId, ingredientId) => api.delete(`/recipes/${recipeId}/ingredients/${ingredientId}`);
export const addRecipeBasePreparation = (recipeId, data) => api.post(`/recipes/${recipeId}/base-preparations`, data);
export const removeRecipeBasePreparation = (recipeId, prepId) => api.delete(`/recipes/${recipeId}/base-preparations/${prepId}`);
export const duplicateRecipe = (id) => api.post(`/recipes/${id}/duplicate`);
export const recalculateRecipeCost = (id) => api.post(`/recipes/${id}/recalculate`);

// Base Preparations
export const getBasePreparations = (params) => api.get('/base-preparations', { params });
export const getBasePreparation = (id) => api.get(`/base-preparations/${id}`);
export const createBasePreparation = (data) => api.post('/base-preparations', data);
export const updateBasePreparation = (id, data) => api.put(`/base-preparations/${id}`, data);
export const deleteBasePreparation = (id) => api.delete(`/base-preparations/${id}`);
export const addBasePrepIngredient = (prepId, data) => api.post(`/base-preparations/${prepId}/ingredients`, data);
export const updateBasePrepIngredient = (prepId, ingredientId, data) => api.put(`/base-preparations/${prepId}/ingredients/${ingredientId}`, data);
export const removeBasePrepIngredient = (prepId, ingredientId) => api.delete(`/base-preparations/${prepId}/ingredients/${ingredientId}`);
export const recalculateBasePrepCost = (id) => api.post(`/base-preparations/${id}/recalculate`);

export default api;
