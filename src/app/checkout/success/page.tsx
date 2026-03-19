import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Package, ArrowRight, Star } from 'lucide-react';

export default function OrderSuccessPage() {
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">

            <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center relative overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-blue-900/5 rounded-full blur-3xl pointer-events-none"></div>

                {/* Success Icon Animation */}
                <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 relative z-10 animate-[bounceIn_0.6s_ease-out]">
                    <CheckCircle className="text-green-500 w-12 h-12" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-brand-blue-900 tracking-tight mb-4 relative z-10">
                    Order Confirmed!
                </h1>

                <p className="text-lg text-gray-500 font-medium mb-8 max-w-md mx-auto relative z-10">
                    Thank you for shopping with Prime Imports BD. Your premium products are being prepared for delivery.
                </p>

                {/* Order Details Card */}
                <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-3xl p-6 mb-10 text-left relative z-10">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-blue-100/50">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                            <p className="text-lg font-extrabold text-brand-blue-900">#PIBD-88492</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-lg font-extrabold text-brand-gold-600">৳3,126</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 text-brand-blue-800 font-medium">
                        <Package className="text-brand-blue-400 mt-1 shrink-0" size={20} />
                        <p className="text-sm">
                            Estimated Delivery: <span className="font-bold text-brand-blue-900">Tomorrow by 8:00 PM</span> to Gulshan 2, Dhaka.
                        </p>
                    </div>
                </div>

                {/* Golden Circle Upsell / Status */}
                <div className="bg-brand-gold-500 text-brand-blue-900 rounded-3xl p-6 mb-10 flex items-center gap-4 text-left shadow-card relative z-10">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <Star className="text-white" size={28} fill="currentColor" />
                    </div>
                    <div>
                        <p className="font-extrabold text-lg flex items-center gap-2">Golden Circle <span className="bg-white/30 text-xs px-2 py-0.5 rounded-full">VIP</span></p>
                        <p className="text-sm font-semibold opacity-90 mt-1">You earned 31 Points on this order!</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                    <Link href="/orders/PIBD-88492" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto px-8 py-6 rounded-xl font-bold text-lg shadow-button text-white bg-brand-blue-900 hover:bg-brand-blue-800">
                            Track Order
                        </Button>
                    </Link>
                    <Link href="/products" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto px-8 py-6 rounded-xl font-bold text-lg text-brand-blue-900 border-gray-200 hover:bg-gray-50">
                            Continue Shopping <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </Link>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}} />

        </div>
    );
}
