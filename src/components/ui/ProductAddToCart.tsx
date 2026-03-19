'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, Bell, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useWaitlistStore } from '@/store/useWaitlistStore';
import type { Product } from '@/types';

interface ProductAddToCartProps {
    product: Product;
    isMobileFooter?: boolean;
}

export function ProductAddToCart({ product, isMobileFooter = false }: ProductAddToCartProps) {
    const [quantity, setQuantity] = useState(1);
    const { items, addItem, updateQuantity, toggleCart } = useCartStore();
    const { openModal } = useWaitlistStore();
    const [isHydrated, setIsHydrated] = useState(false);

    const stock = Number(product.stock) || 0;
    const isOutOfStock = stock <= 0;

    const cartItem = items.find(item => item.id === product.id);
    const isInCart = !!cartItem;

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Sync local quantity with cart quantity if item is in cart
    useEffect(() => {
        if (isHydrated && cartItem) {
            setQuantity(cartItem.quantity);
        }
    }, [isHydrated, cartItem?.quantity]);

    const handleMinus = () => {
        if (isInCart) {
            if (quantity > 0) updateQuantity(product.id || '', quantity - 1);
        } else {
            if (quantity > 1) setQuantity(quantity - 1);
        }
    };

    const handlePlus = () => {
        if (isInCart) {
            if (quantity < stock) updateQuantity(product.id || '', quantity + 1);
        } else {
            if (quantity < stock) setQuantity(quantity + 1);
        }
    };

    const handleAction = () => {
        if (isInCart) {
            toggleCart(true);
        } else {
            addItem(product, quantity);
        }
    };

    if (!isHydrated) return null;

    if (isMobileFooter) {
        return (
            <div
                className="lg:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white border-t border-slate-100 z-[9999]"
            >
                <div className="absolute top-[99%] left-0 right-0 h-[600px] bg-white -z-10" />

                <div className="p-4 space-y-3 max-w-[1400px] mx-auto bg-white">
                    {isOutOfStock ? (
                        <button
                            onClick={() => openModal(product)}
                            className="w-full h-12 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Bell size={16} />
                            <span>Notify When Available</span>
                        </button>
                    ) : (
                        <div className="flex flex-row items-center gap-2">
                            {/* Quantity Control */}
                            <div className="w-1/3 flex items-center bg-slate-50 rounded-xl p-0.5 h-12 border border-slate-100">
                                <button
                                    onClick={handleMinus}
                                    className="flex-1 h-full flex items-center justify-center text-brand-blue-900 border-r border-slate-100 hover:bg-white rounded-l-lg transition-all active:scale-90"
                                >
                                    <Minus size={16} strokeWidth={3} />
                                </button>
                                <span className="w-8 text-center font-black text-sm text-brand-blue-900">{isHydrated ? quantity : 1}</span>
                                <button
                                    onClick={handlePlus}
                                    className="flex-1 h-full flex items-center justify-center text-brand-blue-900 border-l border-slate-100 hover:bg-white rounded-r-lg transition-all active:scale-90"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Add Action */}
                            <button
                                onClick={handleAction}
                                className={`w-2/3 ${isInCart ? 'bg-emerald-600' : 'bg-brand-blue-900'} text-white h-12 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all hover:bg-black text-[11px] uppercase tracking-[0.2em]`}
                            >
                                {isInCart ? (
                                    <>
                                        <ShoppingCart size={18} strokeWidth={2.5} />
                                        <span>Added (View Cart)</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={18} strokeWidth={2.5} />
                                        <span>Add to Cart</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full transition-all duration-300">
            {isOutOfStock ? (
                <button
                    onClick={() => openModal(product)}
                    className="w-full h-12 md:h-14 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl text-[11px] md:text-sm font-black uppercase tracking-widest hover:bg-slate-100 hover:text-brand-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm group"
                >
                    <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>Notify Me When Available</span>
                </button>
            ) : (
                <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center bg-slate-50 rounded-xl p-0.5 h-12 border border-slate-100">
                            <button
                                onClick={handleMinus}
                                className="w-10 h-10 flex items-center justify-center text-brand-blue-900 hover:bg-white rounded-lg transition-all active:scale-90"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="w-8 text-center font-black text-sm text-brand-blue-900">{isHydrated ? quantity : 1}</span>
                            <button
                                onClick={handlePlus}
                                className="w-10 h-10 flex items-center justify-center text-brand-blue-900 hover:bg-white rounded-lg transition-all active:scale-90"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>

                        <button
                            onClick={handleAction}
                            className={`flex-1 ${isInCart ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-blue-600 hover:bg-brand-blue-700'} text-white h-12 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-blue-900/10 active:scale-[0.97] transition-all text-xs uppercase tracking-widest`}
                        >
                            {isInCart ? (
                                <>
                                    <ShoppingCart size={18} strokeWidth={2.5} />
                                    <span>Added to Cart</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={18} strokeWidth={2.5} />
                                    <span>Add to Cart</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
