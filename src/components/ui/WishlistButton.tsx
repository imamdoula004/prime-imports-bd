'use client';

import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';

interface WishlistButtonProps {
    productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
    const isWishlisted = isInWishlist(productId);

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all border shadow-sm ${isWishlisted
                    ? 'bg-red-50 text-red-500 border-red-100'
                    : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 hover:border-slate-200'
                }`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={isWishlisted ? 3 : 2} />
        </button>
    );
}
