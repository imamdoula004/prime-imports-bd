'use client';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { QuantumGate } from '@/components/admin/QuantumGate';
import { Shield, Zap, Lock, LogOut, LayoutDashboard, Database } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AdminPortalPage() {
    const { isAuthenticated, loading } = useAdminAuth();

    if (loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-t-brand-gold-400 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border-2 border-t-transparent border-r-blue-400 border-b-transparent border-l-transparent rounded-full opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="text-brand-gold-400 animate-pulse" size={32} />
                    </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Initializing Neural Link</p>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Background Aesthetic Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16 relative z-10"
            >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white p-1 shadow-2xl mb-8 border border-brand-gold-400/20">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white">
                        <Image
                            src="/brand_logo.jpeg"
                            alt="Prime Management"
                            fill
                            className="object-contain p-2"
                        />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-brand-blue-900 uppercase tracking-tighter mb-4">
                    Quantum <span className="text-brand-gold-500">Access</span> Portal
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Secure Interface for Prime Imports BD Administration</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 w-full max-w-2xl relative z-10">
                {!isAuthenticated ? (
                    <QuantumGate 
                        href="/admin/signin" 
                        label="Initialize Session" 
                        sublabel="Secure Quantum Key Distribution" 
                        icon={Lock}
                    />
                ) : (
                    <>
                        <QuantumGate 
                            href="/admin/dashboard" 
                            label="Management Core" 
                            sublabel="Access Real-time Analytics" 
                            icon={LayoutDashboard}
                            variant="primary"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QuantumGate 
                                href="/admin/inventory" 
                                label="Inventory Matrix" 
                                sublabel="Resource Control" 
                                icon={Database}
                                variant="secondary"
                            />
                            <QuantumGate 
                                href="/admin/signout" 
                                label="Terminate Link" 
                                sublabel="Close Secure Connection" 
                                icon={LogOut}
                                variant="danger"
                            />
                        </div>
                    </>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-center"
            >
                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    System Status: Operational • Encryption: AES-QKD-512
                </div>
            </motion.div>
        </div>
    );
}
