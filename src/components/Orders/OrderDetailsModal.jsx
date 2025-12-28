import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { X, Plus, Trash2, DollarSign, Edit2, Save, XCircle } from 'lucide-react';

export function OrderDetailsModal({ order, onClose, onUpdate }) {
    const [costs, setCosts] = useState([]);
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCost, setShowAddCost] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        orderNo: order.orderNo || order.orderNumber || '',
        productName: order.productName || '',
        sku: order.sku || '',
        sellingPrice: order.sellingPrice || order.orderPrice || '',
        status: order.status || order.deliveryStatus || 'In-Transit'
    });

    useEffect(() => {
        Promise.all([
            api.costs.getByOrder(order._id),
            api.productSheets.getAll()
        ]).then(([costsData, sheetsData]) => {
            setCosts(costsData || []);
            setSheets(sheetsData || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [order._id]);

    async function loadCosts() {
        try {
            const data = await api.costs.getByOrder(order._id);
            setCosts(data || []);
        } catch (error) {
            console.error('Error loading costs:', error);
        }
    }

    // Cost Breakdown Logic (Template & Snapshots)
    let templateCosts = 0;
    let customCostsSnapshot = [];

    if (order.templateCostsSnapshot && order.templateCostsSnapshot.total !== undefined) {
        templateCosts = Number(order.templateCostsSnapshot.total) || 0;
        customCostsSnapshot = order.templateCostsSnapshot.customCosts || [];
    } else if (order.baseCost !== undefined || (order.customCosts && order.customCosts.length > 0)) {
        const customSum = (order.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        templateCosts = (Number(order.baseCost) || 0) + customSum;
        customCostsSnapshot = order.customCosts || [];
    } else {
        const sheet = sheets.find(s => s.productName.toLowerCase() === order.productName.toLowerCase());
        if (sheet) {
            const customSum = (sheet.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
            templateCosts = (Number(sheet.baseCost) || 0) + customSum;
            customCostsSnapshot = sheet.customCosts || [];
        }
    }

    // Dynamic field mapping & calculations for instant reactivity
    const finalOrderNo = order.orderNo || order.orderNumber || 'N/A';
    const currentStatus = order.status || order.deliveryStatus || 'In-Transit';
    const finalSellingPrice = Number(isEditing ? editData.sellingPrice : (order.sellingPrice || order.orderPrice)) || 0;

    // Sum manual costs from local state
    const manualTotal = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Total = Template + Manual Costs + Applied Overhead
    const finalTotalCosts = templateCosts + manualTotal + (Number(order.monthlyOverheadApplied || order.overheadPerOrder) || 0);

    // Profit calculation logic (synced with backend logic)
    let finalProfit = 0;
    const s = currentStatus.toLowerCase();
    if (s === 'delivered' || s === 'in-transit' || s === 'pending') {
        finalProfit = finalSellingPrice - finalTotalCosts;
    } else if (s === 'returned') {
        // Loss = Total Cost + Return Charges - Recovered Amount
        finalProfit = -(finalTotalCosts + (Number(order.returnCharges) || 0) - (Number(order.recoveredAmount) || 0));
    } else if (s === 'cancelled') {
        finalProfit = -finalTotalCosts;
    }

    async function handleUpdateOrder() {
        try {
            await api.orders.update(order._id, editData);
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order');
        }
    }

    async function handleDeleteCost(costId) {
        if (!confirm('Are you sure you want to delete this cost?')) return;

        try {
            await api.costs.delete(costId);
            loadCosts();
            onUpdate();
        } catch (error) {
            console.error('Error deleting cost:', error);
        }
    }

    async function handleDeleteOrder() {
        if (!confirm('Are you sure you want to delete this order? This will also delete all associated costs.')) return;

        try {
            await api.orders.delete(order._id);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    }

    const costTypeLabels = {
        advertising: 'Advertising',
        courier: 'Courier',
        packaging: 'Packaging',
        platform_fee: 'Platform Fee',
        return_loss: 'Return Loss',
        other: 'Other',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <input
                                    value={editData.orderNo}
                                    onChange={(e) => setEditData({ ...editData, orderNo: e.target.value })}
                                    className="text-xl font-bold text-gray-900 border-b border-gray-300 outline-none focus:border-blue-500"
                                    placeholder="Order #"
                                />
                                <input
                                    value={editData.productName}
                                    onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                                    className="text-sm text-gray-600 border-b border-gray-200 outline-none focus:border-blue-500"
                                    placeholder="Product Name"
                                />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{finalOrderNo}</h2>
                                <p className="text-sm text-gray-600 truncate max-w-[200px]">{order.productName}</p>
                            </div>
                        )}
                        <select
                            value={isEditing ? editData.status : currentStatus}
                            onChange={(e) => isEditing ? setEditData({ ...editData, status: e.target.value }) : api.orders.update(order._id, { status: e.target.value }).then(onUpdate)}
                            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${(isEditing ? editData.status : currentStatus) === 'In-Transit' || (isEditing ? editData.status : currentStatus) === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                ((isEditing ? editData.status : currentStatus) === 'Delivered' || (isEditing ? editData.status : currentStatus) === 'delivered') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    ((isEditing ? editData.status : currentStatus) === 'Returned' || (isEditing ? editData.status : currentStatus) === 'returned') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                }`}
                        >
                            <option value="In-Transit">In-Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateOrder}
                                    className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-lg"
                                >
                                    <Save className="w-4 h-4" /> Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                                >
                                    <XCircle className="w-4 h-4" /> Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Order
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Order Revenue</p>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-bold">Rs.</span>
                                    <input
                                        type="number"
                                        value={editData.sellingPrice}
                                        onChange={(e) => setEditData({ ...editData, sellingPrice: e.target.value })}
                                        className="text-xl font-bold text-gray-900 bg-transparent border-b border-blue-200 w-full outline-none focus:border-blue-500"
                                    />
                                </div>
                            ) : (
                                <p className="text-2xl font-bold text-gray-900">
                                    Rs. {finalSellingPrice.toFixed(2)}
                                </p>
                            )}
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Total Costs</p>
                            <p className="text-2xl font-bold text-gray-900">
                                Rs. {finalTotalCosts.toFixed(2)}
                            </p>
                        </div>
                        <div className={`${finalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 col-span-2`}>
                            <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                            <p className={`text-3xl font-bold ${finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Rs. {Math.abs(finalProfit).toFixed(2)}
                                {finalProfit < 0 && ' Loss'}
                            </p>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Internal SKU Reference</label>
                            <input
                                value={editData.sku}
                                onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter SKU..."
                            />
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
                            <button
                                onClick={() => setShowAddCost(true)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                            >
                                <Plus className="w-4 h-4" />
                                Add Manual Cost
                            </button>
                        </div>

                        {/* Snapshot Template Costs */}
                        <div className="mb-6 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Automated Template Costs (Snapshot)</p>
                            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                                <p className="font-medium text-indigo-900">Basic Price</p>
                                <p className="font-bold text-indigo-900">Rs. {(Number(order.templateCostsSnapshot?.baseCost || order.baseCost) || 0).toFixed(2)}</p>
                            </div>
                            {customCostsSnapshot.map((cost, idx) => (
                                <div key={`snap-${idx}`} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 italic">
                                    <p className="text-sm text-slate-600">{cost.name || 'Other Cost'}</p>
                                    <p className="font-semibold text-slate-700 font-mono">Rs. {(Number(cost.amount) || 0).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Manual Costs Heading */}
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Manual Order Expenses</p>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : costs.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
                                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">No manual costs added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {costs.map((cost) => (
                                    <div
                                        key={cost._id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">
                                                {costTypeLabels[cost.type] || 'Other'}
                                            </p>
                                            {cost.description && (
                                                <p className="text-xs text-gray-500">{cost.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-gray-900">
                                                Rs. {Number(cost.amount).toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => handleDeleteCost(cost._id)}
                                                className="text-red-500 hover:text-red-600 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {showAddCost && (
                        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-[60]">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                <h3 className="text-lg font-bold mb-4">Add Manual Cost</h3>
                                <AddCostForm
                                    orderId={order._id}
                                    onSuccess={() => {
                                        setShowAddCost(false);
                                        loadCosts();
                                        onUpdate();
                                    }}
                                    onCancel={() => setShowAddCost(false)}
                                    costTypeLabels={costTypeLabels}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium">
                        <button
                            onClick={handleDeleteOrder}
                            className="text-red-400 hover:text-red-600 transition font-bold uppercase tracking-wider"
                        >
                            Delete Order Permanentally
                        </button>
                        <span>Created: {new Date(order.createdAt || order.orderDate).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddCostForm({ orderId, onSuccess, onCancel, costTypeLabels }) {
    const [formData, setFormData] = useState({
        type: 'advertising',
        amount: '',
        description: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.costs.create({
                ...formData,
                orderId,
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating cost:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {Object.entries(costTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter amount"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Brief description"
                />
            </div>
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    Save Cost
                </button>
            </div>
        </form>
    );
}
