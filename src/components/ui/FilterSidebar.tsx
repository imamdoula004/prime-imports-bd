'use client';

import { useFilterStore } from '@/store/useFilterStore';
import { X, SlidersHorizontal } from 'lucide-react';
import { NikeFilterPanel } from '../product/FilterPanel';
import { motion, AnimatePresence } from 'framer-motion';

export function FilterSidebar() {
    const { isOpen, setIsOpen } = useFilterStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-brand-blue-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-blue-900 text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <SlidersHorizontal size={20} className="text-brand-gold-400" />
                                <h2 className="text-lg font-black uppercase tracking-tighter">Refine Results</h2>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 filter-scroll no-scrollbar">
                            <NikeFilterPanel onClose={() => setIsOpen(false)} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
