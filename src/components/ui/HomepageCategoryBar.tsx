'use client';

import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import Link from 'next/link';
import {
    Wine, Coffee, Sparkles, Cookie, Sparkle, ShoppingBag, Utensils,
    Refrigerator, Baby, Box, Gift, HeartPulse
} from 'lucide-react';

const ALL_CATEGORIES = [
    { name: 'Beverages & Drinks', icon: <Wine size={22} />, text: 'Beverages' },
    { name: 'Tea & Coffee', icon: <Coffee size={22} />, text: 'Tea & Coffee' },
    { name: 'Chocolate Bars', icon: <Sparkles size={22} />, text: 'Chocolates' },
    { name: 'Biscuits & Cookies', icon: <Cookie size={22} />, text: 'Biscuits' },
    { name: 'Snacks & Confectionery', icon: <Sparkle size={22} />, text: 'Snacks' },
    { name: 'Cosmetics & Beauty', icon: <HeartPulse size={22} />, text: 'Beauty' },
    { name: 'Grocery and Essentials', icon: <Utensils size={22} />, text: 'Grocery' },
    { name: 'Dairy & Cheese', icon: <Refrigerator size={22} />, text: 'Dairy' },
    { name: 'Baby Care Imports', icon: <Baby size={22} />, text: 'Baby' },
    { name: 'Home & Kitchen', icon: <Box size={22} />, text: 'Home' },
    { name: 'Hampers & Gifts', icon: <Gift size={22} />, text: 'Gifts' },
];

const DEFAULT_CATEGORIES = [
    'Beverages & Drinks', 'Tea & Coffee', 'Chocolate Bars',
    'Biscuits & Cookies', 'Snacks & Confectionery', 'Cosmetics & Beauty', 'Grocery and Essentials'
];

export function HomepageCategoryBar() {
    const { config } = useStorefrontConfig();

    const visibleNames = (config?.homepageCategoryBar && config.homepageCategoryBar.length > 0)
        ? config.homepageCategoryBar
        : DEFAULT_CATEGORIES;

    const categories = ALL_CATEGORIES.filter(cat => visibleNames.includes(cat.name));

    return (
        <div className="flex overflow-x-auto pt-4 pb-4 px-2 gap-4 md:gap-6 no-scrollbar scroll-smooth -mt-4">
            {categories.map((cat, idx) => (
                <Link
                    key={idx}
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center gap-3 group min-w-[100px] md:min-w-[120px]"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-brand-blue-600 flex items-center justify-center text-brand-gold-400 transition-all group-hover:scale-110 group-hover:shadow-xl group-hover:bg-brand-blue-700 group-active:scale-95 shadow-md">
                        {cat.icon}
                    </div>
                    <span className="font-black text-brand-blue-900 text-[9px] md:text-[10px] uppercase tracking-widest text-center whitespace-nowrap group-hover:text-brand-blue-600 transition-colors">{cat.text}</span>
                </Link>
            ))}
        </div>
    );
}
