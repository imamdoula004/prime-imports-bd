'use client';

import { useState } from 'react';

export function DescriptionSection({ description }: { description?: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = description || "Premium international import. Curated for the finest taste and quality metrics. Directly sourced and verified.";

    // Check if description is long enough to warrant a toggle
    const shouldShowToggle = content.length > 300;

    return (
        <div>
            <h3 className="text-xs md:text-sm font-black text-brand-blue-600 uppercase tracking-[0.2em] mb-1.5 opacity-60">Product Description</h3>
            <div className={`text-xs md:text-sm text-brand-blue-900/60 leading-normal font-medium transition-all duration-500 ${!isExpanded && shouldShowToggle ? 'line-clamp-4' : ''}`}>
                {content}
            </div>
            {shouldShowToggle && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-3 text-[10px] font-black text-brand-blue-600 uppercase tracking-widest hover:text-brand-blue-900 transition-colors flex items-center gap-2 border-b border-brand-blue-600 pb-0.5"
                >
                    {isExpanded ? 'See Less' : 'Read Full Description'}
                </button>
            )}
        </div>
    );
}
