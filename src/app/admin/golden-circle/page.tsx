'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    deleteDoc, 
    doc, 
    serverTimestamp, 
    writeBatch, 
    updateDoc, 
    setDoc 
} from 'firebase/firestore';
import { 
    useRealTimeMembers, 
    useRealTimeAdminStats, 
    useRealTimeGCRequests 
} from '@/hooks/useRealTimeData';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, 
    Star, 
    Plus, 
    Trash2, 
    UserPlus, 
    Search, 
    Phone, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    Clock,
    ShieldCheck,
    ArrowUpRight,
    Filter,
    MoreHorizontal,
    LayoutGrid,
    List,
    Download,
    TrendingUp,
    Shield
} from 'lucide-react';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { GoldenMember, GoldenCircleRequest } from '@/types';

export default function UnifiedGoldenCircleAdmin() {
    const { members, loading: membersLoading } = useRealTimeMembers();
    const { requests, loading: requestsLoading } = useRealTimeGCRequests();
    const stats = useRealTimeAdminStats();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({ phone: '', name: '', notes: '' });
    const [bulkImport, setBulkImport] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [activeTab, setActiveTab] = useState('members');

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        const sanitized = sanitizePhone(newMember.phone);
        if (!isValidBDPhone(sanitized)) return alert("Please enter a valid 11-digit BD phone number.");

        try {
            await setDoc(doc(db, 'goldenCircleUsers', sanitized), {
                phoneNumber: sanitized,
                name: newMember.name,
                isActive: true,
                createdAt: serverTimestamp(),
                notes: newMember.notes,
                totalSpent: 0,
                totalSaved: 0
            });
            setNewMember({ phone: '', name: '', notes: '' });
            setIsAddingMember(false);
        } catch (err) {
            console.error("Error adding member:", err);
            alert("Failed to add member. Check console.");
        }
    };

    const handleBulkImport = async () => {
        if (!bulkImport.trim()) return;
        setIsImporting(true);
        const phones = bulkImport.split(/[\n,]+/).map(p => sanitizePhone(p.trim())).filter(p => isValidBDPhone(p));
        
        try {
            const batch = writeBatch(db);
            phones.forEach(phone => {
                const ref = doc(db, 'goldenCircleUsers', phone);
                batch.set(ref, {
                    phoneNumber: phone,
                    isActive: true,
                    createdAt: serverTimestamp(),
                    totalSpent: 0,
                    totalSaved: 0,
                    notes: 'Bulk imported legacy member'
                });
            });
            await batch.commit();
            setBulkImport('');
            alert(`Successfully imported ${phones.length} new members.`);
        } catch (err) {
            console.error("Bulk import error:", err);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Are you sure you want to remove this member? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'goldenCircleUsers', id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const handleRequestAction = async (request: GoldenCircleRequest, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                await setDoc(doc(db, 'goldenCircleUsers', request.phoneNumber), {
                    phoneNumber: request.phoneNumber,
                    name: request.name,
                    isActive: true,
                    createdAt: serverTimestamp(),
                    notes: `Approved request via Admin. Source: ${request.source}.`,
                    totalSpent: request.orderTotal || 0,
                    totalSaved: 0
                });
                
                await updateDoc(doc(db, 'goldenCircleRequests', request.id!), {
                    status: 'approved',
                    processedAt: serverTimestamp()
                });

                console.log(`[SMS NOTIFICATION] Sent approval to ${request.phoneNumber}`);
                alert(`Membership approved for ${request.name}!`);
            } else {
                await updateDoc(doc(db, 'goldenCircleRequests', request.id!), {
                    status: 'rejected',
                    processedAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Request action error:", err);
            alert(`Failed to ${action} request`);
        }
    };

    const pendingRequests = requests.filter((r: GoldenCircleRequest) => r.status === 'pending');
    const filteredMembers = members.filter(m => {
        const search = searchTerm.toLowerCase();
        return (
            m.name?.toLowerCase().includes(search) || 
            m.phoneNumber?.includes(search) ||
            m.id?.toLowerCase().includes(search)
        );
    });

    const isLoading = membersLoading || requestsLoading;

    if (isLoading && members.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Loading Member Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-gold-50 text-brand-gold-600 rounded-xl">
                            <Star size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Golden Circle</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Unified Membership & Lifecycle Management</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={() => setIsAddingMember(true)} 
                        className="bg-brand-blue-900 text-white gap-2 text-[10px] font-black uppercase tracking-widest h-12 px-6 rounded-2xl shadow-xl shadow-brand-blue-900/10 hover:scale-105 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} /> Add New Member
                    </Button>
                </div>
            </header>

            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Active Members" 
                    value={members.length} 
                    icon={Users} 
                    color="blue" 
                />
                <StatCard 
                    title="Pending Requests" 
                    value={pendingRequests.length} 
                    icon={Clock} 
                    color="gold" 
                    alert={pendingRequests.length > 0}
                />
                <StatCard 
                    title="Member Savings" 
                    value={`৳${Math.round(stats.totalMemberSavings || 0).toLocaleString()}`} 
                    icon={ShieldCheck} 
                    color="emerald" 
                />
                <StatCard 
                    title="Total Spending" 
                    value={`৳${Math.round(stats.totalMemberSpending || 0).toLocaleString()}`} 
                    icon={TrendingUp} 
                    color="purple" 
                />
            </div>

            {/* Main Tabs UI */}
            <Tabs defaultValue="members" onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-white p-3 rounded-3xl border border-slate-100 shadow-sm">
                    <TabsList className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto">
                        <TabsTrigger value="members" className="rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-brand-blue-900">
                            Registry
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest relative data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-brand-blue-900">
                            Requests
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-bounce">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="import" className="rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-brand-blue-900">
                            Bulk Import
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'members' && (
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                                type="text"
                                placeholder="Search registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-brand-blue-900 focus:bg-white focus:ring-4 focus:ring-brand-blue-500/5 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    <TabsContent key="members-tab" value="members" className="mt-0 focus-visible:outline-none">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-50">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Identity</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredMembers.map((member) => (
                                            <tr key={member.id || member.phoneNumber || Math.random()} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-2xl bg-brand-blue-900 text-brand-gold-400 flex items-center justify-center font-black text-sm uppercase shadow-lg shadow-brand-blue-900/20 group-hover:scale-110 transition-transform">
                                                                {member.name?.substring(0, 2) || member.phoneNumber?.substring(0, 2)}
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg border-2 border-slate-50 flex items-center justify-center">
                                                                <Star size={10} className="text-brand-gold-500" fill="currentColor" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-brand-blue-950 uppercase tracking-tight">{member.name || 'Anonymous'}</p>
                                                            <p className="text-[11px] font-bold text-slate-400 tracking-widest flex items-center gap-1.5 mt-0.5">
                                                                <Phone size={10} className="text-slate-300" /> +880 {member.phoneNumber}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <p className="text-[11px] font-black text-slate-600 uppercase">৳{Math.round(member.totalSpent || 0).toLocaleString()} spent</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-gold-500" />
                                                            <p className="text-[11px] font-black text-slate-400 uppercase italic">৳{Math.round(member.totalSaved || 0).toLocaleString()} saved</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${member.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                        <Shield size={10} fill="currentColor" /> {member.isActive ? 'Active' : 'Locked'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleDeleteMember(member.phoneNumber!)} 
                                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            title="Delete Member"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button 
                                                            className="p-2.5 text-slate-300 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-xl transition-all"
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredMembers.length === 0 && (
                                <div className="p-12 text-center space-y-3 opacity-50">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest">No matching members found</p>
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent key="requests-tab" value="requests" className="mt-0 focus-visible:outline-none">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {pendingRequests.length === 0 ? (
                                <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-5">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="text-sm font-black text-brand-blue-950 uppercase tracking-widest">All caught up!</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">No pending membership requests currently require your attention.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pendingRequests.map((req: GoldenCircleRequest) => (
                                        <motion.div 
                                            key={req.id} 
                                            layout
                                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6 group hover:border-brand-blue-200 transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-blue-900 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                        <UserPlus size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-brand-blue-950 uppercase tracking-tight">{req.name}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <p className="text-[11px] font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
                                                                <Phone size={10} className="text-slate-300" /> +880 {req.phoneNumber}
                                                            </p>
                                                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                            <span className="text-[9px] font-black text-brand-blue-600 border border-brand-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                                                                {req.source}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoiced Amount</p>
                                                    <p className="text-sm font-black text-brand-blue-900 italic">
                                                        ৳{req.orderTotal?.toLocaleString() || '2,000+'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Submission Time</p>
                                                    <p className="text-sm font-black text-slate-600 uppercase tracking-tighter">
                                                        {req.requestedAt?.seconds ? new Date(req.requestedAt.seconds * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Sync'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button 
                                                    onClick={() => handleRequestAction(req, 'approve')}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest gap-2 h-14 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center"
                                                >
                                                    <CheckCircle2 size={16} /> Approve Access
                                                </button>
                                                <button 
                                                    onClick={() => handleRequestAction(req, 'reject')}
                                                    className="w-14 h-14 bg-white border border-red-50 text-red-500 hover:bg-red-50 flex items-center justify-center rounded-2xl active:scale-95 transition-all shadow-sm"
                                                    title="Reject Request"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent key="import-tab" value="import" className="mt-0 focus-visible:outline-none">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-8 max-w-2xl"
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-brand-blue-950 uppercase tracking-tight flex items-center gap-3">
                                    <Download className="text-brand-blue-600" size={20} />
                                    Bulk Member Onboarding
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Quickly activate legacy Golden Circle members by uploading their phone numbers.
                                    <br /><span className="text-brand-gold-600">Format: Paste a list separated by commas or new lines.</span>
                                </p>
                            </div>
                            
                            <textarea
                                value={bulkImport}
                                onChange={(e) => setBulkImport(e.target.value)}
                                placeholder="01711223344&#10;01822334455, 01933445566"
                                className="w-full h-56 bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-sm font-black text-brand-blue-950 focus:bg-white focus:border-brand-blue-600 outline-none transition-all resize-none shadow-inner placeholder:text-slate-200"
                            />
                            
                            <Button
                                onClick={handleBulkImport}
                                disabled={isImporting || !bulkImport.trim()}
                                className="w-full h-16 bg-brand-blue-900 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:translate-y-[-2px] transition-all disabled:opacity-50"
                            >
                                {isImporting ? <Loader2 className="animate-spin" size={20} /> : 'Synchronize Member List'}
                            </Button>
                        </motion.div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Modal for Manual Entry (Minimal overlay) */}
            <AnimatePresence>
                {isAddingMember && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-blue-950/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-base font-black text-brand-blue-950 uppercase tracking-tight">Manual Activation</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Directly grant Golden Circle status</p>
                            </div>
                            <form onSubmit={handleAddMember} className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input 
                                        required
                                        type="tel"
                                        placeholder="01XXXXXXXXX"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-black text-brand-blue-950 focus:bg-white focus:border-brand-blue-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Member Name"
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-black text-brand-blue-950 focus:bg-white focus:border-brand-blue-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAddingMember(false)} className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest h-14">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-brand-blue-900 border-none text-white rounded-2xl text-[10px] font-black uppercase tracking-widest h-14 shadow-lg shadow-brand-blue-900/20">
                                        Activate
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, alert }: { title: string, value: string | number, icon: any, color: string, alert?: boolean }) {
    const colorMap: any = {
        blue: 'bg-brand-blue-50 text-brand-blue-600',
        gold: 'bg-brand-gold-50 text-brand-gold-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 space-y-4 hover:translate-y-[-2px] transition-all group overflow-hidden relative">
            {alert && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <div className={`w-12 h-12 rounded-2xl ${colorMap[color] || 'bg-slate-50 text-slate-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</p>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-brand-blue-900 tracking-tighter">{value}</p>
                    <div className="mb-1 text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                        <ArrowUpRight size={12} strokeWidth={3} />
                        LIVE
                    </div>
                </div>
            </div>
        </div>
    );
}
