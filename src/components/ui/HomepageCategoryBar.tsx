'use client';

import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import Link from 'next/link';
import {
    Wine, Coffee, Sparkles, Cookie, Sparkle, ShoppingBag, Utensils,
    Refrigerator, Baby, Box, Gift, HeartPulse, ShieldCheck
} from 'lucide-react';
import { CATEGORIES } from '@/config/categories';

// Mapping icons to our canonical category IDs
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'beverages': <Wine size={22} />,
    'tea-coffee': <Coffee size={22} />,
    'chocolates': <Sparkles size={22} />,
    'biscuits': <Cookie size={22} />,
    'snacks': <Sparkle size={22} />,
    'beauty': <HeartPulse size={22} />,
    'grocery': <Utensils size={22} />,
    'dairy': <Refrigerator size={22} />,
    'baby': <Baby size={22} />,
    'home': <Box size={22} />,
    'gifts': <Gift size={22} />,
    'health-wellness': <ShieldCheck size={22} />
};

const DEFAULT_VISIBLE_IDS = [
    'beverages', 'tea-coffee', 'chocolates',
    'biscuits', 'snacks', 'beauty', 'grocery'
];

export function HomepageCategoryBar() {
    const { config } = useStorefrontConfig();

    // Mapping Firestore names to IDs if needed, or just using our ID list
    // For now, we prefer to drive this by our canonical IDs
    const visibleIds = (config?.homepageCategoryBar && config.homepageCategoryBar.length > 0)
        ? config.homepageCategoryBar.map(name => 
            CATEGORIES.find(c => c.name === name || c.id === name)?.id
          ).filter(id => !!id) as string[]
        : DEFAULT_VISIBLE_IDS;

    const displayCategories = CATEGORIES.filter(cat => visibleIds.includes(cat.id));

    return (
        <div className="flex overflow-x-auto pt-4 pb-4 px-2 gap-4 md:gap-6 premium-scrollbar scroll-smooth -mt-4">
            {displayCategories.map((cat) => (
                <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex flex-col items-center gap-3 group min-w-[100px] md:min-w-[120px]"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-brand-blue-600 flex items-center justify-center text-brand-gold-400 transition-all group-hover:scale-110 group-hover:shadow-xl group-hover:bg-brand-blue-700 group-active:scale-95 shadow-md">
                        {CATEGORY_ICONS[cat.id] || <ShoppingBag size={22} />}
                    </div>
                    <span className="font-black text-brand-blue-900 text-[9px] md:text-[10px] uppercase tracking-widest text-center whitespace-nowrap group-hover:text-brand-blue-600 transition-colors">
                        {cat.name.split(' ')[0]}
                    </span>
                </Link>
            ))}
        </div>
    );
}
