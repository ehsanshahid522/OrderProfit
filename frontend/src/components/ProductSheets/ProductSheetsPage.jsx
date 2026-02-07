import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Save, FileSpreadsheet, Loader, X, ShoppingBag, Settings2 } from 'lucide-react';
import { AddOrderModal } from '../Orders/AddOrderModal';
import ManageCostsModal from './ManageCostsModal';
export function ProductSheetsPage() {
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [orderModalData, setOrderModalData] = useState(null);
    const [newProduct, setNewProduct] = useState({ productName: '', sku: '' });
    const [editingCosts, setEditingCosts] = useState(null); // The sheet being edited for costs
    const [saveSuccess, setSaveSuccess] = useState(null); // ID of successfully saved sheet
    const [saveNotification, setSaveNotification] = useState(null); // { message, type }
    const [companyData, setCompanyData] = useState({ employees: [], expenses: [] });
    const [overheadPerOrder, setOverheadPerOrder] = useState(0);
    const sheetsRef = useRef(sheets);

    useEffect(() => {
        sheetsRef.current = sheets;
    }, [sheets]);

    useEffect(() => {
        loadSheets();
    }, []);

    const loadSheets = async () => {
        try {
            const [sheetsData, employees, expenses, orders] = await Promise.all([
                api.productSheets.getAll(),
                api.company.getEmployees(),
                api.company.getExpenses(),
                api.orders.getAll()
            ]);

            setSheets(sheetsData);
            setCompanyData({ employees, expenses });

            // Calculate Overhead per Order
            const totalSalaries = employees.reduce((sum, e) => sum + Number(e.salary), 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalOverhead = totalSalaries + totalExpenses;

            // Monthly order count estimation
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthOrdersCount = orders.filter(o => new Date(o.orderDate) >= monthStart).length;

            setOverheadPerOrder(totalOverhead / (monthOrdersCount || 1));
        } catch (error) {
            console.error('Error loading sheets:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleSave = async (sheet) => {
        const { index, ...sheetToSave } = sheet;

        const cleanName = (sheetToSave.productName || '').trim();
        if (!cleanName) {
            alert('Product name is required');
            return null;
        }

        const sanitizedCustomCosts = (sheetToSave.customCosts || [])
            .map(c => ({
                name: (c.name || '').trim().toLowerCase(),
                amount: Number(c.amount) || 0
            }))
            .filter(c => c.name !== '' || c.amount > 0);

        const sanitizedSheet = {
            ...sheetToSave,
            productName: cleanName,
            sku: (sheetToSave.sku || '').trim(),
            baseCost: Number(sheetToSave.baseCost) || 0,
            customCosts: sanitizedCustomCosts
        };

        setSaving(true);
        try {
            const savedSheet = await api.productSheets.save(sanitizedSheet);

            // Update UI from response (avoiding loadSheets for stability)
            setSheets(prev => prev.map(s => {
                const isSame = (s._id && savedSheet._id && s._id === savedSheet._id) ||
                    (s.productName.toLowerCase() === savedSheet.productName.toLowerCase());
                return isSame ? savedSheet : s;
            }));

            // Sync the ref
            sheetsRef.current = sheetsRef.current.map(s => {
                const isSame = (s._id && savedSheet._id && s._id === savedSheet._id) ||
                    (s.productName.toLowerCase() === savedSheet.productName.toLowerCase());
                return isSame ? savedSheet : s;
            });

            return savedSheet;
        } catch (error) {
            console.error('Error saving sheet:', error);
            alert(error?.message || 'Save failed');
            return null;
        } finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this sheet?')) return;
        try {
            await api.productSheets.delete(id);
            setSheets(sheets.filter(s => s._id !== id));
        } catch (error) {
            alert('Error deleting sheet');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.productName) return;

        const existingName = sheets.find(s => s.productName.toLowerCase() === newProduct.productName.toLowerCase());
        if (existingName) {
            alert('A product with this name already exists');
            return;
        }

        if (newProduct.sku) {
            const existingSku = sheets.find(s => s.sku?.toLowerCase() === newProduct.sku.toLowerCase());
            if (existingSku) {
                alert(`Error: Product ID (SKU) '${newProduct.sku}' is already assigned to '${existingSku.productName}'`);
                return;
            }
        }

        setSaving(true);
        try {
            await api.productSheets.save({
                ...newProduct,
                baseCost: 0,
                customCosts: []
            });
            setNewProduct({ productName: '', sku: '' });
            setShowAddModal(false);
            await loadSheets();
        } catch (error) {
            alert('Error creating sheet');
        } finally {
            setSaving(false);
        }
    };

    const updateSheetValue = (index, field, value) => {
        setSheets(prev => prev.map((s, i) => {
            if (i === index) {
                const updated = { ...s };
                if (field === 'baseCost') {
                    updated[field] = value === '' ? '' : Number(value);
                } else {
                    updated[field] = value;
                }
                return updated;
            }
            return s;
        }));
    };

    const calculateTotal = (sheet) => {
        const base = Number(sheet.baseCost) || 0;
        const custom = (sheet.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        return base + custom;
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
                        Product <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Manager</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Define pre-set costs for automated profit calculation</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add New Product
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>

                <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Cost Template Grid</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product Info</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Price (Rs.)</th>
                                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Other Costs Breakdown</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Total Template</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Manage</th>
                                <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sheets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-medium">
                                        No product sheets defined. Add a product above to start.
                                    </td>
                                </tr>
                            ) : (
                                sheets.map((sheet, index) => (
                                    <tr key={sheet._id || index} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <input
                                                    type="text"
                                                    value={sheet.productName}
                                                    onChange={(e) => updateSheetValue(index, 'productName', e.target.value)}
                                                    onBlur={() => handleSave(sheets[index])}
                                                    className="font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Product SKU/No."
                                                    value={sheet.sku || ''}
                                                    onChange={(e) => updateSheetValue(index, 'sku', e.target.value)}
                                                    onBlur={() => handleSave(sheets[index])}
                                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 rounded px-1.5 py-0.5 border-none w-32 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="number"
                                                value={sheet.baseCost}
                                                onChange={(e) => updateSheetValue(index, 'baseCost', e.target.value)}
                                                onBlur={() => handleSave(sheets[index])}
                                                className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                                                    {(sheet.customCosts || []).length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 font-medium italic">No other costs</span>
                                                    ) : (
                                                        (sheet.customCosts || []).map((cost, ci) => (
                                                            <div key={ci} className="flex justify-between items-center gap-4 py-1 border-b border-slate-50 last:border-0">
                                                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]" title={cost.name}>
                                                                    {cost.name || 'Unnamed'}
                                                                </span>
                                                                <span className="text-[10px] font-extrabold text-indigo-500 whitespace-nowrap">
                                                                    Rs. {Number(cost.amount || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                <div className="pt-1 mt-1 border-t border-slate-100 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Est. Overhead</span>
                                                    <span className="text-[10px] font-extrabold text-slate-500">Rs. {Math.round(overheadPerOrder).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-extrabold text-indigo-600">
                                            Rs. {(calculateTotal(sheet) + overheadPerOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setEditingCosts({ ...sheet, index })}
                                                className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                                                title="Manage Custom Costs"
                                            >
                                                <Settings2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setOrderModalData({ productName: sheet.productName, sku: sheet.sku })}
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors active:scale-90"
                                                    title="Add Order for this Product"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleSave(sheet)}
                                                    disabled={saving}
                                                    className={`p-2 rounded-lg transition-all active:scale-90 disabled:opacity-50 ${saveSuccess === sheet._id
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        }`}
                                                    title={saveSuccess === sheet._id ? "Saved Successfully!" : "Save Changes"}
                                                >
                                                    {saving ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : saveSuccess === sheet._id ? (
                                                        <Save className="w-4 h-4" /> // Keeps save icon but color change indicates success
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sheet._id)}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors active:scale-90"
                                                    title="Delete Sheet"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative scale-[1.02]">
                        <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Basic Information</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProduct.productName}
                                    onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                                    placeholder="Enter name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">SKU / Item No.</label>
                                <input
                                    type="text"
                                    value={newProduct.sku}
                                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                                    placeholder="Optional SKU..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !newProduct.productName}
                                    className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                >
                                    {saving ? 'Creating...' : 'Create Sheet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Order Modal Integration */}
            {orderModalData && (
                <AddOrderModal
                    initialProductName={orderModalData.productName}
                    initialSku={orderModalData.sku}
                    onClose={() => setOrderModalData(null)}
                    onSuccess={() => {
                        setOrderModalData(null);
                        alert('Order created successfully!');
                    }}
                />
            )}

            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">How it works</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <li className="space-y-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">Step 1</span>
                            <p className="font-medium text-indigo-100">Add each of your products and its specific No/SKU.</p>
                        </li>
                        <li className="space-y-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">Step 2</span>
                            <p className="font-medium text-indigo-100">Click the gear icon to add unlimited custom costs like Packing or Returns.</p>
                        </li>
                        <li className="space-y-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">Step 3</span>
                            <p className="font-medium text-indigo-100">When adding an order, these costs are automatically factored into your profit!</p>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Manage Costs Modal Component */}
            <ManageCostsModal
                isOpen={!!editingCosts}
                onClose={() => setEditingCosts(null)}
                product={editingCosts}
                isSaving={saving}
                onSave={async (updatedCosts) => {
                    if (!editingCosts) return;

                    const updatedSheet = {
                        ...sheets[editingCosts.index],
                        customCosts: updatedCosts
                    };

                    // 1) Instant UI update
                    setSheets(prev => prev.map((s, i) => i === editingCosts.index ? updatedSheet : s));

                    // 2) Save to backend
                    const result = await handleSave(updatedSheet);
                    if (result) {
                        setEditingCosts(null);
                    }
                }}
            />

            {/* Floating Save Notification */}
            {saveNotification && (
                <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border ${saveNotification.type === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-rose-600 text-white border-rose-400'
                    }`}>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Save className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold">{saveNotification.message}</p>
                </div>
            )}
        </div>
    );
}
