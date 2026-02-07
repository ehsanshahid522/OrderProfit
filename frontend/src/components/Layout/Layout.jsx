import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, ShoppingCart, Sparkles, Menu, X, LogOut, FileSpreadsheet, Building2 } from 'lucide-react';
import logo from '../../assets/logo.png';

export function Layout({ children, currentPage, onNavigate }) {
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { id: 'dashboard', name: 'Home', icon: LayoutDashboard, color: 'indigo' },
        { id: 'orders', name: 'Order Sheet', icon: ShoppingCart, color: 'blue' },
        { id: 'product-sheets', name: 'Products', icon: FileSpreadsheet, color: 'purple' },
        { id: 'company', name: 'Company', icon: Building2, color: 'emerald' },
        { id: 'insights', name: 'AI Insights', icon: Sparkles, color: 'emerald' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-18 py-3">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate('dashboard')}>
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                                <img src={logo} alt="OrderProfit logo" className="w-10 h-10 object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-4">
                                    OrderProfit <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">AI</span>
                                </h1>
                                {user && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{user.businessName}</span>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate(item.id)}
                                        className={`nav-item ${isActive
                                            ? 'nav-item-active'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${isActive ? `bg-${item.color}-100 text-${item.color}-600` : 'bg-slate-100'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        {item.name}
                                    </button>
                                );
                            })}

                            <div className="h-8 w-px bg-slate-200 mx-2"></div>

                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 border-t' : 'max-h-0'}`}>
                    <div className="px-4 py-6 space-y-3 bg-white">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-4 px-5 py-4 text-red-600 bg-red-50 rounded-2xl font-bold hover:bg-red-100 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 vibrant-gradient opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="logo" className="w-8 h-8 opacity-50 grayscale hover:grayscale-0 transition-all" />
                        <p className="text-sm font-bold tracking-tight text-slate-400">OrderProfit AI</p>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                        &copy; {new Date().getFullYear()} OrderProfit AI. Empowering E-Commerce Intelligence.
                    </p>
                </div>
            </footer>
        </div>
    );
}
