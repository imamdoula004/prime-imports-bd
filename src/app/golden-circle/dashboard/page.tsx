'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Star,
    ShieldCheck,
    Package,
    Zap,
    ArrowLeft,
    LogOut,
    BadgeCheck,
    Bell,
    Wallet,
    Trophy,
    Home,
    Tag,
    User,
    Loader2,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot, doc } from 'firebase/firestore';
import type { Product } from '@/types';

interface MemberData {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    status: string;
    autoApproved: boolean;
    totalPurchases: number;
}

import { useMemberAuth } from '@/context/MemberAuthContext';
import { useRealTimeMember } from '@/hooks/useRealTimeData';
import { useRouter } from 'next/navigation';

export default function GoldenCircleDashboard() {
    const { phoneNumber, logout, isGoldenCircleUser, isLoading: authLoading } = useMemberAuth();
    const router = useRouter();
    const { member, loading: memberLoading } = useRealTimeMember(phoneNumber || '');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isGoldenCircleUser) {
            router.push('/golden-circle');
            return;
        }

        // Real-time listener for featured products
        const q = query(collection(db, 'products'), limit(12));
        const unsubscribeProducts = onSnapshot(q, (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
            setLoading(false);
        });

        return () => {
            unsubscribeProducts();
        };
    }, [isGoldenCircleUser, authLoading, router]);

    const handleLogout = () => {
        logout();
        router.push('/golden-circle');
    };

    const initials = member?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || <User size={20} />;

    if (authLoading || memberLoading || loading || !member) {
        return (
            <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#f2b90d]" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c14] text-white font-sans selection:bg-[#f2b90d] selection:text-[#0a0c14] pb-24 overflow-x-hidden">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 bg-[#0a0c14]/80 backdrop-blur-xl">
                <Link href="/golden-circle" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-[#f2b90d] hover:text-[#0a0c14] transition-all border border-white/10">
                    <ArrowLeft size={18} />
                </Link>
                <h2 className="text-lg font-black uppercase tracking-widest italic">Golden Circle</h2>
                <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[#f2b90d]/10 text-[#f2b90d] border border-[#f2b90d]/20">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0c14]"></span>
                </button>
            </header>

            <main className="max-w-lg mx-auto px-6 space-y-8 animate-fade-in pt-4">
                {/* Profile Section */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-[#f2b90d] p-1.5 shadow-[0_0_30px_rgba(242,185,13,0.3)] bg-[#0a0c14] flex items-center justify-center overflow-hidden">
                            {member?.profileImage ? (
                                <img
                                    src={member.profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-4xl font-black text-[#f2b90d]">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 bg-[#f2b90d] rounded-full p-1.5 border-4 border-[#0a0c14] text-[#0a0c14]">
                            <BadgeCheck size={16} strokeWidth={3} />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none mb-2">Welcome, {member.name?.split(' ')[0] || 'Member'}</h1>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-[#f2b90d] text-[10px] font-black uppercase tracking-[0.3em]">Golden Status</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Prime Imports BD</span>
                        </div>
                    </div>
                </div>

                {/* Hero Discount Badge */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#f2b90d] via-[#d4af37] to-[#f2b90d] p-8 shadow-2xl shadow-[#f2b90d]/20"
                >
                    <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col gap-2">
                        <p className="text-[#0a0c14]/60 text-[10px] font-black uppercase tracking-[0.4em]">Active Status</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-[#0a0c14] text-5xl font-black tracking-tighter italic">3%</h3>
                            <p className="text-[#0a0c14] text-xl font-black uppercase italic">Lifetime Discount</p>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-[#0a0c14]/80 text-[10px] font-black uppercase tracking-widest leading-relaxed">Exclusive Golden Circle Privilege</p>
                            <Star size={24} className="text-[#0a0c14] fill-transparent" strokeWidth={2.5} />
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-2 mb-4">
                            <Wallet className="text-[#f2b90d] group-hover:scale-110 transition-transform" size={16} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Savings</span>
                        </div>
                        <p className="text-2xl font-black italic tracking-tighter">৳{member.totalPurchases ? Math.floor(member.totalPurchases * 0.03).toLocaleString() : '0'}</p>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="text-[#f2b90d] group-hover:scale-110 transition-transform" size={16} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Points Earned</span>
                        </div>
                        <p className="text-2xl font-black italic tracking-tighter">
                            {member.totalPurchases ? Math.floor(member.totalPurchases / 10).toLocaleString() : '0'} <span className="text-[10px] font-bold text-slate-500 not-italic uppercase tracking-widest ml-1">pts</span>
                        </p>
                    </div>
                </div>

                {/* Exclusive Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black uppercase tracking-tight italic">Golden Circle Only</h3>
                        <Link href="/products" className="text-[10px] font-black text-[#f2b90d] uppercase tracking-[0.2em] border-b border-[#f2b90d]/30 pb-0.5 hover:border-[#f2b90d] transition-all">View All</Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-6">
                        {products.slice(0, 6).map((p) => (
                            <Link
                                key={p.id}
                                href={`/products/${(p as any).slug || p.id}`}
                                className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden group hover:bg-[#0a0c14] hover:border-[#f2b90d]/30 transition-all shadow-xl flex flex-col"
                            >
                                <div className="relative aspect-square bg-white shrink-0">
                                    <Image
                                        src={p.imageURL || `https://picsum.photos/seed/${p.id}/300/300`}
                                        alt={p.name}
                                        fill
                                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                        <p className="text-[#f2b90d] text-[7px] font-black uppercase tracking-widest italic">-3%</p>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="text-[10px] font-black text-white group-hover:text-[#f2b90d] transition-colors truncate uppercase italic leading-tight">{p.name}</h4>
                                    <div className="mt-auto pt-2 flex items-baseline gap-2">
                                        <p className="text-sm font-black text-[#f2b90d] italic">৳{p.price?.toLocaleString()}</p>
                                        <p className="text-[8px] text-slate-500 line-through font-bold">৳{Math.floor(p.price / 0.97).toLocaleString()}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Logout Action */}
                <button
                    onClick={handleLogout}
                    className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2 mb-12"
                >
                    <LogOut size={16} /> Formal Exit
                </button>
            </main>

        </div>
    );
}
