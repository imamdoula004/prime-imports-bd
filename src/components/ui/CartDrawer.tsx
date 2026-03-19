'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Zap, Star, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useMemberAuth } from '@/context/MemberAuthContext';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CartNudge } from '@/components/ui/CartNudge';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import type { Bundle, Product } from '@/types';

export function CartDrawer() {
    const pathname = usePathname();
    const { items, isOpen, toggleCart, updateQuantity, removeItem, suggestedBundles, setSuggestedBundles, addBundle } = useCartStore();
    const { isGoldenCircleUser } = useMemberAuth();

    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Fetch bundle suggestions based on cart items
    useEffect(() => {
        const fetchBundleSuggestions = async () => {
            if (items.length === 0) {
                setSuggestedBundles([]);
                return;
            }

            try {
                // Get non-bundle product IDs in cart
                const cartProductIds = items.filter(item => !item.isBundle).map(item => item.id);
                if (cartProductIds.length === 0) {
                    setSuggestedBundles([]);
                    return;
                }

                // Fetch active bundles that contain at least one of these products
                // Firestore limit for array-contains-any is 10 items
                const bundlesRef = collection(db, 'bundles');
                const q = query(
                    bundlesRef,
                    where('products', 'array-contains-any', cartProductIds.slice(0, 10)),
                    where('active', '==', true),
                    limit(3)
                );

                const snap = await getDocs(q);
                const suggestions = [];

                for (const bundleDoc of snap.docs) {
                    const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
                    
                    // Skip if bundle already in cart
                    if (items.some(item => item.id === `bundle-${bundleData.id}`)) continue;

                    const products: Product[] = [];
                    let allAvailable = true;

                    for (const pid of bundleData.products) {
                        const pDoc = await getDoc(doc(db, 'products', pid));
                        if (pDoc.exists()) {
                            const pData = { id: pDoc.id, ...pDoc.data() } as Product;
                            if (Number(pData.stock) <= 0) allAvailable = false;
                            products.push(pData);
                        } else {
                            allAvailable = false;
                        }
                    }

                    if (allAvailable && products.length > 0) {
                        // Check if cart has all components to auto-convert
                        const hasAllComponents = bundleData.products.every(pid => items.some(item => !item.isBundle && item.id === pid));
                        
                        if (hasAllComponents) {
                            addBundle(bundleData, products);
                            bundleData.products.forEach(pid => {
                                const cartItem = useCartStore.getState().items.find(i => i.id === pid);
                                if (cartItem) {
                                    if (cartItem.quantity > 1) {
                                        useCartStore.getState().updateQuantity(pid, cartItem.quantity - 1);
                                    } else {
                                        useCartStore.getState().removeItem(pid);
                                    }
                                }
                            });
                            continue; // Skip adding to suggestions
                        }

                        suggestions.push({ bundle: bundleData, products });
                    }
                }

                setSuggestedBundles(suggestions);
            } catch (error) {
                console.error("Error fetching bundle suggestions:", error);
            }
        };

        if (isOpen && isHydrated) {
            fetchBundleSuggestions();
        }
    }, [items.length, isOpen, isHydrated, setSuggestedBundles]);

    // Safety: Never render cart drawer/backdrop on admin pages
    if (pathname?.startsWith('/admin')) return null;

    // Compute directly from items array for reactive updates
    const totalPrice = items.reduce((total, item) => {
        const price = (item.isBundle && item.bundlePrice) ? item.bundlePrice : item.price;
        return total + price * item.quantity;
    }, 0);
    const totalItems = isHydrated ? items.reduce((total, item) => total + item.quantity, 0) : 0;

    const totalSavings = items.reduce((total, item) => {
        if (item.isBundle && item.marketPrice && item.bundlePrice) {
            return total + (item.marketPrice - item.bundlePrice) * item.quantity;
        }
        return total;
    }, 0);

    const goldenCircleDiscount = isGoldenCircleUser ? Math.round(totalPrice * 0.03) : 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => toggleCart(false)}
                        className="fixed inset-0 bg-brand-blue-900/40 backdrop-blur-[2px] z-[10500]"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 md:bottom-0 md:left-auto md:right-4 md:max-w-[380px] bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.1)] z-[11000] max-h-[85vh] flex flex-col overflow-hidden border-t border-slate-100 md:mb-4"
                    >
                        {/* Drawer Header - Compact */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-blue-900 text-brand-gold-400 p-2 rounded-xl shadow-md">
                                    <ShoppingBag size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Your Cart</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                        {totalItems} Items — ৳{totalPrice.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleCart(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all border border-transparent active:scale-95"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Cart Items - High Density */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar pb-10">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-brand-blue-50 rounded-full flex items-center justify-center text-brand-blue-600 mb-4">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest">Cart is empty</h3>
                                    <p className="text-[10px] text-slate-400 mt-2 max-w-[180px] font-bold leading-relaxed uppercase">
                                        Discover premium imports today.
                                    </p>
                                    <button
                                        onClick={() => toggleCart(false)}
                                        className="mt-6 text-[10px] font-black text-brand-blue-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
                                    >
                                        Browse Marketplace
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.id} className={`flex gap-4 p-3 rounded-2xl bg-white border ${item.isBundle ? 'border-brand-gold-200 bg-brand-gold-50/10' : 'border-slate-100'} hover:border-brand-blue-100 transition-all group relative`}>
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50">
                                                    {item.isBundle && item.bundleProductImages && item.bundleProductImages.length > 0 ? (
                                                        <div className="relative w-full h-full p-1 flex items-center justify-center">
                                                            {item.bundleProductImages.slice(0, 2).map((img, i) => (
                                                                <div 
                                                                    key={i} 
                                                                    className={`absolute w-10 h-10 rounded-md border border-white shadow-sm overflow-hidden bg-white ${i === 0 ? 'top-1 left-1 z-0' : 'bottom-1 right-1 z-1'}`}
                                                                >
                                                                    <Image src={img || '/brand_logo.jpeg'} alt="" fill className="object-contain p-0.5" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            src={item.imageURL || item.image || `https://picsum.photos/seed/${item.slug || item.id}/150/150`}
                                                            alt={item.name || item.title || 'Product'}
                                                            fill
                                                            className="object-contain p-1.5"
                                                        />
                                                    )}
                                                    {item.isBundle && (
                                                        <div className="absolute top-0 right-0 bg-brand-gold-500 text-brand-blue-900 p-0.5 rounded-bl-lg shadow-sm z-10">
                                                            <Zap size={10} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </div>
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        {item.isBundle && (
                                                            <span className="text-[8px] font-black text-brand-gold-600 uppercase tracking-widest block mb-0.5">Value Combo</span>
                                                        )}
                                                        <h4 className="text-[11px] font-black text-brand-blue-950 truncate uppercase tracking-tight w-full">
                                                            {item.name || item.title}
                                                        </h4>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id!)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] font-black text-brand-blue-600 uppercase bg-brand-blue-50 px-1 rounded-sm">
                                                        {item.brand || (item.isBundle ? 'Prime Bundle' : 'Import')}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-black text-brand-blue-900 tracking-tighter">৳{item.price.toLocaleString()}</span>
                                                        {item.isBundle && item.marketPrice && (
                                                            <span className="text-[10px] font-bold text-slate-400 line-through">৳{item.marketPrice.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>


                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                                        <button
                                                            onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-brand-blue-900 rounded transition-all"
                                                        >
                                                            <Minus size={12} strokeWidth={3} />
                                                        </button>
                                                        <span className="text-[10px] font-black text-brand-blue-900 w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                                                            disabled={item.quantity >= (item.stock || 0)}
                                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-brand-blue-900 rounded transition-all disabled:opacity-10"
                                                        >
                                                            <Plus size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm font-black text-brand-blue-950 uppercase tracking-widest">৳{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* BUNDLE SUGGESTIONS / UPGRADES */}
                                    {suggestedBundles.length > 0 && (
                                        <div className="mt-8 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 bg-brand-gold-500 rounded-lg flex items-center justify-center text-brand-blue-900">
                                                    <Zap size={14} fill="currentColor" />
                                                </div>
                                                <h5 className="text-[10px] font-black text-brand-blue-900 uppercase tracking-[0.15em]">Bundle & Save More</h5>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {suggestedBundles.map(({ bundle, products }, idx) => (
                                                    <div key={idx} className="bg-brand-blue-900 rounded-2xl p-4 shadow-xl shadow-brand-blue-900/10 border border-brand-blue-800 transition-all hover:bg-black group">
                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                                            <p className="text-[11px] font-black text-white uppercase tracking-tight leading-tight">{bundle.name}</p>
                                                            <div className="bg-brand-gold-500 text-brand-blue-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                                                                Save ৳{bundle.marketPrice - bundle.bundlePrice}
                                                            </div>
                                                        </div>

                                                        {/* Product List within Bundle */}
                                                        <div className="space-y-3 mb-8">
                                                            {products.map((p, i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shadow-sm flex-shrink-0 border border-white">
                                                                        <Image src={p.imageURL || p.image || '/brand_logo.jpeg'} alt="" width={40} height={40} className="object-contain p-1" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] sm:text-xs font-black text-brand-gold-400 uppercase truncate tracking-tight">{p.name || p.title}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button 
                                                            onClick={() => {
                                                                addBundle(bundle, products);
                                                                // Remove individual components if they exist in cart
                                                                products.forEach(p => {
                                                                    const cartItem = useCartStore.getState().items.find(i => i.id === p.id);
                                                                    if (cartItem) {
                                                                        if (cartItem.quantity > 1) {
                                                                            useCartStore.getState().updateQuantity(p.id!, cartItem.quantity - 1);
                                                                        } else {
                                                                            useCartStore.getState().removeItem(p.id!);
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className="w-full py-2.5 bg-brand-gold-500 text-brand-blue-900 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-brand-gold-500/10"
                                                        >
                                                            Upgrade to Combo <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Summary Area - High Density */}
                        {items.length > 0 && (
                            <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] bg-white border-t border-slate-50 space-y-4 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-brand-blue-900/60 uppercase tracking-widest">Order Subtotal</span>
                                        <div className="flex flex-col items-end">
                                            {(totalSavings > 0 || isGoldenCircleUser) && (
                                                <span className="text-[10px] md:text-xs font-bold text-slate-400 line-through">৳{(totalPrice + totalSavings).toLocaleString()}</span>
                                            )}
                                            <span className="text-sm md:text-base font-black text-brand-blue-900">৳{(totalPrice - goldenCircleDiscount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {isGoldenCircleUser && (
                                        <div className="flex justify-between items-center text-emerald-600">
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck size={10} fill="currentColor" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Golden Circle Discount (3%)</span>
                                            </div>
                                            <span className="text-[11px] font-black">- ৳{goldenCircleDiscount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {totalSavings > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600">
                                            <div className="flex items-center gap-1">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Bundle Savings</span>
                                            </div>
                                            <span className="text-[11px] font-black">- ৳{totalSavings.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-brand-blue-900/60 uppercase tracking-widest">Delivery Charge</span>
                                        <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest italic">Calculated at Checkout</span>
                                    </div>
                                </div>

                                <Link href="/checkout" onClick={() => toggleCart(false)} className="block">
                                    <button className="w-full h-12 bg-brand-blue-900 text-white font-black uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all hover:bg-black text-[11px] shadow-lg shadow-brand-blue-900/10">
                                        Finalize Purchase
                                        <ArrowRight size={16} strokeWidth={3} />
                                    </button>
                                </Link>

                                <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.1em]">
                                    Secured checkout powered by Prime Imports
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
