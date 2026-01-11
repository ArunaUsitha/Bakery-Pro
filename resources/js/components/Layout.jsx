import React, { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
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
    User as UserIcon,
    BookOpen,
    Layers,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
            { path: '/ingredients', icon: Package, label: 'Ingredients', roles: ['admin', 'manager'] },
            { path: '/recipes', icon: BookOpen, label: 'Recipes', roles: ['admin', 'manager'] },
            { path: '/base-preparations', icon: Layers, label: 'Base Preparations', roles: ['admin', 'manager'] },
        ]
    },
    {
        section: 'Management', items: [
            { path: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager'] },
            { path: '/wastage', icon: Trash2, label: 'Wastage' },
            { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
        ]
    },
];

function Layout({ children, theme, toggleTheme }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const userRoles = user?.roles?.map(r => r.name) || [];

    const filteredNavItems = navItems.map(section => ({
        ...section,
        items: section.items.filter(item =>
            !item.roles || item.roles.some(role => userRoles.includes(role))
        )
    })).filter(section => section.items.length > 0);

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

    const handleLogout = async () => {
        await logout();
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
                    {filteredNavItems.map((section, idx) => (
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
                        <div className="sidebar-user-avatar">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'User'}</div>
                            <div className="sidebar-user-role capitalize">{userRoles[0] || 'Staff'}</div>
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
                        <button className="header-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="header-btn" title="Notifications">
                            <Bell size={20} />
                            <span className="badge-dot"></span>
                        </button>
                        <button className="header-btn" title="Settings">
                            <Settings size={20} />
                        </button>
                        <div className="user-dropdown-container relative">
                            <button
                                className="header-user flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="header-user-avatar w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <span className="header-user-name text-sm font-medium text-[var(--text-primary)] hidden sm:block">
                                    {user?.name || 'User'}
                                </span>
                                <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-2 border-b border-[var(--border-color)] mb-1">
                                            <p className="text-xs text-[var(--text-muted)]">Signed in as</p>
                                            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{user?.email}</p>
                                        </div>
                                        <button className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 transition-colors">
                                            <UserIcon size={16} /> Profile
                                        </button>
                                        <button className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 transition-colors">
                                            <Settings size={16} /> Settings
                                        </button>
                                        <div className="border-t border-[var(--border-color)] mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut size={16} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="page-content">
                    <Outlet />
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
