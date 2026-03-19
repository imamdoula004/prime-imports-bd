'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Bell, Save, Camera, Loader2 as LoaderIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

import { useMemberAuth } from '@/context/MemberAuthContext';
import { useRealTimeMember } from '@/hooks/useRealTimeData';

export default function SettingsPage() {
    const { phoneNumber } = useMemberAuth();
    const { member, loading: memberLoading } = useRealTimeMember(phoneNumber || '');
    const [updating, setUpdating] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSync = async () => {
        if (!member?.phone) return;
        setUpdating(true);
        try {
            const memberDoc = doc(db, 'goldenCircleApplications', member.phone);
            await updateDoc(memberDoc, {
                profileImage: tempImage || member.profileImage || null
            });
            alert('Settings synchronized successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to sync settings.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Account Settings</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure your premium browsing experience</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-12 shadow-sm space-y-10">
                {/* Profile Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue-50 flex items-center justify-center text-brand-blue-600">
                            <User size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Display Identity</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-brand-blue-600 transition-colors">
                                {tempImage || member?.profileImage ? (
                                    <img src={tempImage || member?.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-slate-300" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-blue-900 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-brand-blue-800 transition-colors active:scale-90">
                                <Camera size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <p className="text-xs font-black text-brand-blue-900 uppercase tracking-tight">Profile Essence</p>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest max-w-xs">
                                Upload a high-resolution image to represent your elite presence within the Golden Circle.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue-50 flex items-center justify-center text-brand-blue-600">
                            <User size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Personal Identification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</label>
                            <input
                                type="text"
                                defaultValue={member?.name || ''}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-blue-600 focus:bg-white rounded-2xl px-6 py-4 text-sm font-black text-brand-blue-900 outline-none transition-all uppercase tracking-tight"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Protocol</label>
                            <input
                                type="email"
                                defaultValue={member?.email || ''}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-brand-blue-600 focus:bg-white rounded-2xl px-6 py-4 text-sm font-black text-brand-blue-900 outline-none transition-all"
                                readOnly
                            />
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue-50 flex items-center justify-center text-brand-blue-600">
                            <Bell size={20} />
                        </div>
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Privacy & Notifications</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            'Priority stock alerts for saved items',
                            'Executive drop announcements',
                            'Market update summaries',
                            'Private curation reminders'
                        ].map((label, i) => (
                            <label key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue-900 opacity-70 group-hover:opacity-100 transition-opacity">{label}</span>
                                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" />
                                </div>
                            </label>
                        ))}
                    </div>
                </section>

                <div className="pt-4">
                    <button 
                        onClick={handleSync}
                        disabled={updating}
                        className="flex items-center justify-center gap-3 w-full md:w-auto px-12 py-5 bg-brand-blue-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-blue-900/20 active:scale-95 transition-all group disabled:opacity-50"
                    >
                        {updating ? (
                            <LoaderIcon className="animate-spin" size={18} />
                        ) : (
                            <Save size={18} className="group-hover:rotate-12 transition-transform" />
                        )}
                        Synchronize Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
