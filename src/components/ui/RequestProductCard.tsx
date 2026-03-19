'use client';

import { PackageSearch, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useFilterStore } from '@/store/useFilterStore';
import { useEffect } from 'react';

export function RequestProductCard() {
    const { setRequestCardVisible } = useFilterStore();

    useEffect(() => {
        // Increment visibility count or set flag
        setRequestCardVisible(true);
        return () => setRequestCardVisible(false);
    }, [setRequestCardVisible]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative bg-brand-blue-900 rounded-[2.5rem] p-6 md:p-10 overflow-hidden shadow-2xl shadow-brand-blue-900/40 border-4 border-white h-full flex flex-col justify-center min-h-[400px]"
        >
            {/* Animated Background Orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/20 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-blue-400/10 rounded-full blur-[60px] -ml-24 -mb-24" />

            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold-500 text-brand-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-brand-gold-500/20">
                    <Zap size={14} fill="currentColor" /> Sourcing Secret
                </div>
                
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">
                        Can&apos;t Find <br /> <span className="text-brand-gold-500 italic">Your Favorite?</span>
                    </h2>
                    <p className="text-white/90 text-sm font-bold leading-relaxed max-w-sm">
                        Tell us what you&apos;re looking for—chocolate, skincare, or luxury snacks—and we&apos;ll fly it in specifically for you from UK or US.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link href="/request-product">
                        <Button className="w-full h-16 bg-white hover:bg-brand-gold-500 text-brand-blue-900 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-between gap-3 px-8 text-xs uppercase tracking-widest group/btn">
                            Request Sourcing
                            <div className="w-8 h-8 rounded-full bg-brand-blue-900 text-white flex items-center justify-center group-hover/btn:rotate-[-45deg] transition-transform">
                                <ArrowRight size={18} />
                            </div>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Decorative Icon */}
            <div className="absolute top-10 right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <PackageSearch size={140} strokeWidth={1} />
            </div>
        </motion.div>
    );
}
