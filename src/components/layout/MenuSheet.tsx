'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, HelpCircle, Info, FileText, Shield, RotateCcw, Truck, ExternalLink, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface MenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { name: 'Live Chat', icon: <MessageCircle size={20} />, href: '/support', color: 'text-blue-500' },
    { name: 'Help & Support', icon: <HelpCircle size={20} />, href: '/support', color: 'text-brand-blue-600' },
    { name: 'About Us', icon: <Info size={20} />, href: '/about', color: 'text-slate-600' },
    { name: 'Terms & Conditions', icon: <FileText size={20} />, href: '/terms', color: 'text-slate-600' },
    { name: 'Privacy Policy', icon: <Shield size={20} />, href: '/privacy', color: 'text-emerald-600' },
    { name: 'Refund Policy', icon: <RotateCcw size={20} />, href: '/returns', color: 'text-orange-500' },
    { name: 'Delivery Policy', icon: <Truck size={20} />, href: '/shipping', color: 'text-blue-400' },
];

export function MenuSheet({ isOpen, onClose }: MenuSheetProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ translateY: '100%' }}
                        animate={{ translateY: 0 }}
                        exit={{ translateY: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-[64px] md:top-[80px] bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 w-full bg-white z-[70] overflow-hidden flex flex-col shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.1)]"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 mx-auto max-w-[1320px] w-full">
                            <div>
                                <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Main Menu</h2>
                                <p className="text-[10px] text-brand-blue-900/40 font-bold uppercase tracking-widest mt-1">Information & Support</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-brand-blue-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 md:px-6 md:pt-6 w-full">
                            <div className="mx-auto max-w-[1320px] w-full flex flex-col gap-4">
                                <ul className="space-y-1">
                                    {menuItems.map((item, idx) => (
                                        <li key={idx}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-brand-blue-900 transition-all group"
                                            >
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${item.color} group-hover:bg-white/10 group-hover:text-white transition-all`}>
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-brand-blue-900 group-hover:text-white transition-colors">{item.name}</span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-white transition-colors" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {/* VIP Banner moved to bottom */}
                                <div className="p-5 md:p-6 rounded-3xl bg-brand-blue-900 text-white relative overflow-hidden group">
                                    <Star size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1 px-2 border border-brand-gold-400 rounded-lg flex items-center gap-1.5">
                                                <Star size={10} className="fill-brand-gold-400 text-brand-gold-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold-400">Golden Circle</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight mb-1">VIP Premium Perks</h3>
                                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest leading-relaxed mb-4">Priority delivery & exclusive pricing.</p>
                                        <Link
                                            href="/golden-circle"
                                            onClick={onClose}
                                            className="inline-block px-8 py-3 bg-white text-brand-blue-900 text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg"
                                        >
                                            Explore Membership
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
