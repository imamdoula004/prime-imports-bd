import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit, getCountFromServer } from 'firebase/firestore';
import type { Product } from '@/types';
import Link from 'next/link';
import { RealTimeProductGrid } from '@/components/ui/RealTimeProductGrid';
import { Button } from '@/components/ui/Button';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ProductRequestCard } from '@/components/ui/ProductRequestCard';
import {
    Sparkles, Wine, Coffee, Sparkle, Cookie, Pizza,
    ShoppingBag, Utensils, Search, Box, Refrigerator,
    Zap, Baby, HeartPulse, Home, Gift,
    ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';

async function getProductCount(category?: string) {
    try {
        const productsRef = collection(db, 'products');
        let countQ = query(productsRef);

        if (category && category !== 'All Imports') {
            countQ = query(productsRef, where('category', '==', category));
        }

        const snapshot = await getCountFromServer(countQ);
        return snapshot.data().count;
    } catch (e) {
        return 0;
    }
}

function getPaginationArray(currentPage: number, totalPages: number) {
    const delta = 3;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string, page?: string, search?: string, sort?: string }> }) {
    const { category, page: pageStr, search: searchStr, sort } = await searchParams;
    const page = parseInt(pageStr || '1');
    const pageSize = 24; // Increased for higher density
    const totalItems = await getProductCount(category);
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="flex flex-col min-h-screen bg-white container-pbd mx-auto max-w-[1320px] px-4">
            {/* Compact Header */}
            <div className="py-6 border-b border-slate-50 mb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Box size={14} className="text-brand-blue-600" />
                            <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-[0.2em]">Premium Catalog</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-brand-blue-900 uppercase tracking-tighter leading-none">
                            {category || (searchStr ? `Search: ${searchStr}` : 'All Imports')}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                            Showing {Math.min(totalItems, (page - 1) * pageSize + 1)}-{Math.min(totalItems, page * pageSize)} of {totalItems} Products
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <SortDropdown />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1">
                <RealTimeProductGrid
                    category={category}
                    searchQuery={searchStr}
                    sort={sort}
                    currentPage={page}
                    pageSize={pageSize}
                />

                <div className="mt-20 pb-20">
                    <ProductRequestCard />
                </div>
            </div>
        </div>
    );
}


