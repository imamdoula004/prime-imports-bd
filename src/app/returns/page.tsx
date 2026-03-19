import { RotateCcw, CheckCircle2, ShieldAlert, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ReturnsPage() {
    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-3xl mb-6 text-red-500">
                        <RotateCcw size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-blue-900 mb-4 tracking-tight">Returns & Refunds</h1>
                    <p className="text-slate-500 text-lg font-bold">Your satisfaction is our absolute priority.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <CheckCircle2 className="text-green-600" size={24} />
                            <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Easy Returns</h2>
                        </div>
                        <p className="text-slate-600 font-medium mb-6 leading-relaxed text-sm">
                            We accept returns within 48 hours of delivery if the product is damaged, near expiry, or incorrect.
                        </p>
                        <ul className="space-y-3 text-sm text-slate-500 font-bold uppercase tracking-wider">
                            <li>• Original Packaging</li>
                            <li>• Unused Condition</li>
                            <li>• Invoice Required</li>
                        </ul>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-brand-blue-900 text-white shadow-xl shadow-brand-blue-900/20">
                        <div className="flex items-center gap-4 mb-6">
                            <RotateCcw className="text-brand-gold-400" size={24} />
                            <h2 className="text-xl font-black uppercase tracking-tight">Fast Refunds</h2>
                        </div>
                        <p className="font-medium mb-6 leading-relaxed text-sm text-brand-blue-100">
                            Once your return is verified, refunds are processed within 3-5 business days to your original payment method.
                        </p>
                        <div className="p-4 bg-brand-blue-800 rounded-2xl border border-brand-blue-700">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-gold-400 block mb-1">Bkash / Nagad</span>
                            <span className="text-sm font-bold">Processed in 24 Hours</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 mb-12">
                    <h3 className="text-2xl font-black text-brand-blue-900 mb-6 uppercase tracking-tight">Exceptions</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <ShieldAlert className="text-red-500 shrink-0" size={20} />
                            <p className="text-slate-600 text-sm font-medium">For health and safety reasons, opened cosmetics or food items cannot be returned unless they are damaged or defective at the time of delivery.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <h4 className="text-xl font-black text-brand-blue-900 mb-6">Need to start a return?</h4>
                    <Link href="/support">
                        <Button className="bg-brand-blue-900 text-white font-black px-12 py-8 rounded-2xl text-xl hover:bg-brand-blue-950 transition-all shadow-2xl shadow-brand-blue-900/20 active:scale-[0.98]">
                            <MessageSquare className="mr-3" /> Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
