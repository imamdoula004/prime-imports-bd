'use client';

import {
    Search,
    Filter,
    Trash2,
    Loader2,
    Package,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Image as ImageIcon,
    X,
    LayoutGrid,
    Tag,
    RotateCcw,
    Undo2
} from 'lucide-react';
import { StickyScrollContainer } from '@/components/ui/StickyScrollContainer';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { SearchDropdown } from '@/components/ui/SearchDropdown';
import { AnimatePresence, motion } from 'framer-motion';

const ITEMS_PER_PAGE = 25;

export default function RecycleBinPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [firstDoc, setFirstDoc] = useState<any>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        category: 'all',
        brand: 'all',
    });

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;
    const resetFilters = () => setFilters({ category: 'all', brand: 'all' });

    const [filterMetadata, setFilterMetadata] = useState<{ brands: string[], categories: string[] }>({
        brands: [],
        categories: []
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            const productsRef = collection(db, 'products');
            const snap = await getDocs(query(productsRef, where('isDeleted', '==', true), limit(500)));
            const brands = new Set<string>();
            const categories = new Set<string>();
            snap.docs.forEach(doc => {
                const data = doc.data();
                if (data.brand) brands.add(data.brand);
                if (data.category) categories.add(data.category);
            });
            setFilterMetadata({
                brands: Array.from(brands).sort(),
                categories: Array.from(categories).sort()
            });
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        setLoading(true);
        const productsRef = collection(db, 'products');
        let q = query(productsRef, where('isDeleted', '==', true));

        if (!searchTerm.trim()) {
            if (filters.category !== 'all') {
                q = query(q, where('category', '==', filters.category));
            }
            if (filters.brand !== 'all') {
                q = query(q, where('brand', '==', filters.brand));
            }
            q = query(q, orderBy('deletedAt', 'desc'), limit(ITEMS_PER_PAGE));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));

            if (searchTerm.trim()) {
                const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                data = data.filter(p => {
                    const searchable = `${p.name} ${p.brand} ${p.category} ${p.subcategory}`.toLowerCase();
                    return searchWords.every(word => searchable.includes(word));
                });
                if (filters.category !== 'all') data = data.filter(p => p.category === filters.category);
                if (filters.brand !== 'all') data = data.filter(p => p.brand === filters.brand);
            }

            setProducts(data);
            setFirstDoc(snapshot.docs[0]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setTotalItems(snapshot.size); // Approximation for simplified UI
            setLoading(false);
        }, (err) => {
            console.error("Recycle bin sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm, currentPage, filters]);

    const handleRestore = async (product: Product) => {
        if (confirm(`Restore "${product.name}"? It will reappear in the main inventory and storefront.`)) {
            setIsProcessing(true);
            try {
                const productRef = doc(db, 'products', product.id!);
                await updateDoc(productRef, {
                    isDeleted: false,
                    deletedAt: null,
                    isActive: true // Re-activate on restore
                });
            } catch (error) {
                console.error("Restore error:", error);
                alert("Failed to restore product.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handlePermanentDelete = async (product: Product) => {
        if (confirm(`CRITICAL: Permanently delete "${product.name}"? This action CANNOT be undone and will remove all associated images from storage.`)) {
            setIsProcessing(true);
            try {
                // 1. Delete images from Storage if they exist
                if (product.image && product.image.includes('firebasestorage')) {
                    const storage = getStorage();
                    const imageRef = ref(storage, product.image);
                    await deleteObject(imageRef).catch(err => console.warn("Image delete failed (might already be gone):", err));
                }
                
                // Handle multiple images if they exist in images object
                if (product.images) {
                    const storage = getStorage();
                    for (const key of Object.keys(product.images)) {
                        const url = (product.images as any)[key];
                        if (url && url.includes('firebasestorage')) {
                            const imgRef = ref(storage, url);
                            await deleteObject(imgRef).catch(err => console.warn(`Storage delete failed for ${key}:`, err));
                        }
                    }
                }

                // 2. Delete document from Firestore
                await deleteDoc(doc(db, 'products', product.id!));
            } catch (error) {
                console.error("Permanent delete error:", error);
                alert("Failed to permanently delete product.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSelectItem = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/inventory/items" className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                            <ChevronLeft size={20} />
                        </Link>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Recycle Bin</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 ml-11">Recover or Permanently Delete Products</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full z-20">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-brand-blue-600' : 'text-slate-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search deleted items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-brand-blue-100 transition-all outline-none"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilterCount > 0 ? 'bg-brand-blue-900 text-white' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                    <Filter size={14} /> 
                    Filter {activeFilterCount > 0 && <span className="ml-1 bg-brand-gold-400 text-brand-blue-900 px-1.5 py-0.5 rounded-full text-[8px]">{activeFilterCount}</span>}
                </button>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 relative mb-8 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center text-brand-blue-600">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                )}

                <StickyScrollContainer minWidth="1000px">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-6 w-12 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest">Select</th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deleted Product</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Price</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deleted At</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl p-12 border-2 border-dashed border-slate-200">
                                            <Trash2 size={48} className="text-slate-200 mb-4" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deleted products found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group opacity-75 hover:opacity-100">
                                        <td className="px-6 py-6 w-12 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(p.id!)}
                                                onChange={() => handleSelectItem(p.id!)}
                                                className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-slate-100 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all border border-slate-100">
                                                    {p.image ? (
                                                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-brand-blue-900 truncate max-w-[200px]">{p.name}</span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">{p.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-mono font-black text-brand-blue-900 text-sm">
                                            ৳{p.price?.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-600 uppercase">
                                                    {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString() : 'Unknown'}
                                                </span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                    {p.deletedAt ? new Date(p.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center gap-1.5 w-fit mx-auto">
                                                <Trash2 size={10} /> Deleted
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleRestore(p)}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    <Undo2 size={14} /> Restore
                                                </button>
                                                <button 
                                                    onClick={() => handlePermanentDelete(p)}
                                                    disabled={isProcessing}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 rounded-xl disabled:opacity-50"
                                                    title="Permanent Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </StickyScrollContainer>
            </div>

            {/* Pagination Placeholder */}
            {products.length > 0 && (
                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Displaying {products.length} deleted items
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled className="p-2 bg-white border border-slate-100 rounded-xl text-slate-300 cursor-not-allowed"><ChevronLeft size={18} /></button>
                        <span className="px-4 text-[10px] font-black text-brand-blue-900 uppercase">Page 1</span>
                        <button disabled className="p-2 bg-white border border-slate-100 rounded-xl text-slate-300 cursor-not-allowed"><ChevronRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Filter Drawer (Simplified) */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterOpen(false)} className="fixed inset-0 bg-brand-blue-900/40 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Filter Bin</h2>
                                <button onClick={() => setIsFilterOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="flex-1 p-6 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest">Category</h3>
                                    <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-blue-900 outline-none">
                                        <option value="all">All Categories</option>
                                        {filterMetadata.categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                <button onClick={() => setIsFilterOpen(false)} className="w-full bg-brand-blue-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Apply Filter</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
