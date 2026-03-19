'use client';

import { useRealTimeProducts } from '@/hooks/useRealTimeData';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { useRef, useState, useEffect, useMemo } from 'react';
import { PackageX, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { RequestProductCard } from './RequestProductCard';
import { useFilterStore } from '@/store/useFilterStore';

interface ProductGridProps {
    category?: string;
    searchQuery?: string;
    sort?: string;
    currentPage: number;
    pageSize: number;
    onTotalItemsUpdate?: (total: number) => void;
    layout?: 'grid' | 'carousel';
    disableInfiniteScroll?: boolean;
}

export function RealTimeProductGrid({
    category,
    searchQuery,
    sort,
    currentPage,
    pageSize,
    onTotalItemsUpdate,
    layout = 'grid',
    disableInfiniteScroll = false
}: ProductGridProps) {
    const { products: rawProducts, loading } = useRealTimeProducts(category, searchQuery, sort);
    const { brands, priceRange, gender, isNewArrival, isBestSeller } = useFilterStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(pageSize || 24);

    useEffect(() => {
        setVisibleCount(pageSize || 24);
    }, [category, searchQuery, sort, pageSize]);

    // Infinite Scroll logic removed in favor of manual "Load More" button


    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check
            handleScroll();
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [rawProducts, loading]);

    // Dynamic Filtering - Moved to top to comply with Rules of Hooks
    const filteredProducts = useMemo(() => {
        let result = [...rawProducts];

        // Search Query multi-word fallback
        if (searchQuery && searchQuery.trim().split(' ').length > 1) {
            const terms = searchQuery.toLowerCase().trim().split(' ').slice(1);
            result = result.filter(p => {
                const searchStr = `${p.name} ${p.category || ''} ${p.subcategory || ''} ${p.brand || ''}`.toLowerCase();
                return terms.every(term => searchStr.includes(term));
            });
        }

        // Brand Filter
        if (brands.length > 0) {
            result = result.filter(p => p.brand && brands.includes(p.brand));
        }

        // Price Filter
        if (priceRange[1] < 50000) {
            result = result.filter(p => p.price <= priceRange[1]);
        }

        // Gender Filter
        if (gender) {
            result = result.filter(p => p.gender === gender || p.tags?.includes(gender.toLowerCase()));
        }

        // New Arrival Filter (Simplified: created in last 7 days or has tag)
        if (isNewArrival) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(p => {
                const createdDate = p.createdAt ? new Date(p.createdAt) : null;
                return (createdDate && createdDate >= sevenDaysAgo) || p.tags?.includes('new');
            });
        }

        // Best Seller Filter (Simplified: has tag or stock < 10?)
        if (isBestSeller) {
            result = result.filter(p => p.tags?.includes('best-seller') || p.tags?.includes('trending'));
        }

        return result;
    }, [rawProducts, searchQuery, brands, priceRange, gender, isNewArrival, isBestSeller]);

    if (loading) {
        return (
            <div className={layout === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
                : "flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            }>
                {[...Array(layout === 'grid' ? pageSize : 4)].map((_, i) => (
                    <div key={i} className={layout === 'carousel' ? "min-w-[160px] md:min-w-[200px]" : "w-full"}>
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    // Sorting
    const sortedProducts = [...filteredProducts];
    if (sort === 'price_asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (sort === 'best_selling') {
        sortedProducts.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    } else {
        sortedProducts.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    }

    const totalItems = sortedProducts.length;

    // Local infinite scroll
    const displayedProducts = layout === 'grid' 
        ? sortedProducts.slice(0, visibleCount)
        : sortedProducts;
    
    if (displayedProducts.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center gap-10 w-full">
                <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-3">
                        <PackageX size={24} />
                    </div>
                    <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">No Matches Found</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Try adjusting your filters or search terms.
                    </p>
                </div>
            </div>
        );
    }



    if (layout === 'carousel') {
        return (
            <div className="relative group/carousel">
                {/* Desktop Navigation Arrows */}
                <div className="hidden lg:block lg:opacity-0 lg:group-hover/carousel:opacity-100 transition-opacity duration-300">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronLeft size={24} strokeWidth={2.5} />
                        </button>
                    )}
                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronRight size={24} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex carousel-container no-scrollbar pb-8 overflow-x-auto px-4 md:px-0 gap-3 md:gap-4 py-3"
                >
                    {sortedProducts.slice(0, 40).map((product) => (
                        <div key={product.id || product.slug} className="carousel-item-standard py-1 px-1">
                            <ProductCard product={product} />
                        </div>
                    ))}


                    {/* View All Card */}
                    {totalItems > 10 && (
                        <Link
                            href={`/products?category=${category || ''}`}
                            className="carousel-item group h-full py-1"
                        >
                            <div className="h-full bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center hover:bg-brand-blue-50 hover:border-brand-blue-600 transition-all group-active:scale-95 min-h-[300px] md:min-h-[340px]">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-blue-600 group-hover:text-white">
                                    <ArrowRight size={24} className="transition-colors" />
                                </div>
                                <span className="text-xs font-black text-brand-blue-950 uppercase tracking-[0.2em]">View All</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{totalItems} Products</span>
                            </div>
                        </Link>
                    )}
                    <div className="w-10 shrink-0" /> {/* Ending Spacer */}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {displayedProducts.map((product, idx) => (
                    <ProductCard key={product.id || product.slug} product={product} priority={idx < 4} />
                ))}
            </div>
            


            {visibleCount < sortedProducts.length && layout === 'grid' && (
                <div className="py-12 flex flex-col items-center gap-6 w-full border-t border-slate-50 mt-8">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Showing {visibleCount} of {sortedProducts.length} Products
                    </p>
                    <button
                        onClick={() => setVisibleCount(prev => prev + (pageSize || 24))}
                        className="h-16 px-12 bg-white border-2 border-brand-blue-900 text-brand-blue-900 hover:bg-brand-blue-900 hover:text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-blue-900/5 active:scale-95 flex items-center gap-4 text-xs uppercase tracking-[0.2em] group"
                    >
                        Load More Product
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

        </div>
    );
}
