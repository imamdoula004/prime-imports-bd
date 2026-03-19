'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';

interface ShoppingCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShoppingCartDrawer({ isOpen, onClose }: ShoppingCartDrawerProps) {
    const { items, updateQuantity, getTotalPrice } = useCartStore();

    const subtotal = getTotalPrice();
    const deliveryFee = 70;
    const total = subtotal + deliveryFee;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-brand-blue-900/60 backdrop-blur-sm z-[100] transition-opacity fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-white z-[110] shadow-2xl flex flex-col slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3 text-brand-blue-900">
                        <ShoppingBag size={24} strokeWidth={2.5} />
                        <h2 className="text-xl font-extrabold tracking-tight">Your Cart</h2>
                        <span className="bg-brand-blue-50 text-brand-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{items.length} items</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-brand-blue-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Free Shipping Progress Indicator */}
                <div className="bg-brand-gold-50/50 p-4 border-b border-brand-gold-100">
                    <p className="text-sm font-semibold text-brand-blue-800 mb-2 flex justify-between">
                        <span>Spend ৳{5000 - subtotal > 0 ? 5000 - subtotal : 0} more for FREE shipping!</span>
                        {subtotal >= 5000 && <span className="text-green-600">Unlocked!</span>}
                    </p>
                    <div className="w-full bg-white rounded-full h-2.5 shadow-inner border border-brand-gold-100">
                        <div
                            className="bg-brand-gold-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (subtotal / 5000) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                            <ShoppingBag size={48} strokeWidth={1} />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <Button variant="outline" onClick={onClose} className="mt-4">Continue Shopping</Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                    <Image src={item.imageURL || '/placeholder.png'} alt={item.title || 'Product Image'} fill className="object-cover" />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-brand-blue-900 leading-snug line-clamp-2">{item.title}</h3>
                                        <p className="text-brand-gold-600 font-bold mt-1">৳{item.price}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        {/* Quantity Selector */}
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                                            <button onClick={() => item.id && updateQuantity(item.id, -1)} className="p-1.5 text-brand-blue-600 hover:text-brand-blue-900 disabled:opacity-30">
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold text-brand-blue-900">{item.quantity}</span>
                                            <button onClick={() => item.id && updateQuantity(item.id, 1)} className="p-1.5 text-brand-blue-600 hover:text-brand-blue-900">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Summary Footer */}
                {items.length > 0 && (
                    <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span className="text-brand-blue-900 font-bold">৳{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 font-medium pb-4 border-b border-gray-100">
                                <span>Estimated Delivery (Dhaka)</span>
                                <span className="text-brand-blue-900 font-bold">৳{deliveryFee}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-extrabold text-brand-blue-900">Total</span>
                                <span className="font-extrabold text-brand-gold-600 text-2xl">৳{total}</span>
                            </div>
                        </div>

                        <Link href="/checkout" onClick={onClose} className="block w-full">
                            <Button className="w-full py-6 text-white bg-brand-blue-900 hover:bg-brand-blue-800 font-extrabold text-lg rounded-xl shadow-button flex items-center justify-center gap-2 group">
                                Proceed to Checkout
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
        </>
    );
}
