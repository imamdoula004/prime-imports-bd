'use client';

import { useRealTimeProducts } from '@/hooks/useRealTimeData';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import Image from 'next/image';
import { Plus, Sparkles } from 'lucide-react';
import { HorizontalCarousel } from './HorizontalCarousel';

export function CartNudge() {
    const { items, addItem } = useCartStore();

    // Determine the most frequent category in the cart
    const categoryCounts = items.reduce((acc, item) => {
        const cat = item.category || 'General';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Beverages';

    // Fetch products from the same category (limiting to 4 for the nudge)
    const { products, loading } = useRealTimeProducts(topCategory);

    // Filter out products already in cart
    const nudgeProducts = products
        .filter(p => !items.find(item => item.id === p.id) && p.stock > 0)
        .slice(0, 3);

    if (loading || nudgeProducts.length === 0) return null;

    return (
        <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Sparkles size={16} className="text-brand-gold-500" />
                <h3 className="text-[11px] font-black text-brand-blue-900 uppercase tracking-widest">Complete Your Selection</h3>
            </div>

            <HorizontalCarousel 
                containerClassName="pb-4 gap-3 scroll-smooth"
                showArrows={true}
                arrowPosition="inside"
            >
                {nudgeProducts.map((product) => (
                    <div
                        key={product.id}
                        className="min-w-[140px] max-w-[140px] bg-white rounded-2xl border border-slate-100 p-2 flex flex-col group hover:shadow-lg transition-all"
                    >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2">
                            <Image
                                src={product.image || product.imageURL || product.images?.catalog || `https://picsum.photos/seed/${product.id}/100/100`}
                                alt={product.name || product.title || 'Product'}
                                fill
                                className="object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <h4 className="text-[10px] font-bold text-brand-blue-900 line-clamp-1 mb-1 truncate uppercase">
                            {product.name || product.title}
                        </h4>
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-[11px] font-black text-brand-blue-900">৳{product.price.toLocaleString()}</span>
                            <button
                                onClick={() => addItem(product)}
                                className="w-6 h-6 bg-brand-blue-50 text-brand-blue-600 rounded-lg flex items-center justify-center hover:bg-brand-blue-600 hover:text-white transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </HorizontalCarousel>
        </div>
    );
}

