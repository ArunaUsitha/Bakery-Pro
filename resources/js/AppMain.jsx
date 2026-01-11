import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Production from './pages/Production';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import VehicleSettlement from './pages/VehicleSettlement';
import Wastage from './pages/Wastage';
import Reports from './pages/Reports';
import Ingredients from './pages/Ingredients';
import Recipes from './pages/Recipes';
import BasePreparations from './pages/BasePreparations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles.length > 0) {
        const userRoles = user.roles?.map(r => r.name) || [];
        if (!roles.some(role => userRoles.includes(role))) {
            return <Navigate to="/" replace />;
        }
    }

    return children ? children : <Outlet />;
};

function App() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <AuthProvider>
            <ToastProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={
                        <ProtectedRoute>
                            <Layout theme={theme} toggleTheme={toggleTheme} />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="production" element={<Production />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="sales" element={<Sales />} />
                        <Route path="settlements" element={<VehicleSettlement />} />
                        <Route path="wastage" element={<Wastage />} />

                        {/* Role Protected Sub-routes */}
                        <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
                            <Route path="products" element={<Products />} />
                            <Route path="ingredients" element={<Ingredients />} />
                            <Route path="recipes" element={<Recipes />} />
                            <Route path="base-preparations" element={<BasePreparations />} />
                        </Route>

                        <Route element={<ProtectedRoute roles={['admin']} />}>
                            <Route path="reports" element={<Reports />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
