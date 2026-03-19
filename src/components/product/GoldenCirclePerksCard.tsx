'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useMemberAuth } from '@/context/MemberAuthContext';

interface Props {
  price: number;
}

export function GoldenCirclePerksCard({ price }: Props) {
  const { isGoldenCircleUser: isMember } = useMemberAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const discountAmount = Math.round(price * 0.03);
  const finalPrice = Math.max(0, price - discountAmount);

  if (!mounted) {
     return <div className="bg-brand-blue-900 p-5 rounded-2xl flex items-center justify-between group border border-brand-blue-800 animate-pulse h-[82px]"></div>;
  }

  if (isMember) {
    return (
      <div className="bg-brand-blue-900 p-5 rounded-2xl flex items-center justify-between group border border-brand-blue-500 shadow-md shadow-brand-blue-900/20">
        <div>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 block">Premium Perks Applied</span>
          <span className="text-sm font-black text-white uppercase tracking-tight">
             Price: ৳{finalPrice} <span className="text-[10px] text-brand-blue-300 ml-1 font-bold">(Saved ৳{discountAmount})</span>
          </span>
        </div>
        <Star size={24} className="text-brand-gold-500 fill-brand-gold-500" />
      </div>
    );
  }

  return (
    <Link href="/golden-circle" className="bg-brand-gold-500 p-5 rounded-2xl flex items-center justify-between group border border-brand-gold-400 hover:bg-brand-gold-400 transition-colors shadow-lg shadow-brand-gold-500/20">
      <div>
        <span className="text-[9px] font-black text-brand-blue-950/70 uppercase tracking-widest mb-1 block">Members Only</span>
        <span className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">
          Save ৳{discountAmount} on this <span className="underline decoration-1 underline-offset-2 ml-0.5 text-brand-blue-900 text-[10px] font-black">Join</span>
        </span>
      </div>
      <Star size={24} className="text-brand-blue-900/30 fill-brand-blue-900/10 group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
    </Link>
  );
}
