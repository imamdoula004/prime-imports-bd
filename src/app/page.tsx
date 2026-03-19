import { Star, ArrowRight, Zap, TrendingUp, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { HeroCarousel } from '@/components/ui/HeroCarousel';
import { RealTimeProductGrid } from '@/components/ui/RealTimeProductGrid';
import { CategoryBoxGrid } from '@/components/ui/CategoryBoxGrid';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function getCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(doc => doc.data().name).filter(Boolean);
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col min-h-screen bg-white pb-0">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-[1320px] px-4 md:px-6 lg:px-8 w-full mb-4 mt-2">
        <HeroCarousel />
      </section>




      {/* 3. Dynamic Category Sections */}
      <div className="mx-auto max-w-[1320px] px-4 md:px-6 lg:px-8 w-full space-y-4">
        {categories.slice(0, 5).map((category, idx) => (
          <section key={category} className="py-2">
            <div className="flex items-center justify-between mb-3 px-0">
              <div>
                <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-[0.4em] mb-2 block leading-none">
                  {idx === 0 ? 'International Arrivals' : 'Premium Selection'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-brand-blue-900 uppercase tracking-tighter leading-none">{category}</h2>
              </div>
              <Link href={`/products?category=${encodeURIComponent(category)}`} className="group flex items-center gap-2.5 text-[10px] font-black text-brand-blue-900/40 hover:text-brand-blue-600 transition-colors uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl hover:bg-brand-blue-50">
                Show All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <RealTimeProductGrid
              pageSize={12}
              currentPage={1}
              category={category}
              layout="carousel"
            />
          </section>
        ))}
      </div>

      {/* 4. Main Explorer Grid */}
      <section className="mx-auto max-w-[1320px] px-4 md:px-6 lg:px-8 w-full py-8 border-t border-slate-100 mt-8">
        <div className="text-center mb-4 max-w-xl mx-auto px-4">
          <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-[0.3em] mb-3 block italic">Fresh Arrivals</span>
          <h2 className="text-3xl md:text-4xl font-black text-brand-blue-900 tracking-tighter uppercase leading-[0.85] mb-4">Discover Daily</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Sourced from global hubs. Delivered to your doorstep.</p>
        </div>

        <RealTimeProductGrid
          pageSize={12}
          currentPage={1}
          disableInfiniteScroll={true}
        />

        <div className="mt-4 text-center">
          <Link href="/products">
            <button className="bg-brand-blue-900 hover:bg-black text-white font-black px-12 py-5 rounded-2xl shadow-2xl shadow-brand-blue-900/20 transition-all active:scale-95 group text-[11px] uppercase tracking-[0.2em] border-2 border-transparent">
              Explore Full Collection
            </button>
          </Link>
        </div>
      </section>

      {/* 6. Why Prime Imports */}
      <section className="mx-auto max-w-[1320px] px-4 md:px-6 lg:px-8 w-full pt-8 pb-4 border-t border-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-2">
          {[
            { icon: <Zap className="text-brand-gold-500" size={24} />, title: 'EXPRESS', desc: 'Dhaka Delivery' },
            { icon: <ShieldCheck className="text-blue-500" size={24} />, title: 'CERTIFIED', desc: '100% Authentic' },
            { icon: <Link href="/golden-circle" className="text-emerald-500"><Star size={24} /></Link>, title: 'GOLDEN', desc: 'VIP Membership' },
            { icon: <ShoppingBag className="text-rose-500" size={24} />, title: 'PREMIUM', desc: 'Global Sourcing' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-3 md:p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
              <div className="mb-2 md:mb-3">{item.icon}</div>
              <h3 className="font-black text-brand-blue-900 uppercase tracking-widest text-[10px] mb-1">{item.title}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
