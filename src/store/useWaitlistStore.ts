'use client';

import { create } from 'zustand';
import { Product } from '@/types';

interface WaitlistStore {
    isOpen: boolean;
    selectedProduct: Product | null;
    openModal: (product: Product) => void;
    closeModal: () => void;
}

export const useWaitlistStore = create<WaitlistStore>((set) => ({
    isOpen: false,
    selectedProduct: null,
    openModal: (product) => set({ isOpen: true, selectedProduct: product }),
    closeModal: () => set({ isOpen: false, selectedProduct: null }),
}));
