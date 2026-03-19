'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAdminAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate small delay for feel
        await new Promise(resolve => setTimeout(resolve, 500));

        const success = await login(username, password);
        if (success) {
            router.push('/admin');
        } else {
            setError('Invalid credentials. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-svh bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white p-1 shadow-2xl mb-6 border-2 border-brand-gold-400">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white">
                            <Image
                                src="/brand_logo.jpeg"
                                alt="Prime Imports BD"
                                fill
                                className="object-contain p-1"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Admin Portal</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Secure Gateway Access</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake">
                                <AlertCircle size={20} />
                                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Username</p>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-blue-100 focus:bg-white rounded-2xl text-sm font-bold text-brand-blue-900 transition-all outline-none"
                                        placeholder="admin"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Password</p>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-blue-600 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-blue-100 focus:bg-white rounded-2xl text-sm font-bold text-brand-blue-900 transition-all outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-7 bg-brand-blue-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-brand-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Enter Dashboard'}
                            {!isLoading && <ArrowRight size={20} />}
                        </Button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest pb-8">
                    Authorized Personnel Only • IP: Logged
                </p>
            </div>
        </div>
    );
}
