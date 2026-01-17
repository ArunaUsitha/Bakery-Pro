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
    Package,
    Loader2
} from 'lucide-react';
import {
    getReports,
    generateDailyReport,
    getDashboardStats
} from '../utils/api';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../theme/tailadmin/components/ui/table";
import Badge from "../theme/tailadmin/components/ui/badge/Badge";
import Button from "../theme/tailadmin/components/ui/button/Button";
import Input from "../theme/tailadmin/components/form/input/InputField";

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
        setLoading(true);
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
    const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Reports & Analytics</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/" className="hover:text-brand-500">Home</Link>
                        <ChevronRight size={14} />
                        <span>Reports</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                        type="date"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand-500 dark:border-white/[0.03] dark:bg-white/[0.03] dark:focus:border-brand-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <Button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        startIcon={generating ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw size={16} />}
                    >
                        {generating ? 'Generating...' : 'Generate Report'}
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 dark:border-white/[0.03] dark:bg-white/[0.03]">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
                >
                    <BarChart3 size={16} />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === 'daily' ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
                >
                    <Calendar size={16} />
                    Daily Reports
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Revenue Card */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                                    <DollarSign size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Today's Revenue</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(stats?.today?.sales || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Revenue</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(stats?.week?.sales || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(stats?.month?.sales || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Wastage</p>
                                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formatCurrency(stats?.week?.wastage || 0)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                            <TrendingUp size={20} className="text-brand-500" />
                            Sales Trend (Last 7 Days)
                        </h4>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrendData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ dy: 10 }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickFormatter={(v) => `${v / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ dx: -10 }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                                        contentStyle={{
                                            background: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#4F46E5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lower Grid: Top Products & Weekly Summary */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Top Products */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                                <Package size={20} className="text-brand-500" />
                                Top Selling Products
                            </h4>
                            <div className="space-y-4">
                                {(stats?.top_products || []).map((product, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-xl border border-gray-50 p-4 transition-all hover:bg-gray-50 dark:border-white/[0.03] dark:hover:bg-white/[0.01]">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                                                style={{ background: COLORS[index % COLORS.length] }}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-800 dark:text-white/90">{product.name}</h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{product.total_qty} units sold</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-500">{formatCurrency(product.total_revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.top_products || stats.top_products.length === 0) && (
                                    <div className="py-20 text-center text-gray-500">No sales data available</div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Breakdown Summary */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90 mb-6">
                                <BarChart3 size={20} className="text-brand-500" />
                                Weekly Summary
                            </h4>
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-green-50/50 p-5 dark:bg-green-500/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                                <TrendingUp size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</span>
                                        </div>
                                        <span className="text-xl font-black text-green-600 dark:text-green-400">{formatCurrency(stats?.week?.sales || 0)}</span>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-red-50/50 p-5 dark:bg-red-500/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                                <TrendingDown size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Wastage</span>
                                        </div>
                                        <span className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(stats?.week?.wastage || 0)}</span>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-brand-50 p-6 dark:bg-brand-500/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 text-xl font-black">
                                                $
                                            </div>
                                            <span className="font-bold text-brand-900 dark:text-brand-300">Net Weekly Revenue</span>
                                        </div>
                                        <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                                            {formatCurrency((stats?.week?.sales || 0) - (stats?.week?.wastage || 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'daily' && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/[0.03] dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white/90">
                            <FileText size={20} className="text-brand-500" />
                            Daily Report History
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Showing last 30 reports</div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.03]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell isHeader px="px-4">Date</TableCell>
                                    <TableCell isHeader px="px-4">Prod. Cost</TableCell>
                                    <TableCell isHeader px="px-4">Revenue</TableCell>
                                    <TableCell isHeader px="px-4">Wastage</TableCell>
                                    <TableCell isHeader px="px-4">Discrepancy</TableCell>
                                    <TableCell isHeader px="px-4">Net Profit</TableCell>
                                    <TableCell isHeader px="px-4">Status</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="mb-4 text-gray-300" size={48} />
                                                <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">No reports generated yet</h5>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate your first daily report to see data here</p>
                                                <Button onClick={handleGenerateReport} className="mt-6" startIcon={<RefreshCw size={16} />}>
                                                    Generate Report
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map(report => (
                                        <TableRow key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                                            <TableCell className="px-4 py-4 font-bold text-gray-800 dark:text-white/90">
                                                {formatDate(report.report_date)}
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-gray-500 dark:text-gray-400">
                                                {formatCurrency(report.total_production_cost)}
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 dark:text-white/90">{formatCurrency(report.total_revenue)}</span>
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">S: {formatCurrency(report.total_shop_sales)} | V: {formatCurrency(report.total_vehicle_sales)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 font-bold text-red-500">
                                                {formatCurrency(report.total_wastage_cost)}
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <span className={`font-bold ${parseFloat(report.total_discrepancy) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {parseFloat(report.total_discrepancy) >= 0 ? '+' : ''}{formatCurrency(report.total_discrepancy)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <span className={`text-base font-black ${parseFloat(report.net_profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatCurrency(report.net_profit)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4">
                                                <Badge
                                                    variant="light"
                                                    color={report.status === 'completed' ? 'green' : 'orange'}
                                                >
                                                    {report.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
