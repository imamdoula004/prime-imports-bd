import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CartItem extends Product {
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    suggestedBundles: { bundle: any, products: Product[] }[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: (open?: boolean) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    addBundle: (bundle: any, products: Product[]) => void;
    setSuggestedBundles: (bundles: { bundle: any, products: Product[] }[]) => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            suggestedBundles: [],
            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existingItem = items.find((item) => item.id === product.id);

                if (existingItem) {
                    const newQuantity = existingItem.quantity + quantity;
                    if (newQuantity > (product.stock || 0)) {
                        return;
                    }
                    set({
                        items: items.map((item) =>
                            item.id === product.id
                                ? {
                                    ...item,
                                    quantity: newQuantity,
                                    price: Number(product.price || 0),
                                }
                                : item
                        )
                    });
                } else {
                    if (quantity > (product.stock || 0)) {
                        return;
                    }
                    set({
                        items: [...items, {
                            ...product,
                            quantity,
                            price: Number(product.price || 0),
                        }]
                    });
                }
            },
            setSuggestedBundles: (bundles) => set({ suggestedBundles: bundles }),
            removeItem: (productId) => {
                set({
                    items: get().items.filter((item) => item.id !== productId)
                });
            },
            updateQuantity: (productId, quantity) => {
                const items = get().items;
                const item = items.find(i => i.id === productId);
                if (!item) return;

                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                // Prevent exceeding stock
                if (quantity > (item.stock || 0)) return;

                set({
                    items: items.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    )
                });
            },
            addBundle: (bundle, products) => {
                const items = get().items;
                const bundleId = `bundle-${bundle.id}`;
                const existingItem = items.find((item) => item.id === bundleId);

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.id === bundleId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    });
                } else {
                    // Create a virtual product representing the bundle
                    const bundleItem: CartItem = {
                        id: bundleId,
                        productID: bundleId,
                        name: bundle.name,
                        title: bundle.name,
                        price: bundle.bundlePrice,
                        bundlePrice: bundle.bundlePrice,
                        marketPrice: bundle.marketPrice,
                        imageURL: products[0]?.imageURL || '',
                        category: 'Bundle',
                        stock: Math.min(...products.map(p => p.stock)),
                        isActive: true,
                        isBundle: true,
                        bundleProducts: products.map(p => p.id!),
                        bundleProductImages: products.map(p => p.imageURL || p.image || ''),
                        slug: `bundle-${bundle.id}`,
                        quantity: 1,
                        status: 'active',
                        description: `Bundle combo featuring ${products.map(p => p.name).join(', ')}`,
                        tags: ['bundle', 'combo'],
                        searchKeywords: ['bundle', 'combo', bundle.name.toLowerCase()],
                        totalSales: 0,
                        weeklySales: 0,
                        monthlySales: 0,
                        isDeleted: false,
                        deletedAt: null
                    };
                    set({ items: [...items, bundleItem] });
                }
            },
            clearCart: () => set({ items: [] }),
            toggleCart: (open) => set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen })),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((total, item) => {
                const price = (item.isBundle && item.bundlePrice) ? item.bundlePrice : item.price;
                return total + (Number(price) * item.quantity);
            }, 0),
        }),
        {
            name: 'prime-imports-cart',
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);
