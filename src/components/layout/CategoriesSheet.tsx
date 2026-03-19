'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Wine, Coffee, Cookie, Sparkles, Utensils, Refrigerator, Baby, Box, Gift, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CategoryBoxGrid } from '@/components/ui/CategoryBoxGrid';

interface CategoriesSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CategoriesSheet({ isOpen, onClose }: CategoriesSheetProps) {
    const pathname = usePathname();

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
                        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 mx-auto max-w-[1320px] w-full">
                            <div>
                                <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">All Categories</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Browse Premium Imports</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-brand-blue-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-slate-50 w-full">
                            <div className="mx-auto max-w-[1320px] w-full">
                                <CategoryBoxGrid onClick={onClose} />
                            </div>
                        </div>

                        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 w-full">
                            <div className="mx-auto max-w-[1320px] w-full">
                                <Link
                                    href="/products"
                                    onClick={onClose}
                                    className="block w-full py-4 bg-brand-blue-900 text-white text-center rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-blue-900/20 active:scale-95 transition-all"
                                >
                                    Explore All Products
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
