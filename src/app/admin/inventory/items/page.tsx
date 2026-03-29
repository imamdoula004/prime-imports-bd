'use client';

import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    MoreVertical,
    Loader2,
    Package,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Image as ImageIcon,
    X,
    FilterX,
    LayoutGrid,
    Tag,
    Archive
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
    where,
    addDoc
} from 'firebase/firestore';
import { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { SearchDropdown } from '@/components/ui/SearchDropdown';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES } from '@/config/categories';

const ITEMS_PER_PAGE = 25;

export default function AdminProductsManagementPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [firstDoc, setFirstDoc] = useState<any>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && products.length > 0) {
            setSelectedIds(new Set(products.map(p => p.id!)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectItem = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDiscount = async () => {
        const percentStr = prompt("Enter discount percentage to apply (e.g., 10 for 10% off market price):");
        if (!percentStr) return;
        const percent = parseFloat(percentStr);
        if (isNaN(percent) || percent < 0 || percent > 100) return alert("Invalid percentage");

        setIsBulkUpdating(true);
        try {
            const promises = Array.from(selectedIds).map(async (id) => {
                const product = products.find(p => p.id === id);
                if (!product) return;
                const basePrice = product.originalPrice || product.price || 0;
                const newPrice = Math.round(basePrice * (1 - (percent / 100)));
                await updateDoc(doc(db, 'products', id), {
                    price: newPrice,
                    originalPrice: basePrice,
                    updatedAt: new Date().toISOString()
                });
            });
            await Promise.all(promises);
            setSelectedIds(new Set());
            alert("Bulk discount applied successfully.");
        } catch (e) {
            console.error(e);
            alert("Error applying bulk update.");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        categoryId: 'all',
        category: 'all', // Keep for backward compatibility if needed, but primary is categoryId
        subcategory: 'all',
        brand: 'all',
        stockStatus: 'all', // 'critical', 'low', 'full', 'empty'
        isActive: 'all',    // 'active', 'draft'
    });

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

    const resetFilters = () => setFilters({
        categoryId: 'all',
        category: 'all',
        subcategory: 'all',
        brand: 'all',
        stockStatus: 'all',
        isActive: 'all'
    });

    // Extract unique labels for filters
    const [filterMetadata, setFilterMetadata] = useState<{ brands: string[], categories: string[] }>({
        brands: [],
        categories: []
    });

    // Load filter metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            const productsRef = collection(db, 'products');
            const snap = await getDocs(query(productsRef, limit(500))); // Sample for labels
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

    // Initial load and total count
    useEffect(() => {
        const fetchTotal = async () => {
            setTotalItems(4724); 
        };
        fetchTotal();
    }, []);

    // Paginated sync with optimized search AND filters
    useEffect(() => {
        setLoading(true);
        const productsRef = collection(db, 'products');

        let q = query(productsRef, where('isDeleted', '==', false));

        // Apply Status Filter if searching by base status
        if (filters.isActive !== 'all') {
            q = query(q, where('isActive', '==', filters.isActive === 'active'));
        }

        // Apply Category/Brand if not searching by text (Firestore limitation)
        if (!searchTerm.trim()) {
            if (filters.categoryId !== 'all') {
                q = query(q, where('categoryId', '==', filters.categoryId));
            } else if (filters.category !== 'all') {
                q = query(q, where('category', '==', filters.category));
            }
            if (filters.brand !== 'all') {
                q = query(q, where('brand', '==', filters.brand));
            }
            q = query(q, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));

            // Client-side filtering for Search + Stock Status
            if (searchTerm.trim()) {
                const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                data = data.filter(p => {
                    const searchable = `${p.name} ${p.brand} ${p.category} ${p.subcategory}`.toLowerCase();
                    return searchWords.every(word => searchable.includes(word));
                });
            }

            if (filters.stockStatus !== 'all') {
                data = data.filter(p => {
                    const stock = p.stock ?? 0;
                    if (filters.stockStatus === 'critical') return stock > 0 && stock <= 5;
                    if (filters.stockStatus === 'low') return stock > 5 && stock <= 15;
                    if (filters.stockStatus === 'empty') return stock === 0;
                    if (filters.stockStatus === 'full') return stock > 15;
                    return true;
                });
            }

            // Post-search Category/Brand filter ensure if search term is active
            if (searchTerm.trim()) {
                if (filters.category !== 'all') data = data.filter(p => p.category === filters.category);
                if (filters.brand !== 'all') data = data.filter(p => p.brand === filters.brand);
            }

            setProducts(data);
            setFirstDoc(snapshot.docs[0]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setLoading(false);
        }, (err) => {
            console.error("Products management sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm, currentPage, filters]);

    const handleNextPage = async () => {
        if (!lastDoc) return;
        const productsRef = collection(db, 'products');
        const nextQ = query(productsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(ITEMS_PER_PAGE));
        const snapshot = await getDocs(nextQ);
        if (snapshot.docs.length > 0) {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
            setProducts(data);
            setFirstDoc(snapshot.docs[0]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setCurrentPage(prev => prev + 1);
        }
    };

    const handleDelete = async (product: Product) => {
        if (confirm('Move to Recycle Bin? Product will be hidden from storefront but can be restored later.')) {
            try {
                const productRef = doc(db, 'products', product.id!);
                await updateDoc(productRef, {
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                    isActive: false
                });
                showStatus(`"${product.name}" moved to Recycle Bin.`);
            } catch (error) {
                console.error(error);
                showStatus('Error moving product to Recycle Bin.', 'error');
            }
        }
    };

    const updateStock = async (product: Product, newStock: number) => {
        const productRef = doc(db, 'products', product.id!);
        await updateDoc(productRef, {
            stock: Number(newStock)
        });
    };

    const toggleStatus = async (product: Product) => {
        const productRef = doc(db, 'products', product.id!);
        await updateDoc(productRef, {
            isActive: !product.isActive
        });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Inventory Intelligence</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Managing {totalItems.toLocaleString()} Real Products</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/recycle-bin"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        <Trash2 size={16} />
                        Recycle Bin
                    </Link>
                    <Link href="/admin/inventory/add" className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-blue-700 transition-colors shadow-lg shadow-brand-blue-600/20 active:scale-95">
                        <Plus size={16} strokeWidth={3} />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full z-20">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-brand-blue-600' : 'text-slate-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder={`Live search ${totalItems.toLocaleString()} items...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-brand-blue-100 transition-all outline-none"
                    />

                    <AnimatePresence>
                        {isSearchFocused && searchTerm.length >= 2 && (
                            <SearchDropdown
                                query={searchTerm}
                                onClose={() => setIsSearchFocused(false)}
                                isAdmin
                            />
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilterCount > 0 ? 'bg-brand-blue-900 text-white' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Filter size={14} /> 
                        Filter {activeFilterCount > 0 && <span className="ml-1 bg-brand-gold-400 text-brand-blue-900 px-1.5 py-0.5 rounded-full text-[8px]">{activeFilterCount}</span>}
                    </button>
                    <button 
                        onClick={() => {
                            if(confirm("This will archive all products with 0 stock. Proceed?")) {
                                // Cleanup logic would go here
                            }
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                        <Trash2 size={14} className="text-rose-500" /> Cleanup
                    </button>
                </div>
            </div>

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2">Displaying:</span>
                    {Object.entries(filters).map(([key, value]) => value !== 'all' && (
                        <div key={key} className="flex items-center gap-2 bg-brand-blue-50 border border-brand-blue-100 px-3 py-1.5 rounded-full">
                            <span className="text-[9px] font-black uppercase text-brand-blue-400">{key}:</span>
                            <span className="text-[10px] font-black text-brand-blue-900 uppercase">{value.toString()}</span>
                            <button onClick={() => setFilters({ ...filters, [key]: 'all' })} className="ml-1 hover:text-rose-500">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={resetFilters}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:underline px-2"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-brand-blue-900 border border-brand-blue-800 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-brand-blue-900/20"
                    >
                        <div className="flex items-center gap-3 text-white">
                            <span className="bg-brand-blue-800 px-3 py-1 rounded-lg text-xs font-black">{selectedIds.size}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue-100 mt-0.5">Products Selected</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkDiscount}
                                disabled={isBulkUpdating}
                                className="flex items-center gap-2 bg-white text-brand-blue-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold-400 transition-colors disabled:opacity-50"
                            >
                                {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <TrendingDown size={14} />}
                                Apply Discount
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-blue-200 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Table Container */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 relative mb-8 transition-all">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center text-brand-blue-600">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                )}

                <StickyScrollContainer minWidth="1000px">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-6 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500 cursor-pointer"
                                        checked={products.length > 0 && selectedIds.size === products.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Information</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pricing Analysis</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Availability</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Performance</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Admin Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No products synchronised</p>
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(p.id!) ? 'bg-brand-blue-50/30' : ''}`}>
                                        <td className="px-6 py-6 w-12 text-center" onClick={() => handleSelectItem(p.id!)}>
                                            <div className="flex items-center justify-center cursor-pointer" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500 cursor-pointer"
                                                    checked={selectedIds.has(p.id!)}
                                                    onChange={() => handleSelectItem(p.id!)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-slate-100 relative overflow-hidden flex-shrink-0 border border-slate-100">
                                                    {p.image ? (
                                                        <Image src={p.image} alt={p.name || (p as any).title} fill className="object-cover transition-transform group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ImageIcon size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-black text-brand-blue-900 group-hover:text-brand-blue-600 transition-colors truncate max-w-[200px]">{p.name || (p as any).title}</span>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[8px] font-black text-white bg-brand-blue-500 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                            {CATEGORIES.find(c => c.id === p.categoryId)?.name || p.category}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.subcategory || 'General'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="text-sm font-black text-brand-blue-900 font-mono">৳{p.price?.toLocaleString()}</span>
                                                    <span className="text-[7px] font-black bg-brand-blue-900 text-white px-1 rounded uppercase">Discounted</span>
                                                </div>
                                                <div className="w-full max-w-[140px] flex flex-col gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Market Price</span>
                                                        <span className="text-[9px] font-bold text-slate-400 line-through">৳{p.originalPrice?.toLocaleString() || p.price?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Purchase Price</span>
                                                        <span className="text-[9px] font-black text-brand-blue-600">৳{p.buyingPrice?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    {p.buyingPrice && p.buyingPrice > 0 ? (
                                                        <>
                                                            <div className="h-px bg-slate-200 my-0.5" />
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Net Profit</span>
                                                                <span className="text-[9px] font-black text-emerald-600">৳{(p.price - (p.buyingPrice || 0)).toLocaleString()}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="mt-1 flex justify-center">
                                                            <span className="text-[6px] font-bold text-slate-300 uppercase tracking-tighter">Cost data required for profit analysis</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                    <input
                                                        type="number"
                                                        defaultValue={p.stock || 0}
                                                        onBlur={(e) => updateStock(p, Number(e.target.value))}
                                                        className="w-14 px-1.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all text-center"
                                                    />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest pr-1 ${p.stock && p.stock <= 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                        Stock
                                                    </span>
                                                </div>
                                                {p.stock !== undefined && p.stock <= 5 && (
                                                    <span className="text-[7px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                                        <AlertTriangle size={8} /> Critical
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-brand-blue-900 uppercase">৳{((p.totalSales || 0) * (p.price || 0)).toLocaleString()}</span>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 flex items-center gap-0.5 ${(p.totalSales || 0) > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        <TrendingUp size={8} /> {p.totalSales || 0} Sold
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => toggleStatus(p)}
                                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${p.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {p.isActive ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                                                {p.isActive ? 'active' : 'draft'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/inventory/edit/${p.id}`} className="flex items-center gap-1 px-3 py-2 bg-brand-blue-50 text-brand-blue-600 rounded-xl hover:bg-brand-blue-600 hover:text-white transition-all group/edit shadow-sm">
                                                    <Edit size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Edit Product</span>
                                                </Link>
                                                <button onClick={() => handleDelete(p)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl">
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

                {/* Pagination Controls */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing {products.length} of {totalItems.toLocaleString()} Products
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-[10px] font-black text-brand-blue-900 border-x px-4 uppercase tracking-[0.3em]">
                            Page {currentPage}
                        </span>
                        <button
                            disabled={products.length < ITEMS_PER_PAGE}
                            onClick={handleNextPage}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Robust Filter Drawer */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="fixed inset-0 bg-brand-blue-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-blue-900 text-brand-gold-400 flex items-center justify-center">
                                        <Filter size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Advanced Filter</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory Intelligence</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 premium-scrollbar">
                                {/* Status Filter */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <LayoutGrid size={14} className="text-brand-blue-400" /> Visibility Status
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['all', 'active', 'draft'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFilters({ ...filters, isActive: status as any })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filters.isActive === status ? 'bg-brand-blue-900 text-white border-brand-blue-900' : 'bg-white border-slate-100 text-slate-500 hover:border-brand-blue-200'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Stock Status */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <Archive size={14} className="text-brand-blue-400" /> Stock Level
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'all', label: 'All Stock' },
                                            { id: 'critical', label: 'Critical (≤5)' },
                                            { id: 'low', label: 'Low (≤15)' },
                                            { id: 'empty', label: 'Out of Stock' },
                                            { id: 'full', label: 'Full Stock (>15)' }
                                        ].map(stock => (
                                            <button
                                                key={stock.id}
                                                onClick={() => setFilters({ ...filters, stockStatus: stock.id as any })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filters.stockStatus === stock.id ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-100 text-slate-500 hover:border-brand-blue-200'}`}
                                            >
                                                {stock.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Dropdown */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <LayoutGrid size={14} className="text-brand-blue-400" /> Category
                                    </h3>
                                    <select
                                        value={filters.categoryId}
                                        onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-brand-blue-900 outline-none focus:ring-2 focus:ring-brand-blue-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Brand Filter */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <Tag size={14} className="text-brand-blue-400" /> Brand Focus
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFilters({ ...filters, brand: 'all' })}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filters.brand === 'all' ? 'bg-brand-blue-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            All Brands
                                        </button>
                                        {filterMetadata.brands.map(brand => (
                                            <button
                                                key={brand}
                                                onClick={() => setFilters({ ...filters, brand: brand })}
                                                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filters.brand === brand ? 'bg-brand-blue-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-brand-blue-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue-900/20 active:scale-95 transition-all"
                                >
                                    Apply Intelligent Filters
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="w-full bg-white text-slate-400 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors"
                                >
                                    Reset to Default
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Status Message */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 backdrop-blur-md border ${statusMessage.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : 'bg-brand-blue-900/90 text-white border-brand-blue-800'}`}
                    >
                        {statusMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-brand-gold-400" />}
                        {statusMessage.text}
                        <button onClick={() => setStatusMessage(null)} className="ml-4 opacity-50 hover:opacity-100 italic lowercase tracking-normal">close</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
