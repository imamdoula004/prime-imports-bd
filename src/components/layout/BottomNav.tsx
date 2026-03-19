'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ShoppingCart, Tag, Menu } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useState, useEffect } from 'react';
import { CategoriesSheet } from '@/components/layout/CategoriesSheet';
import { MenuSheet } from '@/components/layout/MenuSheet';

export function BottomNav() {
    const pathname = usePathname();
    const { toggleCart, items } = useCartStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const totalCartItems = isHydrated ? items.reduce((total, item) => total + item.quantity, 0) : 0;

    if (pathname.startsWith('/golden-circle')) return null;

    return (
        <>
            <nav
                className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-slate-100"
                style={{ 
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {/* 
                    DIRECTIONAL BLEED (v6.3): 
                    Instead of a 360-degree shadow, we use a hidden div that only extends 
                    BELOW the navbar. This avoids masking elements above it like LiveChat.
                */}
                <div className="absolute top-[99%] left-0 right-0 h-[600px] bg-white -z-10" />

                <div className="flex items-center justify-around h-16 max-w-[1400px] mx-auto bg-white">
                    {/* Home */}
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${pathname === '/' ? 'text-brand-blue-600' : 'text-brand-blue-900/40 hover:text-brand-blue-600'}`}
                    >
                        <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                    </Link>

                    {/* Categories */}
                    <button
                        onClick={() => {
                            if (!isCategoriesOpen) setIsMenuOpen(false);
                            setIsCategoriesOpen(!isCategoriesOpen);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isCategoriesOpen ? 'text-brand-blue-600' : 'text-brand-blue-900/40 hover:text-brand-blue-600'}`}
                    >
                        <Grid size={22} strokeWidth={isCategoriesOpen ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Categories</span>
                    </button>

                    {/* Cart */}
                    <button
                        onClick={() => toggleCart(true)}
                        className="flex flex-col items-center justify-center gap-1 w-full h-full relative group"
                    >
                        <div className="bg-brand-blue-900 text-white p-2.5 rounded-2xl shadow-lg shadow-brand-blue-900/20 active:scale-90 -translate-y-2 border-4 border-white">
                            <ShoppingCart size={22} strokeWidth={2.5} />
                            {totalCartItems > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand-gold-500 text-brand-blue-900 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white translate-x-1 -translate-y-1">
                                    {totalCartItems}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue-900 mt-[-8px]">Cart</span>
                    </button>

                    {/* Offers */}
                    <Link
                        href="/products"
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${pathname === '/products' ? 'text-brand-blue-600' : 'text-brand-blue-900/40 hover:text-brand-blue-600'}`}
                    >
                        <Tag size={22} strokeWidth={pathname === '/products' ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Offers</span>
                    </Link>

                    {/* Menu */}
                    <button
                        onClick={() => {
                            if (!isMenuOpen) setIsCategoriesOpen(false);
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isMenuOpen ? 'text-brand-blue-600' : 'text-brand-blue-900/40 hover:text-brand-blue-600'}`}
                    >
                        <Menu size={22} strokeWidth={isMenuOpen ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Bottom Sheets */}
            <CategoriesSheet isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />
            <MenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}
