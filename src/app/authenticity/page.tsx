import { ShieldCheck, Globe, BadgeCheck, Zap, Heart } from 'lucide-react';

export default function AuthenticityPage() {
    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue-50 rounded-3xl mb-6 text-brand-blue-600">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-blue-900 mb-4 tracking-tight uppercase">Authenticity Promise</h1>
                    <p className="text-slate-500 text-lg font-bold">100% Genuine. 100% Imported. No Compromise.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-brand-blue-900 leading-tight uppercase tracking-tight">Directly Sourced</h2>
                        <p className="text-slate-600 text-lg leading-relaxed font-medium">
                            We don't buy from local wholesalers. Every single product at Prime Imports BD is sourced directly from retail chains and primary distributors in the UK, USA, UAE, and Europe.
                        </p>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Globe className="text-brand-blue-600" size={24} />
                            <span className="text-sm font-black text-brand-blue-900 uppercase">Global Supply Chain Integrity</span>
                        </div>
                    </div>
                    <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-blue-900/10">
                        <img
                            src="https://images.unsplash.com/photo-1577705998148-3605e7300977?auto=format&fit=crop&w=800&q=80"
                            alt="Authenticity"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-brand-blue-900/20 backdrop-blur-[2px]"></div>
                        <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-whiteShadow-sm">
                            <BadgeCheck className="text-brand-blue-600 mb-2" size={32} />
                            <p className="text-brand-blue-900 font-black text-sm uppercase tracking-wider">Prime Verification™ Seal</p>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-blue-900 text-white p-12 rounded-[3.5rem] shadow-2xl shadow-brand-blue-900/20 mb-20">
                    <h3 className="text-3xl font-black mb-8 text-center uppercase tracking-tight">Three Pillars of Trust</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center space-y-4">
                            <Zap className="mx-auto text-brand-gold-400" size={32} />
                            <h4 className="font-black text-lg uppercase tracking-tight">Fresh Batches</h4>
                            <p className="text-brand-blue-200 text-sm font-medium">We only stock current batches. No near-expiry stock ever enters our warehouse.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <ShieldCheck className="mx-auto text-brand-gold-400" size={32} />
                            <h4 className="font-black text-lg uppercase tracking-tight">Chain of Custody</h4>
                            <p className="text-brand-blue-200 text-sm font-medium">From the supermarket shelf in London to your door in Dhaka, we track every mile.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <Heart className="mx-auto text-brand-gold-400" size={32} />
                            <h4 className="font-black text-lg uppercase tracking-tight">Customer Veto</h4>
                            <p className="text-brand-blue-200 text-sm font-medium">If you have even 1% doubt about authenticity, we take it back—no questions asked.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
                    Prime Imports BD is a registered importer under the laws of Bangladesh.<br />
                    All brand names and logos are trademarks of their respective owners.
                </div>
            </div>
        </div>
    );
}
