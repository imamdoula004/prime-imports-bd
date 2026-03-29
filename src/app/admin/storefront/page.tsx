'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorefrontConfig } from '@/hooks/useStorefrontConfig';
import { Search, Save, Check, Plus, Trash2, Layout, Star, ChevronRight, Loader2, Image as ImageIcon, Type, Gift, Upload, Grid3X3, BarChart2 } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/types';

const PRESET_CATEGORIES = [
    'Beverages & Drinks',
    'Tea & Coffee',
    'Chocolate Bars',
    'Biscuits & Cookies',
    'Snacks & Sweets',
    'Cosmetics & Beauty',
    'Grocery Essentials',
    'Dairy & Cheese',
    'Baby Care',
    'Home & Kitchen',
    'Hampers & Gifts',
];

export default function AdminStorefrontPage() {
    const { config, loading: configLoading } = useStorefrontConfig();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [homepageCategoryBar, setHomepageCategoryBar] = useState<string[]>([]);
    const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [heroSlide3ProductIds, setHeroSlide3ProductIds] = useState<string[]>([]);
    const [heroSlide3Products, setHeroSlide3Products] = useState<Product[]>([]);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searching, setSearching] = useState(false);
    const [heroSearch, setHeroSearch] = useState('');
    const [heroSearchResults, setHeroSearchResults] = useState<Product[]>([]);
    const [heroSearching, setHeroSearching] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<number | null>(null);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

    // Hero banner state
    const [heroBanners, setHeroBanners] = useState([
        { id: 1, title: 'Golden Circle Members', subtitle: 'GET 3% OFF ALL ORDERS', badge: 'MEMBER EXCLUSIVE', buttonText: 'Upgrade Now', link: '/golden-circle', imageURL: '' },
        { id: 2, title: 'Premium Swiss Chocolates', subtitle: 'FRESH BATCH JUST ARRIVED', badge: 'NEW ARRIVAL', buttonText: 'Shop Lindt', link: '/products?category=Chocolate Bars', imageURL: '' },
        { id: 3, title: 'Trending Products', subtitle: 'MOST POPULAR THIS WEEK', badge: 'HOT PICKS', buttonText: 'Browse All', link: '/products?sort=best_selling', imageURL: '' },
    ]);

    // Offer banner state
    const [offerBanner, setOfferBanner] = useState({
        title: 'First Order Special!',
        description: 'Spend ৳5,000+ for FREE FAST DELIVERY & a Surprise Gift! 🎁',
        buttonText: 'Claim Offer',
        link: '/products',
    });

    useEffect(() => {
        if (config) {
            setSelectedCategories(config.visibleCategories || []);
            setHomepageCategoryBar(config.homepageCategoryBar || []);
            setFeaturedProductIds(config.featuredProductIds || []);
            setHeroSlide3ProductIds(config.heroSlide3ProductIds || []);
            if (config.heroBanners) setHeroBanners(config.heroBanners as typeof heroBanners);
            if (config.offerBanner) setOfferBanner(config.offerBanner);
        }
    }, [config]);

    // Fetch featured product details
    useEffect(() => {
        const fetchFeatured = async () => {
            if (featuredProductIds.length === 0) { setFeaturedProducts([]); return; }
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('__name__', 'in', featuredProductIds));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            const ordered = featuredProductIds.map(id => items.find(p => p.id === id)).filter(Boolean) as Product[];
            setFeaturedProducts(ordered);
        };
        fetchFeatured();
    }, [featuredProductIds]);

    // Fetch hero slide 3 products
    useEffect(() => {
        const fetchHeroSlide3 = async () => {
            if (heroSlide3ProductIds.length === 0) { setHeroSlide3Products([]); return; }
            // Firestore 'in' supports max 30
            const batches = [];
            for (let i = 0; i < heroSlide3ProductIds.length; i += 10) {
                batches.push(heroSlide3ProductIds.slice(i, i + 10));
            }
            const allItems: Product[] = [];
            for (const batch of batches) {
                const productsRef = collection(db, 'products');
                const q = query(productsRef, where('__name__', 'in', batch));
                const snapshot = await getDocs(q);
                allItems.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
            }
            const ordered = heroSlide3ProductIds.map(id => allItems.find(p => p.id === id)).filter(Boolean) as Product[];
            setHeroSlide3Products(ordered);
        };
        fetchHeroSlide3();
    }, [heroSlide3ProductIds]);

    const handleSearch = async (queryStr: string, target: 'featured' | 'hero') => {
        if (!queryStr.trim()) return;
        const setFn = target === 'featured' ? setSearching : setHeroSearching;
        const setResultsFn = target === 'featured' ? setSearchResults : setHeroSearchResults;
        setFn(true);
        try {
            const productsRef = collection(db, 'products');
            const term = queryStr.toLowerCase().trim();
            const words = term.split(/\s+/).filter(w => w.length > 0);
            const firstWord = words[0];
            let allProducts: Product[] = [];

            // Strategy 1: searchKeywords array-contains
            try {
                const q1 = query(productsRef, where('searchKeywords', 'array-contains', firstWord), limit(20));
                const snap1 = await getDocs(q1);
                snap1.docs.forEach(d => {
                    allProducts.push({ id: d.id, ...d.data() } as Product);
                });
            } catch (e) { /* field may not exist */ }

            // Strategy 2: slug prefix range query
            if (allProducts.length < 5) {
                try {
                    const q2 = query(productsRef, where('slug', '>=', firstWord), where('slug', '<=', firstWord + '\uf8ff'), limit(20));
                    const snap2 = await getDocs(q2);
                    snap2.docs.forEach(d => {
                        if (!allProducts.find(p => p.id === d.id)) {
                            allProducts.push({ id: d.id, ...d.data() } as Product);
                        }
                    });
                } catch (e) { /* slug may not be indexed */ }
            }

            // Strategy 3: broad fetch + client-side filter
            if (allProducts.length < 3) {
                try {
                    const q3 = query(productsRef, limit(200));
                    const snap3 = await getDocs(q3);
                    snap3.docs.forEach(d => {
                        if (!allProducts.find(p => p.id === d.id)) {
                            const data = d.data();
                            const searchable = `${data.name || ''} ${data.title || ''} ${data.brand || ''} ${data.category || ''} ${d.id}`.toLowerCase();
                            if (words.some(word => searchable.includes(word))) {
                                allProducts.push({ id: d.id, ...data } as Product);
                            }
                        }
                    });
                } catch (e) { console.error(e); }
            }

            // Score and rank
            const scored = allProducts.map(p => {
                const searchable = `${p.name || ''} ${(p as any).title || ''} ${p.brand || ''} ${p.category || ''} ${p.slug || ''}`.toLowerCase();
                let score = 0;
                words.forEach(w => { if (searchable.includes(w)) score += 1; });
                const name = (p.name || (p as any).title || '').toLowerCase();
                if (name.startsWith(term)) score += 5;
                if (name.includes(term)) score += 3;
                return { product: p, score };
            });

            setResultsFn(scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 15).map(s => s.product));
        } catch (err) { console.error(err); }
        setFn(false);
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const toggleHomepageCategory = (cat: string) => {
        setHomepageCategoryBar(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const addFeatured = (product: Product) => {
        if (featuredProductIds.includes(product.id!)) return;
        if (featuredProductIds.length >= 3) { alert('Maximum 3 featured products.'); return; }
        setFeaturedProductIds([...featuredProductIds, product.id!]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const addHeroSlide3Product = (product: Product) => {
        if (heroSlide3ProductIds.includes(product.id!)) return;
        if (heroSlide3ProductIds.length >= 12) { alert('Maximum 12 products for Hero Slide 3.'); return; }
        setHeroSlide3ProductIds([...heroSlide3ProductIds, product.id!]);
        setHeroSearchResults([]);
        setHeroSearch('');
    };

    const removeFeatured = (id: string) => {
        setFeaturedProductIds(prev => prev.filter(pId => pId !== id));
    };

    const removeHeroSlide3 = (id: string) => {
        setHeroSlide3ProductIds(prev => prev.filter(pId => pId !== id));
    };

    const updateBanner = (idx: number, field: string, value: string) => {
        setHeroBanners(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    };

    const handleImageUpload = async (idx: number, file: File) => {
        setUploadingImage(idx);
        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `hero-banners/slide-${idx + 1}-${timestamp}.webp`);
            await uploadBytes(storageRef, file);
            let url = await getDownloadURL(storageRef);
            // Append version token to bust internal Next.js image caching
            url = `${url}&v=${timestamp}`;
            setHeroBanners(prev => prev.map((b, i) => i === idx ? { ...b, imageURL: url } : b));
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload image. Try again.');
        }
        setUploadingImage(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'storefront_config', 'main');
            await setDoc(docRef, {
                visibleCategories: selectedCategories,
                homepageCategoryBar: homepageCategoryBar,
                featuredProductIds: featuredProductIds,
                heroSlide3ProductIds: heroSlide3ProductIds,
                heroBanners: heroBanners,
                offerBanner: offerBanner,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert('✅ Storefront Configuration Synced!');
        } catch (err) {
            console.error(err);
            alert('Failed to update.');
        }
        setSaving(false);
    };

    if (configLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-brand-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Storefront Architect</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Curation & Real-time UI Control</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-blue-900 text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-blue-950 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} strokeWidth={3} />}
                    Sync Configuration
                </button>
            </div>

            {/* ======= SIDEBAR + HOMEPAGE CATEGORY BAR ======= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Drawer (Sidebar) */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-brand-blue-50 text-brand-blue-600 rounded-2xl"><Layout size={24} /></div>
                        <div>
                            <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">Sidebar Categories</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select which departments appear in the sidebar drawer</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {PRESET_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedCategories.includes(cat) ? 'bg-brand-blue-600 border-brand-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-brand-blue-600 hover:text-white hover:border-brand-blue-600'}`}
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">{cat}</span>
                                {selectedCategories.includes(cat) ? <Check size={16} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Homepage Category Horizontal Bar */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-brand-blue-50 text-brand-blue-600 rounded-2xl"><Grid3X3 size={24} /></div>
                        <div>
                            <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">Homepage Category Bar</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select which categories appear as icons on homepage</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {PRESET_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => toggleHomepageCategory(cat)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${homepageCategoryBar.includes(cat) ? 'bg-brand-blue-600 border-brand-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-brand-blue-600 hover:text-white hover:border-brand-blue-600'}`}
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">{cat}</span>
                                {homepageCategoryBar.includes(cat) ? <Check size={16} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                            </button>
                        ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 ml-1">If none selected, default categories will show</p>
                </div>
            </div>

            {/* ======= HERO BANNER EDITING WITH IMAGE UPLOAD ======= */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-blue-50 text-brand-blue-600 rounded-2xl"><Type size={24} /></div>
                    <div>
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">Hero Banner Content</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit all 3 hero slides with text and background images</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {heroBanners.map((banner, idx) => (
                        <div key={banner.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest">Slide {idx + 1}</span>
                                <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg uppercase tracking-widest">{banner.badge}</span>
                            </div>

                            {/* IMAGE UPLOAD */}
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Background Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(idx, file);
                                    }}
                                />
                                {banner.imageURL ? (
                                    <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2 group">
                                        <Image src={banner.imageURL} alt="Banner bg" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button onClick={() => fileInputRefs.current[idx]?.click()} className="text-white text-[10px] font-black uppercase tracking-widest bg-brand-blue-600 px-4 py-2 rounded-lg">
                                                Replace
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRefs.current[idx]?.click()}
                                        disabled={uploadingImage === idx}
                                        className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-blue-400 hover:bg-brand-blue-50 transition-all"
                                    >
                                        {uploadingImage === idx ? (
                                            <Loader2 className="animate-spin text-brand-blue-600" size={20} />
                                        ) : (
                                            <>
                                                <Upload size={16} className="text-slate-400" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click to Upload</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Title</label>
                                <input type="text" value={banner.title} onChange={(e) => updateBanner(idx, 'title', e.target.value)} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-black text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Subtitle</label>
                                <input type="text" value={banner.subtitle} onChange={(e) => updateBanner(idx, 'subtitle', e.target.value)} className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Badge</label>
                                    <input type="text" value={banner.badge} onChange={(e) => updateBanner(idx, 'badge', e.target.value)} className="w-full px-3 py-2 bg-white border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Button</label>
                                    <input type="text" value={banner.buttonText} onChange={(e) => updateBanner(idx, 'buttonText', e.target.value)} className="w-full px-3 py-2 bg-white border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Link URL</label>
                                <input type="text" value={banner.link} onChange={(e) => updateBanner(idx, 'link', e.target.value)} className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs font-bold text-brand-blue-600 focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ======= HERO SLIDE 3 PRODUCT PICKER ======= */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-gold-50 text-brand-gold-600 rounded-2xl"><Star size={24} className="fill-current" /></div>
                    <div>
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">Hero Slide 3 — Product Cards</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose up to 12 products to display on the hero banner slide 3</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {heroSlide3Products.length === 0 && (
                        <div className="col-span-full text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No products selected for slide 3</p>
                        </div>
                    )}
                    {heroSlide3Products.map((p, idx) => (
                        <div key={p.id} className="relative flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <button onClick={() => removeHeroSlide3(p.id!)} className="absolute top-2 right-2 z-10 p-2 bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Remove product">
                                <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                            <span className="absolute top-2 left-3 text-[9px] font-black text-slate-300">#{idx + 1}</span>
                            <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden shadow-sm mb-3 mt-4">
                                <Image src={p.imageURL || '/placeholder.png'} alt={p.name || (p as any).title || 'Product'} fill className="object-contain p-2" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[10px] font-black text-brand-blue-900 truncate uppercase tracking-tight">{p.name || (p as any).title}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.category || p.brand || 'Import'}</p>
                                <p className="text-xs font-black text-brand-blue-600 mt-1">৳{(Number(p.price) || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search products to add to slide 3..." value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(heroSearch, 'hero')} className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-blue-100 transition-all outline-none" />
                        {heroSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-blue-600" size={18} />}
                    </div>
                    {heroSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                            {heroSearchResults.map((p) => (
                                <button key={p.id} onClick={() => addHeroSlide3Product(p)} className="w-full flex items-center gap-4 p-4 hover:bg-brand-blue-600 hover:text-white transition-all border-b border-slate-50 last:border-none text-left group">
                                    <div className="relative w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image src={p.imageURL || '/placeholder.png'} alt={p.name} fill className="object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-black text-brand-blue-900 group-hover:text-white truncate uppercase">{p.name || (p as any).title}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest">{p.category}</p>
                                    </div>
                                    <Plus size={16} className="text-brand-blue-600 group-hover:text-white" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ======= FEATURED PRODUCTS (legacy) ======= */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-gold-50 text-brand-gold-600 rounded-2xl"><Star size={24} className="fill-current" /></div>
                    <div>
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">Hero Spotlight</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Featured Products overlaid on hero (Max 3)</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {featuredProducts.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No products featured</p>
                        </div>
                    )}
                    {featuredProducts.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <span className="text-xs font-black text-slate-300">#{idx + 1}</span>
                            <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                <Image src={p.imageURL || '/placeholder.png'} alt={p.name} fill className="object-contain p-2" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-brand-blue-900 truncate uppercase tracking-tight">{p.name || (p as any).title}</h4>
                                <p className="text-[10px] font-black text-brand-blue-600">৳{p.price?.toLocaleString()}</p>
                            </div>
                            <button onClick={() => removeFeatured(p.id!)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery, 'featured')} className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-12 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-blue-100 transition-all outline-none" />
                        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-blue-600" size={18} />}
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                            {searchResults.map((p) => (
                                <button key={p.id} onClick={() => addFeatured(p)} className="w-full flex items-center gap-4 p-4 hover:bg-brand-blue-600 hover:text-white transition-all border-b border-slate-50 last:border-none text-left group">
                                    <div className="relative w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image src={p.imageURL || '/placeholder.png'} alt={p.name} fill className="object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-black text-brand-blue-900 group-hover:text-white truncate uppercase">{p.name || (p as any).title}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest">{p.category}</p>
                                    </div>
                                    <Plus size={16} className="text-brand-blue-600 group-hover:text-white" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ======= OFFER ARC CARD FOOTER ======= */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-gold-50 text-brand-gold-600 rounded-2xl"><Gift size={24} /></div>
                    <div>
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tighter">OfferArcCardFooter Editor</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit the promotional arc banner on homepage</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Offer Title</label>
                            <input type="text" value={offerBanner.title} onChange={(e) => setOfferBanner({ ...offerBanner, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-black text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
                            <textarea rows={3} value={offerBanner.description} onChange={(e) => setOfferBanner({ ...offerBanner, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-brand-blue-100 outline-none resize-none" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Button Text</label>
                            <input type="text" value={offerBanner.buttonText} onChange={(e) => setOfferBanner({ ...offerBanner, buttonText: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Link URL</label>
                            <input type="text" value={offerBanner.link} onChange={(e) => setOfferBanner({ ...offerBanner, link: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-brand-blue-600 focus:ring-2 focus:ring-brand-blue-100 outline-none" />
                        </div>
                        <div className="bg-brand-blue-600 rounded-2xl p-4 text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Live Preview</p>
                            <h4 className="text-lg font-black">{offerBanner.title}</h4>
                            <p className="text-xs text-blue-100 mt-1">{offerBanner.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
