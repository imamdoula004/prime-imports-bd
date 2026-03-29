'use client';

import { useState } from 'react';
import type { ProductVariant } from '@/types';

interface VariantSelectorProps {
    variants: ProductVariant[];
    basePrice: number;
    onVariantSelect?: (variant: ProductVariant | null, adjustedPrice: number) => void;
}

export default function VariantSelector({ variants, basePrice, onVariantSelect }: VariantSelectorProps) {
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

    if (!variants || variants.length === 0) return null;

    // Group variants by type
    const groupedVariants: Record<string, ProductVariant[]> = {};
    variants.forEach(v => {
        const typeKey = v.type;
        if (!groupedVariants[typeKey]) groupedVariants[typeKey] = [];
        groupedVariants[typeKey].push(v);
    });

    const handleSelect = (type: string, variant: ProductVariant) => {
        const newSelected = { ...selectedVariants };
        if (newSelected[type] === variant.id) {
            delete newSelected[type]; // Deselect
        } else {
            newSelected[type] = variant.id;
        }
        setSelectedVariants(newSelected);

        // Calculate total price adjustment
        const totalAdjustment = Object.values(newSelected).reduce((sum, selectedId) => {
            const v = variants.find(var_ => var_.id === selectedId);
            return sum + (v?.priceAdjustment || 0);
        }, 0);

        const currentlySelectedVariants = Object.values(newSelected)
            .map(id => variants.find(v => v.id === id)!)
            .filter(Boolean);

        onVariantSelect?.(
            currentlySelectedVariants as any,
            basePrice + totalAdjustment
        );
    };

    const typeLabels: Record<string, string> = {
        weight: 'Weight',
        size: 'Size',
        color: 'Color',
        pack_size: 'Pack Size',
        flavor: 'Flavor',
        other: 'Option'
    };

    return (
        <div className="space-y-4">
            {Object.entries(groupedVariants).map(([type, typeVariants]) => (
                <div key={type}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {typeLabels[type] || type.replace(/_/g, ' ')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {typeVariants.map(variant => {
                            const isSelected = selectedVariants[type] === variant.id;
                            const isOutOfStock = variant.stock !== undefined && variant.stock !== null && variant.stock <= 0;

                            return (
                                <button
                                    key={variant.id}
                                    onClick={() => !isOutOfStock && handleSelect(type, variant)}
                                    disabled={isOutOfStock}
                                    className={`
                                        relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                                        ${isSelected
                                            ? 'bg-brand-blue-900 text-white shadow-lg shadow-brand-blue-900/20 scale-105'
                                            : isOutOfStock
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-[1.02] active:scale-95 border border-gray-200'
                                        }
                                    `}
                                >
                                    <span>{variant.label}</span>
                                    {variant.priceAdjustment && variant.priceAdjustment !== 0 && (
                                        <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                            {variant.priceAdjustment > 0 ? '+' : ''}{variant.priceAdjustment}৳
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                                            Out
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
