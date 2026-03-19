'use client';

import { useFilterStore } from '@/store/useFilterStore';
import { 
    X, SlidersHorizontal, ChevronDown, 
    RotateCcw, Check, ShoppingBag, 
    Filter, Zap, Trophy, Percent, Search
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelProps {
    isVisible?: boolean;
    onClose?: () => void;
}

const FilterSection = ({ 
    id, label, children, count, isOpen, onToggle 
}: { id: string, label: string, children: React.ReactNode, count?: number, isOpen: boolean, onToggle: (id: string) => void }) => (
    <div className="border-b border-slate-100 py-6 last:border-0">
        <button 
            onClick={() => onToggle(id)}
            className="w-full flex items-center justify-between group"
        >
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#111] leading-none">
                    {label}
                </span>
                {count !== undefined && count > 0 && (
                    <span className="bg-brand-blue-900 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {count}
                    </span>
                )}
            </div>
            <ChevronDown 
                size={16} 
                className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                >
                    <div className="pt-5 space-y-3">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const Checkbox = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        type="button"
        className="flex items-center gap-3 w-full group py-0.5 text-left"
    >
        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0
            ${selected ? 'bg-black border-black' : 'bg-white border-slate-200 group-hover:border-slate-400'}`}>
            {selected && <Check size={12} className="text-white" strokeWidth={4} />}
        </div>
        <span className={`text-[13px] font-bold transition-colors
            ${selected ? 'text-black' : 'text-slate-500 group-hover:text-slate-900'}`}>
            {label}
        </span>
    </button>
);

export function NikeFilterPanel({ isVisible = true, onClose }: FilterPanelProps) {
    const { 
        brands: selectedBrands, setBrands,
        genders: selectedGenders, setGenders,
        subcategories: selectedSubs, setSubcategories,
        productTypes: selectedTypes, setProductTypes,
        ram: selectedRam, setRam,
        storage: selectedStorage, setStorage,
        colors: selectedColors, setColors,
        priceRange, setPriceRange,
        isNewArrival, setNewArrival,
        isBestSeller, setBestSeller,
        sortBy, setSortBy,
        brandSearch, setBrandSearch,
        resetFilters 
    } = useFilterStore();

    const [availableOptions, setAvailableOptions] = useState({
        brands: [] as string[],
        subcategories: [] as string[],
        productTypes: [] as string[],
        ram: [] as string[],
        storage: [] as string[],
        colors: [] as string[],
    });

    const [expandedSections, setExpandedSections] = useState<string[]>([
        'brands', 'gender', 'sort'
    ]);

    // Fetch dynamic options from the first 500 products
    useEffect(() => {
        const fetchOptions = async () => {
            const q = query(collection(db, 'products'), limit(1000));
            const snap = await getDocs(q);
            const b = new Set<string>();
            const s = new Set<string>();
            const t = new Set<string>();
            const r = new Set<string>();
            const st = new Set<string>();
            const c = new Set<string>();

            snap.docs.forEach(doc => {
                const p = doc.data();
                if (p.brand) b.add(p.brand);
                if (p.subcategory) s.add(p.subcategory);
                if (p.productType) t.add(p.productType);
                if (p.ram) r.add(p.ram);
                if (p.storage) st.add(p.storage);
                if (p.colors && Array.isArray(p.colors)) p.colors.forEach((col: string) => c.add(col));
                // Fallback to tags for specifications if needed
                if (p.tags) {
                    p.tags.forEach((tag: string) => {
                        const low = tag.toLowerCase();
                        if (low.includes('gb')) {
                           if (['4', '6', '8', '12', '16'].some(v => low.startsWith(v))) r.add(tag);
                           else st.add(tag);
                        }
                    });
                }
            });

            setAvailableOptions({
                brands: Array.from(b).sort(),
                subcategories: Array.from(s).sort(),
                productTypes: Array.from(t).sort(),
                ram: Array.from(r).sort((a,b) => parseInt(a) - parseInt(b)),
                storage: Array.from(st).sort((a,b) => parseInt(a) - parseInt(b)),
                colors: Array.from(c).sort(),
            });
        };
        fetchOptions();
    }, []);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleFilter = (list: string[], setFn: (val: string[]) => void, value: string) => {
        if (list.includes(value)) {
            setFn(list.filter(v => v !== value));
        } else {
            setFn([...list, value]);
        }
    };

    const filteredBrands = useMemo(() => {
        return availableOptions.brands.filter(b => 
            b.toLowerCase().includes(brandSearch.toLowerCase())
        );
    }, [availableOptions.brands, brandSearch]);

    return (
        <div className={`${isVisible ? 'block' : 'hidden'} w-full md:w-64 shrink-0`}>
            <style jsx global>{`
                .filter-scroll::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
                .filter-scroll::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .filter-scroll::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .filter-scroll::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
            {/* Header / Mobile Toggle (Top part of sidebar) */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-4 pt-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-brand-blue-900" />
                        <h2 className="text-lg font-black uppercase tracking-tighter text-brand-blue-900">Filters</h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="md:hidden p-2 text-slate-400">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Quick Filters / Clear */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button 
                        onClick={resetFilters}
                        className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[10px] font-black text-brand-blue-900 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                        <RotateCcw size={10} /> Reset
                    </button>
                    {(selectedBrands.length > 0 || selectedGenders.length > 0) && (
                         <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" />
                    )}
                </div>
            </div>

            {/* Scrollable Filters */}
            <div className="space-y-0">
                {/* Sort Section */}
                <FilterSection id="sort" label="Sort By" isOpen={expandedSections.includes('sort')} onToggle={toggleSection}>
                    {[
                        { id: 'newest', label: 'Newest Arrivals', icon: <Zap size={14} /> },
                        { id: 'best_selling', label: 'Best Selling', icon: <Trophy size={14} /> },
                        { id: 'discounted', label: 'Featured Discounts', icon: <Percent size={14} /> },
                        { id: 'price_asc', label: 'Price: Low to High' },
                        { id: 'price_desc', label: 'Price: High to Low' },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setSortBy(opt.id)}
                            className={`flex items-center justify-between w-full text-xs font-bold py-1.5 transition-colors
                                ${sortBy === opt.id ? 'text-brand-blue-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <span className="flex items-center gap-2">
                                {opt.icon}
                                {opt.label}
                            </span>
                            {sortBy === opt.id && <Check size={14} className="text-brand-blue-900" />}
                        </button>
                    ))}
                </FilterSection>

                {/* Status Toggles */}
                <div className="py-6 border-b border-slate-100 space-y-3">
                    <Checkbox 
                        label="New Arrivals" 
                        selected={isNewArrival} 
                        onClick={() => setNewArrival(!isNewArrival)} 
                    />
                    <Checkbox 
                        label="Best Sellers" 
                        selected={isBestSeller} 
                        onClick={() => setBestSeller(!isBestSeller)} 
                    />
                </div>

                {/* Brand Filter */}
                {availableOptions.brands.length > 0 && (
                    <FilterSection id="brands" label="Brand" count={selectedBrands.length} isOpen={expandedSections.includes('brands')} onToggle={toggleSection}>
                        <div className="mb-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Search brands..."
                                    value={brandSearch}
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold focus:outline-none focus:border-black transition-all"
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto filter-scroll pr-1 space-y-3">
                            {filteredBrands.map(brand => (
                                <Checkbox 
                                    key={brand} 
                                    label={brand} 
                                    selected={selectedBrands.includes(brand)} 
                                    onClick={() => toggleFilter(selectedBrands, setBrands, brand)} 
                                />
                            ))}
                            {filteredBrands.length === 0 && (
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">No brands found</p>
                            )}
                        </div>
                    </FilterSection>
                )}

                {/* Gender Filter */}
                <FilterSection id="gender" label="Gender" count={selectedGenders.length} isOpen={expandedSections.includes('gender')} onToggle={toggleSection}>
                    {['Men', 'Women', 'Unisex'].map(g => (
                        <Checkbox 
                            key={g} 
                            label={g} 
                            selected={selectedGenders.includes(g)} 
                            onClick={() => toggleFilter(selectedGenders, setGenders, g)} 
                        />
                    ))}
                </FilterSection>

                {/* Category Type Filter */}
                {availableOptions.subcategories.length > 0 && (
                    <FilterSection id="subs" label="Type / Subcategory" count={selectedSubs.length} isOpen={expandedSections.includes('subs')} onToggle={toggleSection}>
                        {availableOptions.subcategories.map(s => (
                            <Checkbox 
                                key={s} 
                                label={s} 
                                selected={selectedSubs.includes(s)} 
                                onClick={() => toggleFilter(selectedSubs, setSubcategories, s)} 
                            />
                        ))}
                    </FilterSection>
                )}

                {/* Price Range */}
                <FilterSection id="price" label="Price Range" isOpen={expandedSections.includes('price')} onToggle={toggleSection}>
                   <div className="px-1 space-y-4 pb-2">
                        <input 
                            type="range"
                            min="0"
                            max="50000"
                            step="500"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            className="w-full accent-black h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Min</span>
                                <span className="text-xs font-black text-brand-blue-900">৳{priceRange[0]}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Max</span>
                                <span className="text-xs font-black text-brand-blue-900">৳{priceRange[1]}</span>
                            </div>
                        </div>
                   </div>
                </FilterSection>

                {/* RAM/Storage (Nike Style Specifications) */}
                {availableOptions.ram.length > 0 && (
                    <FilterSection id="ram" label="RAM" count={selectedRam.length} isOpen={expandedSections.includes('ram')} onToggle={toggleSection}>
                        <div className="grid grid-cols-2 gap-2">
                            {availableOptions.ram.map(r => (
                                <button
                                    key={r}
                                    onClick={() => toggleFilter(selectedRam, setRam, r)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black border-2 transition-all 
                                        ${selectedRam.includes(r) 
                                            ? 'bg-brand-blue-900 border-brand-blue-900 text-white' 
                                            : 'bg-slate-50 border-slate-50 text-slate-500 hover:border-slate-200'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </FilterSection>
                )}

                {/* Colors */}
                {availableOptions.colors.length > 0 && (
                    <FilterSection id="colors" label="Colors" count={selectedColors.length} isOpen={expandedSections.includes('colors')} onToggle={toggleSection}>
                        <div className="flex flex-wrap gap-2.5">
                            {availableOptions.colors.map(col => (
                                <button
                                    key={col}
                                    onClick={() => toggleFilter(selectedColors, setColors, col)}
                                    className={`w-8 h-8 rounded-full border-2 p-0.5 transition-all
                                        ${selectedColors.includes(col) ? 'border-brand-blue-900 shadow-md scale-110' : 'border-transparent'}`}
                                    title={col}
                                >
                                    <div 
                                        className="w-full h-full rounded-full border border-black/10 shadow-inner"
                                        style={{ backgroundColor: col.toLowerCase() }}
                                    />
                                </button>
                            ))}
                        </div>
                    </FilterSection>
                )}
            </div>
            
            <div className="h-20" /> {/* Spacer */}
        </div>
    );
}
