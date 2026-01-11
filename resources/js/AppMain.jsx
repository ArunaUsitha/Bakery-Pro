import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { ToastProvider } from './context/ToastContext';

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
        <ToastProvider>
            <Layout theme={theme} toggleTheme={toggleTheme}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/production" element={<Production />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/settlements" element={<VehicleSettlement />} />
                    <Route path="/wastage" element={<Wastage />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ingredients" element={<Ingredients />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/base-preparations" element={<BasePreparations />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </ToastProvider>
    );
}

export default App;
