'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, limit, doc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import {
    Package,
    Upload,
    X,
    CheckCircle2,
    Loader2,
    Image as ImageIcon,
    Tag,
    DollarSign,
    Layers,
    Type,
    AlertCircle,
    AlertTriangle,
    RefreshCw,
    Search,
    Edit
} from 'lucide-react';
import Image from 'next/image';

const CATEGORIES = [
    'Beverages & Drinks',
    'Tea & Coffee',
    'Chocolate Bars',
    'Biscuits & Cookies',
    'Snacks & Sweets Haven',
    'Cosmetics & Beauty',
    'Grocery and Essentials',
    'Sauces & Condiments',
    'Breakfast & Cereals',
    'Dairy & Cheese',
    'Baking Essentials',
    'Baby Care Imports',
    'Health & Wellness',
    'Home & Kitchen',
    'Gift Boxes & Hampers',
    'Exotic Fruits'
];

interface DuplicateMatch {
    id: string;
    name?: string;
    title?: string;
    price?: number;
    stock?: number;
    category?: string;
    brand?: string;
    imageURL?: string;
    image?: string;
    description?: string;
    oldPrice?: number;
    marketPrice?: number;
    buyingPrice?: number;
    sku?: string;
    status?: string;
    productID?: string;
    weight?: string;
    size?: string;
    supplier?: string;
    aliases?: string[];
}

