'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { MessageSquare, FileText, PhoneCall, ChevronRight, HelpCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SupportPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        orderNumber: '',
        issueType: 'Order Tracking & Delivery',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            alert("Please fill in all required fields.");
            return;
        }

        setStatus('submitting');
        try {
            const ticketsRef = collection(db, 'tickets');
            await addDoc(ticketsRef, {
                customerName: formData.name,
                customerEmail: formData.email,
                subject: `${formData.issueType} - ${formData.orderNumber || 'General'}`,
                messages: [{
                    sender: 'customer',
                    content: formData.message,
                    timestamp: new Date().toISOString()
                }],
                orderNumber: formData.orderNumber || null,
                priority: 'normal', // Default
                status: 'open',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            setStatus('success');
            setFormData({ name: '', email: '', orderNumber: '', issueType: 'Order Tracking & Delivery', message: '' });

            setTimeout(() => {
                setStatus('idle');
            }, 5000);
        } catch (error) {
            console.error("Error submitting ticket:", error);
            setStatus('error');
            alert("There was an error submitting your ticket. Please try again.");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24" suppressHydrationWarning>

            {/* Support Header */}
            <section className="bg-brand-blue-900 text-white pt-12 pb-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-brand-gold-500 rounded-2xl mb-6 shadow-card">
                        <HelpCircle size={40} className="text-brand-blue-900" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        How can we help you today?
                    </h1>
                    <p className="text-brand-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90">
                        Our Prime Imports BD support team and intelligent assistants are here to resolve your issues quickly.
                    </p>
                </div>
            </section>

            <main className="container mx-auto px-4 max-w-5xl -mt-10 relative z-10">

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {/* Contact Cards */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                        <MessageSquare className="text-brand-gold-500 mb-4" size={32} />
                        <h3 className="text-xl font-extrabold text-brand-blue-900 mb-2">Live Chat</h3>
                        <p className="text-gray-500 text-sm font-medium mb-6">Chat with our intelligent agent or a real human instantly.</p>
                        <Button variant="outline" className="w-full font-bold border-gray-200">Start Chat</Button>
                    </div>

                    <div className="bg-brand-blue-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-brand-blue-800 flex flex-col items-center text-center transform md:-translate-y-4">
                        <FileText className="text-brand-gold-400 mb-4" size={32} />
                        <h3 className="text-xl font-extrabold text-white mb-2">Submit a Ticket</h3>
                        <p className="text-white/80 text-sm font-medium mb-6">Open a formal request for complex issues like returns or missing items.</p>
                        <a href="#ticket-form" className="w-full">
                            <Button className="w-full font-bold bg-white text-brand-blue-900 hover:bg-slate-100 border-none">Open Ticket</Button>
                        </a>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-card border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                        <PhoneCall className="text-brand-gold-500 mb-4" size={32} />
                        <h3 className="text-xl font-extrabold text-brand-blue-900 mb-2">Call Us</h3>
                        <p className="text-gray-500 text-sm font-medium mb-6">Speak directly with Golden Circle VIP support.</p>
                        <Button variant="outline" className="w-full font-bold border-gray-200">View Numbers</Button>
                    </div>
                </div>

                {/* Ticket Submission Form */}
                <div id="ticket-form" className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-card border border-gray-100 max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue-900 tracking-tight mb-2">Submit a Support Ticket</h2>
                        <p className="text-gray-500 font-medium">Please provide as much detail as possible. Tickets are typically answered within 2 hours.</p>
                    </div>

                    {status === 'success' ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-extrabold text-emerald-900 mb-2">Ticket Submitted Successfully!</h3>
                            <p className="text-emerald-700 font-medium">Our team will review your inquiry and get back to you shortly.</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit} suppressHydrationWarning>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
                                    <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white text-brand-blue-900 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address *</label>
                                    <input required name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white text-brand-blue-900 font-medium" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Number (Optional)</label>
                                <input name="orderNumber" value={formData.orderNumber} onChange={handleChange} type="text" placeholder="e.g. #PIBD-12345" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white text-brand-blue-900 font-medium" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Issue Type</label>
                                <select name="issueType" value={formData.issueType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white text-brand-blue-900 font-medium appearance-none">
                                    <option>Order Tracking & Delivery</option>
                                    <option>Returns & Refunds</option>
                                    <option>Product Inquiry</option>
                                    <option>Golden Circle Membership</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Message *</label>
                                <textarea required name="message" value={formData.message} onChange={handleChange} rows={5} placeholder="Describe your issue in detail..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white text-brand-blue-900 font-medium resize-none"></textarea>
                            </div>

                            <Button disabled={status === 'submitting'} type="submit" className="w-full py-5 text-white bg-brand-blue-900 hover:bg-brand-blue-800 font-extrabold text-lg rounded-xl shadow-button flex items-center justify-center gap-2 group border-none">
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                        Submit Ticket
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </div>

            </main>
        </div>
    );
}
