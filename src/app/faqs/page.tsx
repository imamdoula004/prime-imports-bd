import { HelpCircle, ChevronDown, Zap } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            q: "How do I know the products are original?",
            a: "Every product we sell is imported directly from the UK, USA, or UAE. We maintain a full chain-of-custody and never source from local wholesale markets. Check our Authenticity Promise page for more details."
        },
        {
            q: "What is the delivery time in Dhaka?",
            a: "We offer express delivery within 12-36 hours inside Dhaka. Orders placed before 4:00 PM are typically delivered the same day."
        },
        {
            q: "Do you deliver outside Dhaka?",
            a: "Yes, we deliver nationwide across Bangladesh. Outside Dhaka delivery typically takes 48-72 hours via our partner courier services."
        },
        {
            q: "How can I join the Golden Circle?",
            a: "You can join by clicking 'Become a Member' in the footer or on the Golden Circle page. Membership gives you a lifetime 3% discount and VIP support."
        },
        {
            q: "What is your return policy?",
            a: "We accept returns within 48 hours for damaged or incorrect items. Please keep the original packaging and invoice intact."
        }
    ];

    return (
        <div className="bg-white min-h-screen py-20 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue-50 rounded-2xl mb-6 text-brand-blue-600">
                        <HelpCircle size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-brand-blue-900 uppercase tracking-tight">Common FAQs</h1>
                    <p className="text-slate-500 font-bold mt-2">Find quick answers to your questions.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-brand-blue-200 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-brand-blue-900 pr-8">{faq.q}</h3>
                                <ChevronDown className="text-slate-400 group-hover:text-brand-blue-600 transition-colors" size={20} />
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-10 bg-brand-blue-900 text-white rounded-[3rem] text-center shadow-2xl shadow-brand-blue-900/20">
                    <Zap className="mx-auto text-brand-gold-400 mb-4" size={32} />
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Still have questions?</h2>
                    <p className="text-brand-blue-200 font-medium mb-8">Our support team is ready to assist you 24/7.</p>
                    <a href="/contact" className="inline-block bg-white text-brand-blue-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-50 transition-colors shadow-xl">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
