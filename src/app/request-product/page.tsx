'use client';

import { useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Send, Loader2, ArrowLeft, CheckCircle2, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';

export default function RequestProductPage() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        productName: '',
        brand: '',
        notes: ''
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.productName) {
            alert("Please fill in the required fields.");
            return;
        }

        if (!isValidBDPhone(formData.phone)) {
            alert("Please enter a valid 11-digit Bangladeshi phone number.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = '';
            if (image) {
                const storageRef = ref(storage, `product-requests/${Date.now()}_${image.name}`);
                const snapshot = await uploadBytes(storageRef, image);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'requestedItems'), {
                title: formData.productName,
                brand: formData.brand,
                description: formData.notes,
                phone: formData.phone,
                customerName: formData.name, // Adding this for admin convenience
                imageUrl,
                status: 'Pending',
                createdAt: serverTimestamp(),
                adminNotes: ''
            });

            setIsSuccess(true);
        } catch (error) {
            console.error("Failed to submit request:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tighter mb-2">Request Received!</h2>
                <p className="text-slate-500 font-bold max-w-md mb-8">
                    Thank you, {formData.name.split(' ')[0]}. Our sourcing team has been notified. We'll reach out to you at {formData.phone} once we have an update.
                </p>
                <Link href="/products">
                    <Button className="bg-brand-blue-900 text-white font-black uppercase tracking-widest px-10 py-6 rounded-2xl">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-16 flex items-center px-4 md:px-6">
                <div className="max-w-[1320px] mx-auto w-full flex items-center justify-between">
                    <Link href="/products" className="p-2 -ml-2 text-brand-blue-900 active:scale-95 transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xs font-black uppercase tracking-[0.3em] text-brand-blue-900 italic">Product Sourcing</h1>
                    <div className="w-8"></div>
                </div>
            </header>

            <main className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
                <div className="bg-brand-blue-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-brand-blue-900/40 border border-brand-blue-800 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-blue-600/20 rounded-full blur-[60px] -ml-24 -mb-24" />

                    <div className="relative z-10">
                        <div className="mb-10 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-gold-500 flex items-center justify-center text-brand-blue-950 shadow-lg shrink-0">
                                    <PackageSearch size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Special Request</h2>
                                    <p className="text-[10px] text-brand-gold-400 font-black uppercase tracking-[0.25em] mt-2">Personal Sourcing Service</p>
                                </div>
                            </div>
                            <p className="text-sm text-white font-bold leading-relaxed">
                             Can't find a specific chocolate, perfume, or cosmetic? Tell us about it, and we'll source it directly from <span className="text-white underline decoration-brand-gold-500/50 underline-offset-4">UK, US, or EU</span> for you.
                        </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Abdullah Khan"
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:border-brand-gold-500 outline-none transition-all placeholder:text-white/20"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="01XXXXXXXXX"
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:border-brand-gold-500 outline-none transition-all placeholder:text-white/20"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
                                        maxLength={11}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Desired Product Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Lindt Excellence 85% Dark Chocolate 100g"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:border-brand-gold-500 outline-none transition-all placeholder:text-white/20"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Brand (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lindt & Sprüngli"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:border-brand-gold-500 outline-none transition-all placeholder:text-white/20"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Additional Details</label>
                                <textarea
                                    placeholder="Any specific flavor, size, or variant? Provide links if any..."
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:bg-white/10 focus:border-brand-gold-500 outline-none transition-all placeholder:text-white/20 min-h-[140px] resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Upload Reference Photo</label>
                                <div 
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                    className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-brand-gold-500 transition-all relative overflow-hidden group/upload"
                                >
                                    {imagePreview ? (
                                        <Image src={imagePreview} alt="Preview" fill className="object-contain p-6" />
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 group-hover/upload:text-brand-gold-500 transition-colors mb-4">
                                                <Camera size={32} />
                                            </div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Tap to upload / take photo</span>
                                        </>
                                    )}
                                    <input 
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-brand-gold-500 hover:bg-white text-brand-blue-950 font-black rounded-2xl shadow-2xl shadow-brand-gold-500/20 transition-all active:scale-95 flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>Send Request <Send size={18} /></>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 bg-brand-gold-50/50 p-6 rounded-[2rem] border border-brand-gold-100 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-brand-gold-500 text-white flex items-center justify-center shrink-0">
                        <PackageSearch size={16} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-brand-gold-700 uppercase tracking-widest mb-1">How it works</h4>
                        <p className="text-[9px] text-brand-gold-600 font-bold leading-relaxed uppercase tracking-wide">
                            Once you submit, our global agents will check availability in their respective regions. We will reach out to you within 24-48 hours with pricing and estimated delivery date.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
