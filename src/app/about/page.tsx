import { Star, Globe, ShieldCheck, Heart, Award } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-24">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-blue-50 rounded-[2rem] mb-8 text-brand-blue-600 shadow-xl shadow-brand-blue-600/5 rotate-3">
                        <Star size={48} className="fill-current text-brand-gold-400" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-brand-blue-900 mb-6 tracking-tighter uppercase italic">Our Story</h1>
                    <p className="text-slate-500 text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                        Bringing the world's finest premium imports to your doorstep with zero compromise on quality and authenticity.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl skew-y-1">
                        <img
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
                            alt="Luxury Imports"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-brand-blue-900/10 backdrop-blur-[1px]"></div>
                    </div>
                    <div className="space-y-8">
                        <h2 className="text-4xl font-black text-brand-blue-900 uppercase tracking-tight">The Prime Mission</h2>
                        <p className="text-slate-600 text-lg leading-relaxed font-medium">
                            Founded in Dhaka, Prime Imports BD was born out of a simple frustration: the difficulty of finding genuine, fresh, and high-quality imported goods without the fear of counterfeits.
                        </p>
                        <p className="text-slate-600 text-lg leading-relaxed font-medium">
                            We don't just sell products; we curate experiences. From the crunch of a Swiss chocolate bar to the scent of a French body mist, we ensure that every item you receive is exactly what you'd find on the shelves of luxury retailers in London, New York, or Paris.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-32">
                    {[
                        { icon: <Award className="text-brand-gold-500" size={32} />, title: "Premium Sourcing", desc: "No local wholesalers. We buy directly from primary international retail chains." },
                        { icon: <Globe className="text-brand-blue-600" size={32} />, title: "Global Reach", desc: "Our network spans across 4 continents to bring you exclusive limited editions." },
                        { icon: <Heart className="text-red-500" size={32} />, title: "Customer Obsessed", desc: "Our Golden Circle support VIPs are available 24/7 to ensure your satisfaction." }
                    ].map((feature, i) => (
                        <div key={i} className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all group">
                            <div className="mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                            <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight mb-4">{feature.title}</h3>
                            <p className="text-slate-500 font-bold text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-brand-blue-900 text-white p-12 md:p-20 rounded-[4rem] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-400 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase tracking-tighter">Ready to experience the best?</h2>
                    <a href="/products" className="inline-block bg-white text-brand-blue-900 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-slate-100 transition-all shadow-2xl active:scale-95">
                        Start Shopping
                    </a>
                </div>
            </div>
        </div>
    );
}
