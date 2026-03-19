'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, CreditCard, Wallet, Loader2, Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { 
    collection, 
    serverTimestamp, 
    doc, 
    runTransaction, 
    getDocs, 
    query, 
    where, 
    addDoc, 
    getDoc,
    setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckoutProgress } from '@/components/ui/CheckoutProgress';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';
import { useMemberAuth } from '@/context/MemberAuthContext';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { isGoldenCircleUser, phoneNumber } = useMemberAuth();
    const [mounted, setMounted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        city: 'Dhaka',
        notes: ''
    });
    const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('dhaka');
    const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'cod'>('cod');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isGCMatch, setIsGCMatch] = useState(false);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isGoldenCircleUser && phoneNumber) {
            setCustomerInfo(prev => ({ ...prev, phone: phoneNumber }));
            setIsGCMatch(true);
        }
    }, [isGoldenCircleUser, phoneNumber]);

    // Automatic Golden Circle Phone Match
    useEffect(() => {
        const checkPhone = async () => {
            const sanitized = sanitizePhone(customerInfo.phone);
            if (sanitized.length === 11 && isValidBDPhone(sanitized)) {
                if (isGoldenCircleUser && sanitized === phoneNumber) {
                    setIsGCMatch(true);
                    return;
                }
                
                setIsCheckingPhone(true);
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const docRef = doc(db, 'goldenCircleUsers', sanitized);
                    const docSnap = await getDoc(docRef);
                    setIsGCMatch(docSnap.exists() && docSnap.data()?.isActive === true);
                } catch (error) {
                    console.error("GC Phone match error:", error);
                } finally {
                    setIsCheckingPhone(false);
                }
            } else {
                if (!isGoldenCircleUser) setIsGCMatch(false);
            }
        };

        const timer = setTimeout(checkPhone, 500);
        return () => clearTimeout(timer);
    }, [customerInfo.phone, isGoldenCircleUser, phoneNumber]);


    if (!mounted) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-blue-600" size={32} /></div>;
    }

    if (items.length === 0 && !isNavigating) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Image src="/brand_logo.jpeg" alt="Logo" width={64} height={64} className="rounded-full object-cover" />
                </div>
                <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Cart is Empty</h2>
                <p className="text-slate-500 font-bold mb-8">You have no items to checkout.</p>
                <Link href="/products">
                    <Button className="bg-brand-blue-900 text-white font-black uppercase tracking-widest px-8">Return to Shop</Button>
                </Link>
            </div>
        );
    }

    if (isNavigating) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                     <div className="w-20 h-20 bg-brand-blue-50 rounded-full flex items-center justify-center">
                         <ShieldCheck className="text-brand-blue-600 animate-pulse" size={40} />
                     </div>
                     <div className="absolute inset-0 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Finalizing Order</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest animate-bounce">One second while we secure your imports...</p>
            </div>
        );
    }

    const subtotal = getTotalPrice();
    const deliveryCharge = deliveryArea === 'dhaka' ? 70 : 140;
    const isGCDiscountEligible = isGoldenCircleUser || isGCMatch;
    const goldenCirclePromo = isGCDiscountEligible ? Math.round(subtotal * 0.03) : 0;
    const totalPayable = subtotal + deliveryCharge - goldenCirclePromo;

    const handleFinalize = async () => {
        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
            alert("Please fill in all required delivery fields (Name, Phone, Address, City).");
            return;
        }

        if (!isValidBDPhone(customerInfo.phone)) {
            alert("Please enter a valid 11-digit Bangladeshi phone number.");
            return;
        }

        setIsSubmitting(true);
        try {
            const orderDocId = await runTransaction(db, async (transaction) => {
                // Collect required stock per product ID (unwrapping bundles)
                const requiredProducts = new Map<string, { title: string, qty: number }>();
                for (const item of items) {
                    if (item.isBundle && item.bundleProducts) {
                        for (const pid of item.bundleProducts) {
                            const current = requiredProducts.get(pid);
                            requiredProducts.set(pid, {
                                title: `part of ${item.title}`,
                                qty: (current?.qty || 0) + item.quantity
                            });
                        }
                    } else {
                        const current = requiredProducts.get(item.id!);
                        requiredProducts.set(item.id!, {
                            title: item.name || item.title || 'Untitled Product',
                            qty: (current?.qty || 0) + item.quantity
                        });
                    }
                }

                // Verify stock and apply deductions
                // First pass: READ all documents
                const productDocs = new Map<string, any>();
                for (const pid of requiredProducts.keys()) {
                    const productRef = doc(db, 'products', pid);
                    const productSnap = await transaction.get(productRef);
                    if (!productSnap.exists()) {
                        throw new Error(`Product "${requiredProducts.get(pid)?.title}" no longer exists.`);
                    }
                    productDocs.set(pid, { ref: productRef, data: productSnap.data() });
                }

                // Verify stock bounds
                for (const [pid, data] of requiredProducts.entries()) {
                    const docData = productDocs.get(pid)!.data;
                    const currentStock = docData.stock || 0;
                    if (currentStock < data.qty) {
                        throw new Error(`Insufficient stock for "${data.title}".`);
                    }
                }

                // Second pass: WRITE all updates
                for (const [pid, data] of requiredProducts.entries()) {
                    const { ref, data: docData } = productDocs.get(pid)!;
                    const currentStock = docData.stock || 0;
                    transaction.update(ref, {
                        stock: currentStock - data.qty,
                        updatedAt: serverTimestamp()
                    });
                }

                const ordersRef = collection(db, 'orders');
                const orderDocRef = doc(ordersRef);
                
                const sanitizedPhone = sanitizePhone(customerInfo.phone);

                // Structured order data as per strict production requirements
                const orderData = {
                    orderId: orderDocRef.id,
                    customerInfo: {
                        name: customerInfo.name,
                        phone: sanitizedPhone,
                        address: customerInfo.address,
                        city: customerInfo.city,
                        zone: deliveryArea === 'dhaka' ? 'inside_dhaka' : 'outside_dhaka',
                        notes: customerInfo.notes || ""
                    },
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name || item.title || "Untitled Product",
                        price: item.price,
                        originalPrice: item.originalPrice || item.marketPrice || item.oldPrice || item.price,
                        marketPrice: item.marketPrice || item.originalPrice || item.oldPrice || item.price,
                        quantity: item.quantity,
                        imageURL: item.imageURL || item.image || ''
                    })),
                    pricing: {
                        subtotal: subtotal,
                        deliveryFee: deliveryCharge,
                        discount: goldenCirclePromo,
                        total: totalPayable
                    },
                    paymentMethod: paymentMethod, // 'cod' or 'bkash'
                    paymentStatus: 'pending',
                    customerPhone: sanitizePhone(customerInfo.phone),
                    customerEmail: "", // Will be filled if user is logged in
                    status: 'Pending',
                    statusHistory: [
                        {
                            status: 'Pending',
                            timestamp: new Date()
                        }
                    ],
                    createdAt: serverTimestamp()
                };

                transaction.set(orderDocRef, orderData);
                return orderDocRef.id;
            });

            setIsNavigating(true);
            clearCart();
            // Redirect to new dedicated confirmation page
            router.push(`/checkout/confirmation/${orderDocId}`);
        } catch (error: any) {
            console.error("Order fulfillment transaction failed:", error);
            alert(error.message || "Failed to place order.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-brand-blue-100 pb-20 lg:pb-12">
            <header className="h-16 w-full bg-white sticky top-0 z-50 flex items-center px-4 border-b border-slate-100">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <Link href="/products" className="p-2 -ml-2 rounded-xl text-brand-blue-900 active:scale-90 transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="font-black text-xs uppercase tracking-[0.3em] text-brand-blue-900 italic">Secure Checkout</h1>
                    <div className="w-8"></div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <CheckoutProgress currentStep="shipping" />
                <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
                    {/* Left: Form */}
                    <div className="lg:col-span-7 space-y-8">
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-brand-blue-900 text-brand-gold-400 flex items-center justify-center text-xs font-black">01</div>
                                <h2 className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">Delivery Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Recipient Name"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white focus:border-brand-blue-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        {!isGCDiscountEligible && !isCheckingPhone && (
                                            <Link href="/golden-circle" className="text-[9px] font-black text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded uppercase tracking-widest hover:bg-brand-blue-100 transition-colors">
                                                Join <Star size={8} className="inline mb-0.5" /> Golden Circle for 3% off
                                            </Link>
                                        )}
                                        {isCheckingPhone && (
                                            <span className="text-[9px] font-black text-slate-400 animate-pulse uppercase tracking-widest">Checking membership...</span>
                                        )}
                                        {isGCDiscountEligible && (
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                                <ShieldCheck size={10} /> {isGCMatch && !isGoldenCircleUser ? 'GC Member Detected' : 'Member Access'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="tel"
                                            placeholder="01XXXXXXXXX"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: sanitizePhone(e.target.value) })}
                                            className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white outline-none transition-all ${isGCMatch ? 'border-emerald-100 focus:border-emerald-500' : 'border-transparent focus:border-brand-blue-600'}`}
                                            disabled={isGoldenCircleUser}
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Area</label>
                                    <select
                                        value={deliveryArea}
                                        onChange={(e) => {
                                            const val = e.target.value as 'dhaka' | 'outside';
                                            setDeliveryArea(val);
                                            setCustomerInfo({ ...customerInfo, city: val === 'dhaka' ? 'Dhaka' : 'Outside Dhaka' });
                                        }}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white focus:border-brand-blue-600 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="dhaka">Metro Dhaka (৳70)</option>
                                        <option value="outside">Outside Dhaka (৳140)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area / City</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dhanmondi, Banani"
                                        value={customerInfo.city}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white focus:border-brand-blue-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Delivery Address</label>
                                    <textarea
                                        placeholder="House, Road, Block, Neighborhood details..."
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white focus:border-brand-blue-600 outline-none transition-all resize-none min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-brand-blue-900 text-brand-gold-400 flex items-center justify-center text-xs font-black">02</div>
                                <h2 className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">Payment Method</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'cod' ? 'border-brand-blue-900 bg-brand-blue-50/20' : 'border-slate-50 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${paymentMethod === 'cod' ? 'bg-brand-blue-900 text-brand-gold-400' : 'bg-slate-100 text-slate-400'}`}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-[10px] uppercase tracking-widest text-brand-blue-950">Cash on Delivery</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pay when you receive</p>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-brand-blue-900 bg-brand-blue-900' : 'border-slate-200'}`}>
                                        {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('bkash')}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'bkash' ? 'border-[#E2136E] bg-[#E2136E]/5' : 'border-slate-50 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${paymentMethod === 'bkash' ? 'bg-[#E2136E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-[10px] uppercase tracking-widest text-brand-blue-950">bKash / Wallet</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Digital Payment</p>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bkash' ? 'border-[#E2136E] bg-[#E2136E]' : 'border-slate-200'}`}>
                                        {paymentMethod === 'bkash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-5 mt-6 lg:mt-0 sticky lg:top-20">
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h2 className="text-[10px] font-black text-brand-blue-900 uppercase tracking-[0.3em] mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto no-scrollbar border-b border-slate-50 pb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-50">
                                            <Image src={item.imageURL || item.image || '/brand_logo.jpeg'} alt={item.name || item.title || 'Product'} fill className="object-contain p-1.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-brand-blue-950 uppercase truncate leading-none">{item.name || item.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                                                {item.quantity} × <span className="text-brand-blue-900/60 text-xs">৳{item.price.toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <p className="text-sm font-black text-brand-blue-900 italic pr-1">৳{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="text-sm font-black text-brand-blue-900">৳{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Fee</span>
                                    <span className="text-sm font-black text-brand-blue-900">৳{deliveryCharge.toLocaleString()}</span>
                                </div>
                                {goldenCirclePromo > 0 && (
                                    <div className="flex justify-between items-center text-brand-gold-600 bg-brand-gold-50 px-3 py-2 rounded-lg">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Golden Perks</span>
                                        <span className="text-sm font-black italic pr-1">-৳{goldenCirclePromo.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</span>
                                        <span className="text-4xl font-black text-brand-blue-950 tracking-tighter italic leading-none mt-1 pr-2">৳{totalPayable.toLocaleString()}</span>
                                    </div>
                                    <ShieldCheck size={20} className="text-emerald-500" />
                                </div>
                            </div>

                            <Button
                                onClick={handleFinalize}
                                disabled={isSubmitting}
                                className="w-full h-14 bg-brand-blue-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Place Secure Order <ArrowRight size={18} /></>}
                            </Button>
                        </section>

                        <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <Star size={14} className="text-brand-gold-500 mt-0.5" />
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                                Authentic global products strictly sourced. 24-hr support for all prime members.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
