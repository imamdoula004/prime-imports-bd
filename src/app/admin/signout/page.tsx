'use client';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldAlert, ArrowLeft, Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function QuantumSignOutPage() {
    const { logout, isAuthenticated } = useAdminAuth();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/admin');
        }
    }, [isAuthenticated, router]);

    const handleSignOut = async () => {
        setIsProcessing(true);
        // Simulate quantum link termination
        await new Promise(resolve => setTimeout(resolve, 1500));
        logout();
    };

    return (
        <div className="min-h-svh bg-[#050b14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Matrix Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] [background-size:100%_4px,3px_100%]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 border border-rose-500/20 text-center"
                >
                    <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto mb-8 relative">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-rose-500 rounded-full blur-xl"
                        />
                        <Power className="text-rose-500 relative z-10" size={40} />
                    </div>

                    <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Terminate Link?</h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">You are about to close the secure management session.</p>

                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSignOut}
                            disabled={isProcessing}
                            className="w-full py-6 bg-rose-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-3 text-xs disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <LogOut size={18} />
                                </motion.div>
                            ) : <LogOut size={18} />}
                            {isProcessing ? 'Terminating...' : 'Disconnect Now'}
                        </motion.button>

                        <button
                            onClick={() => router.back()}
                            disabled={isProcessing}
                            className="w-full py-6 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] border border-white/10 disabled:opacity-50"
                        >
                            <ArrowLeft size={16} />
                            Abort Termination
                        </button>
                    </div>
                </motion.div>

                <div className="mt-10 flex items-center justify-center gap-3 text-rose-500/50">
                    <ShieldAlert size={14} />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Warning: Unsaved metrics will be lost</p>
                </div>
            </div>
        </div>
    );
}
