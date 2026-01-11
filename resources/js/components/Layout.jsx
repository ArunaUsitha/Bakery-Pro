import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Factory,
    Warehouse,
    ShoppingCart,
    Truck,
    Trash2,
    BarChart3,
    Menu,
    X,
    Search,
    Bell,
    Moon,
    Sun,
    Settings,
    ChevronDown,
    Croissant,
    User,
    BookOpen,
    Layers
} from 'lucide-react';

const navItems = [
    {
        section: 'Main', items: [
            { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        ]
    },
    {
        section: 'Operations', items: [
            { path: '/production', icon: Factory, label: 'Production' },
            { path: '/inventory', icon: Warehouse, label: 'Inventory' },
            { path: '/sales', icon: ShoppingCart, label: 'Sales' },
            { path: '/settlements', icon: Truck, label: 'Vehicle Settlement' },
        ]
    },
    {
        section: 'Recipe Costing', items: [
            { path: '/ingredients', icon: Package, label: 'Ingredients' },
            { path: '/recipes', icon: BookOpen, label: 'Recipes' },
            { path: '/base-preparations', icon: Layers, label: 'Base Preparations' },
        ]
    },
    {
        section: 'Management', items: [
            { path: '/products', icon: Package, label: 'Products' },
            { path: '/wastage', icon: Trash2, label: 'Wastage' },
            { path: '/reports', icon: BarChart3, label: 'Reports' },
        ]
    },
];

function Layout({ children, theme, toggleTheme }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    const getCurrentPageTitle = () => {
        for (const section of navItems) {
            for (const item of section.items) {
                if (item.path === location.pathname) {
                    return item.label;
                }
            }
        }
        return 'Dashboard';
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setSidebarOpen(!sidebarOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Croissant size={24} />
                    </div>
                    <div className="sidebar-title">
                        <h1>BakeryPro</h1>
                        <span>Management System</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((section, idx) => (
                        <div key={idx} className="nav-section">
                            <div className="nav-section-title">{section.section}</div>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">A</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">Admin User</div>
                            <div className="sidebar-user-role">Administrator</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <button className="header-toggle" onClick={toggleSidebar}>
                            <Menu size={20} />
                        </button>
                        <div className="header-search">
                            <Search size={18} />
                            <input type="text" placeholder="Search products, reports..." />
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="header-btn" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="header-btn">
                            <Bell size={20} />
                            <span className="badge-dot"></span>
                        </button>
                        <button className="header-btn">
                            <Settings size={20} />
                        </button>
                        <div className="header-user">
                            <div className="header-user-avatar">A</div>
                            <span className="header-user-name">Admin</span>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="page-content">
                    {children}
                </div>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 99 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}

export default Layout;
