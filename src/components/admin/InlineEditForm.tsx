'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { triggerRestockNotifications } from '@/lib/notifications';
import type { Product, ProductVariant } from '@/types';
import { CATEGORIES } from '@/config/categories';
import {
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
    Trash2,
    Plus,
    GripVertical
} from 'lucide-react';
import Image from 'next/image';

const VARIANT_TYPES = ['Weight', 'Size', 'Color', 'Pack Size', 'Flavor', 'Other'];

interface InlineEditFormProps {
    product: Product;
    onClose: () => void;
    onSaveSuccess: (updatedProduct: Product) => void;
}

export function InlineEditForm({ product, onClose, onSaveSuccess }: InlineEditFormProps) {
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    
    // File states
    const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
    const [primaryImagePreview, setPrimaryImagePreview] = useState<string>(product.image || product.imageURL || '');
    
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
    const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
    const [existingGallery, setExistingGallery] = useState<string[]>(product.gallery || []);

    // Form data state
    const [formData, setFormData] = useState({
        title: product.name || product.title || '',
        description: product.description || '',
        price: product.price ? String(product.price) : '',
        oldPrice: product.originalPrice || product.marketPrice || product.oldPrice ? String(product.originalPrice || product.marketPrice || product.oldPrice) : '',
        buyingPrice: product.buyingPrice ? String(product.buyingPrice) : '',
        stock: product.stock ? String(product.stock) : '',
        category: product.category || CATEGORIES[0].name,
        categoryId: product.categoryId || CATEGORIES[0].id,
        subcategory: product.subcategory || '',
        productType: product.productType || '',
        gender: product.gender || 'Unisex',
        brand: product.brand || '',
        sku: product.sku || '',
        status: product.status || 'active',
        weight: product.weight || '',
        size: product.size || '',
        supplier: product.supplier || '',
        aliases: product.aliases ? product.aliases.join(', ') : ''
    });

    // Variants state
    const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
    const [newVariant, setNewVariant] = useState({ type: VARIANT_TYPES[0], label: '', priceAdjustment: '', stock: '' });

    // Handle primary image file pick
    const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPrimaryImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPrimaryImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle adding files to gallery queue
    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setNewGalleryFiles(prev => [...prev, ...fileArray]);

            fileArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewGalleryPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // Remove file from gallery queue
    const removeQueuedGalleryImage = (idx: number) => {
        setNewGalleryFiles(prev => prev.filter((_, i) => i !== idx));
        setNewGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    // Delete existing image URL from gallery
    const removeExistingGalleryImage = (urlToRemove: string) => {
        setExistingGallery(prev => prev.filter(url => url !== urlToRemove));
    };

    // Variant helpers
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

    const normalizeTitle = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const generateSearchKeywords = (title: string, brand: string, category: string) => {
        const keywords = new Set<string>();
        const fullString = `${title} ${brand} ${category}`.toLowerCase();
        const words = fullString.split(/[^a-z0-9]/).filter(w => w.length >= 2);
        words.forEach(word => {
            keywords.add(word);
            for (let i = 3; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        });
        return Array.from(keywords);
    };

    // Promise wrapper for resumable upload
    const uploadFilePromise = (file: File, keyName: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const storageRef = ref(storage, `products/${timestamp}-${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setUploadProgress(prev => ({ ...prev, [keyName]: pct }));
                },
                (error) => {
                    console.error("Resumable upload error for key", keyName, error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(`${downloadUrl}&v=${timestamp}`);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setUploadProgress({});

        try {
            // 1. Upload primary image if changed
            let finalPrimaryUrl = product.image || product.imageURL || '';
            if (primaryImageFile) {
                finalPrimaryUrl = await uploadFilePromise(primaryImageFile, 'primary');
            } else if (!primaryImagePreview) {
                // If user deleted the main image preview completely
                finalPrimaryUrl = '';
            }

            // 2. Upload queued new gallery images
            const uploadedGalleryUrls: string[] = [];
            for (let i = 0; i < newGalleryFiles.length; i++) {
                const file = newGalleryFiles[i];
                const key = `gallery-${i}`;
                const url = await uploadFilePromise(file, key);
                uploadedGalleryUrls.push(url);
            }

            // 3. Assemble final gallery list
            const finalGalleryList = [...existingGallery, ...uploadedGalleryUrls];

            // 4. Update product details in Firestore
            const docRef = doc(db, 'products', product.id!);
            const currentDocSnap = await getDoc(docRef);
            const currentData = currentDocSnap.exists() ? currentDocSnap.data() : {};
            
            const previousStock = currentData.stock || 0;
            const previousDescription = currentData.description || '';
            const previousImage = currentData.image || currentData.imageURL || '';
            const existingDeletedDescriptions = currentData.deletedDescriptions || [];
            const existingDeletedImages = currentData.deletedImages || [];
            
            const newStock = parseInt(formData.stock) || 0;

            const updatedDeletedDescriptions = [...existingDeletedDescriptions];
            if (formData.description !== previousDescription && previousDescription) {
                updatedDeletedDescriptions.push({
                    text: previousDescription,
                    deletedAt: new Date().toISOString()
                });
            }

            const updatedDeletedImages = [...existingDeletedImages];
            if (finalPrimaryUrl !== previousImage && previousImage) {
                updatedDeletedImages.push({
                    url: previousImage,
                    deletedAt: new Date().toISOString()
                });
            }

            const updateData: Record<string, any> = {
                ...formData,
                name: formData.title,
                title: formData.title,
                lowercaseTitle: formData.title.toLowerCase(),
                normalized_title: normalizeTitle(formData.title),
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
                price: parseFloat(formData.price) || 0,
                oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                marketPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                originalPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
                buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
                stock: newStock,
                image: finalPrimaryUrl,
                imageURL: finalPrimaryUrl,
                gallery: finalGalleryList,
                categoryId: formData.categoryId,
                normalizedCategory: formData.categoryId,
                aliases: formData.aliases.split(',').map(s => s.trim()).filter(s => s),
                variants: variants,
                searchKeywords: generateSearchKeywords(formData.title, formData.brand, formData.category),
                isActive: formData.status === 'active',
                isDeleted: false,
                status: formData.status || 'active',
                statusLabel: newStock > 0 ? 'In Stock' : 'Out of Stock',
                updatedAt: serverTimestamp(),
                deletedDescriptions: updatedDeletedDescriptions,
                deletedImages: updatedDeletedImages
            };

            await updateDoc(docRef, updateData);

            if (previousStock === 0 && newStock > 0) {
                await triggerRestockNotifications(product.id!, formData.title);
            }

            const completeUpdatedProduct = {
                ...product,
                ...updateData,
                id: product.id
            } as Product;

            onSaveSuccess(completeUpdatedProduct);
            onClose();
        } catch (error: any) {
            console.error("Error updating product inline:", error);
            alert(`Failed to save changes: ${error?.message || error}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50/70 p-6 rounded-[2rem] border border-slate-200/60 shadow-inner grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-slate-800 text-left">
            {/* Visuals Upload Section */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product Visuals</h4>

                    {/* Primary Image Slot */}
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Cover Image</p>
                    <div className={`relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed transition-all mb-4 ${primaryImagePreview ? 'border-brand-blue-100' : 'border-slate-200 bg-slate-50/50'}`}>
                        {primaryImagePreview ? (
                            <>
                                <Image src={primaryImagePreview} alt="Preview" fill className="object-contain p-2" />
                                <button
                                    type="button"
                                    onClick={() => { setPrimaryImageFile(null); setPrimaryImagePreview(''); }}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow hover:scale-105 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-2 border">
                                    <Upload size={18} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Upload Cover</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImageChange} />
                            </label>
                        )}
                        {uploadProgress['primary'] !== undefined && (
                            <div className="absolute bottom-0 left-0 right-0 bg-brand-blue-900 text-white text-[8px] font-black text-center py-1">
                                Uploading cover: {uploadProgress['primary']}%
                            </div>
                        )}
                    </div>

                    {/* Multi-Gallery Image Grid */}
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gallery Images ({existingGallery.length + newGalleryFiles.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Existing Gallery Images */}
                        {existingGallery.map((url, index) => (
                            <div key={`exist-${index}`} className="relative aspect-square rounded-xl bg-slate-50 border overflow-hidden">
                                <Image src={url} alt={`Gallery ${index}`} fill className="object-contain p-1" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingGalleryImage(url)}
                                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md hover:scale-105 transition-all"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}

                        {/* Queued Gallery Previews */}
                        {newGalleryPreviews.map((url, index) => (
                            <div key={`new-${index}`} className="relative aspect-square rounded-xl bg-slate-50 border border-brand-blue-200 overflow-hidden">
                                <Image src={url} alt={`Queued ${index}`} fill className="object-contain p-1" />
                                <button
                                    type="button"
                                    onClick={() => removeQueuedGalleryImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md hover:scale-105 transition-all"
                                >
                                    <X size={10} />
                                </button>
                                {uploadProgress[`gallery-${index}`] !== undefined && (
                                    <div className="absolute inset-x-0 bottom-0 bg-brand-blue-900 text-white text-[7px] font-black text-center py-0.5">
                                        {uploadProgress[`gallery-${index}`]}%
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Gallery Files Slot */}
                        <label className="aspect-square rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <Plus size={16} className="text-slate-400 mb-1" />
                            <span className="text-[7px] font-black uppercase text-slate-400">Add More</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Product Details Fields */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    {/* Core Information */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                <Type size={14} />
                            </div>
                            <h5 className="text-xs font-black text-brand-blue-900 uppercase tracking-wider">Core Info</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Product Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Brand</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                <DollarSign size={14} />
                            </div>
                            <h5 className="text-xs font-black text-brand-blue-900 uppercase tracking-wider">Pricing & Stock</h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">MSRP (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.oldPrice}
                                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1.5 block italic">Cost (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.buyingPrice}
                                    onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-rose-50/30 border border-rose-100 rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-brand-blue-600 uppercase tracking-widest mb-1.5 block">Price (৳)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-brand-blue-50/50 border border-brand-blue-100 rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Stock Level</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-100 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metadata & Tagging */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                <Layers size={14} />
                            </div>
                            <h5 className="text-xs font-black text-brand-blue-900 uppercase tracking-wider">Metadata</h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => {
                                        const selectedCat = CATEGORIES.find(c => c.id === e.target.value);
                                        if (selectedCat) {
                                            setFormData({ ...formData, categoryId: selectedCat.id, category: selectedCat.name });
                                        }
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none cursor-pointer"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Subcategory</label>
                                <input
                                    type="text"
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Product Type</label>
                                <input
                                    type="text"
                                    value={formData.productType}
                                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none cursor-pointer"
                                >
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Unisex">Unisex</option>
                                    <option value="Kids">Kids</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Weight/Volume</label>
                                <input
                                    type="text"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Size/Variant</label>
                                <input
                                    type="text"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Supplier</label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Visibility Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'draft' | 'archived' })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none cursor-pointer"
                                >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Search Aliases (Comma Separated)</label>
                                <input
                                    type="text"
                                    value={formData.aliases}
                                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-brand-blue-900 focus:bg-white outline-none"
                                    placeholder="e.g. snack, import, fingers"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Variants management */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-brand-blue-50 text-brand-blue-600 rounded-lg">
                                <Layers size={14} />
                            </div>
                            <h5 className="text-xs font-black text-brand-blue-900 uppercase tracking-wider">Product Variants</h5>
                        </div>

                        {/* Add Variant Widget */}
                        <div className="bg-slate-50 p-4 rounded-xl mb-4 border grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                            <div>
                                <label className="text-[7px] font-black text-slate-400 uppercase mb-1 block">Type</label>
                                <select
                                    value={newVariant.type}
                                    onChange={(e) => setNewVariant({ ...newVariant, type: e.target.value })}
                                    className="w-full px-2 py-2 bg-white rounded-lg text-[10px] font-bold outline-none border cursor-pointer"
                                >
                                    {VARIANT_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[7px] font-black text-slate-400 uppercase mb-1 block">Label</label>
                                <input
                                    type="text"
                                    value={newVariant.label}
                                    onChange={(e) => setNewVariant({ ...newVariant, label: e.target.value })}
                                    className="w-full px-2 py-2 bg-white rounded-lg text-[10px] font-bold outline-none border"
                                    placeholder="500g"
                                />
                            </div>
                            <div>
                                <label className="text-[7px] font-black text-slate-400 uppercase mb-1 block">Price +/- (৳)</label>
                                <input
                                    type="number"
                                    value={newVariant.priceAdjustment}
                                    onChange={(e) => setNewVariant({ ...newVariant, priceAdjustment: e.target.value })}
                                    className="w-full px-2 py-2 bg-white rounded-lg text-[10px] font-bold outline-none border"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[7px] font-black text-slate-400 uppercase mb-1 block">Stock</label>
                                <input
                                    type="number"
                                    value={newVariant.stock}
                                    onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                    className="w-full px-2 py-2 bg-white rounded-lg text-[10px] font-bold outline-none border"
                                    placeholder="Optional"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addVariant}
                                disabled={!newVariant.label.trim()}
                                className="px-3 py-2 bg-brand-blue-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-brand-blue-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                <Plus size={10} /> Add
                            </button>
                        </div>

                        {/* Variants List */}
                        {variants.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {variants.map((v) => (
                                    <div key={v.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg hover:border-brand-blue-200 transition-all">
                                        <span className="text-[8px] font-black text-brand-blue-600 bg-brand-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                            {v.type}
                                        </span>
                                        <span className="text-xs font-bold text-brand-blue-900">{v.label}</span>
                                        {v.priceAdjustment ? (
                                            <span className={`text-[9px] font-black ${(v.priceAdjustment || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {(v.priceAdjustment || 0) > 0 ? '+' : ''}{v.priceAdjustment}৳
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(v.id)}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest py-2 italic">
                                No variants added.
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-brand-blue-900 text-white hover:bg-brand-blue-800 text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-75"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
