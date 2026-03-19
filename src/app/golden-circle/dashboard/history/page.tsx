'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    orderBy 
} from 'firebase/firestore';
import { 
    Package, 
    Calendar, 
    ChevronDown, 
    ChevronUp,
    ShoppingBag,
    Clock,
    CheckCircle2,
    Truck,
    AlertCircle,
    BadgePercent
} from 'lucide-react';

import { sanitizePhone } from '@/lib/utils';
import { useMemberAuth } from '@/context/MemberAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderHistory() {
    const { phoneNumber } = useMemberAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        if (!phoneNumber) {
            setLoading(false);
            return;
        }

        const sanitized = sanitizePhone(phoneNumber);
        console.log(`[GC DEBUG] Listening to orders for phone: ${sanitized}`);

        // STRICT LINKING: Query strictly by customerInfo.phone
        // We use a real-time listener (onSnapshot)
        const q = query(
            collection(db, 'orders'),
            where('customerInfo.phone', '==', sanitized),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
                };
            });
            
            console.log(`[GC DEBUG] Fetched ${ordersData.length} orders real-time`);
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("[GC DEBUG] Order listener error:", error);
            // Fallback: If index is missing for orderBy + where, try simple query
            if (error.message?.includes('index')) {
                const simpleQ = query(
                    collection(db, 'orders'),
                    where('customerInfo.phone', '==', sanitized)
                );
                onSnapshot(simpleQ, (snap) => {
                    const data = snap.docs.map(d => ({
                        id: d.id,
                        ...d.data(),
                        createdAt: (d.data() as any).createdAt?.toDate ? (d.data() as any).createdAt.toDate() : new Date()
                    })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
                    setOrders(data);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [phoneNumber]);

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || 'pending';
        switch (s) {
            case 'completed':
            case 'delivered':
                return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle2 size={12} /> };
            case 'processing':
            case 'confirmed':
                return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Clock size={12} /> };
            case 'shipped':
                return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Truck size={12} /> };
            case 'cancelled':
                return { bg: 'bg-rose-50', text: 'text-rose-600', icon: <AlertCircle size={12} /> };
            default:
                return { bg: 'bg-slate-50', text: 'text-slate-600', icon: <Package size={12} /> };
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white rounded-[2rem] border border-slate-100" />
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-16 text-center shadow-sm">
                <div className="w-24 h-24 bg-brand-blue-50 rounded-full flex items-center justify-center text-brand-blue-600 mx-auto mb-8">
                    <ShoppingBag size={40} />
                </div>
                <h3 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-3">No orders found yet</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10 max-w-xs mx-auto">
                    Once you place your first elite import, it will appear here in real-time.
                </p>
                <a href="/products" className="inline-block px-12 py-5 bg-brand-blue-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue-900/20 active:scale-95 transition-all">
                    Explore Inventory
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-brand-blue-900 uppercase tracking-tighter italic">Order History</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Status Synchronization Active</p>
                </div>
            </header>

            <div className="space-y-4">
                {orders.map((order) => {
                    const style = getStatusStyle(order.status);
                    const isExpanded = expandedOrder === order.id;

                    return (
                        <div 
                            key={order.id} 
                            className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-brand-blue-200 ring-4 ring-brand-blue-50' : 'border-slate-100 hover:border-brand-blue-200 shadow-sm'}`}
                        >
                            {/* Summary Header */}
                            <div 
                                className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 ${style.bg} ${style.text} rounded-2xl flex items-center justify-center shadow-inner`}>
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <p className="text-base font-black text-brand-blue-900 uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
                                                {style.icon}
                                                {order.status || 'Pending'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {order.createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span>{order.items?.length || 0} Premium Items</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-5 md:pt-0">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable</p>
                                        <p className="text-xl font-black text-brand-blue-900 tracking-tighter italic">৳{order.pricing?.total?.toLocaleString() || order.total?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-brand-blue-900 text-white rotate-180' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List Breakdown */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-50 bg-slate-50/30"
                                    >
                                        <div className="p-8 space-y-8">
                                            {/* Items List */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-brand-blue-300 uppercase tracking-[0.3em] mb-4">Itemized Breakdown</p>
                                                {order.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between gap-4 py-2">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 relative">
                                                                {item.imageURL && <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />}
                                                                <div className="absolute top-0 right-0 bg-brand-blue-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">x{item.quantity}</div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-brand-blue-900 line-clamp-1">{item.name || item.title}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">৳{item.price?.toLocaleString()} / unit</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-black text-brand-blue-900 italic">৳{(item.price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Price Calculation Card */}
                                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span>Subtotal</span>
                                                        <span className="text-brand-blue-900">৳{order.pricing?.subtotal?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span>Processing & Delivery</span>
                                                        <span className="text-brand-blue-900">+৳{order.pricing?.deliveryFee?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    {order.pricing?.discount > 0 && (
                                                        <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><BadgePercent size={12} /> Golden Circle Privilege</span>
                                                            <span>-৳{order.pricing?.discount?.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="pt-3 border-t border-slate-50 flex justify-between items-baseline">
                                                        <span className="text-[10px] font-black text-brand-blue-900 uppercase tracking-[0.2em]">Grand Total</span>
                                                        <span className="text-xl font-black text-brand-blue-900 tracking-tighter italic font-sans animate-in zoom-in-95 duration-700">
                                                            ৳{order.pricing?.total?.toLocaleString() || order.total?.toLocaleString() || '0'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
