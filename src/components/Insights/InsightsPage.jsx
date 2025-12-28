import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, TrendingUp, AlertCircle, Loader, BarChart3, PieChart, Target } from 'lucide-react';

export function InsightsPage() {
    const { user } = useAuth();
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        avgProfit: 0,
    });

    useEffect(() => {
        if (user) {
            loadStats();
        }
    }, [user]);

    async function loadStats() {
        try {
            const orders = await api.orders.getAll();
            const costs = await api.costs.getAll();
            const sheets = await api.productSheets.getAll();
            const employees = await api.company.getEmployees();
            const expenses = await api.company.getExpenses();

            // Calculate Overheads
            const totalMonthlySalaries = employees.reduce((sum, e) => sum + Number(e.salary), 0);
            const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalOverhead = totalMonthlySalaries + totalMonthlyExpenses;

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthOrdersCount = orders?.filter(o => new Date(o.orderDate) >= monthStart).length || 1;
            const overheadPerOrder = totalOverhead / (monthOrdersCount || 1);

            const sheetMap = new Map();
            sheets?.forEach(s => sheetMap.set(s.productName.toLowerCase(), s));

            const orderCosts = new Map();
            costs?.forEach((cost) => {
                const current = orderCosts.get(cost.orderId) || 0;
                orderCosts.set(cost.orderId, current + Number(cost.amount));
            });

            let totalRevenue = 0;
            let totalCosts = 0;

            orders?.forEach((order) => {
                totalRevenue += Number(order.orderPrice);

                const manualCosts = orderCosts.get(order._id) || 0;

                // Priority 1: Use snapshot costs if they exist (new system)
                // Priority 2: Fallback to dynamic template (legacy system)
                let templateCosts = 0;

                if (order.baseCost !== undefined || order.marketingCost !== undefined || order.customCostsSum !== undefined) {
                    templateCosts = (order.baseCost || 0) +
                        (order.marketingCost || 0) +
                        (order.salaryCost || 0) +
                        (order.otherFixedCosts || 0) +
                        (order.customCostsSum || 0);
                } else {
                    const sheet = sheetMap.get(order.productName?.toLowerCase());
                    const customCostsSum = (sheet?.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                    templateCosts = sheet
                        ? (sheet.baseCost + sheet.marketingCost + sheet.salaryCost + sheet.otherFixedCosts + customCostsSum)
                        : 0;
                }

                totalCosts += (manualCosts + templateCosts + overheadPerOrder);
            });

            const totalProfit = totalRevenue - totalCosts;
            const avgProfit = orders?.length ? totalProfit / orders.length : 0;

            setStats({
                totalOrders: orders?.length || 0,
                totalRevenue,
                totalCosts,
                totalProfit,
                avgProfit,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function generateInsights() {
        setLoading(true);
        setError('');
        setInsights('');

        try {
            const data = await api.insights.generate(stats);
            setInsights(data.insights);
        } catch (err) {
            setError('Failed to generate insights. Please make sure the AI service is configured.');
            console.error('Error generating insights:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        AI <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Strategic business analysis and growth mapping</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">Rs. {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Costs</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">Rs. {stats.totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Profit</p>
                    </div>
                    <p className={`text-2xl font-extrabold ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Rs. {stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Plus className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Profit</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">Rs. {stats.avgProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {stats.totalOrders === 0 ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 vibrant-gradient"></div>
                    <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Insufficient Data</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                        We need at least one order with costs attached to generate meaningful AI insights.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                        <div className="flex items-center gap-5">
                            <div className="vibrant-gradient p-4 rounded-2xl shadow-lg shadow-indigo-100 animate-pulse">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900">Advanced AI Analysis</h2>
                                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Powered by Google Gemini 1.5</p>
                            </div>
                        </div>
                        <button
                            onClick={generateInsights}
                            disabled={loading}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Analyzing Metrics...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Insights
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl font-bold mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {insights ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed text-lg">
                                    {insights}
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                            <div className="bg-white p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-sm">
                                <Sparkles className="w-10 h-10 text-indigo-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Ready for Analysis</h4>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto">
                                Click the button above to unlock strategic recommendations for your business.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
