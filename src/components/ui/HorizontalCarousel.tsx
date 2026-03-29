'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalCarouselProps {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    showArrows?: boolean;
    arrowPosition?: 'inside' | 'outside';
}

export function HorizontalCarousel({
    children,
    className,
    containerClassName,
    showArrows = true,
    arrowPosition = 'outside'
}: HorizontalCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            handleScroll();
            // Also check on resize
            window.addEventListener('resize', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [children]);

    return (
        <div className={cn("relative group/carousel-wrapper w-full", className)}>
            {showArrows && (
                <div className="hidden lg:block transition-opacity duration-300">
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90",
                                arrowPosition === 'outside' ? "-left-5" : "left-4"
                            )}
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-brand-blue-900 hover:bg-brand-blue-600 hover:text-white transition-all active:scale-90",
                                arrowPosition === 'outside' ? "-right-5" : "right-4"
                            )}
                        >
                            <ChevronRight size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            )}

            <div
                ref={scrollContainerRef}
                className={cn(
                    "flex flex-nowrap overflow-x-auto no-scrollbar scroll-smooth",
                    containerClassName
                )}
            >
                {children}
            </div>
        </div>
    );
}
