'use client';

import { useState, useEffect, use } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { triggerRestockNotifications } from '@/lib/notifications';
import type { ProductVariant } from '@/types';
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
    ArrowLeft,
    History,
    Undo,
    Trash2,
    Plus,
    GripVertical
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

const VARIANT_TYPES = ['Weight', 'Size', 'Color', 'Pack Size', 'Flavor', 'Other'];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [originalImageUrl, setOriginalImageUrl] = useState<string>(''); // Track the actual Firebase URL
    const [deletedDescriptions, setDeletedDescriptions] = useState<{ text: string; deletedAt: any }[]>([]);
    const [deletedImages, setDeletedImages] = useState<{ url: string; deletedAt: any }[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [success, setSuccess] = useState(false);

    // Variants state
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [newVariant, setNewVariant] = useState({ type: VARIANT_TYPES[0], label: '', priceAdjustment: '', stock: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        oldPrice: '',
        category: CATEGORIES[0],
        subcategory: '',
        productType: '',
        gender: 'Unisex',
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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'products', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.name || data.title || '',
                        description: data.description || '',
                        price: data.price ? String(data.price) : '',
                        oldPrice: data.oldPrice || data.marketPrice ? String(data.oldPrice || data.marketPrice) : '',
                        category: data.category || CATEGORIES[0],
                        subcategory: data.subcategory || '',
                        productType: data.productType || '',
                        gender: data.gender || 'Unisex',
                        stock: data.stock ? String(data.stock) : '',
                        brand: data.brand || '',
                        sku: data.sku || '',
                        buyingPrice: data.buyingPrice ? String(data.buyingPrice) : '',
                        status: data.status || 'active',
                        weight: data.weight || '',
                        size: data.size || '',
                        supplier: data.supplier || '',
                        aliases: data.aliases ? data.aliases.join(', ') : ''
                    });
                    const imgUrl = data.image || data.imageURL || '';
                    setImagePreview(imgUrl);
                    setOriginalImageUrl(imgUrl); // Store the real Firebase URL
                    setDeletedDescriptions(data.deletedDescriptions || []);
                    setDeletedImages(data.deletedImages || []);
                    setVariants(data.variants || []);
                } else {
                    alert('Product not found!');
                    router.push('/admin/inventory/items');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, router]);

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

    const normalizeTitle = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Variant management
    const addVariant = () => {
        if (!newVariant.label.trim()) return;
        const variant: ProductVariant = {
            id: `var-${Date.now()}`,
            type: newVariant.type.toLowerCase().replace(/\s+/g, '_'),
            label: newVariant.label.trim(),
            priceAdjustment: newVariant.priceAdjustment ? parseFloat(newVariant.priceAdjustment) : 0,
            stock: newVariant.stock ? parseInt(newVariant.stock) : undefined
        };
        setVariants(prev => [...prev, variant]);
        setNewVariant({ type: newVariant.type, label: '', priceAdjustment: '', stock: '' });
    };

    const removeVariant = (variantId: string) => {
        setVariants(prev => prev.filter(v => v.id !== variantId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let imageUrl: string;
            if (imageFile) {
                // New file uploaded — upload to Firebase Storage
                const timestamp = Date.now();
                const storageRef = ref(storage, `products/${timestamp}-${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                let url = await getDownloadURL(snapshot.ref);
                imageUrl = `${url}&v=${timestamp}`;
            } else {
                // No new file — use the original Firebase URL (NOT imagePreview which could be data: URL)
                imageUrl = originalImageUrl;
            }

            const docRef = doc(db, 'products', id);
            const currentDoc = await getDoc(docRef);
            const currentData = currentDoc.exists() ? currentDoc.data() : {};
            const previousStock = currentData.stock || 0;
            const previousDescription = currentData.description || '';
            const previousImage = currentData.image || currentData.imageURL || '';
            const existingDeletedDescriptions = currentData.deletedDescriptions || [];
            const existingDeletedImages = currentData.deletedImages || [];
            const newStock = parseInt(formData.stock);

            // Archive previous description if changed
            const updatedDeletedDescriptions = [...existingDeletedDescriptions];
            if (formData.description !== previousDescription && previousDescription) {
                updatedDeletedDescriptions.push({
                    text: previousDescription,
                    deletedAt: new Date().toISOString()
                });
            }

            // Archive previous image if changed
            const updatedDeletedImages = [...existingDeletedImages];
            if (imageUrl !== previousImage && previousImage) {
                updatedDeletedImages.push({
                    url: previousImage,
                    deletedAt: new Date().toISOString()
                });
            }

            const updateData: Record<string, any> = {
                ...formData,
                name: formData.title,
                title: formData.title,
                normalized_title: normalizeTitle(formData.title),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
                price: parseFloat(formData.price),
                oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                marketPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                originalPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
                stock: newStock,
                image: imageUrl,
                imageURL: imageUrl,
                normalizedCategory: formData.category,
                aliases: formData.aliases.split(',').map(s => s.trim()).filter(s => s),
                variants: variants,
                updatedAt: serverTimestamp(),
                deletedDescriptions: updatedDeletedDescriptions,
                deletedImages: updatedDeletedImages
            };

            await updateDoc(docRef, updateData);

            // Trigger restock notification if stock goes from 0 to > 0
            if (previousStock === 0 && newStock > 0) {
                await triggerRestockNotifications(id, formData.title);
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/inventory/items');
            }, 2000);
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const restoreDescription = (text: string) => {
        if (confirm('Restore this description? Current description will be archived on save.')) {
            setFormData(prev => ({ ...prev, description: text }));
        }
    };

    const restoreImage = (url: string) => {
        if (confirm('Restore this image? Current image will be archived on save.')) {
            setImagePreview(url);
            setOriginalImageUrl(url); // Update the tracked Firebase URL
            setImageFile(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Retrieving Product DNA...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={48} strokeWidth={3} className="animate-bounce" />
                </div>
                <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Update Committed</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Propagating changes to storefront...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-brand-blue-600 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Edit Product</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">ID: {id}</p>
                    </div>
                </div>
                {(deletedDescriptions.length > 0 || deletedImages.length > 0) && (
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showHistory ? 'bg-brand-blue-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <History size={16} />
                        View History ({deletedDescriptions.length + deletedImages.length})
                    </button>
                )}
            </div>

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

                    <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-amber-600" size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900">Safety Lock</h3>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed text-amber-800/80">
                            Updating pricing or stock levels will affect all live carts and pending checkout sessions instantly. Proceed with caution.
                        </p>
                    </div>
                </div>

                {/* Form Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        {/* Core Information */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                    <Type size={18} />
                                </div>
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Core Information</h2>
                            </div>

                            <div className="grid gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Product Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. Premium Wagyu Striploin A5"
                                    />
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

                        {/* Inventory & Pricing */}
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
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Gender Focus</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subcategory</label>
                                    <input
                                        type="text"
                                        value={formData.subcategory}
                                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. Laptop, Running, Casual"
                                    />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-1 italic">Used for category-specific tags</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Product Type / Detail</label>
                                    <input
                                        type="text"
                                        value={formData.productType}
                                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="e.g. Gaming Laptop, Ultrabook"
                                    />
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

                        {/* Product Variants Section */}
                        <div className="pt-8 border-t border-slate-50">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                    <Layers size={18} />
                                </div>
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Product Variants</h2>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-auto">{variants.length} variants</span>
                            </div>

                            {/* Add New Variant */}
                            <div className="bg-slate-50 p-5 rounded-2xl mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Type</label>
                                        <select
                                            value={newVariant.type}
                                            onChange={(e) => setNewVariant({ ...newVariant, type: e.target.value })}
                                            className="w-full px-3 py-3 bg-white border-none rounded-xl text-xs font-bold text-brand-blue-900 outline-none appearance-none cursor-pointer"
                                        >
                                            {VARIANT_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Label</label>
                                        <input
                                            type="text"
                                            value={newVariant.label}
                                            onChange={(e) => setNewVariant({ ...newVariant, label: e.target.value })}
                                            className="w-full px-3 py-3 bg-white border-none rounded-xl text-xs font-bold text-brand-blue-900 outline-none"
                                            placeholder="e.g. 500g"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Price +/- (৳)</label>
                                        <input
                                            type="number"
                                            value={newVariant.priceAdjustment}
                                            onChange={(e) => setNewVariant({ ...newVariant, priceAdjustment: e.target.value })}
                                            className="w-full px-3 py-3 bg-white border-none rounded-xl text-xs font-bold text-brand-blue-900 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Stock</label>
                                        <input
                                            type="number"
                                            value={newVariant.stock}
                                            onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                            className="w-full px-3 py-3 bg-white border-none rounded-xl text-xs font-bold text-brand-blue-900 outline-none"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        disabled={!newVariant.label.trim()}
                                        className="px-4 py-3 bg-brand-blue-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-blue-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Existing Variants List */}
                            {variants.length > 0 && (
                                <div className="space-y-2">
                                    {variants.map((v) => (
                                        <div key={v.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl group hover:border-brand-blue-200 transition-all">
                                            <div className="text-slate-300"><GripVertical size={16} /></div>
                                            <span className="text-[9px] font-black text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap">
                                                {v.type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs font-bold text-brand-blue-900 flex-1">{v.label}</span>
                                            {v.priceAdjustment ? (
                                                <span className={`text-[10px] font-black ${(v.priceAdjustment || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {(v.priceAdjustment || 0) > 0 ? '+' : ''}{v.priceAdjustment}৳
                                                </span>
                                            ) : null}
                                            {v.stock !== undefined && v.stock !== null && (
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Stock: {v.stock}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(v.id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {variants.length === 0 && (
                                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest py-4 italic">
                                    No variants added — use the form above to add sizes, weights, colors, etc.
                                </p>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="pt-8 flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-5 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-black/20 hover:shadow-black/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Commiting...
                                    </>
                                ) : (
                                    <>
                                        Execute Update
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Product History Section (Recycle Bin of the product) */}
            {showHistory && (
                <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-blue-900 text-white rounded-xl">
                            <History size={20} />
                        </div>
                        <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Product Archive / Recycle Bin</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Archived Descriptions */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                Past Descriptions
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full lowercase tracking-normal font-bold">{deletedDescriptions.length} items</span>
                            </h3>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {deletedDescriptions.length === 0 ? (
                                    <div className="py-12 text-center text-slate-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest italic">No archived descriptions</p>
                                    </div>
                                ) : (
                                    deletedDescriptions.slice().reverse().map((item, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed mb-3 line-clamp-3">{item.text}</p>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                    Archived: {new Date(item.deletedAt).toLocaleDateString()}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => restoreDescription(item.text)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand-blue-100 hover:bg-brand-blue-900 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Undo size={12} /> Restore Version
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Archived Images */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                Past Images
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full lowercase tracking-normal font-bold">{deletedImages.length} items</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {deletedImages.length === 0 ? (
                                    <div className="col-span-2 py-12 text-center text-slate-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest italic">No archived images</p>
                                    </div>
                                ) : (
                                    deletedImages.slice().reverse().map((item, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                                            <Image src={item.url} alt="Archived" fill className="object-cover transition-opacity duration-300 grayscale group-hover:grayscale-0" />
                                            <div className="absolute inset-x-0 bottom-0 bg-brand-blue-900/90 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2">
                                                <span className="text-[8px] font-bold text-white uppercase tracking-widest mb-1 italic">
                                                    {new Date(item.deletedAt).toLocaleDateString()}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => restoreImage(item.url)}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-white text-brand-blue-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold-400 transition-all shadow-md"
                                                >
                                                    <Undo size={12} /> Restore
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