export default function AddProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Product Initialized');

    // Duplicate detection state
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [searchingDuplicates, setSearchingDuplicates] = useState(false);
    const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateMatch | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        oldPrice: '',
        category: CATEGORIES[0],
        stock: '',
        brand: '',
        sku: '',
        buyingPrice: '',
        status: 'active',
        weight: '',
        size: '',
        supplier: '',
        aliases: ''
    });

    // Helper for title normalization
    const normalizeTitle = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Helper for similarity check (simple Levenshtein or word-based)
    const checkProductSimilarity = (t1: string, t2: string) => {
        const s1 = normalizeTitle(t1);
        const s2 = normalizeTitle(t2);
        if (s1 === s2) return 1.0;

        const words1 = s1.split(' ');
        const words2 = s2.split(' ');
        const intersection = words1.filter(w => words2.includes(w));
        return intersection.length / Math.max(words1.length, words2.length);
    };

    // Debounced duplicate detection with multi-strategy search
    useEffect(() => {
        const title = formData.title.trim();
        if (title.length < 2) {
            setDuplicates([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchingDuplicates(true);
            try {
                const productsRef = collection(db, 'products');
                const term = title.toLowerCase();
                const normalizedTerm = normalizeTitle(term);
                const words = term.split(/\s+/).filter(w => w.length > 1);
                const firstWord = words[0];

                let rawMatches: any[] = [];

                // 1. Exact or Prefix Search on Normalized Title (Best match)
                try {
                    const qNorm = query(
                        productsRef,
                        where('normalized_title', '>=', normalizedTerm),
                        where('normalized_title', '<=', normalizedTerm + '\uf8ff'),
                        limit(10)
                    );
                    const snapNorm = await getDocs(qNorm);
                    snapNorm.docs.forEach(doc => {
                        rawMatches.push({ id: doc.id, ...doc.data() });
                    });
                } catch (e) { /* might not be indexed */ }

                // 2. Slug-based search (Fallback)
                if (rawMatches.length < 5) {
                    try {
                        const slugPrefix = term.replace(/[^a-z0-9]/g, '-');
                        const qSlug = query(
                            productsRef,
                            where('slug', '>=', slugPrefix),
                            where('slug', '<=', slugPrefix + '\uf8ff'),
                            limit(10)
                        );
                        const snapSlug = await getDocs(qSlug);
                        snapSlug.docs.forEach(doc => {
                            if (!rawMatches.find(p => p.id === doc.id)) {
                                rawMatches.push({ id: doc.id, ...doc.data() });
                            }
                        });
                    } catch (e) { /* might not be indexed */ }
                }

                // 2b. Exact SKU or ProductID Search
                if (term.length >= 3) {
                    try {
                        const qSKU = query(productsRef, where('sku', '==', title), limit(5));
                        const snapSKU = await getDocs(qSKU);
                        snapSKU.docs.forEach(doc => {
                            if (!rawMatches.find(p => p.id === doc.id)) {
                                rawMatches.push({ id: doc.id, ...doc.data() });
                            }
                        });
                    } catch (e) { /* might not be indexed */ }

                    try {
                        const qID = query(productsRef, where('productID', '==', title), limit(5));
                        const snapID = await getDocs(qID);
                        snapID.docs.forEach(doc => {
                            if (!rawMatches.find(p => p.id === doc.id)) {
                                rawMatches.push({ id: doc.id, ...doc.data() });
                            }
                        });
                    } catch (e) { /* might not be indexed */ }
                }

                // 3. Keyword / Alias Search (Broad)
                if (rawMatches.length < 3) {
                    try {
                        const qKeywords = query(
                            productsRef,
                            where('searchKeywords', 'array-contains', firstWord),
                            limit(10)
                        );
                        const snapKeywords = await getDocs(qKeywords);
                        snapKeywords.docs.forEach(doc => {
                            if (!rawMatches.find(p => p.id === doc.id)) {
                                rawMatches.push({ id: doc.id, ...doc.data() });
                            }
                        });
                    } catch (e) { /* might not be indexed */ }
                }

                // Final Scoring & Ranking
                const scoredMatches = rawMatches.map(p => {
                    const searchable = `${p.name || ''} ${p.title || ''} ${p.brand || ''} ${p.normalized_title || ''} ${p.sku || ''} ${p.id}`.toLowerCase();
                    let score = 0;

                    if (normalizeTitle(p.name || p.title || '') === normalizedTerm) score += 20; // Exact match
                    if (p.sku && p.sku === formData.sku && formData.sku) score += 15; // SKU match

                    words.forEach(w => {
                        if (searchable.includes(w)) score += 2;
                    });

                    if (searchable.startsWith(term)) score += 5;

                    return { product: p, score };
                })
                    .filter(m => m.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);

                setDuplicates(scoredMatches.map(m => ({
                    id: m.product.id,
                    ...m.product,
                    imageURL: m.product.imageURL || m.product.image
                })));
            } catch (e) {
                console.error('Duplicate detection error:', e);
            }
            setSearchingDuplicates(false);
        }, 200); // 200ms debounce as requested

        return () => clearTimeout(timer);
    }, [formData.title, formData.sku]);

    // Fill form with existing product data
    const fillFromExisting = (match: any) => {
        setSelectedDuplicate(match);
        setFormData({
            title: match.name || match.title || '',
            description: match.description || '',
            price: match.price ? String(match.price) : '',
            oldPrice: match.oldPrice || match.marketPrice ? String(match.oldPrice || match.marketPrice) : '',
            category: match.category || CATEGORIES[0],
            stock: match.stock ? String(match.stock) : '',
            brand: match.brand || '',
            sku: match.sku || '',
            buyingPrice: match.buyingPrice ? String(match.buyingPrice) : '',
            status: match.status || 'active',
            weight: match.weight || '',
            size: match.size || '',
            supplier: match.supplier || '',
            aliases: match.aliases ? match.aliases.join(', ') : ''
        });
        if (match.imageURL || match.image) {
            setImagePreview(match.imageURL || match.image);
        }
        setDuplicates([]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                const storageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const productData: Record<string, any> = {
                ...formData,
                name: formData.title,
                normalized_title: normalizeTitle(formData.title),
                price: parseFloat(formData.price),
                marketPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
                stock: parseInt(formData.stock),
                normalizedCategory: formData.category,
                updatedAt: serverTimestamp(),
                aliases: formData.aliases.split(',').map(s => s.trim()).filter(s => s),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
            };

            // Final Duplicate Warning if NEW product
            if (!selectedDuplicate) {
                const qCheck = query(
                    collection(db, 'products'),
                    where('normalized_title', '>=', productData.normalized_title.slice(0, 5)),
                    limit(20)
                );
                const snapCheck = await getDocs(qCheck);
                const possibleDuplicates = snapCheck.docs
                    .map(doc => ({ id: doc.id, ...doc.data() as any }))
                    .filter(p => {
                        const titleSim = checkProductSimilarity(p.name || p.title || '', formData.title);
                        const brandMatch = p.brand?.toLowerCase() === formData.brand.toLowerCase();
                        const weightMatch = p.weight?.toLowerCase() === formData.weight.toLowerCase();

                        // Strict 90% threshold for title or combination
                        return titleSim > 0.9 || (titleSim > 0.7 && brandMatch) || (titleSim > 0.5 && brandMatch && weightMatch);
                    });

                if (possibleDuplicates.length > 0) {
                    const match = possibleDuplicates[0];
                    if (!confirm(`POSSIBLE DUPLICATE DETECTED!\n\nSimilar Product: "${match.name}"\nBrand: ${match.brand || 'N/A'}\nWeight: ${match.weight || 'N/A'}\n\nDo you want to create this anyway? (Cancel to go back and edit the existing one)`)) {
                        setLoading(false);
                        return;
                    }
                }
            }

            if (imageUrl) {
                productData.imageURL = imageUrl;
                productData.image = imageUrl;
            }

            if (selectedDuplicate) {
                // UPDATE existing product
                const docRef = doc(db, 'products', selectedDuplicate.id);
                await updateDoc(docRef, productData);
                setSuccessMessage('Product Updated Successfully');
            } else {
                // CREATE new product
                productData.createdAt = serverTimestamp();
                productData.productID = `PI-${Date.now().toString().slice(-6)}`;
                await addDoc(collection(db, 'products'), productData);
                setSuccessMessage('Product Initialized');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/inventory/items');
            }, 2000);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product. Check console.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={48} strokeWidth={3} className="animate-bounce" />
                </div>
                <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">{successMessage}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Synchronizing with global catalog...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">
                            {selectedDuplicate ? 'Update Existing Product' : 'New Inventory Entry'}
                        </h1>
                        {selectedDuplicate && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-amber-200">
                                Editing Existing
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
                        {selectedDuplicate ? `Product ID: ${selectedDuplicate.productID || selectedDuplicate.id}` : 'Populate Global Product Database'}
                    </p>
                </div>
                {selectedDuplicate && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedDuplicate(null);
                            setFormData({
                                title: '', description: '', price: '', oldPrice: '',
                                category: CATEGORIES[0], stock: '', brand: '', sku: '',
                                buyingPrice: '', status: 'active', weight: '', size: '',
                                supplier: '', aliases: ''
                            });
                            setImagePreview('');
                            setImageFile(null);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
                    >
                        <X size={14} />
                        Cancel & Start Fresh
                    </button>
                )}
            </div>

            {selectedDuplicate && (
                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden relative border border-emerald-100 shrink-0">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="" fill className="object-contain p-1" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package size={20} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-tight">Syncing with LIVE Catalog</h3>
                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Any changes will update the existing product document</p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global SKU</span>
                            <p className="text-xs font-mono font-bold text-brand-blue-900">{selectedDuplicate.sku || 'No SKU'}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image Upload Area */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product Visuals</h2>

                        <div className={`relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed transition-all ${imagePreview ? 'border-brand-blue-100' : 'border-slate-200 bg-slate-50/50'}`}>
                            {imagePreview ? (
                                <>
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                                        className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Media</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>

                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center leading-relaxed">
                            Recommended: 1080x1080px<br />PNG, JPG or WEBP (Max 2MB)
                        </p>
                    </div>

                    <div className="bg-brand-blue-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-brand-blue-900/20">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-brand-gold-400" size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Smart Duplicate Check</h3>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed text-slate-300">
                            As you type the product title, we automatically search for existing products. If a match is found, you can update it instead of creating a duplicate.
                        </p>
                    </div>
                </div>

                {/* Form Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                    <Type size={18} />
                                </div>
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Core Information</h2>
                            </div>

                            <div className="grid gap-6">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Product Title</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none ${selectedDuplicate ? 'border-amber-300 bg-amber-50/30' : duplicates.length > 0 ? 'border-amber-200' : 'border-transparent'}`}
                                            placeholder="e.g. Premium Wagyu Striploin A5"
                                        />
                                        {searchingDuplicates && (
                                            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-blue-400" />
                                        )}
                                    </div>

                                    {/* Duplicate Matches Dropdown - Smart Search Style */}
                                    {duplicates.length > 0 && !selectedDuplicate && (
                                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                                            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <Search size={12} className="text-brand-blue-600" />
                                                    <span className="text-[10px] font-black text-brand-blue-900 uppercase tracking-widest">
                                                        Existing Products Found ({duplicates.length})
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select to Edit</span>
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                                {duplicates.map(dup => (
                                                    <button
                                                        key={dup.id}
                                                        type="button"
                                                        onClick={() => fillFromExisting(dup)}
                                                        className="w-full flex items-center gap-4 p-4 hover:bg-brand-blue-50/50 transition-all text-left border-b border-slate-50 last:border-none group"
                                                    >
                                                        <div className="relative w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 group-hover:border-brand-blue-200 transition-colors">
                                                            {dup.imageURL || dup.image ? (
                                                                <Image src={dup.imageURL || dup.image || ''} alt="" fill className="object-contain p-1 group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                    <Package size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h5 className="text-[11px] font-black text-brand-blue-900 truncate uppercase group-hover:text-brand-blue-600 transition-colors">{dup.name || dup.title}</h5>
                                                                <span className="text-[10px] font-black text-brand-blue-900 font-mono">৳{(dup.price || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest">{dup.brand || 'No Brand'}</span>
                                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${Number(dup.stock) <= 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    Stock: {dup.stock || 0}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">ID: {dup.productID || dup.id}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-blue-600 group-hover:text-white transition-all">
                                                            <Edit size={14} />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDuplicate && (
                                        <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                                Linked to existing product — will update on save
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Brand (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. Kobe Farms"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none resize-none"
                                        placeholder="Detailed specifications and origin details..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                    <DollarSign size={18} />
                                </div>
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Inventory & Pricing</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Regular Price / MSRP (৳)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.oldPrice}
                                        onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Original Price"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 block italic">Buying Price / Cost (৳)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.buyingPrice}
                                        onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                                        className="w-full px-5 py-4 bg-rose-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Our Purchase Cost"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest mb-2 block">Sale Price / You Pay (৳)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-5 py-4 bg-brand-blue-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Checkout Price"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Stock Level</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. 50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Global Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Weight / Volume</label>
                                        <input
                                            type="text"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                            placeholder="e.g. 500g, 1L"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Size / Variant</label>
                                        <input
                                            type="text"
                                            value={formData.size}
                                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                            placeholder="e.g. Large, Pack of 4"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Supplier / Source</label>
                                        <input
                                            type="text"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                            placeholder="e.g. Nestlé BD"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Search Aliases (Comma Separated)</label>
                                    <input
                                        type="text"
                                        value={formData.aliases}
                                        onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. chocolate bar, snack, fingers"
                                    />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1 italic">Used for fuzzy search matching</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="sm:flex-1 py-4 px-6 bg-white text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={16} strokeWidth={2.5} />
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`sm:flex-[2] py-4 px-6 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 border-2 ${selectedDuplicate ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-amber-500/30 hover:shadow-amber-500/50' : 'bg-gradient-to-r from-brand-blue-800 to-brand-blue-900 text-white border-brand-blue-900 shadow-brand-blue-900/30 hover:shadow-brand-blue-900/50'}`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : selectedDuplicate ? (
                                    <>
                                        <RefreshCw size={16} strokeWidth={2.5} />
                                        Update Existing Product
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} strokeWidth={2.5} />
                                        Authorize & Initialize
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
