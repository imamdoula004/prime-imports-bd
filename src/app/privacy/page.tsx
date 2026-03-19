export default function PrivacyPage() {
    return (
        <div className="bg-white min-h-screen py-20 px-4">
            <div className="container mx-auto max-w-3xl prose prose-slate">
                <h1 className="text-4xl font-black text-brand-blue-900 mb-8 uppercase tracking-tight">Privacy Policy</h1>
                <p className="text-slate-500 font-bold mb-8 italic">Last Updated: March 2026</p>

                <h2 className="text-xl font-black text-brand-blue-900 uppercase">1. Introduction</h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    Prime Imports BD ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Prime Imports BD.
                </p>

                <h2 className="text-xl font-black text-brand-blue-900 uppercase">2. Information We Collect</h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    We collect information that you provide directly to us when you create an account, place an order, or communicate with us. This includes your name, email address, shipping address, and phone number.
                </p>

                <h2 className="text-xl font-black text-brand-blue-900 uppercase">3. How We Use Your Information</h2>
                <ul className="text-slate-600 font-medium space-y-2 lg:ml-6 list-disc lg:list-outside">
                    <li>To process and deliver your orders.</li>
                    <li>To communicate with you about your account and orders.</li>
                    <li>To improve our website and services.</li>
                    <li>To provide Golden Circle membership benefits.</li>
                </ul>

                <h2 className="text-xl font-black text-brand-blue-900 uppercase">4. Security</h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.
                </p>

                <div className="mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500 text-sm">
                    Questions about our privacy practices? Contact us at <span className="font-black text-brand-blue-900">privacy@primeimports.bd</span>
                </div>
            </div>
        </div>
    );
}
