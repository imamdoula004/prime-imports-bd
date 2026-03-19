'use client';

import { Check, ShoppingCart, Truck, CreditCard, ShieldCheck } from 'lucide-react';

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review';

interface CheckoutProgressProps {
    currentStep: CheckoutStep;
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
    const steps = [
        { id: 'cart', label: 'Cart', icon: ShoppingCart },
        { id: 'shipping', label: 'Delivery', icon: Truck },
        { id: 'payment', label: 'Payment', icon: CreditCard },
        { id: 'review', label: 'Success', icon: ShieldCheck },
    ];

    const currentIdx = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full max-w-2xl mx-auto mb-10 px-4">
            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                <div 
                    className="absolute top-5 left-0 h-0.5 bg-brand-blue-600 transition-all duration-500 -z-10" 
                    style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                ${isCompleted ? 'bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-200' : 
                                  isActive ? 'bg-black text-white shadow-xl scale-110' : 
                                  'bg-white border-2 border-slate-100 text-slate-300'}
                            `}>
                                {isCompleted ? (
                                    <Check size={18} strokeWidth={3} />
                                ) : (
                                    <step.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                )}
                            </div>
                            <span className={`
                                text-[10px] font-black uppercase tracking-widest transition-colors
                                ${isActive ? 'text-brand-blue-900' : 'text-slate-400'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
