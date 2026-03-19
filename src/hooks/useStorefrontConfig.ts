'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface HeroBanner {
    id: number;
    title: string;
    subtitle: string;
    badge: string;
    buttonText: string;
    link: string;
    imageURL?: string;
}

interface OfferBannerConfig {
    title: string;
    description: string;
    buttonText: string;
    link: string;
}

export interface StorefrontConfig {
    visibleCategories: string[];
    featuredProductIds: string[];
    heroSlide3ProductIds?: string[];
    homepageCategoryBar?: string[];
    heroBanners?: HeroBanner[];
    offerBanner?: OfferBannerConfig;
    updatedAt?: string;
}

export function useStorefrontConfig() {
    const [config, setConfig] = useState<StorefrontConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, 'storefront_config', 'main');

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as StorefrontConfig);
            } else {
                setConfig({
                    visibleCategories: [],
                    featuredProductIds: []
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching storefront config:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { config, loading };
}
