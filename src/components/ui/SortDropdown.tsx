'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function SortDropdown() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get('sort') || 'newest';

    const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== 'newest') {
            params.set('sort', value);
        } else {
            params.delete('sort');
        }

        // Reset to page 1 when sort changes
        params.delete('page');

        router.push(`/products?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-xs font-black uppercase tracking-widest text-slate-400">Sort By</label>
            <select
                id="sort-select"
                value={currentSort}
                onChange={handleSortChange}
                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-brand-blue-900 focus:border-brand-blue-500 focus:ring-0 outline-none cursor-pointer transition-all"
            >
                <option value="newest">Latest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="best_selling">Best Selling</option>
            </select>
        </div>
    );
}
