import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import logo from '../../assets/logo.png';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-6xl flex items-center justify-between gap-16 relative z-10">
                <div className="hidden lg:block flex-1">
                    <div className="text-left">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-white rounded-2xl shadow-lg shadow-indigo-100/50">
                                <img src={logo} alt="OrderProfit logo" className="w-20 h-20 object-contain" />
                            </div>
                            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                                OrderProfit <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">AI</span>
                            </h1>
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                            Master Your E-Commerce <br />
                            <span className="text-indigo-600">Margins with Intelligence.</span>
                        </h2>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                            Stop guessing your real profits. Track every cost, calculate true earnings,
                            and get actionable recommendations to grow your business.
                        </p>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { title: 'Full Cost Transparency', desc: 'Track ads, shipping, and hidden fees instantly.', color: 'indigo' },
                                { title: 'Live Profit Engine', desc: 'Real-time profit per order with precision logic.', color: 'emerald' },
                                { title: 'AI Strategic Growth', desc: 'Personalized insights to scale your brand.', color: 'blue' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 group cursor-default">
                                    <div className={`p-3 rounded-xl bg-${item.color}-100 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{item.title}</h3>
                                        <p className="text-slate-500 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <div className="lg:hidden flex items-center justify-center gap-4 mb-10">
                            <img src={logo} alt="OrderProfit logo" className="w-12 h-12 object-contain" />
                            <h1 className="text-3xl font-extrabold text-slate-900">OrderProfit AI</h1>
                        </div>

                        <div className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 vibrant-gradient"></div>
                            {isLogin ? (
                                <LoginForm onToggleForm={() => setIsLogin(false)} />
                            ) : (
                                <SignUpForm onToggleForm={() => setIsLogin(true)} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
