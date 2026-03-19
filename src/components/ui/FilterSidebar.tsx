'use client';

import { useFilterStore } from '@/store/useFilterStore';
import { X, SlidersHorizontal, ChevronRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export function FilterSidebar() {
    const { 
        isOpen, setIsOpen, 
        brands, setBrands,
        priceRange, setPriceRange,
        gender, setGender,
        isNewArrival, setNewArrival,
        isBestSeller, setBestSeller,
        resetFilters 
    } = useFilterStore();

    const [availableBrands, setAvailableBrands] = useState<string[]>([]);

    useEffect(() => {
        const fetchBrands = async () => {
            const snap = await getDocs(collection(db, 'products'));
            const b = new Set<string>();
            snap.docs.forEach(doc => {
                const brand = doc.data().brand;
                if (brand) b.add(brand);
            });
            setAvailableBrands(Array.from(b).sort());
        };
        fetchBrands();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex justify-end">
            <div 
                className="absolute inset-0 bg-brand-blue-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />
            
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-brand-blue-900 text-white">
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal size={20} className="text-brand-gold-400" />
                        <h2 className="text-lg font-black uppercase tracking-tighter">Refine Results</h2>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-10">
                    {/* Brands Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Brands</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {availableBrands.slice(0, 10).map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => {
                                        const newBrands = brands.includes(brand)
                                            ? brands.filter(b => b !== brand)
                                            : [...brands, brand];
                                        setBrands(newBrands);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all text-center
                                        ${brands.includes(brand) 
                                            ? 'border-brand-blue-900 bg-brand-blue-900 text-white shadow-lg' 
                                            : 'border-slate-100 text-slate-400 hover:border-brand-blue-600/20'}`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range Section */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Price Range (৳)</h3>
                        <div className="px-2">
                            <input 
                                type="range" 
                                min="0" 
                                max="50000" 
                                step="500"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                className="w-full accent-brand-blue-900 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex items-center justify-between mt-4">
                                <span className="bg-slate-50 px-4 py-2 rounded-lg text-xs font-black text-brand-blue-900 border border-slate-100">৳{priceRange[0]}</span>
                                <ChevronRight size={14} className="text-slate-300" />
                                <span className="bg-brand-blue-50 px-4 py-2 rounded-lg text-xs font-black text-brand-blue-900 border border-brand-blue-100">৳{priceRange[1]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Gender Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Men', 'Women', 'Unisex'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGender(gender === g ? null : g)}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all
                                        ${gender === g 
                                            ? 'border-brand-blue-950 bg-brand-blue-50 text-brand-blue-950' 
                                            : 'border-slate-100 text-slate-400 hover:border-brand-blue-600/20'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-4">
                        <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={isNewArrival}
                                onChange={(e) => setNewArrival(e.target.checked)}
                                className="w-5 h-5 accent-brand-blue-900"
                            />
                            <span className="text-xs font-black text-brand-blue-900 uppercase tracking-widest">New Arrivals</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={isBestSeller}
                                onChange={(e) => setBestSeller(e.target.checked)}
                                className="w-5 h-5 accent-brand-blue-900"
                            />
                            <span className="text-xs font-black text-brand-blue-900 uppercase tracking-widest">Best Sellers</span>
                        </label>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                    <button 
                        onClick={resetFilters}
                        className="flex-1 h-14 rounded-2xl border-2 border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white hover:border-slate-300 transition-all"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="flex-[2] h-14 rounded-2xl bg-brand-blue-900 text-brand-gold-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-blue-900/20 active:scale-95 transition-all"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
}
