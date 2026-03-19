'use client';

import { create } from 'zustand';

interface FilterState {
    isOpen: boolean;
    brands: string[];
    genders: string[];
    subcategories: string[];
    productTypes: string[];
    ram: string[];
    storage: string[];
    colors: string[];
    priceRange: [number, number];
    sortBy: string;
    searchQuery: string;
    isNewArrival: boolean;
    isBestSeller: boolean;
    requestCardVisible: boolean;
    brandSearch: string;
    
    // Actions
    setIsOpen: (open: boolean) => void;
    setBrands: (brands: string[]) => void;
    setGenders: (genders: string[]) => void;
    setSubcategories: (subs: string[]) => void;
    setProductTypes: (types: string[]) => void;
    setRam: (ram: string[]) => void;
    setStorage: (storage: string[]) => void;
    setColors: (colors: string[]) => void;
    setPriceRange: (range: [number, number]) => void;
    setSortBy: (sort: string) => void;
    setSearchQuery: (query: string) => void;
    setNewArrival: (isNew: boolean) => void;
    setBestSeller: (isBest: boolean) => void;
    setRequestCardVisible: (visible: boolean) => void;
    setBrandSearch: (query: string) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    isOpen: false,
    brands: [],
    genders: [],
    subcategories: [],
    productTypes: [],
    ram: [],
    storage: [],
    colors: [],
    priceRange: [0, 50000],
    sortBy: 'newest',
    searchQuery: '',
    isNewArrival: false,
    isBestSeller: false,
    requestCardVisible: false,
    brandSearch: '',

    setIsOpen: (open) => set({ isOpen: open }),
    setBrands: (brands) => set({ brands }),
    setGenders: (genders) => set({ genders }),
    setSubcategories: (subcategories) => set({ subcategories }),
    setProductTypes: (productTypes) => set({ productTypes }),
    setRam: (ram) => set({ ram }),
    setStorage: (storage) => set({ storage }),
    setColors: (colors) => set({ colors }),
    setPriceRange: (priceRange) => set({ priceRange }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setNewArrival: (isNewArrival) => set({ isNewArrival }),
    setBestSeller: (isBestSeller) => set({ isBestSeller }),
    setRequestCardVisible: (requestCardVisible) => set({ requestCardVisible }),
    setBrandSearch: (brandSearch) => set({ brandSearch }),
    resetFilters: () => set({
        brands: [],
        genders: [],
        subcategories: [],
        productTypes: [],
        ram: [],
        storage: [],
        colors: [],
        priceRange: [0, 50000],
        sortBy: 'newest',
        searchQuery: '',
        isNewArrival: false,
        isBestSeller: false,
        requestCardVisible: false,
        brandSearch: ''
    })
}));
