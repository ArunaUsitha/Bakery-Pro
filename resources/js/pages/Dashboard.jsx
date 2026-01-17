import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import {
    GridIcon,
    DollarLineIcon,
    BoxIconLine,
    GroupIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    PieChartIcon,
    TableIcon,
    ListIcon,
    CalenderIcon,
    BoltIcon,
    TaskIcon,
    PageIcon
} from "../theme/tailadmin/icons";
import Badge from "../theme/tailadmin/components/ui/badge/Badge";
import { getDashboardStats } from "../utils/api";
import { formatCurrency, formatNumber } from "../utils/formatters";

const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = "primary" }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <Icon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
            <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {value}
                </h4>
            </div>
            {trend && (
                <Badge color={trend === "up" ? "success" : "error"}>
                    {trend === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {trendValue}%
                </Badge>
            )}
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const salesTrendCategories = stats?.sales_trend?.map(d => d.date) || [];
    const salesTrendData = stats?.sales_trend?.map(d => d.total) || [];

    const areaChartOptions = {
        colors: ["#465FFF"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            height: 310,
            type: "area",
            toolbar: { show: false },
        },
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: {
                opacityFrom: 0.55,
                opacityTo: 0,
            },
        },
        xaxis: {
            categories: salesTrendCategories,
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val) => `Rs. ${val.toLocaleString()}`
            }
        },
        grid: {
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },
        dataLabels: { enabled: false },
        tooltip: { enabled: true },
    };

    const areaChartSeries = [
        {
            name: "Sales",
            data: salesTrendData,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                <StatCard
                    icon={DollarLineIcon}
                    label="Today's Sales"
                    value={formatCurrency(stats?.today?.sales || 0)}
                    trend="up"
                    trendValue="12"
                />
                <StatCard
                    icon={BoltIcon}
                    label="Today's Wastage"
                    value={formatCurrency(stats?.today?.wastage || 0)}
                    trend="down"
                    trendValue="5"
                    color="error"
                />
                <StatCard
                    icon={BoxIconLine}
                    label="Inventory Value"
                    value={formatCurrency(stats?.total_inventory_value || 0)}
                />
                <StatCard
                    icon={TaskIcon}
                    label="Pending Settlements"
                    value={stats?.pending_settlements || 0}
                />
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 lg:col-span-8">
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Sales Overview
                        </h3>
                        <div className="max-w-full overflow-x-auto">
                            <Chart
                                options={areaChartOptions}
                                series={areaChartSeries}
                                type="area"
                                height={310}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
                            Top Products (Weekly)
                        </h3>
                        <div className="space-y-5">
                            {stats?.top_products?.map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800 text-brand-500 font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.total_qty} items sold
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white/90">
                                            {formatCurrency(product.total_revenue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status / Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-success-500/10 rounded-lg flex items-center justify-center text-success-500">
                                    <BoltIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">Production</p>
                                    <p className="text-xs text-gray-500 capitalize">{stats?.production_status?.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <Badge color={stats?.production_status === 'completed' ? 'success' : 'warning'}>
                                {stats?.production_status === 'completed' ? 'Online' : 'Pending'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-500">
                                    <PageIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">Settlements</p>
                                    <p className="text-xs text-gray-500">{stats?.pending_settlements} Pending</p>
                                </div>
                            </div>
                            <Badge color={stats?.pending_settlements === 0 ? 'success' : 'error'}>
                                {stats?.pending_settlements === 0 ? 'Clear' : 'Action Required'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Quick Links</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { name: 'Production', icon: BoltIcon, path: '/production' },
                            { name: 'Inventory', icon: BoxIconLine, path: '/inventory' },
                            { name: 'Sales', icon: TaskIcon, path: '/sales' },
                            { name: 'Ingredients', icon: ListIcon, path: '/ingredients' },
                            { name: 'Recipes', icon: CalenderIcon, path: '/recipes' },
                            { name: 'Reports', icon: PieChartIcon, path: '/reports' },
                        ].map((link, idx) => (
                            <a key={idx} href={link.path} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                <link.icon className="size-6 text-gray-500 group-hover:text-brand-500 mb-2" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white">{link.name}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
