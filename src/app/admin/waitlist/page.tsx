'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import {
    Bell,
    Users,
    Calendar,
    Phone,
    Mail,
    ChevronRight,
    RefreshCcw,
    Search,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { triggerRestockNotifications } from '@/lib/notifications';
import { format } from 'date-fns';

interface WaitlistEntry {
    id: string;
    productId: string;
    productName: string;
    waitlistCount: number;
    updatedAt: any;
    users: Array<{
        phone: string;
        email?: string;
        timestamp: string;
    }>;
}

export default function AdminWaitlistPage() {
    const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [notifying, setNotifying] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'waitlists'), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as WaitlistEntry));
            setWaitlists(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleManualNotify = async (productId: string, productName: string) => {
        if (!confirm(`Are you sure you want to notify ${waitlists.find(w => w.productId === productId)?.waitlistCount} customers for ${productName}?`)) return;

        setNotifying(productId);
        await triggerRestockNotifications(productId, productName);
        setNotifying(null);
    };

    const handleDeleteWaitlist = async (id: string) => {
        if (!confirm('This will delete the entire waitlist for this product without notifying. Continue?')) return;
        await deleteDoc(doc(db, 'waitlists', id));
    };

    const filteredWaitlists = waitlists.filter(w =>
        w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.productId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-brand-blue-600/10 rounded-2xl flex items-center justify-center text-brand-blue-600">
                        <Bell size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Restock Waitlist</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Manage restock leads & notifications</p>
                    </div>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue-600 transition-all font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCcw className="animate-spin text-brand-blue-600" size={40} />
                </div>
            ) : filteredWaitlists.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Users size={40} />
                    </div>
                    <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">No active waitlists</h3>
                    <p className="text-slate-500 mt-2 font-medium">When products go out of stock, leads will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredWaitlists.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:border-brand-blue-600/30 transition-all">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-brand-blue-900 text-sm border border-slate-100 group-hover:bg-brand-blue-50 transition-colors">
                                        {entry.waitlistCount}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-brand-blue-900 leading-tight">{entry.productName}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {entry.productId}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleManualNotify(entry.productId, entry.productName)}
                                        disabled={notifying === entry.productId}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${notifying === entry.productId
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 shadow-lg shadow-brand-blue-600/20 active:scale-95'
                                            }`}
                                    >
                                        {notifying === entry.productId ? (
                                            <RefreshCcw size={14} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={14} />
                                        )}
                                        {notifying === entry.productId ? 'Notifying...' : 'Notify All Now'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWaitlist(entry.id)}
                                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-90 border border-rose-100"
                                        title="Clear list"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {entry.users.slice(0, 6).map((user, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/user hover:shadow-md transition-all">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 text-brand-blue-900 font-bold text-sm truncate">
                                                    <Phone size={12} className="text-brand-blue-600" />
                                                    {user.phone}
                                                </div>
                                                {user.email && (
                                                    <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px] truncate mt-0.5">
                                                        <Mail size={10} />
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-slate-400 font-black text-[8px] uppercase tracking-tighter">
                                                    <Calendar size={10} />
                                                    {user.timestamp ? format(new Date(user.timestamp), 'MMM dd, HH:mm') : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {entry.users.length > 6 && (
                                        <div className="flex items-center justify-center p-4 rounded-2xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            + {entry.users.length - 6} more leads
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
