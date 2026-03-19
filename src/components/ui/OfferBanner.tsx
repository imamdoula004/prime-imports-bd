'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function OfferBanner() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const appearTimer = setTimeout(() => setIsVisible(true), 1500);

        // Auto close after 10 seconds of being visible (1500ms delay + 10000ms duration)
        const closeTimer = setTimeout(() => setIsVisible(false), 11500);

        return () => {
            clearTimeout(appearTimer);
            clearTimeout(closeTimer);
        };
    }, []);

    if (!mounted) return null;
    // Only show on the homepage as requested
    if (pathname !== '/') return null;
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: -100, y: 100, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    exit={{ x: -100, y: 100, opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-[60px] md:bottom-2 left-0 z-[10200] w-[320px] h-[320px] pointer-events-none"
                >
                    {/* The Arc Shape */}
                    <div className="absolute bottom-0 left-0 w-full h-full bg-brand-blue-600/95 backdrop-blur-xl rounded-tr-[240px] shadow-[20px_-20px_60px_rgba(0,26,77,0.3)] border-t border-r border-white/20 pointer-events-auto overflow-hidden group">

                        {/* Decorative Background Elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold-500/10 rounded-full blur-3xl group-hover:bg-brand-gold-500/20 transition-colors" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-20 -left-20 opacity-10"
                        >
                            <Sparkles size={200} className="text-white" />
                        </motion.div>

                        {/* Content Container - Angled for the Arc */}
                        <div className="absolute bottom-10 left-8 right-12 text-white">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="bg-brand-gold-500 text-brand-blue-900 p-3 rounded-2xl shadow-lg animate-bounce-slow">
                                    <Gift size={24} strokeWidth={2.5} />
                                </div>
                                <div className="pt-1">
                                    <h4 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">
                                        First Order<br />Special!
                                    </h4>
                                    <div className="h-0.5 w-12 bg-brand-gold-500 rounded-full mb-3" />
                                </div>
                            </div>

                            <p className="text-[11px] font-bold text-blue-50 uppercase tracking-[0.2em] leading-relaxed mb-6 opacity-80">
                                Spend <span className="text-brand-gold-400">৳5,000+</span> for<br />
                                <span className="underline decoration-brand-gold-500/50 underline-offset-4">FREE FAST DELIVERY</span><br />
                                & a Surprise Gift! 🎁
                            </p>

                            <Link
                                href="/products"
                                className="inline-flex items-center gap-3 bg-white text-brand-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-gold-500 hover:text-brand-blue-900 transition-all active:scale-95 shadow-xl shadow-brand-blue-900/20 group/btn"
                            >
                                Claim Offer
                                <ArrowRight size={14} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 p-2.5 bg-brand-blue-900 border-2 border-brand-gold-500 rounded-full text-white hover:text-brand-gold-500 hover:bg-brand-blue-950 transition-all z-20 shadow-xl pointer-events-auto"
                        aria-label="Close"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
