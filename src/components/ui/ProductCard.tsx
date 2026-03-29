'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, ShoppingCart, Heart, Star } from 'lucide-react';
import type { Product } from '@/types';
import { useState, useEffect } from 'react';

import { useCartStore } from '@/store/useCartStore';
import { useWaitlistStore } from '@/store/useWaitlistStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { RotateCcw, Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface ProductCardProps {
    product: Product;
    priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
    const { addItem, updateQuantity, items } = useCartStore();
    const { openModal } = useWaitlistStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [waitlistCount, setWaitlistCount] = useState<number>(0);

    useEffect(() => {
        setIsHydrated(true);

        const currentStock = Number(product.stock) || 0;
        if (currentStock <= 0) {
            // Real-time listener for waitlist count to boost FOMO
            const docRef = doc(db, 'waitlists', product.id || product.slug);
            const unsubscribe = onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    setWaitlistCount(doc.data().waitlistCount || 0);
                }
            });
            return () => unsubscribe();
        }
    }, [product.id, product.slug, product.stock]);

    const cartItem = items.find(item => item.id === product.id);
    const quantity = isHydrated ? (cartItem?.quantity || 0) : 0;

    const imagePlaceholder = product.image || product.imageURL || product.images?.catalog || `https://picsum.photos/seed/${product.id || product.slug}/400/400`;

    const price = Number(product.price || 0);
    const originalPrice = Number(product.originalPrice || product.marketPrice || product.oldPrice || 0);

    const discountPercentage = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const stock = Number(product.stock) || 0;

    const getStatusLabel = () => {
        if (stock <= 0) return { label: 'OUT OF STOCK', classes: 'text-brand-blue-900/40 bg-slate-50' };
        if (stock <= 5) return { label: 'ONLY FEW LEFT', classes: 'text-orange-600 bg-orange-50' };
        if (stock <= 10) return { label: 'SELLING FAST', classes: 'text-red-600 bg-red-50' };
        return { label: 'IN STOCK', classes: 'text-emerald-600 bg-emerald-50' };
    };

    const status = getStatusLabel();

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    const handleUpdateQuantity = (e: React.MouseEvent, newQty: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.id) {
            updateQuantity(product.id, newQty);
        }
    };

    const { isInWishlist, toggleWishlist } = useWishlistStore();
    const isWishlisted = isInWishlist(product.id || '');

    return (
        <div className="group bg-white flex flex-col w-full rounded-[12px] border border-black/[0.08] transition-all duration-120 ease-out overflow-hidden relative shadow-[0_10px_24px_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.22),0_6px_14px_rgba(0,0,0,0.14)] hover:border-brand-blue-600/20 hover:-translate-y-0.75 hover:scale-[1.02] active:scale-[0.97] h-full will-change-transform">
            {/* Wishlist Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product);
                }}
                className={`absolute top-2 right-2 z-20 p-1.5 rounded-full shadow-sm backdrop-blur-md transition-all active:scale-90 ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500'
                    }`}
            >
                <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
            </button>
            {/* Image Section - Aspect Square */}
            <Link href={`/products/${product.slug || product.id}`} className="block relative aspect-square overflow-hidden bg-white shrink-0 border-b border-slate-50">
                <Image
                    src={imagePlaceholder}
                    alt={product.name || product.title || 'Premium Import'}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-105 rounded-[8px]"
                    priority={priority}
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {discountPercentage > 0 && (
                        <span className="bg-red-600 text-white text-[10px] md:text-[11px] font-black px-2 py-1 rounded shadow-sm tracking-widest uppercase">
                            {discountPercentage}% OFF
                        </span>
                    )}
                    {product.tags?.includes('imported') && (
                        <span className="bg-brand-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase">
                            Imported
                        </span>
                    )}
                </div>
            </Link>

            {/* Info Section */}
            <div className="p-2 md:p-3 flex flex-col flex-1">
                {/* Stock Status */}
                <div className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] mb-1.5 px-1.5 py-0.5 rounded inline-block self-start ${status.classes}`}>
                    {status.label}
                </div>

                <Link href={`/products/${product.slug || product.id}`} className="block mb-1">
                    <h3 className="text-brand-blue-950 font-bold text-[10px] md:text-xs leading-[1.2] line-clamp-2 uppercase tracking-tight h-[2.4em] hover:text-brand-blue-600 transition-colors">
                        {product.name || product.title}
                    </h3>
                </Link>

                <div className="mt-auto space-y-2">
                    {/* Pricing with Golden Circle */}
                    <div className="flex flex-col gap-1.5 mb-1.5">
                        <div className="flex items-baseline gap-1 flex-wrap min-h-[1rem]">
                            <span className="text-base md:text-lg font-black text-brand-blue-950 leading-none">
                                ৳{price.toLocaleString()}
                            </span>
                            {originalPrice > price && (
                                <span className="text-[10px] md:text-xs text-red-500 line-through font-black">
                                    ৳{originalPrice.toLocaleString()}
                                </span>
                            )}
                        </div>
                        {isHydrated && price > 0 && (
                            <div className="flex items-center">
                                {typeof window !== 'undefined' && localStorage.getItem('golden_circle_member') === 'true' ? (
                                    <div className="bg-brand-gold-50/80 text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-widest border border-brand-gold-100 text-brand-gold-700">
                                        <Star size={9} className="fill-brand-gold-500 text-brand-gold-500" />
                                        Save ৳{Math.round(price * 0.03).toLocaleString()}
                                    </div>
                                ) : (
                                    <Link href="/golden-circle" className="bg-brand-blue-50/80 hover:bg-brand-blue-100 text-brand-blue-700 transition-colors text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-widest border border-brand-blue-100" onClick={(e) => e.stopPropagation()}>
                                        <Star size={9} className="text-brand-blue-500" />
                                        Save ৳{Math.round(price * 0.03).toLocaleString()} <span className="underline decoration-1 underline-offset-2 ml-0.5">Join</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    {stock > 0 ? (
                        quantity > 0 ? (
                            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-0.5 h-8 md:h-10 border border-slate-100 transition-all hover:bg-slate-100">
                                <button
                                    onClick={(e) => handleUpdateQuantity(e, quantity - 1)}
                                    className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-md bg-white text-brand-blue-900 border border-slate-200 shadow-sm hover:bg-brand-blue-600 hover:text-white hover:border-brand-blue-600 transition-all active:scale-90"
                                >
                                    <Minus size={14} strokeWidth={3} />
                                </button>
                                <span className="font-black text-brand-blue-900 text-[11px] md:text-sm">{quantity}</span>
                                <button
                                    onClick={handleAdd}
                                    className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-md bg-brand-blue-900 text-white shadow-md hover:bg-brand-blue-800 transition-all active:scale-90"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAdd}
                                className="w-full flex items-center justify-center gap-2 h-8 md:h-10 bg-brand-blue-600 text-white rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue-900 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-brand-blue-900/10 group"
                            >
                                <ShoppingCart size={14} className="group-hover:translate-x-0.5 transition-transform" /> Add to Cart
                            </button>
                        )
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(product);
                            }}
                            className="w-full h-8 md:h-10 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm group"
                        >
                            <Bell size={14} className="group-hover:rotate-12 transition-transform" />
                            <div className="flex flex-col items-start leading-none text-left">
                                <span>Notify Me</span>
                                {waitlistCount > 0 && (
                                    <span className="text-[7px] text-white/80 lowercase font-bold tracking-normal mt-0.5">
                                        {waitlistCount} waiting
                                    </span>
                                )}
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
