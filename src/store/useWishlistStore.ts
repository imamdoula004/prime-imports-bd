import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface WishlistStore {
    wishlist: string[]; // List of product IDs
    addToWishlist: (productId: string) => void;
    removeFromWishlist: (productId: string) => void;
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            wishlist: [],
            addToWishlist: (productId: string) => {
                if (!get().wishlist.includes(productId)) {
                    set((state) => ({ wishlist: [...state.wishlist, productId] }));
                }
            },
            removeFromWishlist: (productId: string) => {
                set((state) => ({ wishlist: state.wishlist.filter((id) => id !== productId) }));
            },
            toggleWishlist: (product: Product) => {
                const id = product.id || String(product.slug);
                if (get().wishlist.includes(id)) {
                    get().removeFromWishlist(id);
                } else {
                    get().addToWishlist(id);
                }
            },
            isInWishlist: (productId: string) => get().wishlist.includes(productId),
        }),
        {
            name: 'prime-imports-wishlist',
        }
    )
);
