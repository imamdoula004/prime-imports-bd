import { Phone, Mail, MessageCircle, MapPin, Send, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
    return (
        <div className="bg-white min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-20 text-brand-blue-900">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue-50 rounded-3xl mb-8">
                        <Phone size={40} className="text-brand-blue-600" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">Connect With Us</h1>
                    <p className="text-slate-500 text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                        Premium assistance for your premium needs. Our specialists are ready to help with orders, inquiries, or VIP membership.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Contact Methods */}
                    <div className="space-y-8">
                        <div className="group p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-brand-blue-900 hover:text-white transition-all shadow-xl shadow-brand-blue-900/5">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                    <Phone size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-blue-300 transition-colors">Call or WhatsApp</p>
                                    <p className="text-2xl font-black">+880 1234 567890</p>
                                </div>
                            </div>
                        </div>

                        <div className="group p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-brand-blue-900 hover:text-white transition-all shadow-xl shadow-brand-blue-900/5">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                    <Mail size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-blue-300 transition-colors">Support Email</p>
                                    <p className="text-2xl font-black">support@primeimports.bd</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-brand-blue-50 border-2 border-brand-blue-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="text-brand-blue-600 fill-current" size={24} />
                                <h3 className="text-xl font-black text-brand-blue-900 uppercase">Golden Circle Support</h3>
                            </div>
                            <p className="text-slate-600 font-bold mb-6">VIP members get 24/7 dedicated support via our private WhatsApp line.</p>
                            <Button className="w-full bg-brand-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-blue-600/20 active:scale-[0.98] transition-all">
                                <MessageCircle className="mr-2" size={20} /> Join & Chat Now
                            </Button>
                        </div>
                    </div>

                    {/* Quick Inquiry Form */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-brand-blue-900/10 border border-slate-100">
                        <h2 className="text-3xl font-black text-brand-blue-900 mb-8 uppercase tracking-tight">Quick Inquiry</h2>
                        <form className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</label>
                                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-brand-blue-900 font-bold focus:ring-4 focus:ring-brand-blue-100 transition-all" placeholder="Enter your name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</label>
                                <input type="email" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-brand-blue-900 font-bold focus:ring-4 focus:ring-brand-blue-100 transition-all" placeholder="your@email.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Message</label>
                                <textarea className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-brand-blue-900 font-bold focus:ring-4 focus:ring-brand-blue-100 transition-all resize-none" rows={4} placeholder="How can we help?"></textarea>
                            </div>
                            <Button className="w-full bg-brand-blue-900 text-white font-black py-6 rounded-2xl text-lg shadow-2xl shadow-brand-blue-900/20 active:scale-[0.98] transition-all uppercase">
                                <Send className="mr-3" size={20} /> Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
