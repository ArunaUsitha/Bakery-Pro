import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    Factory,
    Truck,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    ChevronRight,
    BarChart3,
    PieChart,
    Activity,
    Croissant,
    Store,
    Wallet,
    Calendar
} from 'lucide-react';
import { getDashboardStats } from '../utils/api';
import { formatCurrency, formatNumber, getCurrentShiftStatus } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const shiftStatus = getCurrentShiftStatus();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Sample data for charts (will be replaced with real data)
    const salesTrendData = stats?.sales_trend || [
        { date: 'Mon', total: 12500 },
        { date: 'Tue', total: 18200 },
        { date: 'Wed', total: 15600 },
        { date: 'Thu', total: 22100 },
        { date: 'Fri', total: 28400 },
        { date: 'Sat', total: 35200 },
        { date: 'Sun', total: 21000 },
    ];

    const topProducts = stats?.top_products || [
        { name: 'Croissant', total_qty: 156, total_revenue: 7800 },
        { name: 'Fresh Bread', total_qty: 142, total_revenue: 8520 },
        { name: 'Chocolate Muffin', total_qty: 98, total_revenue: 4410 },
        { name: 'Danish Pastry', total_qty: 87, total_revenue: 4785 },
        { name: 'Cinnamon Roll', total_qty: 76, total_revenue: 3952 },
    ];

    return (
        <div className="dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Dashboard</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Dashboard</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="time-indicator">
                        <span className={`dot ${shiftStatus.color}`}></span>
                        <span>{shiftStatus.label}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-lg font-semibold">{currentTime}</span>
                        <span className="text-sm text-muted">{currentDate}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Today's Sales</div>
                        <div className="stat-value">{formatCurrency(stats?.today?.sales || 0)}</div>
                        <div className="stat-trend up">
                            <TrendingUp size={14} />
                            <span>+12.5%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon success">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Weekly Sales</div>
                        <div className="stat-value">{formatCurrency(stats?.week?.sales || 0)}</div>
                        <div className="stat-trend up">
                            <TrendingUp size={14} />
                            <span>+8.3%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Today's Wastage</div>
                        <div className="stat-value">{formatCurrency(stats?.today?.wastage || 0)}</div>
                        <div className="stat-trend down">
                            <TrendingDown size={14} />
                            <span>-5.2%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon info">
                        <Wallet size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Inventory Value</div>
                        <div className="stat-value">{formatCurrency(stats?.total_inventory_value || 0)}</div>
                        <div className="stat-trend up">
                            <Activity size={14} />
                            <span>Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid-3 mb-6">
                {/* Sales Trend Chart */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h4 className="card-title">
                            <BarChart3 size={20} className="text-primary" />
                            Sales Trend (Last 7 Days)
                        </h4>
                        <button className="btn btn-sm btn-secondary">View All</button>
                    </div>
                    <div className="card-body" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrendData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value), 'Sales']}
                                    contentStyle={{
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <Croissant size={20} className="text-primary" />
                            Top Products
                        </h4>
                    </div>
                    <div className="card-body p-0">
                        {topProducts.map((product, index) => (
                            <div key={index} className="list-item">
                                <div className="avatar sm" style={{
                                    background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' :
                                        index === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' :
                                            index === 2 ? 'linear-gradient(135deg, #cd7c2e, #ea9b54)' :
                                                'linear-gradient(135deg, #8b5cf6, #a855f7)'
                                }}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted">{product.total_qty} units sold</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-success">{formatCurrency(product.total_revenue)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions & Status */}
            <div className="grid-2">
                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <Activity size={20} className="text-primary" />
                            Quick Actions
                        </h4>
                    </div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <Link to="/production" className="quick-action-btn">
                                <Factory size={18} />
                                <span>Start Production</span>
                            </Link>
                            <Link to="/sales" className="quick-action-btn">
                                <ShoppingCart size={18} />
                                <span>New Sale</span>
                            </Link>
                            <Link to="/inventory" className="quick-action-btn">
                                <Package size={18} />
                                <span>Transfer Stock</span>
                            </Link>
                            <Link to="/settlements" className="quick-action-btn">
                                <Truck size={18} />
                                <span>Vehicle Settlement</span>
                            </Link>
                            <Link to="/wastage" className="quick-action-btn">
                                <AlertTriangle size={18} />
                                <span>Record Wastage</span>
                            </Link>
                            <Link to="/reports" className="quick-action-btn">
                                <BarChart3 size={18} />
                                <span>Generate Report</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Today's Status */}
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <Calendar size={20} className="text-primary" />
                            Today's Status
                        </h4>
                    </div>
                    <div className="card-body">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-tertiary">
                                <div className="flex items-center gap-3">
                                    <div className="stat-icon primary" style={{ width: 40, height: 40 }}>
                                        <Factory size={18} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Production Status</div>
                                        <div className="text-sm text-muted">Shift 5AM - 12PM</div>
                                    </div>
                                </div>
                                <span className={`badge ${stats?.production_status === 'completed' ? 'badge-success' : stats?.production_status === 'in_progress' ? 'badge-warning' : 'badge-secondary'}`}>
                                    {stats?.production_status === 'completed' ? 'Completed' :
                                        stats?.production_status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-tertiary">
                                <div className="flex items-center gap-3">
                                    <div className="stat-icon warning" style={{ width: 40, height: 40 }}>
                                        <Truck size={18} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Pending Settlements</div>
                                        <div className="text-sm text-muted">Vehicles to settle</div>
                                    </div>
                                </div>
                                <span className={`badge ${(stats?.pending_settlements || 0) > 0 ? 'badge-warning' : 'badge-success'}`}>
                                    {stats?.pending_settlements || 0} pending
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-tertiary">
                                <div className="flex items-center gap-3">
                                    <div className="stat-icon success" style={{ width: 40, height: 40 }}>
                                        <Store size={18} />
                                    </div>
                                    <div>
                                        <div className="font-medium">Shop Status</div>
                                        <div className="text-sm text-muted">Cash collection at 8PM</div>
                                    </div>
                                </div>
                                <span className="badge badge-info">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="card mt-6">
                <div className="card-header">
                    <h4 className="card-title">
                        <PieChart size={20} className="text-primary" />
                        Monthly Summary
                    </h4>
                    <button className="btn btn-sm btn-primary">
                        <BarChart3 size={16} />
                        Full Report
                    </button>
                </div>
                <div className="card-body">
                    <div className="grid-4">
                        <div className="text-center p-4 rounded-xl bg-tertiary">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {formatCurrency(stats?.month?.sales || 0)}
                            </div>
                            <div className="text-sm text-muted">Monthly Sales</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-tertiary">
                            <div className="text-3xl font-bold text-success mb-1">
                                {formatCurrency((stats?.month?.sales || 0) - (stats?.month?.wastage || 0))}
                            </div>
                            <div className="text-sm text-muted">Net Revenue</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-tertiary">
                            <div className="text-3xl font-bold text-warning mb-1">
                                {formatCurrency(stats?.month?.wastage || 0)}
                            </div>
                            <div className="text-sm text-muted">Total Wastage</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-tertiary">
                            <div className="text-3xl font-bold text-info mb-1">
                                {formatNumber(stats?.total_inventory_value ? Math.round(stats.total_inventory_value / 100) : 0)}
                            </div>
                            <div className="text-sm text-muted">Items in Stock</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
