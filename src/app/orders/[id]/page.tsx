'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Package, Truck, CheckCircle2, ChevronLeft, MapPin, Clock, Loader2, XCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { useRealTimeOrder } from '@/hooks/useRealTimeData';
import { Order } from '@/types';
import { generateInvoicePDF } from '@/lib/invoice';

export default function OrderTrackingPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { order, loading } = useRealTimeOrder(orderId) as { order: Order | null, loading: boolean };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-brand-blue-600 mb-4" />
                <p className="font-black text-brand-blue-900 uppercase tracking-widest text-xs">Locating Order Details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <XCircle size={64} className="text-red-400 mb-6" />
                <h1 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2 text-center">Order Not Found</h1>
                <p className="text-gray-500 font-medium text-center mb-8 max-w-md">We couldn't find an order with ID #{orderId}. Please check your order number or contact support.</p>
                <Link href="/products">
                    <Button variant="primary" className="px-8 py-3">Continue Shopping</Button>
                </Link>
            </div>
        );
    }

    const statusSteps = [
        { key: 'Pending', label: 'Order Placed', description: 'We have received your order.' },
        { key: 'Confirmed', label: 'Confirmed', description: 'Order verified and items allocated.' },
        { key: 'Shipped', label: 'Shipped', description: 'Package has been shipped from warehouse.' },
        { key: 'OutForDelivery', label: 'Out for Delivery', description: 'Handed over to local courier.' },
        { key: 'Delivered', label: 'Delivered', description: 'Package has been delivered.' }
    ];

    const currentStatusIndex = statusSteps.findIndex(s => s.key === order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center text-brand-blue-900 font-bold hover:text-brand-gold-500 transition-colors">
                        <ChevronLeft size={20} className="mr-1" /> Home
                    </Link>
                    <div className="font-extrabold text-brand-blue-900">
                        Order <span className="text-brand-gold-600">#{orderId.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="w-16"></div>
                </div>
            </header>

            <main className="container mx-auto px-4 max-w-3xl mt-6 lg:mt-10">
                {isCancelled ? (
                    <div className="bg-red-50 border border-red-100 p-8 rounded-3xl mb-8 flex flex-col items-center text-center">
                        <XCircle size={48} className="text-red-500 mb-4" />
                        <h1 className="text-3xl font-black text-red-900 mb-2">Order Cancelled</h1>
                        <p className="text-red-700 font-medium">This order was cancelled. If you have any questions, please contact support.</p>
                    </div>
                ) : (
                    <div className="bg-brand-blue-900 text-white p-6 md:p-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10">
                            <Truck size={200} />
                        </div>
                        <h1 className="text-3xl font-black mb-2 relative z-10">
                            {order.status === 'Delivered' || order.status === 'Completed' ? 'Delivered!' : 'Order Status'}
                        </h1>
                        <p className="text-brand-blue-200 font-medium mb-6 relative z-10 text-lg">
                            {order.status === 'Delivered' || order.status === 'Completed' ? 'Package reached its destination.' : 'Estimated delivery within 24-48 hours.'}
                        </p>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 relative z-10 border border-white/20">
                            <div className={`p-2 rounded-xl text-white shrink-0 shadow-lg ${
                                order.status === 'Confirmed' ? 'bg-emerald-500' :
                                order.status === 'Shipped' ? 'bg-indigo-500' :
                                order.status === 'OutForDelivery' ? 'bg-sky-500' :
                                ['Delivered', 'Completed'].includes(order.status) ? 'bg-teal-500' :
                                order.status === 'cancelled' ? 'bg-rose-500' :
                                'bg-brand-gold-500 text-brand-blue-900'
                            }`}>
                                <Package size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-brand-gold-400 uppercase tracking-widest">Current Status</p>
                                <p className="font-black text-white text-xs uppercase italic tracking-wider">
                                    {(order.status === 'Pending' || order.status === 'pending') && 'Order received and awaiting verification.'}
                                    {order.status === 'Confirmed' && 'Package is being packed and prepared for shipment.'}
                                    {order.status === 'Shipped' && 'Package has departed from our fulfillment center.'}
                                    {order.status === 'OutForDelivery' && 'Package has been handed over to courier.'}
                                    {(order.status === 'Delivered' || order.status === 'Completed') && 'Package was successfully delivered.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-gray-100 mb-8">
                    <h2 className="text-xl font-extrabold text-brand-blue-900 mb-6 uppercase tracking-tighter italic">Live Tracking</h2>
                    <div className="relative pl-8 space-y-8 before:absolute before:inset-y-2 before:left-[15px] before:w-[2px] before:bg-gray-100">
                        {statusSteps.map((step, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;
                            return (
                                <div key={step.key} className={`relative z-10 ${index > Math.max(0, currentStatusIndex) ? 'opacity-30' : ''}`}>
                                    <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-4 border-white flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-brand-gold-500 scale-110 shadow-lg shadow-brand-gold-500/20' : 'bg-gray-200'} ${isCurrent ? 'ring-4 ring-brand-gold-500/20' : ''}`}>
                                        {isCompleted && <CheckCircle2 size={12} className="text-brand-blue-900" />}
                                    </div>
                                    <h3 className={`font-black text-brand-blue-900 uppercase tracking-tight ${isCurrent ? 'text-lg italic' : 'text-sm'}`}>{step.label}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mt-1">{step.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden mb-8">
                    <div className="bg-brand-blue-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold-400">
                                <Package size={18} />
                            </div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Order Details</h2>
                        </div>
                        <span className="text-[10px] font-black text-brand-blue-200 uppercase tracking-[0.2em]">INVOICE #{orderId.slice(0, 8).toUpperCase()}</span>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        {/* Customer & Shipping Summary */}
                        <div className="grid md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-gray-50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Customer Details</h3>
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-brand-blue-950 uppercase">{order.customerInfo?.name || order.customer?.name}</p>
                                    <p className="text-xs font-bold text-slate-600">{order.customerInfo?.phone || order.customer?.phone}</p>
                                    {order.customerInfo?.notes && (
                                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Notes</p>
                                            <p className="text-xs text-slate-600 font-medium italic">"{order.customerInfo.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Shipping Destination</h3>
                                <div className="space-y-1">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-brand-gold-500 mt-0.5 shrink-0" />
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase pr-4">
                                            {order.customerInfo?.address || order.customer?.address}, {order.customerInfo?.city || order.customer?.city}
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest mt-2">
                                        {order.customerInfo?.zone === 'inside_dhaka' ? 'Metro Dhaka Delivery' : 'Outside Dhaka Shipping'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-10">
                            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-100 px-2">
                                <div className="col-span-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</div>
                                <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</div>
                                <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</div>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 px-2 items-center">
                                        <div className="col-span-8 flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 p-2 shrink-0 relative">
                                                <div className="absolute inset-0 flex items-center justify-center p-2">
                                                    <Image 
                                                        src={item.imageURL || item.image || item.images?.catalog || '/brand_logo.jpeg'} 
                                                        alt={item.name || item.title} 
                                                        fill 
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-brand-blue-950 uppercase tracking-tight leading-none mb-1">{item.name || item.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Price: ৳{item.price.toLocaleString()}</p>
                                                    {Number(item.originalPrice || item.marketPrice || 0) > Number(item.price) && (
                                                        <span className="text-[10px] font-bold text-slate-300 line-through">৳{Number(item.originalPrice || item.marketPrice).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex md:justify-center items-center gap-2">
                                            <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity:</span>
                                            <span className="text-sm font-black text-brand-blue-900 bg-slate-50 w-8 h-8 rounded-lg flex items-center justify-center">{item.quantity}</span>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="text-sm font-black text-brand-blue-950">৳{Number(item.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-brand-blue-900 text-brand-gold-400`}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                                        <p className="text-xs font-black text-brand-blue-950 uppercase">
                                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Wallet'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security & Verification</p>
                                        <p className={`text-xs font-black uppercase ${
                                            order.paymentMethod === 'cod' ? 'text-emerald-600' :
                                            order.paymentStatus === 'verified' ? 'text-emerald-600' : 
                                            order.paymentStatus === 'failed' ? 'text-rose-600' :
                                            'text-orange-500'
                                        }`}>
                                            {order.paymentMethod === 'cod' ? 'Payment on Arrival' :
                                             order.paymentStatus === 'verified' ? 'Payment Verified' : 
                                             order.paymentStatus === 'failed' ? 'Payment Failed' : 
                                             'Verification Pending'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-64 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span className="uppercase tracking-widest">Items Subtotal</span>
                                    <span className="text-brand-blue-950 font-black">৳{(order.pricing?.subtotal || order.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span className="uppercase tracking-widest">Shipping Cost</span>
                                    <span className="text-brand-blue-950 font-black">৳{(order.pricing?.deliveryFee || order.deliveryCharge || 0).toLocaleString()}</span>
                                </div>
                                {(order.pricing?.discount || 0) > 0 && (
                                    <div className="flex justify-between items-center text-xs font-black text-emerald-600">
                                        <span className="uppercase tracking-widest">Golden Circle Discount</span>
                                        <span className="italic pr-1">-৳{order.pricing?.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-200 mt-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-brand-blue-950 uppercase tracking-[0.2em]">Total Amount</span>
                                        <span className="text-3xl font-black text-brand-blue-900 tracking-tighter italic leading-none">৳{(order.pricing?.total || order.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="bg-brand-blue-50 p-3 rounded-full mb-3 text-brand-blue-500">
                        <Clock size={24} />
                    </div>
                    <p className="font-bold text-brand-blue-900 mb-1">Need support?</p>
                    <p className="text-xs text-gray-500 font-medium mb-4 px-4">Contact our support center quoting Order #{orderId.slice(0, 8).toUpperCase()}.</p>
                    <Link href="/support">
                        <Button variant="outline" className="w-full font-bold">Contact Support</Button>
                    </Link>
                </div>

                <div className="mt-8 flex flex-col items-center">
                    <button 
                        onClick={() => generateInvoicePDF(order as any)}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-blue-600 transition-all flex items-center gap-2"
                    >
                        Download Invoice PDF
                    </button>
                    <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-4">Safe & Secure Prime Verification</p>
                </div>
            </main>
        </div>
    );
}
