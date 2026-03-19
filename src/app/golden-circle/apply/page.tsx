'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send, ShieldCheck, Star, User, Phone, MapPin, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';

export default function GoldenCircleApply() {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoApproved, setAutoApproved] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: 'Dhaka Central',
    });

    const updateField = (field: string, value: string) => {
        const processedValue = field === 'phone' ? sanitizePhone(value) : value;
        setFormData(prev => ({ ...prev, [field]: processedValue }));
    };

    const handleNext = () => {
        if (step === 1 && !isValidBDPhone(formData.phone)) {
            setError('Please enter a valid 11-digit Bangladeshi phone number.');
            return;
        }
        setError('');
        setLoading(true);
        setTimeout(() => {
            setStep(prev => prev + 1);
            setLoading(false);
        }, 600);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!isValidBDPhone(formData.phone)) {
            setError('Please enter a valid 11-digit Bangladeshi phone number.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Check if phone already has purchase history ≥ ৳2,000
            let totalPurchases = 0;
            let shouldAutoApprove = false;
            try {
                const ordersQ = query(
                    collection(db, 'orders'),
                    where('phone', '==', formData.phone.trim())
                );
                const ordersSnap = await getDocs(ordersQ);
                totalPurchases = ordersSnap.docs.reduce((sum, d) => {
                    const data = d.data();
                    return sum + (data.total || data.totalAmount || 0);
                }, 0);
                shouldAutoApprove = totalPurchases >= 2000;
            } catch {
                // Orders collection might not exist yet, that's okay
            }

            await addDoc(collection(db, 'goldenCircleApplications'), {
                fullName: formData.fullName,
                phone: formData.phone.trim(),
                address: formData.address,
                city: formData.city,
                status: shouldAutoApprove ? 'approved' : 'pending',
                autoApproved: shouldAutoApprove,
                totalPurchases: totalPurchases,
                submittedAt: serverTimestamp(),
            });

            // If auto-approved, also create the member record directly
            if (shouldAutoApprove) {
                await addDoc(collection(db, 'goldenMembers'), {
                    name: formData.fullName,
                    phone: formData.phone.trim(),
                    address: formData.address,
                    city: formData.city,
                    joinDate: serverTimestamp(),
                    totalSpent: totalPurchases,
                    totalSaved: 0,
                    lifetimeSavings: 0,
                    status: 'active'
                });
            }

            setAutoApproved(shouldAutoApprove);
            setLoading(false);
            setSubmitted(true);
        } catch (err: unknown) {
            setLoading(false);
            console.error('Error submitting application:', err);
            setError('Failed to submit. Please try again.');
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-brand-blue-950 flex flex-col items-center justify-center p-8 text-center text-white selection:bg-brand-gold-500 selection:text-brand-blue-950">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-12">
                    <div className="w-32 h-32 bg-brand-gold-500 rounded-full flex items-center justify-center shadow-3xl shadow-brand-gold-500/20 relative z-10">
                        <CheckCircle2 size={64} className="text-brand-blue-950" />
                    </div>
                    <div className="absolute inset-0 bg-brand-gold-500 rounded-full animate-ping opacity-20"></div>
                </motion.div>
                <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase italic">
                    {autoApproved ? 'Welcome!' : 'Application Received'}
                </h1>
                <p className="text-slate-400 font-medium max-w-sm mx-auto mb-12 uppercase tracking-widest text-xs leading-relaxed">
                    {autoApproved
                        ? 'Your membership has been automatically approved based on your purchase history (≥৳2,000). You can now log in!'
                        : 'Our team is reviewing your application. You will receive a notification within 24-48 hours.'
                    }
                </p>
                {autoApproved ? (
                    <Link href="/golden-circle" className="px-12 py-4 bg-brand-gold-500 text-brand-blue-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-gold-400 transition-all shadow-2xl shadow-brand-gold-500/30">
                        Login to Dashboard
                    </Link>
                ) : (
                    <Link href="/" className="px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                        Return to Storefront
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c14] text-white flex flex-col font-sans selection:bg-[#f2b90d] selection:text-[#0a0c14]">
            {/* Header */}
            <header className="px-8 py-8 flex items-center justify-between">
                <Link href="/golden-circle" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-[#f2b90d] hover:text-[#0a0c14] transition-all border border-white/10">
                    <ArrowLeft size={20} />
                </Link>
                <div className="relative h-6 w-32 opacity-80 transition-opacity hover:opacity-100">
                    <Image src="/brand_logo.jpeg" alt="Logo" fill className="object-contain brightness-0 invert" />
                </div>
                <div className="w-12"></div>
            </header>

            <main className="flex-1 flex flex-col items-center px-8 pt-4 pb-20 overflow-hidden">
                {/* Progress */}
                <div className="w-full max-w-lg mb-16 px-4">
                    <div className="flex justify-between mb-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${step >= s ? 'bg-[#f2b90d] border-[#f2b90d] text-[#0a0c14] scale-110 shadow-lg shadow-[#f2b90d]/20' : 'bg-transparent border-white/20 text-slate-500'}`}>
                                    {s}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${step >= s ? 'text-[#f2b90d]' : 'text-slate-600'}`}>
                                    {s === 1 ? 'Identity' : s === 2 ? 'Context' : 'Submit'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="absolute top-0 left-0 h-full bg-[#f2b90d]" initial={{ width: '0%' }} animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                </div>

                <div className="w-full max-w-lg relative">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Personal Identity</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verification of primary elite status</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                            <input type="text" placeholder="Your Name" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full bg-white/5 border-2 border-transparent focus:border-brand-gold-500 focus:bg-white/10 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold transition-all outline-none" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                            <input 
                                                type="tel" 
                                                placeholder="01XXXXXXXXX" 
                                                value={formData.phone} 
                                                onChange={(e) => updateField('phone', e.target.value)} 
                                                maxLength={11}
                                                className="w-full bg-white/5 border-2 border-transparent focus:border-brand-gold-500 focus:bg-white/10 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold transition-all outline-none" 
                                            />
                                        </div>
                                        {error && step === 1 && (
                                            <p className="text-[10px] text-red-400 font-bold mt-2 ml-2 uppercase tracking-tight">{error}</p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={handleNext} disabled={loading || !formData.fullName.trim() || !formData.phone.trim()} className="w-full bg-[#f2b90d] h-16 rounded-2xl text-[#0a0c14] font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-xl shadow-[#f2b90d]/10">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Next <ArrowRight size={18} /></>}
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Delivery Address</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Priority shipping details</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                            <input type="text" placeholder="Apartment, Street, Area" value={formData.address} onChange={(e) => updateField('address', e.target.value)} className="w-full bg-white/5 border-2 border-transparent focus:border-brand-gold-500 focus:bg-white/10 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold transition-all outline-none" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">City</label>
                                        <div className="relative">
                                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                            <select value={formData.city} onChange={(e) => updateField('city', e.target.value)} className="w-full bg-white/5 border-2 border-transparent focus:border-brand-gold-500 focus:bg-white/10 rounded-2xl py-5 pl-16 pr-8 text-sm font-bold transition-all outline-none appearance-none cursor-pointer">
                                                <option>Dhaka Central</option>
                                                <option>Chattogram Hub</option>
                                                <option>Sylhet Link</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="px-8 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest py-5">Back</button>
                                    <button onClick={handleNext} disabled={loading || !formData.address.trim()} className="flex-1 bg-brand-gold-500 h-16 rounded-2xl text-brand-blue-950 font-black uppercase tracking-widest text-xs hover:bg-brand-gold-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Continue <ArrowRight size={18} /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Confirm & Submit</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Review your application details</p>
                                </div>

                                {/* Auto-approval info */}
                                <div className="p-6 rounded-2xl bg-brand-gold-500/5 border border-brand-gold-500/20 text-center">
                                    <ShieldCheck className="mx-auto text-brand-gold-400 mb-4" size={40} />
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed uppercase tracking-widest mb-2">
                                        Customers with ≥৳2,000 total purchases using the same phone number are <strong className="text-brand-gold-400">automatically approved</strong>.
                                    </p>
                                </div>

                                {/* Summary */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-gold-400 mb-4">Application Summary</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Name</span>
                                        <span className="font-bold">{formData.fullName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Phone</span>
                                        <span className="font-bold">{formData.phone}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Address</span>
                                        <span className="font-bold truncate ml-4">{formData.address}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">City</span>
                                        <span className="font-bold">{formData.city}</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                        <p className="text-sm text-red-400 font-medium">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="flex gap-4">
                                    <button type="button" onClick={() => setStep(2)} className="px-8 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest py-5">Back</button>
                                    <button type="submit" disabled={loading} className="flex-1 bg-[#f2b90d] h-16 rounded-2xl text-[#0a0c14] font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center justify-center gap-2 shadow-2xl shadow-[#f2b90d]/30 disabled:opacity-60">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Submit Application <Send size={18} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
