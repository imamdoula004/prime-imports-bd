'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import { Sparkles } from 'lucide-react';

const CATEGORY_IMAGES = [
    {
        name: 'Chocolate Bars', image: '/category-images/chocolate_bars.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Beverages', image: '/category-images/beverages.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    {
        name: 'Cosmetics', image: '/category-images/cosmetics.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    {
        name: 'Tea & Coffee', image: '/category-images/tea_coffee.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Snacks', image: '/category-images/snacks.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Skincare', image: '/category-images/skincare.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    {
        name: 'Haircare', image: '/category-images/haircare.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Perfumes', image: '/category-images/perfumes.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Gift Sets', image: '/category-images/gift_sets.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/50'
    },
    {
        name: 'Body Lotions', image: '/category-images/body_lotions.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    {
        name: 'Home & Living', image: '/category-images/home_living.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    {
        name: 'Kitchen', image: '/category-images/kitchen.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Supplements', image: '/category-images/supplements.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/50'
    },
    {
        name: 'Baby Care', image: '/category-images/baby_care.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    {
        name: 'Pet Supplies', image: '/category-images/pet_supplies.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/30'
    },
    {
        name: 'Stationery', image: '/category-images/stationery.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/40'
    },
    {
        name: 'Electronics', image: '/category-images/electronics.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/50'
    },
    {
        name: 'Dairy', image: '/category-images/dairy.jpg',
        textColor: 'text-brand-blue-900', badgeClass: 'bg-brand-blue-900/10 text-brand-blue-900 border-brand-blue-900/20', overlay: 'bg-white/30'
    },
    {
        name: 'Condiments', image: '/category-images/condiments.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    },
    {
        name: 'Spices', image: '/category-images/spices.jpg',
        textColor: 'text-white', badgeClass: 'bg-white/20 text-white border-white/20', overlay: 'bg-brand-blue-950/40'
    }
];

export function CategoryBoxGrid({ onClick }: { onClick?: () => void }) {
    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-2 md:gap-4 auto-rows-[120px] md:auto-rows-[180px]">
                {CATEGORY_IMAGES.map((cat, idx) => (
                    <Link
                        key={idx}
                        href={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={onClick}
                        className="relative rounded-xl md:rounded-3xl overflow-hidden group shadow-sm col-span-2 md:col-span-1"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src={cat.image}
                                alt={cat.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>

                        {/* Overlay Gradient (Dynamic) */}
                        <div className={`absolute inset-0 ${cat.overlay} transition-opacity duration-300`} />

                        {/* Content */}
                        <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-end text-center items-center">
                            <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                                <span className={`inline-block px-2 py-0.5 md:px-3 md:py-1 mb-1 md:mb-2 backdrop-blur-md rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${cat.badgeClass}`}>
                                    Shop
                                </span>
                                <h3 className={`text-sm md:text-xl font-black ${cat.textColor} uppercase tracking-tight leading-none`}>
                                    {cat.name}
                                </h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
