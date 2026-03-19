'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck } from 'lucide-react';
import { sanitizePhone, isValidBDPhone } from '@/lib/utils';

export default function GoldenCircleCheckout() {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');

    return (
        <div className="min-h-screen bg-brand-blue-50 py-12 px-4">
            <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-premium border border-brand-gold-200 overflow-hidden">

                {/* Header */}
                <div className="bg-brand-blue-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold-500 rounded-bl-full opacity-20 transform translate-x-10 -translate-y-10"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-brand-gold-500 rounded-full flex items-center justify-center text-brand-blue-900 mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-brand-gold-400 mb-2 font-serif italic">Golden Circle</h1>
                        <p className="text-brand-blue-100 font-light">Exclusive member access & lifetime discounts.</p>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8">
                    {step === 1 && (
                        <div className="fade-in">
                            <h2 className="text-xl font-bold text-brand-blue-900 mb-6">Login to your account</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-blue-700 mb-2">Phone Number</label>
                                    <div className="flex">
                                        <input
                                            type="tel"
                                            className="flex-1 block w-full rounded-xl sm:text-sm border-brand-blue-200 p-4 border focus:outline-none focus:ring-2 focus:ring-brand-gold-400 text-brand-blue-900 font-bold"
                                            placeholder="01XXXXXXXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                                <Button 
                                    className="w-full text-lg py-4 mt-6" 
                                    onClick={() => {
                                        if (isValidBDPhone(phone)) {
                                            setStep(2);
                                        } else {
                                            alert("Please enter a valid 11-digit Bangladeshi phone number.");
                                        }
                                    }}
                                >
                                    Send OTP
                                </Button>
                            </div>

                            <div className="mt-8 p-4 bg-brand-gold-50 rounded-xl border border-brand-gold-100 flex items-start gap-3">
                                <div className="p-1 bg-brand-gold-200 text-brand-gold-700 rounded-full shrink-0">
                                    <Check size={16} />
                                </div>
                                <p className="text-sm text-brand-blue-800 tracking-tight leading-relaxed">
                                    <strong className="font-bold text-brand-blue-900">Not a member?</strong> Just enter your phone number. Your account will be created automatically and the 3% base discount applied.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in">
                            <h2 className="text-xl font-bold text-brand-blue-900 mb-2">Verify Phone Number</h2>
                            <p className="text-brand-blue-500 text-sm mb-6">We sent a 6-digit code to +880 {phone}.</p>

                            <div className="flex justify-between gap-2 mb-8">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        maxLength={1}
                                        className="w-12 h-14 text-center text-xl font-bold border border-brand-blue-200 rounded-xl text-brand-blue-900 focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-brand-gold-500"
                                    />
                                ))}
                            </div>

                            <Button className="w-full text-lg py-4" onClick={() => alert('Authenticated!')}>
                                Verify & Continue
                            </Button>

                            <p className="text-center text-sm font-medium text-brand-blue-600 mt-6 cursor-pointer hover:text-brand-gold-600">
                                Resend Code
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
