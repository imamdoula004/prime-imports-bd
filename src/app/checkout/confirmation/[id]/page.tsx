'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
    CheckCircle2, 
    Package, 
    Truck, 
    MapPin, 
    Phone, 
    CreditCard, 
    ArrowRight, 
    ShoppingBag,
    Loader2,
    MessageCircle,
    Copy,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRealTimeOrder } from '@/hooks/useRealTimeData';
import { generateInvoicePDF } from '@/lib/invoice';

export default function OrderConfirmationPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { order, loading } = useRealTimeOrder(orderId);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loading && !order) {
            // Handle order not found if necessary
        }
    }, [order, loading]);

    const handleCopyId = () => {
        if (!orderId) return;
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 size={40} className="animate-spin text-brand-blue-600 mb-4" />
                <p className="font-black text-brand-blue-900 uppercase tracking-widest text-xs">Finalizing Your Order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
                <ShoppingBag size={64} className="text-slate-200 mb-6" />
                <h1 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Order Not Found</h1>
                <p className="text-slate-500 font-bold mb-8 max-w-md uppercase text-[10px] tracking-widest">We couldn't locate your order session. It might still be processing.</p>
                <Link href="/products">
                    <Button className="bg-brand-blue-900 text-white font-black uppercase tracking-widest px-8 h-14 rounded-2xl shadow-xl">Return to Shop</Button>
                </Link>
            </div>
        );
    }

    const { customerInfo, items, pricing, paymentMethod, status, createdAt } = order;
    const date = createdAt?.toDate ? createdAt.toDate() : new Date();

    return (
        <div className="bg-slate-50 min-h-screen pb-32 lg:pb-12 font-sans selection:bg-brand-blue-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40 h-16 flex items-center">
                <div className="container mx-auto px-4 flex items-center justify-between max-w-5xl">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/brand_logo.jpeg" alt="Logo" width={32} height={32} className="rounded-full" />
                        <span className="font-black text-brand-blue-900 uppercase tracking-tighter text-sm italic">Prime Imports</span>
                    </Link>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        status === 'Shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        status === 'OutForDelivery' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        ['Delivered', 'Completed'].includes(status) ? 'bg-teal-50 text-teal-600 border-teal-100' :
                        status?.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                        <CheckCircle2 size={14} className={['Confirmed', 'Shipped', 'OutForDelivery', 'Delivered', 'Completed'].includes(status) ? 'opacity-100' : 'opacity-50'} />
                        <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">
                            {status === 'Confirmed' ? 'Order Confirmed' : 
                             status === 'Shipped' ? 'Order Shipped' :
                             status === 'OutForDelivery' ? 'Out for Delivery' :
                             ['Delivered', 'Completed'].includes(status) ? 'Order Delivered' :
                             status?.toLowerCase() === 'cancelled' ? 'Order Cancelled' : 'Order Received'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 max-w-3xl py-8">
                <div className="space-y-6">
                    {/* Left Column: Confirmation & Details */}
                    <div className="space-y-6">
                        {/* Hero Success Card */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-50 rounded-full opacity-50" />
                            <div className="relative z-10">
                                <h1 className="text-4xl font-black text-brand-blue-950 tracking-tighter italic mb-2">Thank you, {customerInfo?.name?.split(' ')[0]}!</h1>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-tight mb-6">
                                    {(status === 'Pending' || status === 'pending') && 'Your order has been placed successfully and is now pending verification.'}
                                    {status === 'Confirmed' && 'Great news! Your order has been confirmed and is being prepared for shipment.'}
                                    {status === 'Shipped' && 'Package has departed! Your order has been shipped and is heading to your city.'}
                                    {status === 'OutForDelivery' && 'Your package is on its way! Our delivery agent is heading to your location.'}
                                    {(status === 'Delivered' || status === 'Completed') && 'Order Delivered! We hope you enjoy your Prime Imports purchase.'}
                                    {status === 'cancelled' && 'This order has been cancelled. Please contact support if you have questions.'}
                                </p>
                                
                                {paymentMethod === 'bkash' && order.paymentStatus !== 'verified' && (status === 'Pending' || status === 'pending') && (
                                    <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-3xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <MessageCircle size={80} className="text-rose-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Action Required</p>
                                            <h3 className="text-xl md:text-2xl font-black text-rose-700 leading-tight mb-3 italic">
                                                Please send the total <span className="text-rose-950 underline decoration-rose-300 decoration-4 underline-offset-4">৳{pricing?.total?.toLocaleString()}</span> to <span className="bg-rose-950 text-white px-3 py-1 rounded-lg not-italic inline-block mt-1">01304045810</span>
                                            </h3>
                                            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">
                                                Mention your Order ID <span className="text-rose-900 font-black italic">#{orderId.slice(0, 8).toUpperCase()}</span> in the reference.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-3">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Order ID</p>
                                            <p className="font-black text-brand-blue-900 text-sm">#{orderId.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <button 
                                            onClick={handleCopyId}
                                            className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-brand-blue-600"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                            <p className="font-black text-brand-blue-900 text-xs uppercase italic">{status}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</p>
                                        <p className="font-black text-brand-blue-900 text-sm">{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Table */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-sm font-black text-brand-blue-950 uppercase tracking-[0.2em]">Order Summary</h2>
                                <span className="bg-brand-blue-50 text-brand-blue-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{items?.length} Items</span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                            <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-2 shrink-0 relative">
                                                            <Image 
                                                                src={item.imageURL || item.image || item.images?.catalog || '/brand_logo.jpeg'} 
                                                                alt={item.name} 
                                                                fill 
                                                                className="object-contain" 
                                                            />
                                                        </div>
                                                        <div className="min-w-0 max-w-[200px] md:max-w-xs">
                                                            <p className="text-xs font-black text-brand-blue-950 uppercase tracking-tight leading-none mb-1.5 truncate">{item.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-slate-400 line-through">৳{Number(item.originalPrice || item.marketPrice || item.price).toLocaleString()}</span>
                                                                <span className="text-[10px] font-black text-brand-blue-600 bg-brand-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Verified Price</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="text-sm font-black text-brand-blue-900 bg-slate-50 w-8 h-8 rounded-lg inline-flex items-center justify-center">{item.quantity}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <p className="text-sm font-black text-brand-blue-950">৳{Number(item.price).toLocaleString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Integrated Pricing Breakdown */}
                            <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100">
                                <div className="max-w-xs ml-auto space-y-3">
                                    <div className="flex justify-between items-center opacity-70">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Items Subtotal</span>
                                        <span className="text-sm font-black text-brand-blue-900">৳{pricing?.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-70">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shipping Cost</span>
                                        <span className="text-sm font-black text-brand-blue-900">৳{pricing?.deliveryFee?.toLocaleString()}</span>
                                    </div>
                                    {pricing?.discount > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                                            <span className="text-sm font-black">-৳{pricing?.discount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between">
                                        <span className="text-xs font-black text-brand-blue-950 uppercase tracking-widest">Total</span>
                                        <p className="text-3xl font-black text-brand-blue-900 tracking-tighter italic">৳{pricing?.total?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two Column details: Delivery & Payment */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Delivery Details */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                                        <Truck size={20} />
                                    </div>
                                    <h2 className="text-xs font-black text-brand-blue-950 uppercase tracking-[0.2em]">Delivery Details</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="text-brand-gold-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Address</p>
                                            <p className="text-sm font-black text-brand-blue-950 uppercase leading-snug">
                                                {customerInfo?.name}<br />
                                                {customerInfo?.address}, {customerInfo?.city}
                                            </p>
                                            <p className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest mt-2 px-2 py-0.5 bg-brand-blue-50 rounded inline-block">
                                                {customerInfo?.zone === 'inside_dhaka' ? 'Inside Dhaka (৳70)' : 'Outside Dhaka (৳140)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <Phone size={16} className="text-brand-gold-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                            <p className="text-sm font-black text-brand-blue-950">{customerInfo?.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <h2 className="text-xs font-black text-brand-blue-950 uppercase tracking-[0.2em]">Payment Method</h2>
                                </div>
                                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${paymentMethod === 'cod' ? 'bg-brand-blue-900 text-brand-gold-400' : 'bg-[#E2136E] text-white'}`}>
                                            {paymentMethod === 'cod' ? <ShoppingBag size={20} /> : <CreditCard size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-blue-950 uppercase tracking-widest">
                                                {paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash Wallet'}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                Status: <span className={`italic ${
                                                    paymentMethod === 'cod' ? 'text-emerald-600 font-black' :
                                                    order.paymentStatus === 'verified' ? 'text-emerald-600 font-black' : 
                                                    order.paymentStatus === 'failed' ? 'text-rose-600 font-black' : 
                                                    'text-orange-500'
                                                }`}>
                                                    {paymentMethod === 'cod' ? 'Payment on Arrival' : 
                                                     order.paymentStatus === 'verified' ? 'Verified' : 
                                                     order.paymentStatus === 'failed' ? 'Payment Failed' : 'Pending Verification'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={24} className={(paymentMethod === 'cod' || order.paymentStatus === 'verified') ? 'text-emerald-500' : 'text-slate-200'} />
                                </div>
                                <div className="mt-6 flex items-start gap-3 opacity-60">
                                    <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><CheckCircle2 size={10} /></div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                                        {paymentMethod === 'cod' ? 'Secure order placement. Pay only when you receive your package.' : 'Secured with Prime Protection. Your payment is safe and verified.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Centered CTA */}
                        <div className="flex flex-col items-center gap-4 pt-4 pb-12">
                            <Link href="/products" className="w-full max-w-sm">
                                <Button className="w-full h-16 bg-white border-2 border-brand-blue-600 hover:bg-brand-blue-50 text-brand-blue-900 font-black rounded-3xl transition-all shadow-xl flex flex-col items-center justify-center gap-0.5 group">
                                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-40">Order Secured</span>
                                    <span className="flex items-center gap-2 text-sm uppercase font-black italic group-hover:gap-4 transition-all">
                                        Continue Shopping <ArrowRight size={18} />
                                    </span>
                                </Button>
                            </Link>
                            <button 
                                onClick={() => generateInvoicePDF(order as any)}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-blue-600 transition-colors"
                            >
                                Download Invoice PDF
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper style for mobile sticky shadow
const styles = `
    .shadow-up {
        box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1);
    }
`;
