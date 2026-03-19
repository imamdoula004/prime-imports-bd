'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft, User, Phone, Clock, AlertCircle, CheckCircle2, TicketIcon, Send, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRealTimeTicket } from '@/hooks/useRealTimeData';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export default function AdminTicketDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { ticket, loading } = useRealTimeTicket(id);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendReply = async () => {
        if (!reply.trim() || !ticket?.id) return;
        setSending(true);
        try {
            const ticketRef = doc(db, 'tickets', ticket.id);
            await updateDoc(ticketRef, {
                messages: arrayUnion({
                    role: 'admin',
                    text: reply.trim(),
                    timestamp: new Date()
                })
            });
            setReply('');
        } catch (error) {
            console.error('Error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    const toggleStatus = async () => {
        if (!ticket?.id) return;
        const ticketRef = doc(db, 'tickets', ticket.id);
        await updateDoc(ticketRef, {
            status: ticket.status === 'closed' ? 'open' : 'closed'
        });
    };

    if (loading) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-blue-600 mb-4" />
                <p className="font-black text-brand-blue-900 uppercase tracking-widest text-[10px]">Loading Ticket Details...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <XCircle size={48} className="text-rose-400 mb-4" />
                <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Ticket Not Found</h2>
                <p className="text-slate-400 font-medium mt-2 mb-6">The ticket you are looking for does not exist.</p>
                <Link href="/admin/tickets">
                    <button className="px-6 py-2 bg-brand-blue-600 text-white rounded-xl font-bold">Back to Tickets</button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/tickets" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 transition-colors shadow-sm border border-slate-100 shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-brand-blue-900 tracking-tight">{ticket.subject}</h1>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${ticket.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                            ticket.status === 'closed' ? 'bg-slate-200 text-slate-600' :
                                ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-brand-blue-100 text-brand-blue-700'
                            }`}>
                            {ticket.priority || ticket.status}
                        </span>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Ticket #{ticket.id!.toUpperCase()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Thread */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Message History</h2>
                            <span className="text-xs font-bold text-slate-400">
                                Created {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {ticket.messages?.map((msg, i) => (
                                <div key={i} className={`flex gap-4 ${msg.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black ${msg.role === 'admin' ? 'bg-brand-gold-400 text-brand-blue-900' : 'bg-brand-blue-50 text-brand-blue-600'}`}>
                                        {msg.role === 'admin' ? 'A' : <User size={18} />}
                                    </div>
                                    <div className={`flex-1 p-5 rounded-2xl ${msg.role === 'admin' ? 'bg-brand-blue-600 text-white rounded-tr-none' : 'bg-slate-50 rounded-tl-none'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-black text-sm ${msg.role === 'admin' ? '' : 'text-brand-blue-900'}`}>
                                                {msg.role === 'admin' ? 'Admin Support' : ticket.customerName}
                                            </span>
                                            <span className={`text-[10px] font-bold ${msg.role === 'admin' ? 'text-white/70' : 'text-slate-400'}`}>
                                                {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed font-medium ${msg.role === 'admin' ? 'text-white/90' : 'text-slate-600'}`}>
                                            {msg.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        {ticket.status !== 'closed' && (
                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="relative">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Type your reply to the customer..."
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-4 pr-14 text-sm font-medium text-brand-blue-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-500 transition-all resize-none h-24"
                                    ></textarea>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={sending || !reply.trim()}
                                        className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-brand-blue-600 text-white flex items-center justify-center hover:bg-brand-blue-700 transition-colors shadow-md disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Support Dashboard Powered by RedX
                                    </div>
                                    <button
                                        onClick={toggleStatus}
                                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Mark as Closed
                                    </button>
                                </div>
                            </div>
                        )}
                        {ticket.status === 'closed' && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex flex-col items-center justify-center gap-2">
                                <CheckCircle2 size={24} className="text-slate-400" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">This ticket is closed</p>
                                <button
                                    onClick={toggleStatus}
                                    className="text-[10px] text-brand-blue-600 font-bold uppercase tracking-widest hover:underline mt-1"
                                >
                                    Reopen Ticket
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest mb-6">Customer Details</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center font-black text-lg">
                                {ticket.customerName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-brand-blue-900">{ticket.customerName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-brand-gold-400"></span>
                                    <p className="text-[10px] font-black text-brand-gold-600 uppercase tracking-widest">Golden Circle</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
