'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuantumSignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loading: authLoading, isAuthenticated } = useAdminAuth();
    const router = useRouter();

    if (isAuthenticated) {
        router.push('/admin');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 800));

        const success = await login(email, password);
        if (success) {
            router.push('/admin');
        } else {
            setError('Quantum Handshake Failed. Verify Credentials.');
            setIsLoading(false);
        }
    };

    if (authLoading) return (
        <div className="min-h-svh bg-slate-950 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-brand-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Neural Link...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-svh bg-[#050b14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-blue-500/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 7, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-gold-500/10 rounded-full blur-[120px]"
                />
            </div>

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white p-1 shadow-[0_0_50px_rgba(255,215,0,0.2)] mb-6 border-2 border-brand-gold-400">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden">
                            <Image
                                src="/brand_logo.jpeg"
                                alt="Prime Imports BD"
                                fill
                                className="object-contain p-1"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Quantum <span className="text-brand-gold-400">Gate</span></h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px] mt-2">Level 4 Encryption Enabled</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 border border-white/10 relative overflow-hidden"
                >
                    {/* Inner Scanline */}
                    <motion.div
                        animate={{ top: ['-10%', '110%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-px bg-white/5 z-0"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400"
                                >
                                    <AlertCircle size={18} />
                                    <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Neural Identifier</p>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-gold-400 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-brand-gold-400/50 focus:bg-white/10 rounded-2xl text-sm font-bold text-white transition-all outline-none"
                                        placeholder="Enter Admin Email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Access Key</p>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-gold-400 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-brand-gold-400/50 focus:bg-white/10 rounded-2xl text-sm font-bold text-white transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full py-6 bg-brand-gold-500 text-brand-blue-900 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Zap className="animate-spin" size={18} />
                                    Establishing Link...
                                </>
                            ) : (
                                <>
                                    Authorize Access
                                    <ShieldCheck size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                <p className="text-center mt-8 text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em] pb-8">
                    Node: BD-MAIN-CORE • Protocol: QKD-V3
                </p>
            </div>
        </div>
    );
}
