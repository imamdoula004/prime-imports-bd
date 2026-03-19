'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';

import { useMemberAuth } from '@/context/MemberAuthContext';
import { useRealTimeMember } from '@/hooks/useRealTimeData';

export default function AddressesPage() {
    const { phoneNumber } = useMemberAuth();
    const { member, loading } = useRealTimeMember(phoneNumber || '');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Delivery Addresses</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your premium delivery destinations</p>
                </div>
                <button className="px-6 py-3 bg-brand-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue-900/20 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={14} strokeWidth={3} />
                    Add New
                </button>
            </div>

            {loading ? (
                <div className="h-48 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {member?.address ? (
                    <div className="bg-white rounded-[2rem] border-2 border-brand-blue-600 p-8 relative overflow-hidden group shadow-xl shadow-brand-blue-900/5">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                <Check size={18} strokeWidth={3} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-brand-blue-50 rounded-xl flex items-center justify-center text-brand-blue-600">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Default Address</h3>
                                <p className="text-[10px] font-black text-brand-gold-600 uppercase tracking-widest">Verified Destination</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-brand-blue-900 font-black text-lg leading-tight uppercase tracking-tight">
                                {member.address}
                            </p>
                            <div className="pt-4 border-t border-slate-50 flex gap-4">
                                <button className="text-[10px] font-black uppercase tracking-widest text-brand-blue-600 hover:text-brand-blue-900 transition-colors">Edit Details</button>
                                <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors">Remove</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="md:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-brand-blue-50 rounded-full flex items-center justify-center text-brand-blue-600 mx-auto mb-6">
                            <MapPin size={32} />
                        </div>
                        <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">No addresses saved</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Add a delivery address to speed up your elite checkouts</p>
                    </div>
                )}
            </div>
        )}
    </div>
);
}
