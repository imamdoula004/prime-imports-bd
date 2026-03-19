'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import type { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import { motion } from 'framer-motion';

export function HeroSubProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const { addItem, updateQuantity, items } = useCartStore();
    const { config } = useStorefrontConfig();

    useEffect(() => {
        let q;
        if (config?.heroSlide3ProductIds && config.heroSlide3ProductIds.length > 0) {
            q = query(
                collection(db, 'products'),
                where('__name__', 'in', config.heroSlide3ProductIds.slice(0, 12))
            );
        } else {
            q = query(collection(db, 'products'), limit(12));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            if (config?.heroSlide3ProductIds && config.heroSlide3ProductIds.length > 0) {
                const ordered = config.heroSlide3ProductIds
                    .map(id => fetched.find(p => p.id === id))
                    .filter(Boolean) as Product[];
                setProducts(ordered.length > 0 ? ordered : fetched);
            } else {
                setProducts(fetched);
            }
        });

        return () => unsubscribe();
    }, [config]);

    if (products.length === 0) return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0c14] flex flex-col justify-center px-4 md:px-12 lg:px-20 z-20 py-8 transition-all">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-gold-500/10 rounded-lg">
                    <Sparkles size={18} className="text-brand-gold-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Curated Excellence</h3>
                    <p className="text-[10px] text-brand-gold-400 font-bold uppercase tracking-[0.2em] mt-1">Trending Imports</p>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-1 md:gap-2 overflow-y-auto no-scrollbar max-h-[80%] py-2 pb-12">
                {products.slice(0, 15).map((product, idx) => {
                    const cartItem = items.find(item => item.id === product.id);
                    const qty = cartItem?.quantity || 0;

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group relative bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-1 flex flex-col gap-0.5 hover:bg-white/10 transition-all shadow-xl"
                        >
                            <Link href={`/products/${product.slug || product.id}`} className="block">
                                <div className="relative aspect-square bg-white rounded-lg overflow-hidden p-1 shadow-inner">
                                    <Image
                                        src={product.imageURL || `https://picsum.photos/seed/${product.id}/200/200`}
                                        alt={product.name || product.title || 'Product'}
                                        fill
                                        className="object-contain p-0.5 group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="mt-1">
                                    <h4 className="text-[8px] md:text-[9px] font-bold text-white truncate leading-tight">
                                        {product.name || product.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9px] font-black text-brand-gold-400">৳{product.price?.toLocaleString()}</span>
                                        {qty > 0 && <span className="bg-brand-gold-400 text-brand-blue-900 text-[8px] font-black px-1 rounded-full">{qty}</span>}
                                    </div>
                                </div>
                            </Link>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addItem(product);
                                }}
                                className="w-full h-6 md:h-7 flex items-center justify-center rounded-lg bg-brand-gold-500 text-brand-blue-900 hover:bg-brand-gold-400 transition-all active:scale-90 text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1"
                            >
                                <Plus size={10} strokeWidth={4} className="mr-1" /> Add
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
