'use client';

import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LiveChat() {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // v6.8: Precision Stack Sync
    // We use tight, calculated offsets to sit exactly 26px-36px above the topmost UI element.
    const isProductPage = pathname?.startsWith('/products/');
    
    // Dynamic height calculation
    const getBottomOffset = () => {
        if (!isMobile) return '100px'; // Refined desktop height
        if (isProductPage) return '180px'; // Tight clearance for product mobile footer
        return '90px'; // Tight clearance for mobile navbar
    };

    return (
        <div 
            className="fixed right-6 md:right-8 group"
            style={{ 
                bottom: `calc(${getBottomOffset()} + env(safe-area-inset-bottom, 0px))`,
                zIndex: 999999,
                transition: 'bottom 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)'
            }}
        >
            <button 
                className="w-14 h-14 md:w-16 md:h-16 bg-brand-blue-900 text-brand-gold-400 rounded-full shadow-[0_10px_40px_rgba(0,18,51,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative overflow-visible border-2 border-white/20"
                onClick={() => console.log('LiveChat requested')}
            >
                {/* Visual pulse effect - Enlarged for visibility */}
                <div className="absolute inset-0 rounded-full bg-brand-gold-500/20 animate-ping opacity-40 scale-125" />
                
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                
                <MessageCircle size={28} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform relative z-10" />
            </button>
        </div>
    );
}
