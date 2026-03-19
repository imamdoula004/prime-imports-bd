'use client';

import { useMemberAuth } from '@/context/MemberAuthContext';
import { ShieldCheck, Star, XCircle } from 'lucide-react';
import Link from 'next/link';

export function MemberBadge() {
    const { isGoldenCircleUser, logout } = useMemberAuth();

    if (isGoldenCircleUser) {
        return (
            <div className="flex items-center gap-2">
                <Link 
                    href="/golden-circle/dashboard"
                    className="flex items-center gap-3 bg-brand-blue-900 border border-brand-gold-400/30 px-3 py-1.5 rounded-full shadow-lg shadow-brand-blue-900/20 group transition-all hover:bg-black active:scale-95"
                >
                    <div className="w-5 h-5 rounded-full bg-brand-gold-400 flex items-center justify-center">
                        <ShieldCheck className="text-brand-blue-900" size={12} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-brand-gold-400 uppercase tracking-widest leading-none">Golden Circle</span>
                        <span className="text-[7px] font-bold text-white uppercase tracking-tighter leading-none mt-0.5">My Account</span>
                    </div>
                </Link>
                <button 
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    title="Logout"
                >
                    <XCircle size={16} />
                </button>
            </div>
        );
    }

    return (
        <Link href="/golden-circle" className="flex items-center gap-2.5 bg-brand-gold-50 border border-brand-gold-200 px-3 py-1.5 rounded-full group hover:bg-brand-gold-100 transition-all">
            <Star className="text-brand-gold-600 group-hover:scale-110 transition-transform" size={14} fill="currentColor" />
            <span className="text-[9px] font-black text-brand-gold-700 uppercase tracking-widest">Join GC</span>
        </Link>
    );
}
