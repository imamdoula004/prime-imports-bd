'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './Skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FBTProps {
    currentProductId: string;
    category: string;
}

export function FrequentlyBoughtTogether({ currentProductId, category }: FBTProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                // Load enough for the 6-per-row layout (double it for scroll)
                const q = query(
                    collection(db, 'products'),
                    where('category', '==', category),
                    limit(13)
                );
                const snapshot = await getDocs(q);
                const related = snapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id } as Product))
                    .filter(p => p.id !== currentProductId)
                    .slice(0, 12);
                setProducts(related);
            } catch (error) {
                console.error("Error fetching related products", error);
            } finally {
                setLoading(false);
            }
        };

        if (category) fetchRelated();
    }, [category, currentProductId]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    if (loading) {
        return (
            <div className="py-6 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">You May Also Like</h3>
                </div>
                <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="min-w-[150px] md:min-w-[180px] lg:w-[calc(100%/6-12px)]">
                            <ProductCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <div className="py-8 border-t border-slate-50">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-0.5">
                    <h3 className="text-base font-black text-brand-blue-950 uppercase tracking-tight">Recommended For You</h3>
                    <p className="text-[9px] font-bold text-brand-blue-900/40 uppercase tracking-widest italic">Similar premium imports</p>
                </div>

                <div className="hidden md:flex gap-1.5">
                    <button
                        onClick={() => scroll('left')}
                        className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-slate-50 transition-all active:scale-90"
                    >
                        <ChevronLeft size={16} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-slate-50 transition-all active:scale-90"
                    >
                        <ChevronRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto pb-6 premium-scrollbar snap-x snap-mandatory -mx-4 px-4 md:-mx-0 md:px-0"
            >
                {products.map(product => (
                    <div
                        key={product.id}
                        className="min-w-[150px] xs:min-w-[170px] md:min-w-[190px] lg:min-w-[calc(100%/6-20px)] lg:max-w-[calc(100%/6-20px)] snap-start"
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}
