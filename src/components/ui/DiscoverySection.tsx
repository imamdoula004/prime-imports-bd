'use client';

import { CompactProductCard } from './CompactProductCard';
import { ProductCard } from './ProductCard';
import { HorizontalCarousel } from './HorizontalCarousel';
import type { Product } from '@/types';
import { ChevronRight } from 'lucide-react';

interface DiscoverySectionProps {
    title: string;
    subtitle?: string;
    products: Product[];
    layout?: 'grid' | 'swipe';
    density?: 'normal' | 'dense' | 'ultra';
    cardType?: 'standard' | 'compact';
}

export function DiscoverySection({
    title,
    subtitle,
    products,
    layout = 'grid',
    density = 'normal',
    cardType = 'compact'
}: DiscoverySectionProps) {
    if (!products.length) return null;

    const GridClass = density === 'ultra' ? "discovery-grid-ultra" :
        density === 'dense' ? "product-grid-dense" :
            "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";

    const CarouselItemClass = cardType === 'compact' ? "carousel-item-compact" : "carousel-item-standard";

    return (
        <section className="py-8 border-t border-slate-50">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-brand-blue-950 uppercase tracking-tight leading-none mb-1">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-brand-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform cursor-pointer">
                    View All <ChevronRight size={12} strokeWidth={3} />
                </div>
            </div>

            {layout === 'grid' ? (
                <div className={GridClass}>
                    {products.map((product) => (
                        cardType === 'compact' ?
                            <CompactProductCard key={product.id} product={product} /> :
                            <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <HorizontalCarousel containerClassName="pb-4 gap-3 md:gap-4 scroll-mt-4">
                    {products.map((product) => (
                        <div key={product.id} className={CarouselItemClass}>
                            {cardType === 'compact' ?
                                <CompactProductCard product={product} /> :
                                <ProductCard product={product} />
                            }
                        </div>
                    ))}
                </HorizontalCarousel>
            )}
        </section>
    );
}

