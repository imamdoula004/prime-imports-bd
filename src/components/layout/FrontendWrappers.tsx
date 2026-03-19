'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../ui/CartDrawer';
import { WaitlistModal } from '../ui/WaitlistModal';
import { BottomNav } from './BottomNav';
import { LiveChat } from '../ui/LiveChat';
import { FilterSidebar } from '../ui/FilterSidebar';
import { ProductAddToCart } from '../ui/ProductAddToCart';
import { useWaitlistStore } from '@/store/useWaitlistStore';
import { useEffect, useState } from 'react';

export function ConditionalNavbar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin')) return null;
    return <Navbar />;
}

export function ConditionalFooter() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/golden-circle/dashboard')) return null;
    return <Footer />;
}

export function ConditionalCart() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin')) return null;
    return <CartDrawer />;
}

export function ConditionalWaitlist() {
    const pathname = usePathname();
    const { isOpen, selectedProduct, closeModal } = useWaitlistStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin')) return null;

    return <WaitlistModal isOpen={isOpen} product={selectedProduct} onClose={closeModal} />;
}

export function ConditionalBottomNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/golden-circle/dashboard')) return null;
    return <BottomNav />;
}

export function ConditionalLiveChat() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin')) return null;
    return <LiveChat />;
}

export function ConditionalFilterSidebar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (pathname?.startsWith('/admin')) return null;
    return <FilterSidebar />;
}
