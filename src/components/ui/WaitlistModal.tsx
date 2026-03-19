'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { Product } from '@/types';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';

interface WaitlistModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export function WaitlistModal({ product, isOpen, onClose }: WaitlistModalProps) {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !phone) return;

        if (!isValidBDPhone(phone)) {
            setError('Please enter a valid 11-digit Bangladeshi phone number.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const docRef = doc(db, 'waitlists', product.id || product.slug);
            const docSnap = await getDoc(docRef);

            const userData = {
                phone,
                email: email || null,
                userId: null, // Future: Add auth userId here
                timestamp: new Date().toISOString()
            };

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    productId: product.id || product.slug,
                    productName: product.name || product.title,
                    users: [userData],
                    waitlistCount: 1,
                    updatedAt: serverTimestamp()
                });
            } else {
                await updateDoc(docRef, {
                    users: arrayUnion(userData),
                    waitlistCount: increment(1),
                    updatedAt: serverTimestamp()
                });
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setPhone('');
                setEmail('');
            }, 3000);
        } catch (err) {
            console.error("Waitlist error:", err);
            setError('Failed to join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-blue-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-brand-blue-900 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {success ? (
                            <div className="flex flex-col items-center text-center py-8">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">You're on the list!</h2>
                                <p className="text-slate-500 font-medium">We'll alert you the moment {product?.name || product?.title} is back in stock.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 bg-brand-blue-50 text-brand-blue-600 rounded-2xl flex items-center justify-center">
                                        <Bell size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Restock Alert</h2>
                                        <p className="text-[10px] font-black text-brand-gold-600 uppercase tracking-[0.2em]">{product?.brand || 'Premium Import'}</p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-6 line-clamp-2 italic uppercase">
                                    {product?.name || product?.title}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                                                placeholder="01XXXXXXXXX"
                                                maxLength={11}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:bg-white transition-all text-brand-blue-900 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-brand-blue-900/50 uppercase tracking-widest mb-2 px-1">Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="alex@example.com"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:bg-white transition-all text-brand-blue-900 font-bold"
                                            />
                                        </div>
                                    </div>

                                    {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}

                                    <Button
                                        disabled={loading}
                                        className="w-full py-6 bg-brand-blue-900 hover:bg-brand-blue-950 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Notify Me When Available'}
                                    </Button>

                                    <p className="text-[10px] text-center text-brand-blue-900/40 font-bold uppercase tracking-widest leading-relaxed">
                                        By joining, you'll receive a one-time SMS alert <br /> when this premium import restocks.
                                    </p>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
