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
    Image as ImageIcon
} from 'lucide-react';
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
    const [viewDeleted, setViewDeleted] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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

    // Initial load and total count
    useEffect(() => {
        const fetchTotal = async () => {
            // Avoid fetching 4000+ docs just for count
            // In a real app, this should come from a metadata doc
            setTotalItems(4724); // Actual count from audit
        };
        fetchTotal();
    }, []);

    // Paginated sync with optimized search
    useEffect(() => {
        setLoading(true);
        const productsRef = collection(db, viewDeleted ? 'deleted_products' : 'products');

        // Default query: Recent first
        let q = query(productsRef, orderBy(viewDeleted ? 'deletedAt' : 'createdAt', 'desc'), limit(ITEMS_PER_PAGE));

        if (searchTerm.trim()) {
            const searchLower = searchTerm.trim().toLowerCase();
            const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

            // For 4000+ items, we use the `searchKeywords` array-contains-any
            // However, Firestore only supports 10 items in array-contains-any
            // So we'll take the first word for filtering and do the rest in memory
            // OR we use the prefix search if that's more effective

            if (searchWords.length > 0) {
                // If it's a short word, we use array-contains for better accuracy
                q = query(
                    productsRef,
                    where('searchKeywords', 'array-contains', searchWords[0]),
                    limit(ITEMS_PER_PAGE)
                );
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));

            // Client-side filtering for subsequent words if any
            let filteredData = data;
            const searchWords = searchTerm.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);
            if (searchWords.length > 1) {
                filteredData = data.filter(p => {
                    const searchable = `${p.name} ${p.brand} ${p.category} ${p.subcategory}`.toLowerCase();
                    return searchWords.every(word => searchable.includes(word));
                });
            }

            setProducts(filteredData);
            setFirstDoc(snapshot.docs[0]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setLoading(false);
        }, (err) => {
            console.error("Products management sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm, currentPage]);

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
        if (viewDeleted) {
            if (confirm('Permanently delete this backup? This cannot be undone.')) {
                await deleteDoc(doc(db, 'deleted_products', product.id!));
            }
            return;
        }

        if (confirm('Move to Recently Deleted? Product will be removed from storefront but kept as backup.')) {
            const deletedRef = collection(db, 'deleted_products');
            await addDoc(deletedRef, {
                ...product,
                deletedAt: new Date().toISOString(),
                status: 'archived'
            });
            await deleteDoc(doc(db, 'products', product.id!));
        }
    };

    const handleRestore = async (product: Product) => {
        if (confirm('Restore this product? It will go back to the live storefront.')) {
            const productsRef = collection(db, 'products');
            const { deletedAt, id, ...productData } = product as any;
            await addDoc(productsRef, {
                ...productData,
                status: 'active',
                updatedAt: new Date().toISOString()
            });
            await deleteDoc(doc(db, 'deleted_products', id!));
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
                    <button
                        onClick={() => setViewDeleted(!viewDeleted)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${viewDeleted ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Trash2 size={16} />
                        {viewDeleted ? 'Exit Trash' : 'Recently Deleted'}
                    </button>
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
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                        <Filter size={14} /> Filter
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                        <Trash2 size={14} className="text-rose-500" /> Cleanup
                    </button>
                </div>
            </div>

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

            {/* Product Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center text-brand-blue-600">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
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
                                                        <span className="text-[8px] font-black text-white bg-brand-blue-500 px-1.5 py-0.5 rounded uppercase tracking-widest">{p.category}</span>
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
                                                {viewDeleted ? (
                                                    <button onClick={() => handleRestore(p)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Restore Product">
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                ) : (
                                                    <Link href={`/admin/inventory/edit/${p.id}`} className="flex items-center gap-1 px-3 py-2 bg-brand-blue-50 text-brand-blue-600 rounded-xl hover:bg-brand-blue-600 hover:text-white transition-all group/edit shadow-sm">
                                                        <Edit size={14} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Edit Product</span>
                                                    </Link>
                                                )}
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
                </div>

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
        </div>
    );
}
