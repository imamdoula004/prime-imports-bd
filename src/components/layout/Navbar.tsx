'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User, Heart, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';

import { useFilterStore } from '@/store/useFilterStore';
import { SearchDropdown } from '../ui/SearchDropdown';
import { MemberBadge } from '../ui/MemberBadge';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { toggleCart, items } = useCartStore();
    const { setIsOpen: setIsFilterOpen } = useFilterStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const totalCartItems = isHydrated ? items.reduce((total, item) => total + item.quantity, 0) : 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };


    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Removed exclusion for golden-circle to ensure "permanence" as requested
    // if (pathname.startsWith('/golden-circle')) return null;

    return (
        <header className={`fixed top-0 left-0 right-0 z-[1000] bg-white w-full isolate transform-gpu border-b h-16 md:h-20 flex items-center transition-shadow duration-500 ${isScrolled ? 'shadow-xl border-brand-blue-600/10' : 'border-slate-100'}`}>
            <div className="px-4 md:px-6 lg:px-8 w-full max-w-[1320px] mx-auto">
                <div className="flex items-center gap-4 md:gap-8 min-h-[40px] md:min-h-[50px]">
                    {/* Logo */}
                    <Link href="/" className="shrink-0 flex items-center gap-2 group hover:opacity-80 transition-opacity">
                        <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-slate-100">
                            <Image src="/brand_logo.jpeg" alt="Logo" fill className="object-cover" priority />
                        </div>
                        <span className="hidden lg:block font-black text-brand-blue-900 uppercase tracking-tighter text-lg leading-none">
                            <span className="text-brand-blue-600">PRIME</span> <span className="text-brand-gold-500">IMPORTS</span> <span className="text-brand-blue-600">BD</span>
                        </span>
                    </Link>

                    {/* Prominent Search Bar */}
                    <div className="flex-1 relative group">
                        <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-600 transition-colors z-10">
                            <Search size={18} strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-slate-50 border-2 border-brand-blue-600/20 focus:border-brand-blue-600 focus:bg-white rounded-xl py-2 md:py-2.5 pl-10 md:pl-12 pr-4 transition-all text-sm font-bold outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <SearchDropdown
                            query={searchQuery}
                            onClose={() => setSearchQuery('')}
                        />
                    </div>

                    {/* Nav Actions */}
                    <div className="flex items-center gap-1 md:gap-3">
                        {/* Wishlist Icon */}
                        <Link
                            href="/wishlist"
                            className="p-2 rounded-xl text-brand-blue-900 hover:bg-slate-50 transition-all active:scale-90 relative"
                        >
                            <Heart size={22} strokeWidth={2.5} />
                        </Link>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => {
                                setIsFilterOpen(true);
                            }}
                            className="p-2 rounded-xl text-brand-blue-900 hover:bg-slate-50 transition-all active:scale-90 flex items-center gap-2 group"
                        >
                            <SlidersHorizontal size={22} strokeWidth={2.5} className="group-hover:text-brand-blue-600 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Filters</span>
                        </button>

                        {/* Cart Section */}
                        <button
                            onClick={() => toggleCart(true)}
                            className="relative p-2 rounded-xl text-brand-blue-900 hover:bg-slate-50 transition-all active:scale-90 flex items-center gap-1.5"
                        >
                            <div className="relative">
                                <ShoppingCart size={22} strokeWidth={2.5} />
                                {totalCartItems > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-brand-gold-500 text-brand-blue-900 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                        {totalCartItems}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Golden Circle Access */}
                        <div className="hidden sm:block">
                            <MemberBadge />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
