'use client';

import Link from 'next/link';
import { PackageSearch, ArrowRight, Sparkles } from 'lucide-react';

export function ProductRequestCard() {
    return (
        <section className="container mx-auto px-4 mb-16 px-4 md:px-8 lg:px-16">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-blue-900 via-brand-blue-950 to-black p-8 md:p-12 shadow-2xl shadow-brand-blue-900/20 group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32 animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute inset-0 border-[1px] border-white/10 rounded-full scale-110" />
                    <div className="absolute inset-0 border-[1px] border-white/5 rounded-full scale-125" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 text-center lg:text-left">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-brand-gold-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-md">
                            <Sparkles size={12} />
                            Special Order Service
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                            Can't find <br className="hidden md:block" /> 
                            <span className="text-brand-gold-400">an item?</span>
                        </h2>
                        <p className="text-base md:text-lg text-brand-blue-100 font-bold max-w-xl leading-relaxed">
                            Looking for a specific global snack, premium chocolate, or luxury cosmetic? Our sourcing team can find it for you directly from the <span className="text-white underline decoration-brand-gold-500/50 underline-offset-4">UK, US, or EU.</span>
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-center lg:items-end gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center text-brand-gold-500 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <PackageSearch size={48} strokeWidth={1.5} />
                        </div>
                        <Link href="/request-product">
                            <button className="h-16 px-10 bg-brand-gold-500 hover:bg-white text-brand-blue-950 font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] group/btn">
                                Request Product 
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
