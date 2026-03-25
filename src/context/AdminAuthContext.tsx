'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

const ADMIN_EMAILS = ['primeimportsbdu@gmail.com'];

interface AdminAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser && ADMIN_EMAILS.includes(firebaseUser.email || '')) {
                setUser(firebaseUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
                return false;
            }
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (error: any) {
            console.error('Login error code:', error.code);
            console.error('Login error message:', error.message);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push('/admin/login');
    };

    // Protect admin routes
    useEffect(() => {
        if (!loading && pathname.startsWith('/admin') && pathname !== '/admin/login' && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [pathname, isAuthenticated, router, loading]);

    return (
        <AdminAuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}
