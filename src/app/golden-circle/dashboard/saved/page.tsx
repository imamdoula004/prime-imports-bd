'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';

import { useMemberAuth } from '@/context/MemberAuthContext';
import { useRealTimeMember } from '@/hooks/useRealTimeData';

export default function SavedItems() {
    const { phoneNumber } = useMemberAuth();
    const { member } = useRealTimeMember(phoneNumber || '');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!member) {
                return;
            }

            try {
                // In a real app we'd fetch from a wishlist collection
                // For now, we'll check if they have any saved items in their member record
                const wishlist = (member as any).wishlist || [];
                if (wishlist.length > 0) {
                    const q = query(
                        collection(db, 'products'),
                        where('id', 'in', wishlist.slice(0, 10))
                    );
                    const snapshot = await getDocs(q);
                    setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    setItems([]);
                }
            } catch (error) {
                console.error("Error fetching saved items:", error);
            } finally {
                setLoading(false);
            }
        };

        if (member) fetchWishlist();
        else if (phoneNumber === null) setLoading(false);
    }, [member, phoneNumber]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Saved Items</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Your curated collection of premium favorites</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Your wishlist is empty</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Save items you love to find them easily later</p>
                    <a href="/products" className="inline-block px-10 py-4 bg-brand-blue-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-blue-900/20 active:scale-95 transition-all">
                        Browse Collection
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((product) => (
                        <div key={product.id} className="relative group">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
