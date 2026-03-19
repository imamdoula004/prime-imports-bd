'use client';

import { useEffect, useState } from 'react';
import { CompactProductCard } from './CompactProductCard';
import type { Product } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const productIds = history.filter((id: string) => id !== currentProductId).slice(0, 10);

            const fetchedProducts: Product[] = [];
            for (const id of productIds) {
                try {
                    const docRef = doc(db, 'products', id);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        fetchedProducts.push({ id: snap.id, ...snap.data() } as Product);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            setProducts(fetchedProducts);
        };

        fetchHistory();

        // Add current to history
        const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const newHistory = [currentProductId, ...history.filter((id: string) => id !== currentProductId)].slice(0, 20);
        localStorage.setItem('recentlyViewed', JSON.stringify(newHistory));
    }, [currentProductId]);

    if (products.length === 0) return null;

    return (
        <section className="pt-8 pb-0 border-t border-slate-50">
            <h2 className="text-lg md:text-xl font-black text-brand-blue-950 uppercase tracking-tight mb-6">
                Recently Viewed
            </h2>
            <div className="carousel-container pb-0">
                {products.map((product) => (
                    <div key={product.id} className="carousel-item-compact">
                        <CompactProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
}
