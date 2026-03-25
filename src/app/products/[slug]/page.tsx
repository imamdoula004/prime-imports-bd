import Link from 'next/link';
import {
    Truck,
    ShieldCheck,
    Star,
    Zap,
    ChevronRight,
    ArrowLeft,
    Verified,
    Package,
    RotateCcw
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, limit, orderBy } from 'firebase/firestore';
import type { Product } from '@/types';
import { notFound } from 'next/navigation';
import { ProductAddToCart } from '@/components/ui/ProductAddToCart';
import { ProductGallery } from '@/components/ui/ProductGallery';
import { DescriptionSection } from './DescriptionSection';
import { DiscoverySection } from '@/components/ui/DiscoverySection';
import { BundleSection } from '@/components/ui/BundleSection';
import { RecentlyViewed } from '@/components/ui/RecentlyViewed';
import { GoldenCirclePerksCard } from '@/components/product/GoldenCirclePerksCard';

function sanitizeProduct(doc: any): Product {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lastSoldAt: data.lastSoldAt?.toDate?.()?.toISOString() || null,
        price: Number(data.price || 0),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.marketPrice ? Number(data.marketPrice) : null),
        stock: Number(data.stock || 0),
    } as Product;
}

async function getProductData(slugOrId: string) {
    try {
        const productsRef = collection(db, 'products');
        let currentProduct: Product | null = null;

        // 1. Get Current
        const docRef = doc(db, 'products', slugOrId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isDeleted) return null; // Prevent viewing deleted products
            currentProduct = sanitizeProduct(docSnap);
        } else {
            const q = query(productsRef, where('slug', '==', slugOrId), where('isDeleted', '==', false), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) currentProduct = sanitizeProduct(querySnapshot.docs[0]);
        }

        if (!currentProduct) return null;

        // 2. Fetch Discovery Layers Defensively
        const fetchSimilar = async () => {
            if (!currentProduct?.category) return [];
            try {
                const q = query(productsRef, where('category', '==', currentProduct.category), where('isDeleted', '==', false), limit(12));
                const snap = await getDocs(q);
                if (!snap.empty) return snap.docs.map(sanitizeProduct);
                const fallback = await getDocs(query(productsRef, where('isDeleted', '==', false), limit(12)));
                return fallback.docs.map(sanitizeProduct);
            } catch (e) {
                const fallback = await getDocs(query(productsRef, where('isDeleted', '==', false), limit(12)));
                return fallback.docs.map(sanitizeProduct);
            }
        };

        const [similar, popular, trending] = await Promise.all([
            fetchSimilar(),
            getDocs(query(productsRef, where('isDeleted', '==', false), limit(12))).then(s => s.docs.map(sanitizeProduct)).catch(() => []),
            getDocs(query(productsRef, where('isDeleted', '==', false), limit(12))).then(s => s.docs.map(sanitizeProduct)).catch(() => [])
        ]);

        return {
            product: currentProduct,
            similar: similar.filter(p => p.id !== currentProduct?.id),
            popular: popular.filter(p => p.id !== currentProduct?.id),
            trending: trending.filter(p => p.id !== currentProduct?.id)
        };
    } catch (error) {
        console.error("Failed to load product data", error);
        return null;
    }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data) notFound();
    const { product, similar, popular, trending } = data;

    const discountPercentage = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const stockStatus = product.stock > 0
        ? product.stock < 10 ? 'Limited' : 'In Stock'
        : 'Out of Stock';

    const stockColor = product.stock > 0
        ? product.stock < 10 ? 'text-amber-600' : 'text-emerald-600'
        : 'text-red-600';

    return (
        <div className="bg-white min-h-screen text-brand-blue-900 selection:bg-brand-blue-900 selection:text-white pb-0">
            {/* Header / Breadcrumb */}
            <div className="border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all">
                <div className="container-pbd py-2 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue-600 transition-colors">
                        <ArrowLeft size={16} strokeWidth={3} />
                        Back
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <span className="truncate max-w-[100px]">{product.brand || 'Premium'}</span>
                        <ChevronRight size={10} strokeWidth={4} />
                        <span className="text-brand-blue-900 truncate max-w-[150px]">{product.title || product.name}</span>
                    </div>
                </div>
            </div>

            <main className="container-pbd pt-6 md:pt-10">
                {/* PART 1: BALANCED PRODUCT HUB - 2-Column Symmetric Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">

                    {/* LEFT: GALLERY - Balanced Column */}
                    <div className="lg:sticky lg:top-24">
                        <div className="w-full relative pb-6">
                            <ProductGallery
                                title={product.title || product.name}
                                slug={product.slug}
                                discountPercentage={discountPercentage}
                                images={product.images}
                                fallbackImage={product.image || product.imageURL}
                            />
                        </div>

                        {/* DESKTOP TRUST TILES */}
                        <div className="hidden lg:grid grid-cols-4 gap-2 mt-4">
                            {[
                                { icon: Truck, text: 'Global Import', color: 'text-blue-600' },
                                { icon: ShieldCheck, text: 'Verified', color: 'text-emerald-500' },
                                { icon: RotateCcw, text: 'Returns', color: 'text-orange-500' },
                                { icon: Star, text: 'Genuine', color: 'text-amber-500' }
                            ].map((tile, i) => (
                                <div key={i} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                    <tile.icon size={16} className={`${tile.color} mb-1.5`} />
                                    <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{tile.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: INFO & DESCRIPTION - Symmetric Column */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue-500">
                                        {product.brand || 'Imported Selections'}
                                    </span>
                                    <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${stockColor} bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        {stockStatus}
                                    </div>
                                </div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-brand-blue-950 leading-tight uppercase tracking-tight">
                                    {product.title || product.name}
                                </h1>
                            </div>

                            {/* PRICE CLUSTER */}
                            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-2xl shadow-slate-200/50 flex flex-col gap-6 relative overflow-hidden mb-2">
                                <div className="flex flex-col gap-2">
                                    {product.originalPrice && product.originalPrice > product.price ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl text-red-500 line-through font-black opacity-60">৳{product.originalPrice}</span>
                                            <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-lg">-{discountPercentage}% OFF</span>
                                        </div>
                                    ) : null}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-brand-blue-900 opacity-30">৳</span>
                                        <span className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-blue-950 tracking-tighter leading-none">
                                            {product.price}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PURCHASE MODULE - HIDDEN ON MOBILE, USES STICKY FOOTER INSTEAD */}
                            <div className="hidden lg:block mb-6">
                                <ProductAddToCart product={product} />
                            </div>

                            {/* SPECS PREVIEW */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand</span>
                                    <span className="text-xs font-black text-brand-blue-950 uppercase line-clamp-1">{product.brand || 'Premium'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                                    <span className="text-xs font-black text-brand-blue-950 uppercase line-clamp-1">{product.category || 'Specialty'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Weight</span>
                                    <span className="text-xs font-black text-brand-blue-950 uppercase line-clamp-1">{product.weight || 'Standard'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origin</span>
                                    <span className="text-xs font-black text-brand-blue-950 uppercase line-clamp-1">{product.origin || 'Imported'}</span>
                                </div>
                            </div>

                            {/* DESCRIPTION SECTION - Side-by-Side Integration */}
                            <div className="pt-1">
                                <DescriptionSection description={product.description} />
                            </div>
                        </div>

                        {/* GOLDEN CIRCLE & AUTH TILES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <GoldenCirclePerksCard price={product.price} />
                            <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-between border border-slate-100">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Authentication</span>
                                    <div className="flex items-center gap-2">
                                        <Verified size={16} className="text-brand-blue-600" />
                                        <span className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">100% Genuine</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL ORDERING - REPOSITIONED BELOW THE TILES */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <a 
                                href={`https://wa.me/8801234567890?text=Hello, I'm interested in ${encodeURIComponent(product.title || product.name || '')}. Is it still available?`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-4 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-200/50"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                <span>WhatsApp</span>
                            </a>
                            <a 
                                href="https://m.me/yourbusinesspage"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-4 px-4 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200/50"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.303 2.256.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.258 14.823l-3.047-3.242-5.947 3.242 6.54-6.945 3.125 3.242 5.869-3.242-6.54 6.945z"/>
                                </svg>
                                <span>Messenger</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* LAYER 2: SNACK COMBOS (Dynamic Bundle Pricing) */}
                <BundleSection currentProductId={product.id || ''} />

                {/* LAYER 3: SIMILAR PRODUCTS (Standard Cards - High Impact) */}
                <DiscoverySection
                    title="Recommended For You"
                    subtitle="Similar Premium Imports"
                    products={similar.slice(0, 10)}
                    layout="swipe"
                    cardType="standard"
                />

                {/* LAYER 4: TRENDING NOW (Compact Swipe - High Density) */}
                <DiscoverySection
                    title="Popular Imports"
                    subtitle="What others are buying"
                    products={popular.slice(0, 14)}
                    layout="swipe"
                    density="ultra"
                    cardType="compact"
                />

                {/* LAYER 5: YOU MAY ALSO LIKE (Dense Swipe) */}
                <DiscoverySection
                    title="Hidden Gems"
                    subtitle="Products you haven't seen yet"
                    products={trending.slice(0, 16)}
                    layout="swipe"
                    density="ultra"
                    cardType="compact"
                />

                {/* LAYER 6: RECENTLY VIEWED (Compact Swipe) */}
                <RecentlyViewed currentProductId={product.id || ''} />

            </main>

            {/* FIXED FOOTER FOR MOBILE */}
            <ProductAddToCart product={product} isMobileFooter={true} />
        </div>
    );
}
