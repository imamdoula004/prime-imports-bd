'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    where,
    limit
} from 'firebase/firestore';
import {
    Zap,
    Plus,
    Trash2,
    Search,
    Save,
    X,
    Package,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Product, Bundle } from '@/types';
import Image from 'next/image';

export default function AdminBundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

    // Form State
    const [bundleName, setBundleName] = useState('');
    const [bundlePrice, setBundlePrice] = useState<string>('');
    const [priorityScore, setPriorityScore] = useState('1');
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'bundles'), orderBy('priorityScore', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Bundle));
            setBundles(data);
            setLoading(false);
        });

        // Pre-fetch some products for selection
        const fetchProducts = async () => {
            const pSnap = await getDocs(query(collection(db, 'products'), limit(50)));
            setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        };
        fetchProducts();

        return () => unsubscribe();
    }, []);

    const marketPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

    const handleAddProduct = (product: Product) => {
        if (selectedProducts.find(p => p.id === product.id)) return;
        setSelectedProducts([...selectedProducts, product]);
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProducts.length < 2) {
            alert('A bundle must have at least 2 products');
            return;
        }
        setSaving(true);

        const bundleData = {
            name: bundleName,
            products: selectedProducts.map(p => p.id!),
            bundlePrice: parseFloat(bundlePrice),
            marketPrice,
            priorityScore: parseInt(priorityScore),
            active: true,
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingBundle) {
                await updateDoc(doc(db, 'bundles', editingBundle.id!), bundleData);
            } else {
                await addDoc(collection(db, 'bundles'), {
                    ...bundleData,
                    createdAt: serverTimestamp(),
                });
            }
            resetForm();
        } catch (error) {
            console.error('Error saving bundle:', error);
            alert('Failed to save bundle');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingBundle(null);
        setBundleName('');
        setBundlePrice('');
        setPriorityScore('1');
        setSelectedProducts([]);
    };

    const handleEdit = (bundle: Bundle) => {
        setEditingBundle(bundle);
        setBundleName(bundle.name);
        setBundlePrice(bundle.bundlePrice.toString());
        setPriorityScore(bundle.priorityScore.toString());

        // Find selected products
        const bundleProds = products.filter(p => bundle.products.includes(p.id!));
        setSelectedProducts(bundleProds);
        setIsCreating(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bundle?')) return;
        await deleteDoc(doc(db, 'bundles', id));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-brand-gold-500/10 rounded-2xl flex items-center justify-center text-brand-gold-500">
                        <Zap size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Snack Bundles</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Create high-converting product combos</p>
                    </div>
                </div>

                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-blue-700 transition-all shadow-xl shadow-brand-blue-600/20 active:scale-95"
                    >
                        <Plus size={20} /> Create New Bundle
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between underline-offset-8 decoration-brand-gold-500/30">
                                <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Bundle Information</h2>
                                <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest mb-2">Bundle Name (e.g. Cinema Night Pack)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue-600 transition-all font-bold"
                                        value={bundleName}
                                        onChange={(e) => setBundleName(e.target.value)}
                                        placeholder="Enter catchy bundle name..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest mb-2">Bundle Combo Price (BDT)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue-600 transition-all font-bold"
                                            value={bundlePrice}
                                            onChange={(e) => setBundlePrice(e.target.value)}
                                            placeholder="Discounted price..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest mb-2">Priority Score (1-100)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue-600 transition-all font-bold"
                                            value={priorityScore}
                                            onChange={(e) => setPriorityScore(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Price Analysis */}
                                {marketPrice > 0 && bundlePrice && (
                                    <div className="bg-brand-gold-50/50 p-6 rounded-2xl border border-brand-gold-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-brand-gold-600 uppercase tracking-wide">Customer Savings</p>
                                            <p className="text-xl font-black text-brand-blue-900">
                                                {(marketPrice - parseFloat(bundlePrice)).toFixed(0)} BDT
                                                <span className="text-sm font-bold text-slate-400 ml-2 italic">
                                                    ({Math.round(((marketPrice - parseFloat(bundlePrice)) / marketPrice) * 100)}% off)
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-brand-blue-400 uppercase tracking-wide">Market Total</p>
                                            <p className="text-lg font-bold text-slate-400 line-through">{marketPrice} BDT</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest px-1">Selected Products ({selectedProducts.length})</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedProducts.map(p => (
                                            <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 relative rounded-lg overflow-hidden border bg-white">
                                                        <Image src={p.imageURL || p.image || '/brand_logo.jpeg'} alt={p.name} fill className="object-contain p-1" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-brand-blue-900 leading-tight">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{p.price} BDT</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveProduct(p.id!)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedProducts.length === 0 && (
                                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold italic">
                                                No products added yet...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-5 bg-brand-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-brand-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    {editingBundle ? 'Update Combo Bundle' : 'Create Combo Bundle'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Product Selector */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-fit sticky top-8">
                        <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight mb-6">Select Products</h3>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-brand-blue-600 transition-all"
                                placeholder="Search inventory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddProduct(p)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-brand-blue-50 transition-all text-left border border-transparent hover:border-brand-blue-100 group"
                                >
                                    <div className="w-12 h-12 relative rounded-xl overflow-hidden border bg-white group-hover:scale-105 transition-transform">
                                        <Image src={p.imageURL || p.image || '/brand_logo.jpeg'} alt={p.name} fill className="object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-brand-blue-900 truncate">{p.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.price} BDT</p>
                                    </div>
                                    <Plus size={16} className="text-brand-blue-400 group-hover:text-brand-blue-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Bundle List */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map(bundle => (
                        <div key={bundle.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:border-brand-gold-400/30 transition-all flex flex-col">
                            <div className="p-6 border-b border-slate-50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="px-3 py-1 bg-brand-gold-500 text-brand-blue-900 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-brand-gold-500/20">
                                        {bundle.priorityScore} Priority
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(bundle)} className="p-2 text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg">
                                            <Search size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(bundle.id!)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-brand-blue-900 leading-tight mb-2 group-hover:text-brand-blue-600 transition-colors uppercase">{bundle.name}</h3>
                                <p className="text-2xl font-black text-brand-blue-900">
                                    {bundle.bundlePrice} BDT
                                    <span className="text-sm font-bold text-slate-400 line-through ml-2">{bundle.marketPrice} BDT</span>
                                </p>
                            </div>

                            <div className="p-6 bg-slate-50/50 flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Includes {bundle.products.length} Items:</p>
                                <div className="flex -space-x-3 overflow-hidden">
                                    {bundle.products.slice(0, 4).map((pid, idx) => {
                                        const prod = products.find(p => p.id === pid);
                                        return (
                                            <div key={idx} className="relative w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm hover:z-10 transition-all">
                                                {prod ? <Image src={prod.imageURL || prod.image || '/brand_logo.jpeg'} alt="" fill className="object-contain p-1" /> : <Package size={14} className="m-auto text-slate-300" />}
                                            </div>
                                        );
                                    })}
                                    {bundle.products.length > 4 && (
                                        <div className="relative w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm z-0">
                                            +{bundle.products.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 mt-auto">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    <CheckCircle2 size={12} /> Live on Storefront
                                </div>
                            </div>
                        </div>
                    ))}
                    {bundles.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Zap className="mx-auto mb-4 text-slate-200" size={48} />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-black">No bundles created yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
