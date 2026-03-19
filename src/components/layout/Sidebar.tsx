'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    ShoppingBag,
    Wine,
    Coffee,
    Cookie,
    Utensils,
    HeartPulse,
    Sparkles,
    ChevronRight,
    Headphones,
    User,
    Gift,
    Refrigerator,
    Baby,
    Box
} from 'lucide-react';
import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import { useMemberAuth } from '@/context/MemberAuthContext';

const categories = [
    { name: 'Beverages & Drinks', icon: <Wine size={18} />, color: 'text-blue-600' },
    { name: 'Tea & Coffee', icon: <Coffee size={18} />, color: 'text-orange-900' },
    { name: 'Chocolate Bars', icon: <Sparkles size={18} />, color: 'text-brand-gold-500' },
    { name: 'Biscuits & Cookies', icon: <Cookie size={18} />, color: 'text-amber-800' },
    { name: 'Snacks & Sweets', icon: <Sparkles size={18} />, color: 'text-pink-600' },
    { name: 'Cosmetics & Beauty', icon: <HeartPulse size={18} />, color: 'text-indigo-600' },
    { name: 'Grocery Essentials', icon: <Utensils size={18} />, color: 'text-emerald-700' },
    { name: 'Dairy & Cheese', icon: <Refrigerator size={18} />, color: 'text-blue-400' },
    { name: 'Baby Care', icon: <Baby size={18} />, color: 'text-rose-400' },
    { name: 'Home & Kitchen', icon: <Box size={18} />, color: 'text-slate-600' },
    { name: 'Hampers & Gifts', icon: <Gift size={18} />, color: 'text-purple-600' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { config } = useStorefrontConfig();
    const { isGoldenCircleUser } = useMemberAuth();

    const visibleCategories = categories.filter(cat =>
        !config?.visibleCategories ||
        config.visibleCategories.length === 0 ||
        config.visibleCategories.includes(cat.name)
    );

    return (
        <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 left-0 sidebar-blur z-40 p-8 overflow-y-auto no-scrollbar shrink-0">
            {/* Navigation Header */}
            <div className="mb-12 mt-2">
                <Link href="/" className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-brand-blue-600 tracking-tighter leading-none mb-1">
                        PRIME IMPORTERS BD
                    </h1>
                </Link>
            </div>

            {/* Main Nav */}
            <nav className="space-y-10">
                <div>
                    <h3 className="text-[13px] font-black text-brand-blue-600 uppercase tracking-[0.2em] mb-4 ml-1">Explore Marketplace</h3>
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="/"
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all group ${pathname === '/' ? 'bg-brand-blue-600 text-white shadow-xl shadow-brand-blue-900/10' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Home size={18} className={pathname === '/' ? 'text-white' : 'text-brand-blue-600'} />
                                <span className="text-[11px] font-black uppercase tracking-widest">Storefront</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[13px] font-black text-brand-blue-600 uppercase tracking-[0.2em] mb-4 ml-1">Top Departments</h3>
                    <ul className="space-y-0.5">
                        {visibleCategories.map((cat, i) => {
                            const isActive = pathname === `/products?category=${encodeURIComponent(cat.name)}`;
                            return (
                                <li key={i}>
                                    <Link
                                        href={`/products?category=${encodeURIComponent(cat.name)}`}
                                        className={`flex items-center justify-between px-4 py-3.5 rounded-lg group transition-all ${isActive ? 'bg-brand-blue-600 text-white shadow-xl shadow-brand-blue-900/10' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md transition-colors shadow-sm ${isActive ? 'bg-white/10' : 'bg-white border border-slate-100 group-hover:border-slate-200'} ${cat.color}`}>
                                                {cat.icon}
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-brand-blue-600 group-hover:text-brand-blue-600'}`}>{cat.name}</span>
                                        </div>
                                        <ChevronRight size={12} className={`transition-all ${isActive ? 'opacity-100 translate-x-0 text-white' : 'opacity-0 -translate-x-2 text-slate-300 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* Membership Promo Card - Hidden for already logged in members */}
            {!isGoldenCircleUser && (
                <div className="mt-12 mb-8 p-6 rounded-2xl bg-brand-blue-600 text-white relative overflow-hidden group shadow-2xl shadow-brand-blue-900/40">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                        <Sparkles size={64} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-blue-200">Golden Circle</h4>
                        <p className="text-xs font-bold leading-snug mb-4">Redeem global rewards and priority shipping.</p>
                        <Link href="/golden-circle" className="inline-flex items-center justify-center w-full py-2.5 bg-white text-brand-blue-900 text-[10px] font-black uppercase tracking-widest rounded transition-colors hover:bg-blue-50">
                            Join Membership
                        </Link>
                    </div>
                </div>
            )}

            {/* Support */}
            <div className="mt-auto pt-8 border-t border-slate-100">
                <Link href="/support" className="flex items-center justify-center gap-3 w-full bg-brand-blue-600 text-white px-4 py-4 rounded-xl shadow-xl shadow-brand-blue-900/20 active:scale-95 transition-all group">
                    <Headphones size={18} className="text-brand-gold-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">Support Center</span>
                </Link>
            </div>
        </aside>
    );
}
