'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Zap, ShoppingBag, ArrowRight } from 'lucide-react';
import { HeroSubProducts } from './HeroSubProducts';
import { motion } from 'framer-motion';

const BANNERS = [
    {
        id: 1,
        title: "Golden Circle Members",
        subtitle: "GET 3% OFF ALL ORDERS",
        badge: "MEMBER EXCLUSIVE",
        buttonText: "Upgrade Now",
        link: "/golden-circle",
        bgColor: "bg-brand-blue-900",
        accentColor: "text-brand-gold-400",
        image: null
    },
    {
        id: 2,
        title: "Premium Swiss Chocolates",
        subtitle: "FRESH BATCH JUST ARRIVED",
        badge: "NEW ARRIVAL",
        buttonText: "Shop Lindt",
        link: "/products?category=Chocolate Bars",
        bgColor: "bg-brand-blue-800",
        accentColor: "text-white",
        image: "https://images.unsplash.com/photo-1548907077-39e17aee6bc7?auto=format&fit=crop&w=1200&q=80"
    },
    {
        id: 3,
        title: "Trending Products",
        subtitle: "MOST POPULAR THIS WEEK",
        badge: "HOT PICKS",
        buttonText: "Browse All",
        link: "/products?sort=best_selling",
        bgColor: "bg-brand-blue-950",
        accentColor: "text-brand-gold-400",
        image: null
    }
];

import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';

export function HeroCarousel() {
    const { config } = useStorefrontConfig();
    const [current, setCurrent] = useState(0);

    // Prefer admin-configured banners, fallback to hardcoded BANNERS
    const banners = (config?.heroBanners && config.heroBanners.length > 0)
        ? config.heroBanners.map(b => ({
            ...b,
            // Map Firestore fields to local structure if needed
            bgColor: b.id === 1 ? "bg-brand-blue-900" : b.id === 2 ? "bg-brand-blue-800" : "bg-brand-blue-950",
            accentColor: b.id === 2 ? "text-white" : "text-brand-gold-400",
            image: b.imageURL || null
        }))
        : BANNERS;

    useEffect(() => {
        // Auto-swipe disabled per user request to keep content permanent
        // const timer = setInterval(() => {
        //     setCurrent((prev) => (prev + 1) % banners.length);
        // }, 5000);
        // return () => clearInterval(timer);
    }, [banners.length]);

    const next = () => setCurrent((prev) => (prev + 1) % banners.length);
    const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const minSwipeDistance = 50;
        if (distance > minSwipeDistance) {
            next();
        } else if (distance < -minSwipeDistance) {
            prev();
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
        <div
            className="relative h-[260px] md:h-[340px] w-full overflow-hidden rounded-2xl md:rounded-3xl group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.div
                className="flex h-full"
                animate={{ x: `-${current * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {banners.map((banner) => (
                    <div key={banner.id} className={`min-w-full h-full relative ${banner.bgColor} px-6 py-8 md:px-12 md:py-12 flex items-center`}>
                        {banner.image && (
                            <Image
                                src={banner.image}
                                alt={banner.title}
                                fill
                                className="object-cover opacity-100"
                                priority={banner.id === 1}
                            />
                        )}

                        {/* Background decorative glow */}
                        <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 max-w-lg">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold-400 text-brand-blue-900 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4"
                            >
                                <Star size={10} className="fill-current" /> {banner.badge}
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-2"
                            >
                                {banner.title}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`text-lg md:text-xl font-black ${banner.accentColor} mb-6 tracking-wide`}
                            >
                                {banner.subtitle}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link href={banner.link}>
                                    <button className="bg-white text-brand-blue-900 font-black px-8 py-3.5 rounded-xl text-sm hover:scale-[1.05] hover:shadow-2xl transition-all shadow-lg active:scale-95 group/btn">
                                        <span className="flex items-center gap-2">
                                            {banner.buttonText}
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Gold Circle graphic for slide 1 - Removed per user request */}
                        {/* banner.id === 1 && (
                            <div className="absolute right-10 md:right-20 bottom-10 md:bottom-16 hidden sm:block">
                                <div className="w-20 h-20 md:w-32 md:h-32 border-[8px] border-brand-gold-400 opacity-20 rounded-full" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-12 md:h-12 bg-brand-gold-400 rounded-lg shadow-xl" />
                            </div>
                        ) */}

                        {/* Grid of Product cards for slide 3 */}
                        {banner.id === 3 && (
                            <HeroSubProducts />
                        )}
                    </div>
                ))}
            </motion.div>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-50">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrent(i);
                        }}
                        className={`h-2.5 rounded-full transition-all duration-300 ${current === i ? 'w-10 bg-[#f2b90d] shadow-[0_0_15px_rgba(242,185,13,0.5)]' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

