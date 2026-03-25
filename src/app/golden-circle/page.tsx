'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMemberAuth } from '@/context/MemberAuthContext';
import { GoldenCircleLogin } from '@/components/auth/GoldenCircleLogin';
import { GCRequestForm } from '@/components/auth/GCRequestForm';
import { Star, ShieldCheck, TrendingUp, Zap, User, UserPlus } from 'lucide-react';

export default function GoldenCirclePage() {
    const [view, setView] = useState<'login' | 'join'>('login');
    const { isGoldenCircleUser } = useMemberAuth();

    if (isGoldenCircleUser) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-brand-blue-900 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-brand-blue-900/20">
                        <ShieldCheck className="text-brand-gold-400" size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-brand-blue-950 uppercase tracking-tight">Access Granted</h1>
                        <p className="text-slate-500 font-bold text-sm uppercase">You are already a verified Golden Circle member.</p>
                    </div>
                    <Link 
                        href="/golden-circle/dashboard"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-brand-blue-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-brand-blue-900/20 active:scale-95"
                    >
                        Go to Dashboard
                        <Zap size={18} className="text-brand-gold-400" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-brand-blue-100">
            {/* Hero Section */}
            <div className="bg-brand-blue-900 text-white pt-20 pb-32 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue-600/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <Star className="text-brand-gold-400" size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Membership</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.85]">
                        The Golden <br /> <span className="text-brand-gold-400">Circle</span>
                    </h1>
                    <p className="text-slate-300 max-w-xl mx-auto font-bold text-sm md:text-base leading-relaxed">
                        Join our elite tier of global importers. Access 3% site-wide discounts, priority support, and early access to limited arrivals.
                    </p>
                </div>
            </div>

            {/* Login & Features Section */}
            <div className="max-w-6xl mx-auto px-4 -mt-16 pb-20 relative z-20">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left: Login & Join Portal */}
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm inline-flex">
                            <button 
                                onClick={() => setView('login')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${view === 'login' ? 'bg-brand-blue-900 text-white shadow-lg shadow-brand-blue-900/10' : 'text-slate-400 hover:text-brand-blue-900'}`}
                            >
                                <User size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Login</span>
                            </button>
                            <button 
                                onClick={() => setView('join')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${view === 'join' ? 'bg-brand-blue-900 text-white shadow-lg shadow-brand-blue-900/10' : 'text-slate-400 hover:text-brand-blue-900'}`}
                            >
                                <UserPlus size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Join Circle</span>
                            </button>
                        </div>

                        {view === 'login' ? <GoldenCircleLogin /> : <GCRequestForm />}
                        
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                            <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Membership Perks</h2>
                            <div className="space-y-4">
                                {[
                                    { icon: <TrendingUp className="text-emerald-500" />, title: "3% Flat Discount", desc: "Applied automatically at checkout on every order." },
                                    { icon: <Zap className="text-brand-gold-500" />, title: "Priority Sourcing", desc: "Your product requests are handled first by our global team." },
                                    { icon: <ShieldCheck className="text-brand-blue-600" />, title: "Concierge Support", desc: "Dedicated support line for all Golden Circle inquiries." }
                                ].map((perk, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            {perk.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xs uppercase tracking-tight text-brand-blue-950">{perk.title}</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{perk.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Vision/Social Proof */}
                    <div className="space-y-8 order-1 lg:order-2 lg:pt-16">
                         <div className="space-y-4">
                            <h2 className="text-sm font-black text-brand-blue-600 uppercase tracking-[0.3em]">Pure authenticity</h2>
                            <h3 className="text-3xl font-black text-brand-blue-950 uppercase tracking-tight leading-none">
                                Curated globally, <br /> delivered locally.
                            </h3>
                            <p className="text-slate-500 font-bold text-xs uppercase leading-relaxed tracking-wide">
                                Golden Circle isn't just a discount program. It's a commitment to providing our most loyal customers with unparalleled access to the world's finest imports at a fractional valuation.
                            </p>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-3xl font-black text-brand-blue-900 italic">1,280+</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Members</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-3xl font-black text-brand-gold-600 italic">৳850K+</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Member Savings</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
