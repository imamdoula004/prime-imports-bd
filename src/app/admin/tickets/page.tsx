'use client';

import { TicketIcon, MessageSquare, Clock, CheckCircle2, AlertCircle, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRealTimeTickets } from '@/hooks/useRealTimeData';

export default function AdminTicketsPage() {
    const { tickets, loading } = useRealTimeTickets();

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Retrieving Support Tickets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Ticketing Hub</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Manage Support Inquiries</p>
                </div>
                <button className="flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-blue-700 transition-colors shadow-lg shadow-brand-blue-600/20 active:scale-95">
                    <Plus size={16} strokeWidth={3} />
                    New Ticket
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Open', value: tickets.filter(t => t.status === 'open').length.toString(), color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
                    { label: 'Pending', value: tickets.filter(t => t.status === 'pending').length.toString(), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'closed').length.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Urgent', value: tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length.toString(), color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
                        <span className={`text-2xl font-black ${stat.color} ${stat.bg} w-full rounded-xl py-2`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-50">
                    <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Recent Activity</h2>
                </div>

                <div className="divide-y divide-slate-50">
                    {tickets.length === 0 ? (
                        <div className="px-8 py-24 text-center">
                            <TicketIcon size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No tickets reported yet</p>
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link
                                href={`/admin/tickets/${ticket.id}`}
                                key={ticket.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 hover:bg-slate-50 transition-colors group block"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ticket.status === 'closed' ? 'bg-slate-100 text-slate-400' :
                                            ticket.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                                                'bg-brand-blue-50 text-brand-blue-600'
                                        }`}>
                                        {ticket.status === 'closed' ? <CheckCircle2 size={20} /> :
                                            ticket.priority === 'high' ? <AlertCircle size={20} /> :
                                                <TicketIcon size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{ticket.id?.slice(0, 8)}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ticket.status === 'closed' ? 'bg-slate-200 text-slate-600' :
                                                    ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-brand-blue-100 text-brand-blue-700'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-brand-blue-900 group-hover:text-brand-blue-600 transition-colors truncate">{ticket.subject}</h3>
                                        <p className="text-xs font-bold text-slate-500 mt-1 truncate">Customer: {ticket.customerName || 'Anonymous'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 sm:justify-end text-xs font-bold text-slate-400 shrink-0 ml-14 sm:ml-0">
                                    <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {ticket.messages?.length || 0}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} />
                                        {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

