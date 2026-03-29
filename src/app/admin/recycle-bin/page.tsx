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
    Undo2,
    FileText
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
    getDoc
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { SearchDropdown } from '@/components/ui/SearchDropdown';
import { AnimatePresence, motion } from 'framer-motion';

const ITEMS_PER_PAGE = 25;

type ActiveTab = 'products' | 'images' | 'descriptions';

interface DeletedImageEntry {
    url: string;
    deletedAt: string;
    productId: string;
    productName: string;
}

interface DeletedDescriptionEntry {
    text: string;
    deletedAt: string;
    productId: string;
    productName: string;
}

export default function RecycleBinPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('products');

    // ── Products Tab State ──
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
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // ── Images Tab State ──
    const [deletedImages, setDeletedImages] = useState<DeletedImageEntry[]>([]);
    const [imagesLoading, setImagesLoading] = useState(false);

    // ── Descriptions Tab State ──
    const [deletedDescriptions, setDeletedDescriptions] = useState<DeletedDescriptionEntry[]>([]);
    const [descriptionsLoading, setDescriptionsLoading] = useState(false);

    const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

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

    // ── Fetch Deleted Products ──
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
            setTotalItems(snapshot.size);
            setLoading(false);
        }, (err) => {
            console.error("Recycle bin sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchTerm, currentPage, filters]);

    // ── Fetch Deleted Images from ALL products ──
    useEffect(() => {
        if (activeTab !== 'images') return;
        setImagesLoading(true);

        const fetchDeletedImages = async () => {
            try {
                const productsRef = collection(db, 'products');
                const snap = await getDocs(query(productsRef, limit(1000)));
                const images: DeletedImageEntry[] = [];

                snap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    const productName = data.name || data.title || 'Unknown Product';
                    const productId = docSnap.id;

                    if (data.deletedImages && Array.isArray(data.deletedImages)) {
                        data.deletedImages.forEach((img: { url: string; deletedAt: string }) => {
                            if (img.url) {
                                images.push({
                                    url: img.url,
                                    deletedAt: img.deletedAt || '',
                                    productId,
                                    productName
                                });
                            }
                        });
                    }
                });

                images.sort((a, b) => {
                    if (!a.deletedAt) return 1;
                    if (!b.deletedAt) return -1;
                    return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
                });

                setDeletedImages(images);
            } catch (err) {
                console.error("Error fetching deleted images:", err);
            } finally {
                setImagesLoading(false);
            }
        };

        fetchDeletedImages();
    }, [activeTab]);

    // ── Fetch Deleted Descriptions from ALL products ──
    useEffect(() => {
        if (activeTab !== 'descriptions') return;
        setDescriptionsLoading(true);

        const fetchDeletedDescriptions = async () => {
            try {
                const productsRef = collection(db, 'products');
                const snap = await getDocs(query(productsRef, limit(1000)));
                const descriptions: DeletedDescriptionEntry[] = [];

                snap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    const productName = data.name || data.title || 'Unknown Product';
                    const productId = docSnap.id;

                    if (data.deletedDescriptions && Array.isArray(data.deletedDescriptions)) {
                        data.deletedDescriptions.forEach((desc: { text: string; deletedAt: string }) => {
                            if (desc.text) {
                                descriptions.push({
                                    text: desc.text,
                                    deletedAt: desc.deletedAt || '',
                                    productId,
                                    productName
                                });
                            }
                        });
                    }
                });

                descriptions.sort((a, b) => {
                    if (!a.deletedAt) return 1;
                    if (!b.deletedAt) return -1;
                    return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
                });

                setDeletedDescriptions(descriptions);
            } catch (err) {
                console.error("Error fetching deleted descriptions:", err);
            } finally {
                setDescriptionsLoading(false);
            }
        };

        fetchDeletedDescriptions();
    }, [activeTab]);

    // ── Restore a deleted image back to its product ──
    const handleRestoreImage = async (entry: DeletedImageEntry) => {
        if (!confirm(`Restore this image to "${entry.productName}"? The current image will be archived.`)) return;
        setIsProcessing(true);
        try {
            const productRef = doc(db, 'products', entry.productId);
            const productSnap = await getDoc(productRef);
            if (!productSnap.exists()) {
                showStatus("Product no longer exists.", "error");
                return;
            }
            const productData = productSnap.data();
            const currentImage = productData.image || productData.imageURL || '';
            const existingDeletedImages: { url: string; deletedAt: string }[] = productData.deletedImages || [];

            const newDeletedImages = existingDeletedImages.filter(img => img.url !== entry.url);
            if (currentImage && currentImage !== entry.url) {
                newDeletedImages.push({
                    url: currentImage,
                    deletedAt: new Date().toISOString()
                });
            }

            await updateDoc(productRef, {
                image: entry.url,
                imageURL: entry.url,
                deletedImages: newDeletedImages,
                updatedAt: new Date().toISOString()
            });

            setDeletedImages(prev => prev.filter(img => !(img.url === entry.url && img.productId === entry.productId)));
            showStatus(`Image restored to "${entry.productName}".`);
        } catch (error) {
            console.error("Image restore error:", error);
            showStatus("Failed to restore image.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Restore a deleted description back to its product ──
    const handleRestoreDescription = async (entry: DeletedDescriptionEntry) => {
        if (!confirm(`Restore this description to "${entry.productName}"? The current description will be archived.`)) return;
        setIsProcessing(true);
        try {
            const productRef = doc(db, 'products', entry.productId);
            const productSnap = await getDoc(productRef);
            if (!productSnap.exists()) {
                showStatus("Product no longer exists.", "error");
                return;
            }
            const productData = productSnap.data();
            const currentDescription = productData.description || '';
            const existingDeletedDescriptions: { text: string; deletedAt: string }[] = productData.deletedDescriptions || [];

            const newDeletedDescriptions = existingDeletedDescriptions.filter(desc => !(desc.text === entry.text && desc.deletedAt === entry.deletedAt));
            if (currentDescription && currentDescription !== entry.text) {
                newDeletedDescriptions.push({
                    text: currentDescription,
                    deletedAt: new Date().toISOString()
                });
            }

            await updateDoc(productRef, {
                description: entry.text,
                deletedDescriptions: newDeletedDescriptions,
                updatedAt: new Date().toISOString()
            });

            setDeletedDescriptions(prev => prev.filter(desc => !(desc.text === entry.text && desc.productId === entry.productId && desc.deletedAt === entry.deletedAt)));
            showStatus(`Description restored to "${entry.productName}".`);
        } catch (error) {
            console.error("Description restore error:", error);
            showStatus("Failed to restore description.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async (product: Product) => {
        if (confirm(`Restore "${product.name}"? It will reappear in the main inventory and storefront.`)) {
            setIsProcessing(true);
            try {
                const productRef = doc(db, 'products', product.id!);
                await updateDoc(productRef, {
                    isDeleted: false,
                    deletedAt: null,
                    isActive: true
                });
                showStatus(`"${product.name}" restored to inventory.`);
            } catch (error) {
                console.error("Restore error:", error);
                showStatus("Failed to restore product.", "error");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handlePermanentDelete = async (product: Product) => {
        if (confirm(`CRITICAL: Permanently delete "${product.name}"? This action CANNOT be undone and will remove all associated images from storage.`)) {
            setIsProcessing(true);
            try {
                if (product.image && product.image.includes('firebasestorage')) {
                    const storage = getStorage();
                    const imageRef = ref(storage, product.image);
                    await deleteObject(imageRef).catch(err => console.warn("Image delete failed (might already be gone):", err));
                }
                
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

                await deleteDoc(doc(db, 'products', product.id!));
                showStatus(`"${product.name}" permanently deleted.`);
            } catch (error) {
                console.error("Permanent delete error:", error);
                showStatus("Failed to permanently delete product.", "error");
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
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 ml-11">Recover or Permanently Delete Products, Images &amp; Descriptions</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit flex-wrap">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-brand-blue-900 text-white shadow-lg' : 'text-slate-500 hover:text-brand-blue-900'}`}
                >
                    <Package size={14} />
                    Products {products.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px] ml-1">{products.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('images')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'images' ? 'bg-brand-blue-900 text-white shadow-lg' : 'text-slate-500 hover:text-brand-blue-900'}`}
                >
                    <ImageIcon size={14} />
                    Images {deletedImages.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px] ml-1">{deletedImages.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('descriptions')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'descriptions' ? 'bg-brand-blue-900 text-white shadow-lg' : 'text-slate-500 hover:text-brand-blue-900'}`}
                >
                    <FileText size={14} />
                    Descriptions {deletedDescriptions.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px] ml-1">{deletedDescriptions.length}</span>}
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══ PRODUCTS TAB ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'products' && (
                <>
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
                </>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══ DELETED IMAGES TAB ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'images' && (
                <div className="space-y-6">
                    {imagesLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 size={32} className="animate-spin text-brand-blue-600" />
                        </div>
                    ) : deletedImages.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-16 text-center">
                            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl p-12 border-2 border-dashed border-slate-200">
                                <ImageIcon size={48} className="text-slate-200 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deleted images found</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Images are archived here when you change or clear a product&apos;s picture</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {deletedImages.length} archived image{deletedImages.length !== 1 ? 's' : ''} found across all products
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {deletedImages.map((entry, index) => (
                                    <motion.div
                                        key={`${entry.productId}-${entry.url}-${index}`}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="relative aspect-square bg-slate-100 overflow-hidden">
                                            <Image 
                                                src={entry.url} 
                                                alt={`Deleted image from ${entry.productName}`} 
                                                fill 
                                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <p className="text-[9px] font-black text-brand-blue-900 uppercase tracking-wider truncate" title={entry.productName}>
                                                {entry.productName}
                                            </p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                {entry.deletedAt ? new Date(entry.deletedAt).toLocaleDateString() : 'Unknown date'}
                                            </p>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleRestoreImage(entry)}
                                                    disabled={isProcessing}
                                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    <Undo2 size={10} /> Restore
                                                </button>
                                                <Link
                                                    href={`/admin/inventory/edit/${entry.productId}`}
                                                    className="flex items-center justify-center px-2 py-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-brand-blue-50 hover:text-brand-blue-600 transition-all text-[8px] font-black uppercase tracking-widest"
                                                    title="Edit Product"
                                                >
                                                    <Tag size={10} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══ DELETED DESCRIPTIONS TAB ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'descriptions' && (
                <div className="space-y-6">
                    {descriptionsLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 size={32} className="animate-spin text-brand-blue-600" />
                        </div>
                    ) : deletedDescriptions.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-16 text-center">
                            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl p-12 border-2 border-dashed border-slate-200">
                                <FileText size={48} className="text-slate-200 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deleted descriptions found</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Descriptions are archived here when you edit a product&apos;s description</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {deletedDescriptions.length} archived description{deletedDescriptions.length !== 1 ? 's' : ''} found across all products
                            </p>
                            <div className="space-y-4">
                                {deletedDescriptions.map((entry, index) => (
                                    <motion.div
                                        key={`${entry.productId}-${entry.deletedAt}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group p-5"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black text-brand-blue-900 uppercase tracking-wider">{entry.productName}</span>
                                                    <Link
                                                        href={`/admin/inventory/edit/${entry.productId}`}
                                                        className="text-[8px] font-black text-slate-400 hover:text-brand-blue-600 uppercase tracking-widest transition-colors"
                                                    >
                                                        <Tag size={10} />
                                                    </Link>
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Archived: {entry.deletedAt ? new Date(entry.deletedAt).toLocaleDateString() + ' ' + new Date(entry.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRestoreDescription(entry)}
                                                disabled={isProcessing}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest disabled:opacity-50 shrink-0"
                                            >
                                                <Undo2 size={10} /> Restore
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
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
