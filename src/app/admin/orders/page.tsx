'use client';

import { ShoppingBag, Truck, CheckCircle2, XCircle, Search, Filter, Loader2, ArrowRight, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { Order } from '@/types';
import Link from 'next/link';
import { getRedXStatus, STATUS_COLORS, RedXTrackingResponse } from '@/lib/redx';
import { BadgeCheck, AlertTriangle } from 'lucide-react';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        const matchesSearch = 
            order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerInfo?.phone?.includes(searchTerm) ||
            order.customer?.phone?.includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(data);
            setLoading(false);
        }, (err) => {
            console.error("Orders sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (orderId: string, status: Order['status']) => {
        const orderRef = doc(db, 'orders', orderId);
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const newHistory = [
            ...(order.statusHistory || []),
            {
                status,
                timestamp: new Date()
            }
        ];

        try {
            await updateDoc(orderRef, { 
                status,
                statusHistory: newHistory
            });

            // GC MEMBERSHIP AUTO-REQUEST TRIGGER (PHASE 2)
            // Triggered also when order is marked as Delivered or Completed as a safety net
            if (status === 'Delivered' || status === 'Completed') {
                const total = order.pricing?.total || order.total || 0;
                if (total >= 2000) {
                    const phone = order.customerInfo?.phone || order.customer?.phone;
                    if (!phone) return;
                    
                    const finalPhone = phone.replace(/[^0-9]/g, '').slice(-11);

                    // 1. Check if already a member
                    const memberSnap = await getDocs(query(collection(db, 'goldenCircleUsers'), where('phoneNumber', '==', finalPhone)));
                    if (!memberSnap.empty) return; // Already a member

                    // 2. Check if already has a pending request
                    const requestSnap = await getDocs(query(collection(db, 'goldenCircleRequests'), where('phoneNumber', '==', finalPhone), where('status', '==', 'pending')));
                    if (!requestSnap.empty) return; // Already requested

                    // 3. Create Request
                    await addDoc(collection(db, 'goldenCircleRequests'), {
                        phoneNumber: finalPhone,
                        name: order.customerInfo?.name || order.customer?.name || 'Customer',
                        status: 'pending',
                        requestedAt: serverTimestamp(),
                        source: 'order_completion',
                        orderId: orderId,
                        orderTotal: total,
                        notes: `Auto-triggered by completed order #${orderId.slice(0,8)}`
                    });
                    console.log('GC membership request sent automatically for delivered order');
                }
            }
        } catch (err) {
            console.error("Update status error:", err);
            alert("Failed to update status");
        }
    };

    const updatePaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { paymentStatus });
    };

    const StatusDropdown = ({ order }: { order: Order }) => (
        <select
            value={order.status}
            onChange={(e) => updateStatus(order.id!, e.target.value as Order['status'])}
            className="text-[9px] font-black uppercase tracking-widest bg-slate-100 border-none rounded-lg px-2 py-1.5 focus:ring-0 cursor-pointer w-full text-center"
        >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="OutForDelivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
            <option value="cancelled">Cancelled</option>
        </select>
    );

    const PaymentStatusDropdown = ({ order }: { order: Order }) => (
        <select
            value={order.paymentStatus || 'pending'}
            onChange={(e) => updatePaymentStatus(order.id!, e.target.value as Order['paymentStatus'])}
            className={`text-[9px] font-black uppercase tracking-widest border-none rounded-lg px-2 py-1.5 focus:ring-0 cursor-pointer w-full text-center ${
                order.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                order.paymentStatus === 'failed' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-100 text-slate-400'
            }`}
        >
            <option value="pending">Deposit Pending</option>
            <option value="verified">bKash Verified</option>
            <option value="failed">bKash Failed</option>
        </select>
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Processing Live Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Order Fulfilment</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Real-time Logistics Management</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-brand-blue-500 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['all', 'Pending', 'Confirmed', 'Shipped', 'OutForDelivery', 'Delivered', 'Completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-shrink-0 ${filterStatus === status
                                ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-xl shadow-brand-blue-900/10'
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Detail (Tab 1)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials (Tab 2)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching orders found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-brand-blue-900 uppercase">#{order.id?.slice(0, 8)}</span>
                                                <span className="text-[9px] font-bold text-slate-400 mt-1">
                                                    {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-brand-blue-900">{order.customerInfo?.name || order.customer?.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{order.customerInfo?.phone || order.customer?.phone}</span>
                                                <span className="text-[8px] font-black text-brand-blue-600 uppercase mt-0.5">{order.customerInfo?.zone?.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2 max-w-[300px] bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TAB 1: ITEM PRICING</p>
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-start justify-between gap-4 text-[11px]">
                                                        <div className="min-w-0">
                                                            <p className="font-black text-brand-blue-950 truncate uppercase leading-tight">{item.name || item.title}</p>
                                                            <p className="text-[9px] font-bold text-slate-400">৳{item.price.toLocaleString()} × {item.quantity}</p>
                                                        </div>
                                                        <span className="font-black text-brand-blue-900 shrink-0">
                                                            ৳{(item.price * item.quantity).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-slate-100 flex justify-between">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Item Subtotal</span>
                                                    <span className="text-[11px] font-black text-brand-blue-900">৳{(order.pricing?.subtotal || order.subtotal || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5 max-w-[250px] bg-brand-blue-900 p-3 rounded-xl shadow-lg shadow-brand-blue-900/10 border border-brand-blue-800 text-white">
                                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">TAB 2: DELIVERY & TOTAL</p>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="font-bold opacity-60">Subtotal</span>
                                                    <span className="font-black">৳{(order.pricing?.subtotal || order.subtotal || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-brand-gold-400">
                                                    <span className="font-bold uppercase tracking-wider">Delivery Fee</span>
                                                    <span className="font-black">৳{((order.pricing as any)?.deliveryFee || (order.pricing as any)?.deliveryCharge || order.deliveryCharge || 0).toLocaleString()}</span>
                                                </div>
                                                {((order.pricing?.discount || 0) > 0) && (
                                                    <div className="flex justify-between text-[10px] text-emerald-400">
                                                        <span className="font-bold">Discount</span>
                                                        <span className="font-black">-৳{order.pricing?.discount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="pt-1.5 mt-1.5 border-t border-white/10 flex justify-between text-xs">
                                                    <span className="font-black uppercase tracking-widest">Final Total</span>
                                                    <span className="font-black text-brand-gold-400">৳{(order.pricing?.total || order.pricing?.finalTotal || order.total || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-center ${
                                                    order.status === 'Delivered' || order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'Shipped' || order.status === 'OutForDelivery' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter text-center">
                                                    Last Update: {order.statusHistory?.length ? new Date(order.statusHistory[order.statusHistory.length-1].timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString() : 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-4 min-w-[200px]">
                                                <RedXStatus order={order} />
                                                <div className="flex flex-col items-stretch gap-2 w-32">
                                                    <StatusDropdown order={order} />
                                                    {order.paymentMethod === 'bkash' && (
                                                        <PaymentStatusDropdown order={order} />
                                                    )}
                                                    <Link href={`/orders/${order.id}`} target="_blank" className="flex items-center justify-center gap-1.5 text-[9px] font-black text-brand-blue-600 hover:text-black transition-colors uppercase tracking-widest px-2 py-1.5 rounded-lg bg-brand-blue-50" title="View Customer Perspective">
                                                        <Eye size={12} /> Live Tracking
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function RedXStatus({ order }: { order: Order }) {
    const [tracking, setTracking] = useState<RedXTrackingResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const trackingId = order.delivery?.trackingId;

    useEffect(() => {
        if (trackingId && (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'OutForDelivery' || order.status === 'Confirmed')) {
            setLoading(true);
            getRedXStatus(trackingId).then(data => {
                setTracking(data);
                setLoading(false);
            });
        }
    }, [trackingId, order.status]);

    if (!trackingId) return <span className="text-[8px] font-black text-slate-300 uppercase italic">No Tracking ID</span>;
    if (loading) return <Loader2 size={12} className="animate-spin text-slate-300" />;
    if (!tracking) return <span className="text-[8px] font-black text-slate-300 uppercase italic">Not Dispatched</span>;

    const redxStatus = tracking.status;

    return (
        <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 border border-transparent transition-all ${STATUS_COLORS[redxStatus] || 'bg-slate-50 text-slate-400'} group-hover:border-current/10`}>
            {redxStatus === 'delivered' ? (
                <BadgeCheck size={10} />
            ) : redxStatus === 'cancelled' || redxStatus === 'failed' ? (
                <AlertTriangle size={10} className="animate-bounce" />
            ) : (
                <Truck size={10} />
            )}
            <div className="flex flex-col items-start leading-none">
                <span className="text-[7px] font-black uppercase tracking-tighter">{redxStatus.replace(/[-_]/g, ' ')}</span>
                <span className="text-[6px] font-bold opacity-60 font-mono">{tracking.tracking_id}</span>
            </div>
        </div>
    );
}

