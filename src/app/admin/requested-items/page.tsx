'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { RequestedItem } from '@/types';
import { 
    PackageSearch, 
    Search, 
    Filter, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    MoreHorizontal,
    Phone,
    User,
    StickyNote,
    ExternalLink
} from 'lucide-react';
import Image from 'next/image';

const STATUS_COLORS = {
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Reviewed': 'bg-blue-100 text-blue-700 border-blue-200',
    'Sourced': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Rejected': 'bg-rose-100 text-rose-700 border-rose-200'
};

export default function RequestedItemsAdmin() {
    const [requests, setRequests] = useState<RequestedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);


    useEffect(() => {
        const q = query(collection(db, 'requestedItems'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as RequestedItem));
            setRequests(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requested items:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, newStatus: RequestedItem['status']) => {
        try {
            await updateDoc(doc(db, 'requestedItems', id), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const updateNotes = async (id: string, notes: string) => {
        try {
            await updateDoc(doc(db, 'requestedItems', id), {
                adminNotes: notes
            });
        } catch (error) {
            console.error("Error updating notes:", error);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = 
            req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.phone.includes(searchTerm) ||
            req.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Syncing Sourcing Requests...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Sourcing Dashboard</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Real-time Product Requests Management</p>
                </div>
                <div className="bg-brand-blue-50 px-4 py-2 rounded-2xl border border-brand-blue-100 italic">
                    <span className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest">Total Active: {requests.length}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Title, Brand, Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-brand-blue-500 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['all', 'Pending', 'Reviewed', 'Sourced', 'Rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex-shrink-0 ${statusFilter === status
                                ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-xl shadow-brand-blue-900/10'
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests Grid/Table */}
            <div className="grid grid-cols-1 gap-6">
                {filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100">
                        <PackageSearch size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">No requests found</h3>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase">Try adjusting your filters or search term</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-blue-200 transition-all group overflow-hidden relative">
                            {/* Status Tag - Top Right */}
                            <div className={`absolute top-0 right-0 px-8 py-2 rounded-bl-[2rem] border-l border-b text-[10px] font-black uppercase tracking-[0.2em] ${STATUS_COLORS[req.status]}`}>
                                {req.status}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Left: Product Image */}
                                <div 
                                    onClick={() => req.imageUrl && setSelectedImage(req.imageUrl)}
                                    className="w-full lg:w-48 h-48 relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 cursor-zoom-in group-hover:border-brand-blue-400 transition-colors"
                                >
                                    {req.imageUrl ? (
                                        <Image 
                                            src={req.imageUrl} 
                                            alt={req.title} 
                                            fill 
                                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (

                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <PackageSearch size={32} />
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-2">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Middle: Details */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-brand-blue-500 uppercase tracking-widest">{req.brand}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-400 capitalize">
                                                {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-brand-blue-950 uppercase tracking-tight leading-none group-hover:text-brand-blue-600 transition-colors">
                                            {req.title}
                                        </h3>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <StickyNote size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Customer Notes</span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                                            "{req.description || 'No additional details provided'}"
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                            <User size={14} className="text-brand-blue-600" />
                                            <span className="text-[10px] font-black text-brand-blue-900 uppercase">{req.customerName || 'Anonymous'}</span>
                                        </div>
                                        <a 
                                            href={`tel:${req.phone}`}
                                            className="flex items-center gap-2 bg-brand-blue-50 px-4 py-2 rounded-xl border border-brand-blue-100 hover:bg-brand-blue-600 hover:text-white transition-all group/phone"
                                        >
                                            <Phone size={14} className="text-brand-blue-600 group-hover/phone:text-white transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-widest group-hover/phone:text-white">{req.phone}</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Right: Admin Controls */}
                                <div className="w-full lg:w-72 space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Status</label>
                                        <select
                                            value={req.status}
                                            onChange={(e) => updateStatus(req.id!, e.target.value as RequestedItem['status'])}
                                            className="w-full h-12 bg-slate-100 border-none rounded-xl px-4 text-[11px] font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-brand-blue-500 transition-all shadow-inner"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Reviewed">Reviewed</option>
                                            <option value="Sourced">Sourced</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
                                        <textarea
                                            placeholder="Update customer about price or availability..."
                                            className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all resize-none shadow-inner"
                                            value={req.adminNotes}
                                            onChange={(e) => updateNotes(req.id!, e.target.value)}
                                        />
                                    </div>

                                    <button className="w-full h-10 bg-brand-blue-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] opacity-30 cursor-not-allowed">
                                        Auto-Sync Enabled
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Full Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <XCircle size={48} strokeWidth={1.5} />
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-full">
                        <Image 
                            src={selectedImage} 
                            alt="Full Preview" 
                            fill 
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

