'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import type { Bundle, Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function BundleSection({ currentProductId }: { currentProductId: string }) {
    const [bundles, setBundles] = useState<{ bundle: Bundle, products: Product[] }[]>([]);
    const { addBundle, toggleCart } = useCartStore();

    useEffect(() => {
        const fetchBundles = async () => {
            const q = query(
                collection(db, 'bundles'),
                where('products', 'array-contains', currentProductId),
                where('active', '==', true),
                limit(3)
            );
            const snap = await getDocs(q);

            const bundleResults = [];
            for (const bundleDoc of snap.docs) {
                const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
                const products: Product[] = [];

                // Fetch each product in the bundle
                for (const pid of bundleData.products) {
                    const pDoc = await getDoc(doc(db, 'products', pid));
                    if (pDoc.exists() && !pDoc.data().isDeleted) {
                        products.push({ id: pDoc.id, ...pDoc.data() } as Product);
                    }
                }

                if (products.length > 0) {
                    bundleResults.push({ bundle: bundleData, products });
                }
            }
            setBundles(bundleResults);
        };
        fetchBundles();
    }, [currentProductId]);

    if (bundles.length === 0) return null;

    return (
        <section className="py-12 border-t border-slate-50 bg-gradient-to-b from-brand-gold-50/30 to-white -mx-4 px-4 md:-mx-8 md:px-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-brand-gold-500 rounded-xl flex items-center justify-center text-brand-blue-900 shadow-lg shadow-brand-gold-500/20">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-brand-blue-950 uppercase tracking-tight">Snack Combos</h2>
                        <p className="text-[10px] font-black text-brand-gold-600 uppercase tracking-[0.2em]">Save up to 15% on curated bundles</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map(({ bundle, products }, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-6 border border-brand-gold-100 shadow-xl shadow-brand-gold-500/5 hover:border-brand-gold-400 transition-all group flex flex-col">
                            {/* Detailed Product List inside Bundle */}
                            <div className="space-y-4 mb-6 flex-1">
                                {products.map((p, i) => (
                                    <Link 
                                        key={i} 
                                        href={`/products/${p.slug || p.id}`}
                                        className="flex items-center gap-3 group/item hover:bg-slate-50 p-2 rounded-2xl transition-all"
                                    >
                                        <div className="relative w-14 h-14 rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm flex-shrink-0 group-hover/item:scale-105 transition-transform">
                                            <Image src={p.imageURL || p.image || '/brand_logo.jpeg'} alt={p.name} fill className="object-contain p-1.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-brand-blue-950 uppercase truncate tracking-tight">{p.name || p.title}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider line-clamp-2 mt-0.5 leading-tight">
                                                {p.description || 'Premium imported selection'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <h3 className="text-xl font-black text-brand-blue-950 uppercase leading-none mb-2">{bundle.name}</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-2xl font-black text-brand-blue-950">৳{bundle.bundlePrice}</span>
                                <span className="text-sm font-bold text-slate-400 line-through">৳{bundle.marketPrice}</span>
                                <span className="ml-auto bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-full uppercase">
                                    SAVE ৳{bundle.marketPrice - bundle.bundlePrice}
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    addBundle(bundle, products);
                                    toggleCart(true);
                                }}
                                className="w-full py-4 bg-brand-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-brand-blue-950 transition-all shadow-lg shadow-brand-blue-900/20 active:scale-95"
                            >
                                Add Combo <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
