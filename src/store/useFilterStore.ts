'use client';

import { create } from 'zustand';

interface FilterState {
    isOpen: boolean;
    brands: string[];
    priceRange: [number, number];
    gender: string | null;
    isNewArrival: boolean;
    isBestSeller: boolean;
    requestCardVisible: boolean;
    
    // Actions
    setIsOpen: (open: boolean) => void;
    setBrands: (brands: string[]) => void;
    setPriceRange: (range: [number, number]) => void;
    setGender: (gender: string | null) => void;
    setNewArrival: (isNew: boolean) => void;
    setBestSeller: (isBest: boolean) => void;
    setRequestCardVisible: (visible: boolean) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    isOpen: false,
    brands: [],
    priceRange: [0, 50000],
    gender: null,
    isNewArrival: false,
    isBestSeller: false,
    requestCardVisible: false,

    setIsOpen: (open) => set({ isOpen: open }),
    setBrands: (brands) => set({ brands }),
    setPriceRange: (priceRange) => set({ priceRange }),
    setGender: (gender) => set({ gender }),
    setNewArrival: (isNewArrival) => set({ isNewArrival }),
    setBestSeller: (isBestSeller) => set({ isBestSeller }),
    setRequestCardVisible: (requestCardVisible) => set({ requestCardVisible }),
    resetFilters: () => set({
        brands: [],
        priceRange: [0, 50000],
        gender: null,
        isNewArrival: false,
        isBestSeller: false,
        requestCardVisible: false
    })
}));
