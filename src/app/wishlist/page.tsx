'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductCard } from '@/components/ui/ProductCard';
import { useWishlistStore } from '@/store/useWishlistStore';
import type { Product } from '@/types';

export default function WishlistPage() {
    const { wishlist } = useWishlistStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (wishlist.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const productsRef = collection(db, 'products');
                const chunks = [];
                for (let i = 0; i < wishlist.length; i += 10) {
                    chunks.push(wishlist.slice(i, i + 10));
                }

                const allProducts: Product[] = [];
                for (const chunk of chunks) {
                    const q = query(productsRef, where(documentId(), 'in', chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        allProducts.push({ id: doc.id, ...doc.data() } as Product);
                    });
                }
                setProducts(allProducts);
            } catch (error) {
                console.error("Error fetching wishlist products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlistProducts();
    }, [wishlist]);

    return (
        <div className="bg-white min-h-screen pb-20">

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <Link href="/products" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-blue-900 transition-colors mb-4 group font-bold tracking-tight">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Shopping
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-brand-blue-900 uppercase tracking-tighter italic">My Wishlist</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Saved snippets of luxury & premium imports</p>
                    </div>
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-slate-100">
                        <Heart size={20} className="fill-red-500 text-red-500" />
                        <span className="font-black text-brand-blue-900 text-sm">{wishlist.length} Items Saved</span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                        <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Loading your favorites...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <Heart size={48} strokeWidth={1} />
                        </div>
                        <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Wishlist is Empty</h2>
                        <p className="text-slate-400 font-bold max-w-sm mb-10">You haven't saved any items yet. Browse our premium collections to find something you love.</p>
                        <Link href="/products" className="bg-brand-blue-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-brand-blue-950 transition-all active:scale-95">Explore Products</Link>
                    </div>
                )}
            </main>
        </div>
    );
}
