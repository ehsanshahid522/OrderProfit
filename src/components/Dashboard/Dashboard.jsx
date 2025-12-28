import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, TrendingDown, ShoppingCart, AlertCircle, DollarSign, Sparkles } from 'lucide-react';
export function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayProfit: 0,
        monthlyProfit: 0,
        monthlyInvestment: 0,
        totalOrders: 0,
        totalLosses: 0,
        todayOrders: 0,
        monthlyOrders: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadDashboardStats();
        }
    }, [user]);

    async function loadDashboardStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const orders = await api.orders.getAll();
            const costs = await api.costs.getAll();
            const sheets = await api.productSheets.getAll();
            const employees = await api.company.getEmployees();
            const expenses = await api.company.getExpenses();

            // Map sheets by productName for fast lookup
            const sheetMap = new Map();
            sheets?.forEach(s => {
                if (s.productName) {
                    sheetMap.set(s.productName.toLowerCase(), s);
                }
            });

            // Calculate Monthly Overheads
            const totalMonthlySalaries = employees.reduce((sum, e) => sum + Number(e.salary), 0);
            const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalOverhead = totalMonthlySalaries + totalMonthlyExpenses;

            // 0. Date helper to prevent crashes
            const getSafeDate = (order) => {
                const date = new Date(order.createdAt || order.orderDate);
                return isNaN(date.getTime()) ? new Date() : date;
            };

            // 1. Group orders by month to distribute overhead accurately
            const monthOrdersCount = new Map();
            orders?.forEach(o => {
                const date = getSafeDate(o);
                const month = date.toISOString().slice(0, 7); // "YYYY-MM"
                monthOrdersCount.set(month, (monthOrdersCount.get(month) || 0) + 1);
            });

            const orderCosts = new Map();
            costs?.forEach((cost) => {
                const current = orderCosts.get(cost.orderId) || 0;
                orderCosts.set(cost.orderId, current + Number(cost.amount));
            });

            let todayProfit = 0;
            let monthlyProfit = 0;
            let monthlyInvestment = 0;
            let totalLosses = 0;
            let todayOrders = 0;
            let monthlyOrders = 0;

            orders?.forEach((order) => {
                const orderDate = getSafeDate(order);
                const monthKey = orderDate.toISOString().slice(0, 7);
                const orderPrice = Number(order.sellingPrice || order.orderPrice) || 0;

                // Overhead for this specific month
                const countForMonth = monthOrdersCount.get(monthKey) || 1;
                const overheadForThisOrder = totalOverhead / countForMonth;

                // 2. Get manual costs for this specific order
                const manualCostTotal = orderCosts.get(order._id) || 0;

                // 3. Priority 1: Use snapshot costs if they exist (new system)
                //    Priority 2: Fallback to dynamic template (legacy system)
                let templateCostTotal = 0;
                if (order.templateCostsSnapshot && order.templateCostsSnapshot.total !== undefined) {
                    templateCostTotal = Number(order.templateCostsSnapshot.total) || 0;
                } else if (order.baseCost !== undefined || (order.customCosts && order.customCosts.length > 0)) {
                    const customSum = (order.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                    templateCostTotal = (Number(order.baseCost) || 0) + customSum;
                } else {
                    const sheetName = order.productName?.toLowerCase();
                    const sheet = sheetName ? sheetMap.get(sheetName) : null;
                    if (sheet) {
                        const customSum = (sheet.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                        templateCostTotal = (Number(sheet.baseCost) || 0) + customSum;
                    }
                }

                const orderTotalCost = manualCostTotal + templateCostTotal + overheadForThisOrder;
                const profit = orderPrice - orderTotalCost;

                if (orderDate >= today) {
                    todayProfit += profit;
                    todayOrders++;
                }

                if (orderDate >= startOfMonth) {
                    monthlyProfit += profit;
                    monthlyInvestment += orderTotalCost;
                    monthlyOrders++;
                }

                // Losses include delivery costs and overhead if applicable
                const status = (order.status || order.deliveryStatus || '').toLowerCase();
                if (status === 'returned' || status === 'cancelled') {
                    totalLosses += orderTotalCost;
                }
            });

            setStats({
                todayProfit,
                monthlyProfit,
                monthlyInvestment,
                totalOrders: orders?.length || 0,
                totalLosses,
                todayOrders,
                monthlyOrders,
            });
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-indigo-100 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        Home <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Welcome back, {user?.businessName}</p>
                </div>
                <button
                    onClick={loadDashboardStats}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                >
                    <svg className={`w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Monthly Profit"
                    value={`Rs. ${stats.monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle={`${stats.monthlyOrders} orders this month`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    trend={stats.monthlyProfit >= 0 ? 'up' : 'down'}
                    color="emerald"
                />

                <StatCard
                    title="Total Investment"
                    value={`Rs. ${stats.monthlyInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle="Monthly stock & overheads"
                    icon={<DollarSign className="w-6 h-6" />}
                    color="indigo"
                />

                <StatCard
                    title="Monthly Orders"
                    value={stats.monthlyOrders.toLocaleString()}
                    subtitle="Current month volume"
                    icon={<ShoppingCart className="w-6 h-6" />}
                    color="blue"
                />

                <StatCard
                    title="Total Losses"
                    value={`Rs. ${stats.totalLosses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle="Returns & cancellations"
                    icon={<AlertCircle className="w-6 h-6" />}
                    color="rose"
                />
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="w-3 h-3" />
                            Pro Insight
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Ready to scale your business?</h3>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">
                            Our AI is analyzing your data to find the most profitable products and identify cost-saving opportunities.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, trend, color }) {
    const colorMap = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        blue: 'bg-blue-50 border-blue-100 text-blue-600',
        rose: 'bg-rose-50 border-rose-100 text-rose-600',
    };

    return (
        <div className="group stat-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <div className="flex items-center justify-between mb-5">
                <div className={`p-3.5 rounded-2xl border ${colorMap[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {trend === 'up' ? '+High' : '-Low'}
                    </div>
                )}
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">{value}</p>
            <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
        </div>
    );
}
