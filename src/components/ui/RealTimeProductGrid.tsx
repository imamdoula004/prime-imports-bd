'use client';

import { useRealTimeProducts } from '@/hooks/useRealTimeData';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { NikeFilterPanel } from '@/components/product/FilterPanel';
import Link from 'next/link';
import { useRef, useState, useEffect, useMemo } from 'react';
import { 
    PackageX, ArrowRight, ChevronLeft, ChevronRight, 
    Loader2, SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RequestProductCard } from './RequestProductCard';
import { useFilterStore } from '@/store/useFilterStore';

interface ProductGridProps {
    category?: string;
    categoryId?: string;
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
    categoryId,
    searchQuery: propSearchQuery,
    sort: propSort,
    currentPage,
    pageSize,
    onTotalItemsUpdate,
    layout = 'grid',
    disableInfiniteScroll = false
}: ProductGridProps) {
    const { 
        brands, priceRange, genders, subcategories, productTypes, 
        ram, storage, colors, isNewArrival, isBestSeller, 
        sortBy, searchQuery: storeSearchQuery,
        setIsOpen, resetFilters
    } = useFilterStore();
    
    // Combine props and store search/sort
    const effectiveSearchQuery = propSearchQuery || storeSearchQuery;
    const effectiveSortBy = propSort || sortBy;

    // Memoize filters for useRealTimeProducts to avoid infinite loops
    const serverFilters = useMemo(() => ({
        brands, genders, subcategories
    }), [brands, genders, subcategories]);

    const { products: rawProducts, loading } = useRealTimeProducts(category, categoryId, effectiveSearchQuery, effectiveSortBy, serverFilters);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(pageSize || 24);

    useEffect(() => {
        setVisibleCount(pageSize || 24);
    }, [category, effectiveSearchQuery, effectiveSortBy, pageSize]);

    // Intersection Observer for true Infinite Scroll
    useEffect(() => {
        if (disableInfiniteScroll || layout === 'carousel' || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => prev + (pageSize || 24));
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [disableInfiniteScroll, layout, loading, pageSize]);


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
            handleScroll();
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [rawProducts, loading]);

    // Robust Filtering & Sorting 
    const processedProducts = useMemo(() => {
        let result = [...rawProducts];

        // 1. Search Logic (Fuzzy-ish multi-word)
        if (effectiveSearchQuery) {
            const terms = effectiveSearchQuery.toLowerCase().trim().split(/\s+/);
            result = result.filter(p => {
                const searchable = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.subcategory || ''} ${p.productType || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
                return terms.every(term => searchable.includes(term));
            });
        }

        // 2. Multi-select Filters (AND between sections, OR within sections)
        if (brands.length > 0) {
            result = result.filter(p => p.brand && brands.includes(p.brand));
        }

        if (genders.length > 0) {
            result = result.filter(p => {
                const g = p.gender || 'Unisex';
                return genders.includes(g) || genders.some(sel => p.tags?.includes(sel.toLowerCase()));
            });
        }

        if (subcategories.length > 0) {
            result = result.filter(p => p.subcategory && subcategories.includes(p.subcategory));
        }

        if (productTypes.length > 0) {
            result = result.filter(p => p.productType && productTypes.includes(p.productType));
        }

        if (ram.length > 0) {
            result = result.filter(p => p.ram && ram.includes(p.ram));
        }

        if (storage.length > 0) {
            result = result.filter(p => p.storage && storage.includes(p.storage));
        }

        if (colors.length > 0) {
            result = result.filter(p => p.colors?.some((c: string) => colors.includes(c)) || colors.some((c: string) => p.tags?.includes(c.toLowerCase())));
        }

        // 3. Price Range
        if (priceRange[1] < 50000) {
            result = result.filter(p => p.price <= priceRange[1]);
        }

        // 4. Status Toggles
        if (isNewArrival) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result = result.filter(p => {
                const createdDate = p.createdAt ? new Date(p.createdAt) : null;
                return (createdDate && createdDate >= sevenDaysAgo) || p.tags?.includes('new');
            });
        }

        if (isBestSeller) {
            result = result.filter(p => p.tags?.includes('best-seller') || p.tags?.includes('trending') || (p.totalSales && p.totalSales > 20));
        }

        // 5. Sorting
        switch (effectiveSortBy) {
            case 'price_asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'best_selling':
            case 'popular':
                result.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
                break;
            case 'discounted':
                result.sort((a, b) => {
                    const discA = (a.originalPrice || a.price) - a.price;
                    const discB = (b.originalPrice || b.price) - b.price;
                    return discB - discA;
                });
                break;
            case 'newest':
            default:
                result.sort((a, b) => {
                    const timeA = new Date(a.createdAt || 0).getTime();
                    const timeB = new Date(b.createdAt || 0).getTime();
                    return timeB - timeA;
                });
                break;
        }

        return result;
    }, [rawProducts, effectiveSearchQuery, brands, genders, subcategories, productTypes, ram, storage, colors, priceRange, isNewArrival, isBestSeller, effectiveSortBy]);

    const totalItems = processedProducts.length;

    // Local slicing for visible items
    const displayedProducts = layout === 'grid' 
        ? processedProducts.slice(0, visibleCount)
        : processedProducts;
    
    if (loading) {
        return (
            <div className="flex gap-8 w-full">
                {layout === 'grid' && !disableInfiniteScroll && (
                    <div className="hidden lg:block w-64 shrink-0 space-y-8">
                        <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="space-y-4">
                            {[1,2,3,4].map(i => <div key={i} className="h-10 w-full bg-slate-50 rounded-xl animate-pulse" />)}
                        </div>
                    </div>
                )}
                <div className={layout === 'grid'
                    ? "flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3"
                    : "flex gap-4 overflow-x-auto pb-4 no-scrollbar"
                }>
                    {[...Array(layout === 'grid' ? pageSize : 4)].map((_, i) => (
                        <div key={i} className={layout === 'carousel' ? "min-w-[160px] md:min-w-[200px]" : "w-full"}>
                            <ProductCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (displayedProducts.length === 0) {
        return (
            <div className="flex gap-8 w-full min-h-[60vh]">
                 {layout === 'grid' && !disableInfiniteScroll && (
                    <div className="hidden lg:block w-64 shrink-0">
                        <NikeFilterPanel />
                    </div>
                )}
                <div className="flex-1 py-12 flex flex-col items-center justify-center gap-10">
                    <div className="flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                            <PackageX size={32} />
                        </div>
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">No Matches Found</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Try adjusting your filters or search terms.
                        </p>
                    </div>
                    <RequestProductCard />
                </div>
            </div>
        );
    }

    if (layout === 'carousel') {
        return (
            <div className="relative group/carousel">
                <div className="hidden lg:block transition-opacity duration-300">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronLeft size={24} strokeWidth={2.5} />
                        </button>
                    )}
                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronRight size={24} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex carousel-container no-scrollbar pb-8 overflow-x-auto px-4 md:px-0 gap-3 md:gap-4 py-3"
                >
                    {processedProducts.slice(0, 40).map((product) => (
                        <div key={product.id || product.slug} className="carousel-item-standard py-1 px-1">
                            <ProductCard product={product} />
                        </div>
                    ))}

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
                    <div className="w-10 shrink-0" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-[1440px] mx-auto relative">
            {/* Mobile Filter Trigger */}
            <div className="lg:hidden sticky top-16 z-30 flex items-center justify-between bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 -mx-4 mb-2">
                 <button 
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 active:scale-95 transition-all"
                 >
                    <SlidersHorizontal size={14} strokeWidth={3} />
                    Filters {totalItems > 0 && `(${totalItems})`}
                 </button>
                 
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
                    <select 
                        value={effectiveSortBy}
                        onChange={(e) => useFilterStore.getState().setSortBy(e.target.value)}
                        className="text-[10px] font-black text-brand-blue-900 uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                        <option value="newest">Newest</option>
                        <option value="best_selling">Best Selling</option>
                        <option value="price_asc">Price: Low</option>
                        <option value="price_desc">Price: High</option>
                    </select>
                 </div>
            </div>

            {/* Nike Style Sidebar (Desktop) */}
            {layout === 'grid' && !disableInfiniteScroll && (
                <div className="hidden lg:block w-64 shrink-0">
                    <NikeFilterPanel />
                </div>
            )}


            <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                    {displayedProducts.map((product, idx) => (
                        <ProductCard key={product.id || product.slug} product={product} priority={idx < 4} />
                    ))}
                </div>
                
                {/* Infinite Scroll Target */}
                <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
                    {visibleCount < totalItems && !disableInfiniteScroll && (
                        <div className="flex flex-col items-center gap-4">
                             <Loader2 size={24} className="text-brand-blue-600 animate-spin" />
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading more items...</p>
                        </div>
                    )}
                </div>

                {visibleCount >= totalItems && totalItems > 0 && (
                    <div className="py-8 text-center">
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                            End of Catalog — {totalItems} items shown
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
