'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Bell, Heart } from 'lucide-react';
import type { Product } from '@/types';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useWaitlistStore } from '@/store/useWaitlistStore';
import { useWishlistStore } from '@/store/useWishlistStore';

interface CompactProductCardProps {
    product: Product;
}

export function CompactProductCard({ product }: CompactProductCardProps) {
    const { addItem } = useCartStore();
    const { openModal } = useWaitlistStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const price = Number(product.price || 0);
    const originalPrice = Number(product.originalPrice || product.marketPrice || product.oldPrice || 0);
    const discountPercentage = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    const stock = Number(product.stock) || 0;

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
    };

    const isWishlisted = isInWishlist(product.id || '');

    return (
        <div className="group bg-white flex flex-col w-full rounded-[12px] border border-black/[0.05] transition-all duration-150 ease-out overflow-hidden relative shadow-[0_8px_20px_rgba(0,0,0,0.12),0_3px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.16),0_6px_12px_rgba(0,0,0,0.10)] hover:border-brand-blue-600/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] h-full will-change-transform">
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
                    src={product.images?.catalog || product.image || product.imageURL || '/placeholder.png'}
                    alt={product.name || 'Product'}
                    fill
                    sizes="(max-width: 768px) 33vw, 12vw"
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-110 rounded-[8px]"
                />

                {/* Business Logo Watermark - Solid and Accurate */}
                <div className="absolute bottom-2 right-2 w-5 h-5 z-20 drop-shadow-sm">
                    <Image src="/brand_logo_new.png" alt="Prime Logo" fill className="object-contain" />
                </div>

                {/* Stock Status Label */}
                <div className="absolute top-1 right-1 flex flex-col gap-1 items-end z-20">
                    {stock <= 0 ? (
                        <span className="bg-slate-50 text-brand-blue-900/40 text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter uppercase">
                            Out of Stock
                        </span>
                    ) : stock <= 5 ? (
                        <span className="bg-orange-50 text-orange-600 text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter uppercase">
                            Only Few Left
                        </span>
                    ) : stock <= 10 ? (
                        <span className="bg-red-50 text-red-600 text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter uppercase">
                            Selling Fast
                        </span>
                    ) : (
                        <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter uppercase">
                            In Stock
                        </span>
                    )}

                    {discountPercentage > 0 && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-tighter">
                            {discountPercentage}%
                        </span>
                    )}
                </div>
            </Link>

            {/* Info Section */}
            <div className="p-2 flex flex-col flex-1">
                <Link href={`/products/${product.slug || product.id}`} className="block mb-1">
                    <h3 className="text-brand-blue-950 font-bold text-[10px] md:text-xs leading-tight line-clamp-2 uppercase tracking-tighter h-[2.5em]">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto">
                    {/* Pricing with Golden Circle */}
                    <div className="flex flex-col gap-1.5 mb-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm md:text-base font-black text-brand-blue-950">
                                ৳{price}
                            </span>
                            {originalPrice > price && (
                                <span className="text-[10px] text-red-500 line-through font-bold">
                                    ৳{originalPrice}
                                </span>
                            )}
                        </div>
                        {isHydrated && price > 0 && (
                            <div className="flex items-center">
                                {typeof window !== 'undefined' && localStorage.getItem('golden_circle_member') === 'true' ? (
                                    <div className="bg-brand-gold-50/80 text-brand-gold-700 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest border border-brand-gold-100">
                                        <Star size={8} className="fill-brand-gold-500 text-brand-gold-500" />
                                        Save ৳{Math.round(price * 0.03)}
                                    </div>
                                ) : (
                                    <Link href="/golden-circle" className="bg-brand-blue-50/80 hover:bg-brand-blue-100 text-brand-blue-700 transition-colors text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest border border-brand-blue-100" onClick={(e) => e.stopPropagation()}>
                                        <Star size={8} className="text-brand-blue-500" />
                                        Save ৳{Math.round(price * 0.03)} <span className="underline decoration-1 underline-offset-2 ml-0.5">Join</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {stock > 0 ? (
                        <button
                            onClick={handleAdd}
                            className="w-full flex items-center justify-center gap-1.5 h-7 md:h-8 bg-brand-blue-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-brand-blue-900 transition-all duration-150 active:scale-[0.98] shadow-sm"
                        >
                            <ShoppingCart size={10} /> Add
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openModal(product);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 h-7 md:h-8 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 shadow-sm group"
                        >
                            <Bell size={10} className="group-hover:rotate-12 transition-transform" /> Notify Me
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
