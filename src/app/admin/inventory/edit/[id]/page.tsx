'use client';

import { useState, useEffect, use } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { triggerRestockNotifications } from '@/lib/notifications';
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
    ArrowLeft
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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [success, setSuccess] = useState(false);

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
        status: 'active'
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'products', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        price: data.price?.toString() || '',
                        oldPrice: data.oldPrice?.toString() || '',
                        category: data.category || CATEGORIES[0],
                        subcategory: data.subcategory || '',
                        productType: data.productType || '',
                        gender: data.gender || 'Unisex',
                        stock: data.stock?.toString() || '',
                        brand: data.brand || '',
                        sku: data.sku || '',
                        buyingPrice: data.buyingPrice?.toString() || '',
                        status: data.status || 'active'
                    });
                    if (data.image) setImagePreview(data.image);
                } else {
                    alert('Product not found');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let imageUrl = imagePreview;
            if (imageFile) {
                const storageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const docRef = doc(db, 'products', id);
            const currentDoc = await getDoc(docRef);
            const previousStock = currentDoc.exists() ? (currentDoc.data().stock || 0) : 0;
            const newStock = parseInt(formData.stock);

            const updateData = {
                ...formData,
                price: parseFloat(formData.price),
                oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
                stock: newStock,
                image: imageUrl,
                imageURL: imageUrl,
                normalizedCategory: formData.category,
                updatedAt: serverTimestamp(),
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
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Modify Inventory</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Editing SKU: {id.slice(0, 8)}</p>
                    </div>
                </div>
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
                    </div>

                    <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-amber-600" size={18} />
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900">Safety Lock</h3>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed text-amber-800/80">
                            Updating pricing or stock levels will affect all live carts and pending checkout sessions instantly. Proced with caution.
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
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Product Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Product Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Brand</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Market Price / MSRP (৳)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.oldPrice}
                                        onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Original Market Price"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 block italic">Purchase Price / Cost (৳)</label>
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
                                    <label className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest mb-2 block">Discounted Price / You Pay (৳)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-5 py-4 bg-brand-blue-50 border-none rounded-2xl text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                        placeholder="Final Selling Price"
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
                            </div>
                        </div>

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
        </div>
    );
}
