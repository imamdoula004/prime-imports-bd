'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Heart, MapPin, CreditCard, HeadphonesIcon, Settings, LogOut, ShieldCheck, User, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

const customerLinks = [
    { name: 'Dashboard', href: '/golden-circle/dashboard', icon: LayoutDashboard },
    { name: 'Order History', href: '/golden-circle/dashboard/history', icon: History },
    { name: 'Saved Items', href: '/golden-circle/dashboard/saved', icon: Heart },
    { name: 'Delivery Addresses', href: '/golden-circle/dashboard/addresses', icon: MapPin },
    { name: 'Payment Methods', href: '/golden-circle/dashboard/payments', icon: CreditCard },
    { name: 'Support', href: '/golden-circle/dashboard/support', icon: HeadphonesIcon },
    { name: 'Settings', href: '/golden-circle/dashboard/settings', icon: Settings },
];

import { useMemberAuth } from '@/context/MemberAuthContext';
import { useRealTimeMember } from '@/hooks/useRealTimeData';

export default function GoldenCircleDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { phoneNumber, logout } = useMemberAuth();
    const { member, loading } = useRealTimeMember(phoneNumber || '');

    const initials = member?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || <User size={20} />;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-brand-blue-900 selection:bg-brand-gold-500 selection:text-brand-blue-900">
            {/* Customer Drawer Sidebar */}
            <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col shadow-sm sticky top-16 md:top-20 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] overflow-y-auto no-scrollbar z-40">
                {/* Profile Header */}
                <div className="px-6 py-8 border-b border-slate-50 relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2 group-hover:opacity-20 transition-opacity"></div>

                    <div className="flex items-center gap-3 relative z-10 w-full">
                        <div className="w-12 h-12 rounded-xl bg-brand-blue-900 text-brand-gold-400 flex items-center justify-center font-black text-lg shadow-lg shrink-0 overflow-hidden">
                            {member?.profileImage ? (
                                <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <h2 className="text-sm md:text-base font-black text-brand-blue-900 tracking-tight truncate leading-tight w-full" title={member?.name}>
                                {member?.name || 'Circle Member'}
                            </h2>
                            <div className="flex items-center gap-1 mt-0.5">
                                <ShieldCheck size={10} className="text-brand-gold-600 shrink-0" strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase text-brand-gold-600 tracking-widest truncate">VERIFIED MEMBER</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between bg-brand-blue-50 rounded-2xl p-4 border border-brand-blue-100 relative z-10">
                        <div>
                            <p className="text-[9px] font-black uppercase text-brand-blue-400 tracking-widest mb-1">Circle Savings</p>
                            <p className="text-xl font-black text-brand-blue-900 tracking-tighter">
                                ৳{member?.totalPurchases ? Math.floor(member.totalPurchases * 0.03).toLocaleString() : '0'}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-brand-blue-900 rounded-full flex items-center justify-center text-brand-gold-400 shadow-sm transition-transform group-hover:rotate-12">
                            <Star size={18} className="fill-brand-gold-400/20" />
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {customerLinks.map((link) => {
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/golden-circle/dashboard');

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${isActive
                                    ? 'bg-brand-blue-900 text-brand-gold-400 shadow-xl shadow-brand-blue-900/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-blue-900'
                                    }`}
                            >
                                <link.icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-brand-gold-400' : 'text-slate-400'} />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-6 border-t border-slate-50">
                    <button 
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors active:scale-95"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                    <div className="mt-6 text-center">
                        <p className="text-[9px] font-black text-brand-blue-900 uppercase tracking-widest opacity-40">Prime Imports BD v1.2.4</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 transition-all duration-300">
                <div className="max-w-[1000px] mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
