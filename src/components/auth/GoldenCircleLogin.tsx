'use client';

import { useState } from 'react';
import { useMemberAuth } from '@/context/MemberAuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, ShieldCheck, Phone, ArrowRight } from 'lucide-react';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';

export function GoldenCircleLogin() {
    const { login, isGoldenCircleUser, phoneNumber, logout } = useMemberAuth();
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidBDPhone(phone)) {
            setError("Please enter a valid 11-digit Bangladeshi phone number.");
            return;
        }

        setIsSubmitting(true);
        const result = await login(phone);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error || "Login failed");
        }
    };

    if (isGoldenCircleUser) {
        return (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-emerald-600" size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Welcome Member</h2>
                    <p className="text-slate-500 font-bold text-sm">{phoneNumber}</p>
                </div>
                <div className="pt-4">
                    <button 
                        onClick={logout}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-blue-900 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 max-w-md w-full mx-auto">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-brand-blue-900 text-brand-gold-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-black text-brand-blue-900 uppercase tracking-tight">Golden Circle Login</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Enter your registered phone number</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-brand-blue-900 focus:bg-white focus:border-brand-blue-600 outline-none transition-all"
                            maxLength={11}
                            disabled={isSubmitting}
                        />
                    </div>
                    {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase">{error}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-brand-blue-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em]"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Verify Access <ArrowRight size={18} /></>}
                </Button>
            </form>

            <div className="pt-4 border-t border-slate-50 text-center space-y-3">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Access exclusive 3% rewards & priority sourcing.
                </p>
                <div className="bg-brand-blue-50/50 p-3 rounded-xl border border-brand-blue-100">
                    <p className="text-[8px] text-brand-blue-600 font-black uppercase tracking-widest leading-normal">
                        Note: Minimum order of <span className="text-brand-blue-900 underline decoration-2 underline-offset-2">৳2,000</span> required for automatic eligibility.
                    </p>
                </div>
            </div>
        </div>
    );
}
