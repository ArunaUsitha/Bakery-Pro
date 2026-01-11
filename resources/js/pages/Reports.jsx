import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    ChevronRight,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Download,
    RefreshCw,
    FileText,
    Printer,
    AlertTriangle,
    Package
} from 'lucide-react';
import {
    getReports,
    generateDailyReport,
    getDashboardStats
} from '../utils/api';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

function Reports() {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('overview');
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, statsRes] = await Promise.all([
                getReports({ limit: 30 }),
                getDashboardStats()
            ]);
            setReports(reportsRes.data.data || []);
            setStats(statsRes.data);
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        try {
            await generateDailyReport(selectedDate);
            toast.success('Daily report generated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    // Chart data
    const salesTrendData = stats?.sales_trend || [];

    const pieData = [
        { name: 'Shop Sales', value: stats?.today?.sales || 0, color: '#8b5cf6' },
        { name: 'Vehicle Sales', value: (stats?.week?.sales || 0) - (stats?.today?.sales || 0), color: '#6366f1' },
        { name: 'Wastage', value: stats?.week?.wastage || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Reports & Analytics</h2>
                    <div className="page-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Reports</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        className="form-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerateReport}
                        disabled={generating}
                    >
                        {generating ? <div className="spinner" style={{ width: 16, height: 16 }}></div> : <RefreshCw size={16} />}
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="card mb-6">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <BarChart3 size={16} />
                        <span className="ml-2">Overview</span>
                    </button>
                    <button
                        className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
                        onClick={() => setActiveTab('daily')}
                    >
                        <Calendar size={16} />
                        <span className="ml-2">Daily Reports</span>
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid mb-6">
                        <div className="stat-card primary">
                            <div className="stat-icon primary">
                                <DollarSign size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Today's Revenue</div>
                                <div className="stat-value">{formatCurrency(stats?.today?.sales || 0)}</div>
                                <div className="stat-trend up">
                                    <TrendingUp size={14} />
                                    <span>Active day</span>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-icon success">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Weekly Revenue</div>
                                <div className="stat-value">{formatCurrency(stats?.week?.sales || 0)}</div>
                            </div>
                        </div>
                        <div className="stat-card info">
                            <div className="stat-icon info">
                                <BarChart3 size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Monthly Revenue</div>
                                <div className="stat-value">{formatCurrency(stats?.month?.sales || 0)}</div>
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <div className="stat-icon danger">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">Weekly Wastage</div>
                                <div className="stat-value">{formatCurrency(stats?.week?.wastage || 0)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid-2 mb-6">
                        {/* Sales Trend */}
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h4 className="card-title">
                                    <TrendingUp size={20} className="text-primary" />
                                    Sales Trend (Last 7 Days)
                                </h4>
                            </div>
                            <div className="card-body" style={{ height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrendData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                                        <Tooltip
                                            formatter={(value) => [formatCurrency(value), 'Revenue']}
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
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Products & Summary */}
                    <div className="grid-2">
                        {/* Top Products */}
                        <div className="card">
                            <div className="card-header">
                                <h4 className="card-title">
                                    <Package size={20} className="text-primary" />
                                    Top Selling Products
                                </h4>
                            </div>
                            <div className="card-body p-0">
                                {(stats?.top_products || []).map((product, index) => (
                                    <div key={index} className="list-item">
                                        <div className="avatar sm" style={{
                                            background: COLORS[index % COLORS.length]
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-sm text-muted">{product.total_qty} units</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-success">{formatCurrency(product.total_revenue)}</div>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.top_products || stats.top_products.length === 0) && (
                                    <div className="p-6 text-center text-muted">
                                        No sales data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Summary */}
                        <div className="card">
                            <div className="card-header">
                                <h4 className="card-title">
                                    <BarChart3 size={20} className="text-primary" />
                                    Weekly Summary
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="flex flex-col gap-4">
                                    <div className="p-4 rounded-xl bg-tertiary">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm text-muted">Total Sales</div>
                                                <div className="text-2xl font-bold text-success">{formatCurrency(stats?.week?.sales || 0)}</div>
                                            </div>
                                            <div className="stat-icon success" style={{ width: 48, height: 48 }}>
                                                <TrendingUp size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-tertiary">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm text-muted">Total Wastage</div>
                                                <div className="text-2xl font-bold text-danger">{formatCurrency(stats?.week?.wastage || 0)}</div>
                                            </div>
                                            <div className="stat-icon danger" style={{ width: 48, height: 48 }}>
                                                <TrendingDown size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm text-muted">Net Revenue</div>
                                                <div className="text-2xl font-bold text-primary">
                                                    {formatCurrency((stats?.week?.sales || 0) - (stats?.week?.wastage || 0))}
                                                </div>
                                            </div>
                                            <div className="stat-icon primary" style={{ width: 48, height: 48 }}>
                                                <DollarSign size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'daily' && (
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title">
                            <FileText size={20} className="text-primary" />
                            Daily Report History
                        </h4>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Production Cost</th>
                                    <th>Shop Sales</th>
                                    <th>Vehicle Sales</th>
                                    <th>Total Revenue</th>
                                    <th>Wastage</th>
                                    <th>Discrepancy</th>
                                    <th>Net Profit</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="9">
                                            <div className="empty-state">
                                                <div className="empty-state-icon">
                                                    <FileText size={40} />
                                                </div>
                                                <h3>No reports generated yet</h3>
                                                <p>Generate your first daily report to see data here</p>
                                                <button className="btn btn-primary" onClick={handleGenerateReport}>
                                                    <RefreshCw size={16} />
                                                    Generate Report
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map(report => (
                                        <tr key={report.id}>
                                            <td className="font-medium">{formatDate(report.report_date)}</td>
                                            <td>{formatCurrency(report.total_production_cost)}</td>
                                            <td className="text-success">{formatCurrency(report.total_shop_sales)}</td>
                                            <td className="text-info">{formatCurrency(report.total_vehicle_sales)}</td>
                                            <td className="font-semibold">{formatCurrency(report.total_revenue)}</td>
                                            <td className="text-danger">{formatCurrency(report.total_wastage_cost)}</td>
                                            <td className={parseFloat(report.total_discrepancy) >= 0 ? 'text-success' : 'text-danger'}>
                                                {parseFloat(report.total_discrepancy) >= 0 ? '+' : ''}{formatCurrency(report.total_discrepancy)}
                                            </td>
                                            <td className={`font-bold ${parseFloat(report.net_profit) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(report.net_profit)}
                                            </td>
                                            <td>
                                                <span className={`badge ${report.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
