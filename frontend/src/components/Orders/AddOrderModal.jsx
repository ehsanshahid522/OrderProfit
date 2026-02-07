import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, Info } from 'lucide-react';

export function AddOrderModal({ onClose, onSuccess, initialProductName = '', initialSku = '' }) {
    const [formData, setFormData] = useState({
        orderNumber: '',
        productName: initialProductName,
        sku: initialSku,
        orderPrice: '',
        deliveryStatus: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [sheets, setSheets] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.productSheets.getAll().then(setSheets).catch(console.error);
    }, []);

    // Effect to fetch existing orders and determine the next order ID
    useEffect(() => {
        const fetchOrdersAndSetNextId = async () => {
            try {
                const orders = await api.orders.getAll();
                let maxOrderNum = 0;

                orders.forEach(order => {
                    const orderNumStr = order.orderNo || order.orderNumber;
                    if (orderNumStr && typeof orderNumStr === 'string') {
                        const match = orderNumStr.match(/^ORD-(\d+)$/i);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (!isNaN(num) && num > maxOrderNum) {
                                maxOrderNum = num;
                            }
                        }
                    }
                });

                const nextNum = maxOrderNum + 1;
                const formattedNextId = `ORD-${String(nextNum).padStart(3, '0')}`;
                setFormData(prev => ({ ...prev, orderNumber: formattedNextId }));
            } catch (err) {
                console.error("Failed to fetch orders for ID generation:", err);
                setFormData(prev => ({ ...prev, orderNumber: 'ORD-001' }));
            }
        };

        fetchOrdersAndSetNextId();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Find current template costs to snapshot
            const sheet = sheets.find(s => s.productName.toLowerCase() === formData.productName.toLowerCase());

            await api.orders.create({
                orderNumber: formData.orderNumber,
                productName: formData.productName,
                sku: formData.sku,
                orderPrice: parseFloat(formData.orderPrice),
                deliveryStatus: formData.deliveryStatus,
                orderDate: new Date(formData.orderDate).toISOString(),
                notes: formData.notes,
                // Snapshot values for historical accuracy
                baseCost: sheet?.baseCost || 0,
                customCosts: (sheet?.customCosts || []).map(c => ({
                    name: c.name,
                    amount: Number(c.amount) || 0
                }))
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add order');
            setLoading(false);
        }
    }

    const selectedSheet = sheets.find(s => s.productName.toLowerCase() === formData.productName.toLowerCase());

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col relative scale-[1.01] transition-transform duration-300">
                <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>

                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">New Sales Order</h2>
                        <p className="text-slate-500 text-sm font-medium">Record a new transaction</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                            <X className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Order ID
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.orderNumber}
                                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                                placeholder="#ORD-001"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Order Date
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.orderDate}
                                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Product Selection
                        </label>
                        <input
                            type="text"
                            list="products"
                            required
                            value={formData.productName}
                            onChange={(e) => {
                                const val = e.target.value;
                                const sheet = sheets.find(s => s.productName.toLowerCase() === val.toLowerCase());
                                setFormData({
                                    ...formData,
                                    productName: val,
                                    sku: sheet ? sheet.sku : formData.sku
                                });
                            }}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                            placeholder="Type product name..."
                        />
                        <datalist id="products">
                            {sheets.map((s, i) => (
                                <option key={i} value={s.productName} />
                            ))}
                        </datalist>

                        {selectedSheet ? (
                            <div className="bg-indigo-50/50 p-3 rounded-xl flex items-center gap-3 border border-indigo-100">
                                <Info className="w-4 h-4 text-indigo-500" />
                                <div>
                                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                                        Product Sheet found! Automated cost template applied.
                                    </p>
                                    <p className="text-[9px] text-indigo-400 font-bold uppercase mt-0.5">
                                        SKU: {selectedSheet.sku || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ) : formData.productName && (
                            <div className="bg-amber-50/50 p-3 rounded-xl flex items-center gap-3 border border-amber-100">
                                <Info className="w-4 h-4 text-amber-500" />
                                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                                    No product sheet found. No template costs will be applied.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Sale Revenue (Rs.)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.orderPrice}
                            onChange={(e) => setFormData({ ...formData, orderPrice: e.target.value })}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Shipping Status
                        </label>
                        <select
                            value={formData.deliveryStatus}
                            onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                        >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="returned">Returned</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.productName}
                            className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
