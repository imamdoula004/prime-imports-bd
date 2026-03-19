import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function ShippingPage() {
    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue-50 rounded-3xl mb-6 text-brand-blue-600">
                        <Truck size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-blue-900 mb-4 tracking-tight">Shipping & Delivery</h1>
                    <p className="text-slate-500 text-lg font-bold">Premium delivery for your premium imports.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <MapPin className="text-brand-blue-600" size={24} />
                            <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Inside Dhaka</h2>
                        </div>
                        <p className="text-slate-600 font-bold mb-4">Standard Delivery: ৳70</p>
                        <ul className="space-y-3 text-sm text-slate-500 font-medium">
                            <li className="flex items-center gap-2">
                                <Clock size={16} className="text-brand-blue-400" /> 12 - 36 Hours Delivery
                            </li>
                            <li>• Orders placed before 4 PM delivered same day.</li>
                            <li>• Cash on Delivery available.</li>
                        </ul>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <Globe className="text-brand-blue-600" size={24} />
                            <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Outside Dhaka</h2>
                        </div>
                        <p className="text-slate-600 font-bold mb-4">Standard Delivery: ৳140</p>
                        <ul className="space-y-3 text-sm text-slate-500 font-medium">
                            <li className="flex items-center gap-2">
                                <Clock size={16} className="text-brand-blue-400" /> 48 - 72 Hours Delivery
                            </li>
                            <li>• Courier service used for nationwide shipping.</li>
                            <li>• Full payment or delivery charge advance required.</li>
                        </ul>
                    </div>
                </div>

                <div className="prose prose-slate max-w-none bg-brand-blue-50/30 p-10 rounded-[2.5rem] border border-brand-blue-100">
                    <h3 className="text-2xl font-black text-brand-blue-900 mb-6">Delivery Commitment</h3>
                    <p className="text-slate-600 font-medium leading-relaxed mb-6">
                        At Prime Imports BD, we understand that you're ordering premium goods. Our delivery team is trained to handle fragile items like chocolates and glass-packaged cosmetics with extreme care.
                    </p>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-blue-100">
                        <ShieldCheck className="text-green-600" size={24} />
                        <span className="text-sm font-black text-brand-blue-900 uppercase">Insulated Packaging for Chocolates</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Globe({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}
