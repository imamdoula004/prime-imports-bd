'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
    title: string;
    slug: string;
    discountPercentage: number;
    images?: {
        catalog?: string;
        zoom?: string;
        lifestyle?: string;
    };
    fallbackImage?: string;
}

export function ProductGallery({
    title,
    slug,
    discountPercentage,
    images,
    fallbackImage
}: ProductGalleryProps) {
    const galleryItems = [];
    
    if (fallbackImage) {
        galleryItems.push({ id: 'main', src: fallbackImage });
    } else if (images?.catalog) {
        galleryItems.push({ id: 'catalog', src: images.catalog });
    }

    if (images?.zoom) galleryItems.push({ id: 'zoom', src: images.zoom });
    if (images?.lifestyle) galleryItems.push({ id: 'lifestyle', src: images.lifestyle });

    // Placeholder if no images exist
    if (galleryItems.length === 0) {
        galleryItems.push({
            id: 'placeholder',
            src: `https://picsum.photos/seed/${slug}/800/800`
        });
    }

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToImage = (index: number) => {
        if (!scrollContainerRef.current) return;
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
            left: width * index,
            behavior: 'smooth'
        });
        setActiveIndex(index);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, clientWidth } = scrollContainerRef.current;
        const index = Math.round(scrollLeft / clientWidth);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 pb-4 px-1">
            {/* Main Image Container */}
            <div className="relative aspect-square w-full bg-white rounded-none overflow-hidden border border-slate-100 shadow-sm group/gallery">
                {/* Scrollable Gallery for Mobile/Touch */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x"
                >
                    {galleryItems.map((item, idx) => (
                        <div key={item.id} className="min-w-full h-full snap-start relative flex items-center justify-center p-4">
                            <div className="relative w-full h-full">
                                <Image
                                    src={item.src}
                                    alt={`${title} - View ${idx + 1}`}
                                    fill
                                    className="object-contain"
                                    priority={idx === 0}
                                    sizes="(max-width: 768px) 100vw, 40vw"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                    {discountPercentage > 0 && (
                        <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20">
                            {discountPercentage}% OFF
                        </div>
                    )}
                </div>

                {/* Business Logo Watermark - Solid and Accurate */}
                <div className="absolute bottom-4 right-4 w-12 h-12 z-20 drop-shadow-lg opacity-90">
                    <Image src="/brand_logo_new.png" alt="Prime Logo" fill className="object-contain" />
                </div>

                {/* Desktop Arrows */}
                {galleryItems.length > 1 && (
                    <div className="hidden md:flex absolute inset-0 pointer-events-none items-center justify-between px-4 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                        <button
                            onClick={() => scrollToImage(activeIndex === 0 ? galleryItems.length - 1 : activeIndex - 1)}
                            className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-full border border-slate-100 flex items-center justify-center text-brand-blue-900 shadow-lg hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => scrollToImage((activeIndex + 1) % galleryItems.length)}
                            className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-full border border-slate-100 flex items-center justify-center text-brand-blue-900 shadow-lg hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90"
                        >
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>

            {/* Compact Thumbnails Selector - Cap sizing to fix enlargement */}
            {galleryItems.length > 1 && (
                <div className="flex flex-wrap items-center gap-3">
                    {galleryItems.map((item, idx) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToImage(idx)}
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-none bg-white border-2 transition-all p-1.5 overflow-hidden flex-none ${activeIndex === idx ? 'border-brand-blue-600 shadow-md ring-2 ring-brand-blue-50/50' : 'border-slate-100 hover:border-slate-300 opacity-60 hover:opacity-100'}`}
                        >
                            <div className="relative w-full h-full">
                                <Image
                                    src={item.src}
                                    alt={`Thumbnail ${idx + 1}`}
                                    fill
                                    className="object-contain"
                                    sizes="80px"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
