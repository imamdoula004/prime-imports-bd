'use client';

import { CreditCard, Plus, ShieldCheck } from 'lucide-react';

export default function PaymentsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Payment Methods</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Securely manage your premium payment options</p>
                </div>
                <button className="px-6 py-3 bg-brand-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue-900/20 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={14} strokeWidth={3} />
                    Add Card
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-brand-blue-900 to-brand-blue-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl group border border-white/5 min-h-[220px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500 rounded-full blur-3xl opacity-10 translate-x-1/3 -translate-y-1/3 group-hover:opacity-20 transition-opacity" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                            <CreditCard size={24} className="text-brand-gold-400" />
                        </div>
                        <ShieldCheck size={20} className="text-brand-gold-400 opacity-50" />
                    </div>

                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-2">XXXX XXXX XXXX 8829</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Card Holder</p>
                                <p className="text-xs font-black uppercase tracking-widest">GOLDEN MEMBER</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Expires</p>
                                <p className="text-xs font-black uppercase tracking-widest">12/28</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center hover:bg-white hover:border-brand-blue-600 transition-all group min-h-[220px]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-brand-blue-600 shadow-sm mb-4 transition-transform group-hover:scale-110">
                        <Plus size={24} strokeWidth={3} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-blue-900 transition-colors">Add Backup Method</p>
                </button>
            </div>

            <div className="p-6 bg-brand-blue-50/50 rounded-2xl border border-brand-blue-100/50 flex items-center gap-4">
                <ShieldCheck size={24} className="text-brand-blue-600 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue-900 leading-relaxed">
                    All payment data is encrypted with bank-grade security and never stored directly on our servers.
                </p>
            </div>
        </div>
    );
}
