'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ShieldCheck, Star, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { isValidBDPhone, sanitizePhone } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function GCRequestForm() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'eligible' | 'not_eligible' | 'submitting' | 'success'>('idle');
    const [error, setError] = useState('');
    const [totalSpent, setTotalSpent] = useState(0);

    const checkEligibility = async () => {
        if (!isValidBDPhone(phone)) {
            setError('Please enter a valid BD phone number');
            return;
        }

        setStatus('checking');
        setError('');

        try {
            const sanitized = sanitizePhone(phone);
            
            // 1. Check if already a member
            const membersRef = collection(db, 'goldenCircleUsers');
            const memberSnap = await getDocs(query(membersRef, where('__name__', '==', sanitized)));
            
            if (!memberSnap.empty) {
                setError('This number is already a Golden Circle member');
                setStatus('idle');
                return;
            }

            // 2. Check for existing pending request
            const requestsRef = collection(db, 'goldenCircleRequests');
            const existingReqSnap = await getDocs(query(requestsRef, where('phoneNumber', '==', sanitized), where('status', '==', 'pending')));
            
            if (!existingReqSnap.empty) {
                setError('You already have a pending membership request');
                setStatus('idle');
                return;
            }

            // 3. Check order history for 2000 BDT requirement
            // We search in both customerInfo.phone and customer.phone
            const ordersRef = collection(db, 'orders');
            
            // Check customerInfo.phone
            const q1 = query(ordersRef, where('customerInfo.phone', '==', sanitized));
            const snap1 = await getDocs(q1);
            
            // Check customer.phone
            const q2 = query(ordersRef, where('customer.phone', '==', sanitized));
            const snap2 = await getDocs(q2);

            let spent = 0;
            const processedOrderIds = new Set();

            [...snap1.docs, ...snap2.docs].forEach(doc => {
                if (processedOrderIds.has(doc.id)) return;
                processedOrderIds.add(doc.id);
                const data = doc.data();
                // Use pricing.total or total field
                const orderTotal = data.pricing?.total || data.total || 0;
                spent += orderTotal;
            });

            setTotalSpent(spent);

            if (spent >= 2000) {
                setStatus('eligible');
            } else {
                setStatus('not_eligible');
                setError(`Requirement not met. Total purchases: ৳${spent.toLocaleString()}. Minimum ৳2,000 required.`);
            }
        } catch (err) {
            console.error('Eligibility check error:', err);
            setError('An error occurred during verification');
            setStatus('idle');
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            setError('Please enter your full name');
            return;
        }

        setStatus('submitting');
        try {
            const sanitized = sanitizePhone(phone);
            await addDoc(collection(db, 'goldenCircleRequests'), {
                phoneNumber: sanitized,
                name: name,
                status: 'pending',
                requestedAt: serverTimestamp(),
                source: 'manual',
                totalSpentAtRequest: totalSpent
            });
            setStatus('success');
        } catch (err) {
            setError('Failed to submit request');
            setStatus('eligible');
        }
    };

    if (status === 'success') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4"
            >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Request Received!</h3>
                <p className="text-sm font-bold text-emerald-700/80 uppercase leading-relaxed">
                    Our team will review your purchase history (৳{totalSpent.toLocaleString()}) and activate your Golden Circle membership within 24 hours.
                </p>
                <Button 
                    variant="outline" 
                    className="w-full mt-4 text-emerald-700 border-emerald-200"
                    onClick={() => setStatus('idle')}
                >
                    Submit Another
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-brand-blue-900/5 border border-slate-100 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <ShieldCheck className="text-brand-blue-50 opacity-10" size={80} />
            </div>

            <div className="space-y-1 relative z-10">
                <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight">Join the Circle</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Verification required • ৳2,000 min. purchase
                </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-4 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-blue-900/60 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                        <input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (status !== 'idle') setStatus('idle');
                            }}
                            disabled={status === 'checking' || status === 'submitting' || status === 'eligible'}
                            className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-brand-blue-950 placeholder:text-slate-300 focus:border-brand-blue-600 focus:bg-white outline-none transition-all disabled:opacity-50"
                        />
                        {status === 'idle' && (
                            <button
                                type="button"
                                onClick={checkEligibility}
                                className="absolute right-2 top-2 bottom-2 bg-brand-blue-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                                Verify
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'eligible' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                                    <Star size={16} fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tight leading-none">Status: Eligible</p>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Purchased: ৳{totalSpent.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-blue-900/60 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-brand-blue-950 placeholder:text-slate-300 focus:border-brand-blue-600 focus:bg-white outline-none transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full h-14 bg-brand-blue-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                            >
                                {status === 'submitting' ? <Loader2 className="animate-spin" size={18} /> : <>Request Membership <ArrowRight size={18} /></>}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wide leading-none">{error}</span>
                    </div>
                )}

                {status === 'checking' && (
                    <div className="flex items-center justify-center py-4 gap-3 text-slate-400">
                        <Loader2 className="animate-spin text-brand-blue-600" size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verifying history...</span>
                    </div>
                )}
            </form>
        </div>
    );
}
