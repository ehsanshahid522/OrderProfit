import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Users, Receipt, Building2, TrendingUp, DollarSign } from 'lucide-react';

export function CompanyPage() {
    const [employees, setEmployees] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [empForm, setEmpForm] = useState({ name: '', salary: '', designation: '' });
    const [expForm, setExpForm] = useState({ name: '', amount: '', frequency: 'monthly' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [empData, expData] = await Promise.all([
                api.company.getEmployees(),
                api.company.getExpenses()
            ]);
            setEmployees(empData);
            setExpenses(expData);
        } catch (error) {
            console.error('Error loading company data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            await api.company.addEmployee(empForm);
            setEmpForm({ name: '', salary: '', designation: '' });
            loadData();
        } catch (error) {
            alert('Error adding employee');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.company.addExpense(expForm);
            setExpForm({ name: '', amount: '', frequency: 'monthly' });
            loadData();
        } catch (error) {
            alert('Error adding expense');
        }
    };

    const deleteEmployee = async (id) => {
        if (!confirm('Delete employee?')) return;
        await api.company.deleteEmployee(id);
        loadData();
    };

    const deleteExpense = async (id) => {
        if (!confirm('Delete expense?')) return;
        await api.company.deleteExpense(id);
        loadData();
    };

    const totalSalaries = employees.reduce((sum, emp) => sum + Number(emp.salary), 0);
    const totalOverheads = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const grandMonthlyTotal = totalSalaries + totalOverheads;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-indigo-100 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        Company <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Management</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage employees and recurring overhead costs</p>
                </div>

                <div className="bg-white px-6 py-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Monthly Payroll</span>
                        <span className="text-xl font-extrabold text-slate-900">Rs. {totalSalaries.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Overheads</span>
                        <span className="text-xl font-extrabold text-slate-900">Rs. {totalOverheads.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Employees Section */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Team & Salaries</h2>
                        </div>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                            <input
                                type="text"
                                placeholder="Name"
                                required
                                value={empForm.name}
                                onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            />
                            <input
                                type="number"
                                placeholder="Salary"
                                required
                                value={empForm.salary}
                                onChange={e => setEmpForm({ ...empForm, salary: e.target.value })}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            />
                            <button className="bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </form>

                        <div className="space-y-3">
                            {employees.map(emp => (
                                <div key={emp._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-indigo-100 transition-all">
                                    <div>
                                        <p className="font-bold text-slate-900">{emp.name}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{emp.designation || 'Staff'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-extrabold text-slate-900">Rs. {emp.salary.toLocaleString()}</span>
                                        <button onClick={() => deleteEmployee(emp._id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overheads Section */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Operating Expenses</h2>
                        </div>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                            <input
                                type="text"
                                placeholder="Expense Name"
                                required
                                value={expForm.name}
                                onChange={e => setExpForm({ ...expForm, name: e.target.value })}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                required
                                value={expForm.amount}
                                onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            />
                            <button className="bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </form>

                        <div className="space-y-3">
                            {expenses.map(exp => (
                                <div key={exp._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-emerald-100 transition-all">
                                    <div>
                                        <p className="font-bold text-slate-900">{exp.name}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{exp.frequency}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-extrabold text-slate-900">Rs. {exp.amount.toLocaleString()}</span>
                                        <button onClick={() => deleteExpense(exp._id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="vibrant-gradient rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h3 className="text-3xl font-extrabold mb-4">The Logic of Real Profit</h3>
                        <p className="text-indigo-50 font-medium text-lg leading-relaxed">
                            We take your total monthly overheads (Rs. {grandMonthlyTotal.toLocaleString()}) and divide them by your total orders.
                            This "Overhead per Order" is automatically subtracted from your revenue to show you your TRUE take-home profit.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center w-full max-w-sm">
                            <Building2 className="w-12 h-12 mx-auto mb-4 text-white/80" />
                            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 mb-1">Company Health Score</p>
                            <div className="text-4xl font-extrabold mb-2">A+</div>
                            <p className="text-xs font-bold text-white/60 uppercase">All expenses verified</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
