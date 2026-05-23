'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Database, 
    Cloud, 
    User as UserIcon,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Activity,
    Lock,
    Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiagnosticPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [firestoreStatus, setFirestoreStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [firestoreError, setFirestoreError] = useState<string | null>(null);
    const [storageStatus, setStorageStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [storageError, setStorageError] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const runTests = async () => {
        setIsTesting(true);
        setFirestoreStatus('pending');
        setFirestoreError(null);
        setStorageStatus('pending');
        setStorageError(null);

        // 1. Test Firestore Write
        try {
            const testRef = await addDoc(collection(db, 'system_diagnostics'), {
                timestamp: serverTimestamp(),
                user: user?.email || 'anonymous',
                type: 'write_test'
            });
            await deleteDoc(testRef);
            setFirestoreStatus('success');
        } catch (err: any) {
            console.error('Firestore Diag Error:', err);
            setFirestoreStatus('failed');
            setFirestoreError(`${err.code || 'unknown'}: ${err.message}`);
        }

        // 2. Test Storage Write
        try {
            const dummyFile = new Blob(['diag_test'], { type: 'text/plain' });
            const testStorageRef = ref(storage, `diagnostics/test-${Date.now()}.txt`);
            await uploadBytes(testStorageRef, dummyFile);
            await deleteObject(testStorageRef);
            setStorageStatus('success');
        } catch (err: any) {
            console.error('Storage Diag Error:', err);
            setStorageStatus('failed');
            setStorageError(`${err.code || 'unknown'}: ${err.message}`);
        }

        setIsTesting(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-blue-900 text-brand-gold-400 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">System Node Diagnostics</h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Verifying Protocol Integrity & Cloud Synchronization</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Auth Status Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight flex items-center gap-2">
                                <Lock size={18} className="text-brand-blue-600" /> Identity Core
                            </h2>
                            {authLoading ? (
                                <RefreshCw className="animate-spin text-slate-300" size={18} />
                            ) : user ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Authenticated</span>
                            ) : (
                                <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Unauthorized</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Neural ID</p>
                                <p className="text-xs font-bold text-brand-blue-900 truncate">{user?.email || 'NOT LOGGED IN'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Token (UID)</p>
                                <p className="text-[10px] font-mono font-bold text-slate-500 break-all">{user?.uid || 'NONE'}</p>
                            </div>
                            {user && user.email !== 'primeimportsbdu@gmail.com' && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                                    <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                        Warning: Logged in with non-primary admin account. Some database operations may be restricted.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-brand-blue-900 p-8 rounded-[2.5rem] shadow-xl shadow-brand-blue-900/20 text-white flex flex-col justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                                <Key size={18} className="text-brand-gold-400" /> Command Center
                            </h2>
                            <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                                Initiate a full-spectrum protocol test to verify read/write capabilities across the distributed cloud architecture.
                            </p>
                        </div>

                        <button
                            onClick={runTests}
                            disabled={isTesting || authLoading}
                            className="mt-8 w-full py-4 bg-brand-gold-500 text-brand-blue-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:shadow-brand-gold-500/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                        >
                            {isTesting ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    Scanning Systems...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    Run Global Diagnostics
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Container */}
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Verification Logs</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Firestore Test */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${
                                firestoreStatus === 'pending' ? 'bg-white border-slate-100' :
                                firestoreStatus === 'success' ? 'bg-emerald-50 border-emerald-100' :
                                'bg-rose-50 border-rose-100'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Database className={firestoreStatus === 'failed' ? 'text-rose-500' : 'text-brand-blue-600'} size={20} />
                                        <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-tight">Firestore Node</h3>
                                    </div>
                                    {firestoreStatus === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> :
                                     firestoreStatus === 'failed' ? <XCircle className="text-rose-500" size={20} /> : null}
                                </div>
                                {firestoreError && (
                                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-rose-100">
                                        <p className="text-[10px] font-mono font-bold text-rose-600 break-all">{firestoreError}</p>
                                    </div>
                                )}
                                <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    Status: {firestoreStatus === 'pending' ? 'Ready for scan' : firestoreStatus.toUpperCase()}
                                </p>
                            </div>

                            {/* Storage Test */}
                            <div className={`p-6 rounded-[2rem] border-2 transition-all ${
                                storageStatus === 'pending' ? 'bg-white border-slate-100' :
                                storageStatus === 'success' ? 'bg-emerald-50 border-emerald-100' :
                                'bg-rose-50 border-rose-100'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Cloud className={storageStatus === 'failed' ? 'text-rose-500' : 'text-brand-blue-600'} size={20} />
                                        <h3 className="text-xs font-black text-brand-blue-900 uppercase tracking-tight">Storage Node</h3>
                                    </div>
                                    {storageStatus === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> :
                                     storageStatus === 'failed' ? <XCircle className="text-rose-500" size={20} /> : null}
                                </div>
                                {storageError && (
                                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-rose-100">
                                        <p className="text-[10px] font-mono font-bold text-rose-600 break-all">{storageError}</p>
                                    </div>
                                )}
                                <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    Status: {storageStatus === 'pending' ? 'Ready for scan' : storageStatus.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Global Control Protocol • Node: BD-PRIMARY</p>
                </div>
            </div>
        </div>
    );
}
