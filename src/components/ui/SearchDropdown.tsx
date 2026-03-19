'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { RequestProductCard } from './RequestProductCard';

interface SearchDropdownProps {
    query: string;
    onClose: () => void;
    isAdmin?: boolean;
}

export function SearchDropdown({ query: searchTerm, onClose, isAdmin = false }: SearchDropdownProps) {
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const productsRef = collection(db, 'products');
                const term = searchTerm.toLowerCase().trim();
                const words = term.split(/\s+/).filter(w => w.length > 0);
                const firstWord = words[0];

                let allProducts: Product[] = [];

                // Strategy 1: searchKeywords array-contains (if the field exists)
                try {
                    const q1 = query(
                        productsRef,
                        where('searchKeywords', 'array-contains', firstWord),
                        limit(30)
                    );
                    const snap1 = await getDocs(q1);
                    snap1.docs.forEach(doc => {
                        const data = doc.data();
                        allProducts.push({
                            ...data,
                            id: doc.id,
                            price: Number(data.price || 0),
                            originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.marketPrice ? Number(data.marketPrice) : (data.oldPrice ? Number(data.oldPrice) : null)),
                        } as Product);
                    });
                } catch (e) {
                    // searchKeywords field might not exist, continue to fallback
                }

                // Strategy 2: Slug-based search (slug contains the product name as kebab-case)
                if (allProducts.length < 5) {
                    try {
                        const slugTerm = firstWord.toLowerCase();
                        const q2 = query(
                            productsRef,
                            where('slug', '>=', slugTerm),
                            where('slug', '<=', slugTerm + '\uf8ff'),
                            limit(30)
                        );
                        const snap2 = await getDocs(q2);
                        snap2.docs.forEach(doc => {
                            if (!allProducts.find(p => p.id === doc.id)) {
                                const data = doc.data();
                                allProducts.push({
                                    ...data,
                                    id: doc.id,
                                    price: Number(data.price || 0),
                                    originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.marketPrice ? Number(data.marketPrice) : (data.oldPrice ? Number(data.oldPrice) : null)),
                                } as Product);
                            }
                        });
                    } catch (e) {
                        // slug field might not be indexed, continue
                    }
                }

                // Strategy 3: Broad fetch and client-side filter (fallback if above strategies fail)
                if (allProducts.length < 3) {
                    try {
                        const q3 = query(productsRef, limit(200));
                        const snap3 = await getDocs(q3);
                        snap3.docs.forEach(doc => {
                            if (!allProducts.find(p => p.id === doc.id)) {
                                const data = doc.data();
                                const searchable = `${data.name || ''} ${data.title || ''} ${data.brand || ''} ${data.category || ''} ${doc.id}`.toLowerCase();
                                if (words.some(word => searchable.includes(word))) {
                                    allProducts.push({
                                        ...data,
                                        id: doc.id,
                                        price: Number(data.price || 0),
                                        originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.marketPrice ? Number(data.marketPrice) : (data.oldPrice ? Number(data.oldPrice) : null)),
                                    } as Product);
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Broad search fallback failed:', e);
                    }
                }

                // Client-side refinement: score and rank results by relevance
                const scored = allProducts.map(p => {
                    const name = (p.name || p.title || '').toLowerCase();
                    const brand = (p.brand || '').toLowerCase();
                    const category = (p.category || '').toLowerCase();
                    const subcategory = (p.subcategory || '').toLowerCase();
                    const type = (p.productType || '').toLowerCase();
                    const gender = (p.gender || '').toLowerCase();
                    const tags = (p.tags || []).join(' ').toLowerCase();
                    const keywords = (p.searchKeywords || []).join(' ').toLowerCase();

                    let score = 0;
                    words.forEach(word => {
                        const lowWord = word.toLowerCase();
                        if (name.includes(lowWord)) score += 50;
                        if (name.startsWith(lowWord)) score += 20;
                        if (brand.includes(lowWord)) score += 40;
                        if (subcategory.includes(lowWord)) score += 30;
                        if (type.includes(lowWord)) score += 30;
                        if (gender.includes(lowWord)) score += 25;
                        if (category.includes(lowWord)) score += 20;
                        if (tags.includes(lowWord)) score += 10;
                        if (keywords.includes(lowWord)) score += 10;

                        // Exact match boosts
                        if (name === lowWord) score += 100;
                        if (brand === lowWord) score += 60;
                        if (gender === lowWord) score += 50;
                    });

                    // Match whole phrase
                    if (name.includes(term.toLowerCase())) score += 40;

                    return { product: p, score };
                });

                // Filter to products that match at least one word, sort by score
                const filtered = scored
                    .filter(s => s.score > 1) // Higher threshold for better relevance
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20)
                    .map(s => s.product);

                setResults(filtered);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle click/scroll/touch outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [onClose]);

    if (!searchTerm || searchTerm.length < 2) return null;

    return (
        <div ref={dropdownRef} className="absolute left-[-1.5rem] right-[-1.5rem] md:left-auto md:right-0 top-full mt-2 z-[100] w-[calc(100vw-1rem)] md:w-[600px] mx-auto md:mx-0">
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            >
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-brand-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Searching Catalog...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-2 space-y-1">
                            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                Matching Imports ({results.length})
                            </div>
                            {results.map((product) => (
                                <Link
                                    key={product.id}
                                    href={isAdmin ? `/admin/inventory/edit/${product.id}` : `/products/${product.slug || product.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 p-3.5 hover:bg-slate-50 rounded-2xl transition-all group border-b border-transparent hover:border-slate-100"
                                >
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                                        <Image
                                            src={product.imageURL || `https://picsum.photos/seed/${product.id}/100/100`}
                                            alt={product.name || product.title || ''}
                                            fill
                                            className="object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[10px] md:text-xs font-black text-brand-blue-900 uppercase tracking-tight leading-normal">
                                            {product.name || product.title}
                                        </h4>
                                        <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{product.brand || 'Premium Import'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-brand-blue-600 font-black text-sm">৳{product.price.toLocaleString()}</span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="text-[10px] text-brand-blue-900/30 line-through font-bold">
                                                    ৳{product.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-brand-blue-900/40 group-hover:bg-brand-blue-600 group-hover:text-white group-hover:border-brand-blue-600 transition-all shadow-sm">
                                        <ArrowRight size={16} />
                                    </div>
                                </Link>
                            ))}
                            <Link
                                href={isAdmin ? `/admin/inventory/items?search=${encodeURIComponent(searchTerm)}` : `/products?search=${encodeURIComponent(searchTerm)}`}
                                onClick={onClose}
                                className="block text-center py-5 text-[10px] font-black text-brand-blue-600 uppercase tracking-[0.2em] hover:bg-brand-blue-50 transition-colors bg-white sticky bottom-0 border-t border-slate-50"
                            >
                                View all {results.length}+ Matches for &quot;{searchTerm}&quot;
                            </Link>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <Search size={20} />
                            </div>
                            <h4 className="text-sm font-black text-brand-blue-900 uppercase">No Items Found</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">Try different keywords</p>
                            
                            {!isAdmin && (
                                    <>
                                        <Link 
                                            href="/request-product" 
                                            onClick={onClose}
                                            className="inline-flex items-center gap-2 bg-brand-blue-50 text-brand-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue-600 hover:text-white transition-all active:scale-95"
                                        >
                                            Can&apos;t find it? Request Product
                                        </Link>
                                        <div className="mt-6 border-t border-slate-50 pt-6">
                                            <RequestProductCard />
                                        </div>
                                    </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
