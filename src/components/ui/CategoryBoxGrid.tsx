'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/config/categories';

// Metadata mapping for categories to maintain visual variety
export const CATEGORY_UI_METADATA: Record<string, { image: string, textColor: string, badgeClass: string, overlay: string }> = {
    'chocolates': {
        image: '/category-images/chocolate_bars.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    'beverages': {
        image: '/category-images/beverages.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    'beauty': {
        image: '/category-images/cosmetics.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    'tea-coffee': {
        image: '/category-images/tea_coffee.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    'snacks': {
        image: '/category-images/snacks.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    'health-wellness': {
        image: '/category-images/skincare.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    'dairy': {
        image: '/category-images/dairy.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    'home': {
        image: '/category-images/home_living.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    'baby': {
        image: '/category-images/baby_care.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    'grocery': {
        image: '/category-images/grocery.jpg', // Assuming this exists or using fallback
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    'biscuits': {
        image: '/category-images/biscuits.jpg', // Assuming this exists or using fallback
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    'gifts': {
        image: '/category-images/gifts.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    }
};

export const DEFAULT_METADATA = {
    image: '/category-images/default.jpg',
    textColor: 'text-brand-blue-900',
    badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20',
    overlay: 'bg-white/30'
};

export function CategoryBoxGrid({ onClick }: { onClick?: () => void }) {
    // Only show featured categories in the grid
    const featuredCategories = CATEGORIES.filter(cat => cat.featured);

    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-2 md:gap-4 auto-rows-[120px] md:auto-rows-[180px]">
                {featuredCategories.map((cat) => {
                    const ui = CATEGORY_UI_METADATA[cat.id] || DEFAULT_METADATA;
                    return (
                        <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            onClick={onClick}
                            className="relative rounded-xl md:rounded-3xl overflow-hidden group shadow-sm col-span-2 md:col-span-1"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <Image
                                    src={ui.image}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        // Fallback if image doesn't exist
                                        const img = e.target as HTMLImageElement;
                                        img.src = '/brand_logo.jpeg'; 
                                    }}
                                />
                            </div>

                            {/* Overlay Gradient (Dynamic) */}
                            <div className={`absolute inset-0 ${ui.overlay} transition-opacity duration-300`} />

                            {/* Content */}
                            <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end text-center items-center">
                                <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                                    <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 mb-1 md:mb-2 backdrop-blur-md rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${ui.badgeClass}`}>
                                        Shop
                                    </span>
                                    <h3 className={`text-sm md:text-xl font-black ${ui.textColor} uppercase tracking-tight leading-none`}>
                                        {cat.name}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
