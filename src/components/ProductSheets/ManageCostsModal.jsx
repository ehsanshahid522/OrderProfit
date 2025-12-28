import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader, Settings2 } from 'lucide-react';

const ManageCostsModal = ({ isOpen, onClose, product, onSave, isSaving }) => {
    const [modalCosts, setModalCosts] = useState([]);

    // Initialize modal costs when product changes or modal opens
    useEffect(() => {
        if (isOpen && product) {
            setModalCosts([...(product.customCosts || [])]);
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const handleLocalSave = () => {
        const sanitizedCosts = modalCosts
            .map(c => ({
                name: (c.name || '').trim(),
                amount: Number(c.amount) || 0
            }))
            .filter(c => c.name !== '' || c.amount > 0);

        onSave(sanitizedCosts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Settings2 className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Manage Custom Costs</h2>
                            </div>
                            <p className="text-indigo-100 font-medium ml-12">Product: <span className="text-white font-bold">{product.productName}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 bg-slate-50/50">
                    {modalCosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold">No custom costs added yet.</p>
                            <p className="text-slate-300 text-sm">Add costs like packing, labels, or labor.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {modalCosts.map((cost, ci) => (
                                <div key={ci} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Expense Name</label>
                                        <input
                                            type="text"
                                            value={cost.name}
                                            onChange={(e) => {
                                                const newCosts = [...modalCosts];
                                                newCosts[ci] = { ...newCosts[ci], name: e.target.value };
                                                setModalCosts(newCosts);
                                            }}
                                            placeholder="e.g. Packing Material"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="w-36 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Amount (Rs.)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cost.amount}
                                                onChange={(e) => {
                                                    const newCosts = [...modalCosts];
                                                    newCosts[ci] = { ...newCosts[ci], amount: e.target.value === '' ? '' : Number(e.target.value) };
                                                    setModalCosts(newCosts);
                                                }}
                                                className="w-full bg-slate-50 border-none rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setModalCosts(modalCosts.filter((_, i) => i !== ci))}
                                        className="mt-6 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setModalCosts([...modalCosts, { name: '', amount: 0 }])}
                        className="w-full py-5 border-2 border-dashed border-indigo-200 rounded-3xl text-indigo-600 font-black hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <Plus className="w-6 h-6" />
                        Add New Cost Item
                    </button>
                </div>

                <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLocalSave}
                        disabled={isSaving}
                        className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-[20px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isSaving ? <Loader className="w-6 h-6 animate-spin" /> : null}
                        {isSaving ? 'Saving Changes...' : 'Save All Costs'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCostsModal;
