import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Package, TrendingUp, TrendingDown, Search, Filter, Download } from 'lucide-react';
import { AddOrderModal } from './AddOrderModal';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ExportPDFModal } from './ExportPDFModal';

export function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    async function loadOrders() {
        try {
            const ordersData = await api.orders.getAll();
            const costsData = await api.costs.getAll();
            const sheetsData = await api.productSheets.getAll();
            const employees = await api.company.getEmployees();
            const expenses = await api.company.getExpenses();

            // Calculate Overheads
            const totalMonthlySalaries = employees.reduce((sum, e) => sum + Number(e.salary), 0);
            const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalOverhead = totalMonthlySalaries + totalMonthlyExpenses;

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthOrdersCount = ordersData?.filter(o => new Date(o.createdAt || o.orderDate) >= monthStart).length || 1;
            const overheadPerOrder = totalOverhead / (monthOrdersCount || 1);

            const sheetMap = new Map();
            sheetsData?.forEach(s => sheetMap.set(s.productName.toLowerCase(), s));

            const orderCosts = new Map();
            costsData?.forEach((cost) => {
                const current = orderCosts.get(cost.orderId) || 0;
                orderCosts.set(cost.orderId, current + Number(cost.amount));
            });

            const ordersWithProfit = ordersData?.map((order) => {
                const manualCosts = orderCosts.get(order._id) || 0;

                // Priority 1: Use snapshot if exists
                // Priority 2: Fallback to old system
                let templateCosts = 0;

                if (order.templateCostsSnapshot && order.templateCostsSnapshot.total !== undefined) {
                    templateCosts = Number(order.templateCostsSnapshot.total) || 0;
                } else if (order.baseCost !== undefined || (order.customCosts && order.customCosts.length > 0)) {
                    const customSum = (order.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                    templateCosts = (Number(order.baseCost) || 0) + customSum;
                } else {
                    const sheet = sheetMap.get(order.productName?.toLowerCase());
                    if (sheet) {
                        const customSum = (sheet.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                        templateCosts = (Number(sheet.baseCost) || 0) + customSum;
                    }
                }

                const totalCosts = manualCosts + templateCosts + overheadPerOrder;
                const revenue = Number(order.sellingPrice || order.orderPrice) || 0;
                const profit = revenue - totalCosts;
                return { ...order, totalCosts, profit };
            }) || [];

            setOrders(ordersWithProfit);

            // Sync selected order if open to reflect new costs/updates
            if (selectedOrder) {
                const updated = ordersWithProfit.find(o => o._id === selectedOrder._id);
                if (updated) setSelectedOrder(updated);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(orderId, newStatus) {
        try {
            await api.orders.update(orderId, { status: newStatus });
            loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    const statusConfig = {
        'In-Transit': { label: 'In-Transit', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'Delivered': { label: 'Delivered', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'Returned': { label: 'Returned', class: 'bg-rose-50 text-rose-600 border-rose-100' },
        'Cancelled': { label: 'Cancelled', class: 'bg-slate-50 text-slate-600 border-slate-100' },
        // Fallbacks for legacy/local versions
        'pending': { label: 'In-Transit', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'delivered': { label: 'Delivered', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'returned': { label: 'Returned', class: 'bg-rose-50 text-rose-600 border-rose-100' },
        'cancelled': { label: 'Cancelled', class: 'bg-slate-50 text-slate-600 border-slate-100' },
    };

    const getStatusInfo = (status) => {
        return statusConfig[status || 'In-Transit'] || statusConfig['In-Transit'];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-indigo-100 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        Order <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Sheet</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Track and audit your sales performance</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-5 h-5 text-slate-400" />
                        Download PDF
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Order
                    </button>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 vibrant-gradient"></div>
                    <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Package className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Your inventory is quiet</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                        Once you add your first order, you'll see real-time profit tracking and cost analysis here.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        Add Your First Order
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Order Info</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Product Details</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Total Costs</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Real Profit</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.map((order) => (
                                    <tr key={order._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">#{order.orderNo || order.orderNumber}</span>
                                                <span className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                                                    {new Date(order.createdAt || order.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-xs">
                                                <div className="text-sm font-bold text-slate-800 line-clamp-1">{order.productName}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    SKU: {order.sku || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <select
                                                value={order.status || order.deliveryStatus || 'In-Transit'}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                className={`px-4 py-1.5 text-xs font-extrabold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getStatusInfo(order.status || order.deliveryStatus).class}`}
                                            >
                                                <option value="In-Transit">In-Transit</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Returned">Returned</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                Rs. {Number(order.sellingPrice || order.orderPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-slate-400">
                                                Rs. {Number(order.totalCost || order.totalCosts).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-sm ${(order.profit || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {(order.profit || 0) >= 0 ? (
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                ) : (
                                                    <TrendingDown className="w-3.5 h-3.5" />
                                                )}
                                                Rs. {Math.abs(order.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:rotate-90 transition-all active:scale-90"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAddModal && (
                <AddOrderModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadOrders();
                    }}
                />
            )}

            {showExportModal && (
                <ExportPDFModal
                    orders={orders}
                    businessName={user?.businessName}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={loadOrders}
                />
            )}
        </div>
    );
}
