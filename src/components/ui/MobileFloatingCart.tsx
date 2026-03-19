'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileFloatingCart() {
    const { items, toggleCart } = useCartStore();
    const pathname = usePathname();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Don't show on admin, checkout, or product detail pages (which have their own cart button)
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout') || pathname?.startsWith('/products/')) return null;

    // Compute directly from reactive items array for real-time updates
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => {
        const price = (item.isBundle && item.bundlePrice) ? item.bundlePrice : item.price;
        return total + price * item.quantity;
    }, 0);

    if (!isHydrated) return null;

    return (
        <AnimatePresence>
            {totalItems > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 z-[10100] md:hidden"
                >
                    <button
                        onClick={() => toggleCart(true)}
                        className="w-full flex items-center justify-between bg-brand-blue-900 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-brand-blue-900/30 active:scale-[0.98] transition-all hover:bg-brand-blue-950"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingCart size={22} strokeWidth={2.5} />
                                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-brand-gold-500 text-brand-blue-900 text-[9px] font-black rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            </div>
                            <span className="font-black text-sm uppercase tracking-wider">View Cart</span>
                        </div>
                        <span className="font-black text-lg tracking-tight">৳{totalPrice.toLocaleString()}</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
