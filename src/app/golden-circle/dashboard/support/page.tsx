'use client';

import { Send, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function GoldenCircleSupportPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-black text-brand-blue-900 tracking-tight">Support Center</h1>
                <p className="text-slate-500 font-bold text-sm mt-1">Submit Inquiry</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-50">
                            <div className="w-10 h-10 rounded-xl bg-brand-gold-50 flex items-center justify-center text-brand-gold-600">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">New Support Ticket</h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Our team typically responds within <span className="text-brand-gold-600">2 hours</span> for premium imports.</p>
                            </div>
                        </div>

                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsSubmitting(true); setTimeout(() => setIsSubmitting(false), 1000); }}>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Order #PI-9932 Status"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-brand-blue-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue-500 transition-shadow"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category</label>
                                <select
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-500 transition-shadow appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Select an issue type...</option>
                                    <option value="delivery">Delivery & Tracking</option>
                                    <option value="product">Product Quality / Availability</option>
                                    <option value="billing">Billing & Refunds</option>
                                    <option value="account">Golden Circle Account</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Message</label>
                                <textarea
                                    placeholder="Please provide details about your inquiry..."
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue-500 transition-shadow min-h-[150px] resize-y"
                                    required
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-blue-900 text-brand-gold-400 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-800 transition-all shadow-xl shadow-brand-blue-900/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-brand-gold-400/30 border-t-brand-gold-400 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={16} strokeWidth={3} />
                                            Submit Inquiry
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Active Tickets */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>

                        <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                            <h3 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">My Active Tickets</h3>
                            <span className="bg-brand-blue-50 text-brand-blue-600 text-[10px] font-black px-2 py-0.5 rounded-md">2 Open</span>
                        </div>

                        <div className="relative z-10 space-y-4">
                            {/* Ticket 1 */}
                            <div className="group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 mt-1">
                                        <Clock size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-brand-blue-900 leading-tight group-hover:text-brand-blue-600 transition-colors">Australian Wagyu Delivery</h4>
                                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">Inquiring about the next batch arrival date for the A5 grade cuts...</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last updated: 15 mins ago</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">In Progress</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-50 w-full ml-12"></div>

                            {/* Ticket 2 */}
                            <div className="group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-1">
                                        <AlertCircle size={14} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-brand-blue-900 leading-tight group-hover:text-brand-blue-600 transition-colors">Order Cancellation #122</h4>
                                        <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">Need to cancel my order for French Truffles due to address error...</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last updated: 2 hours ago</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Action Required</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-brand-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors relative z-10">
                            View All History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
