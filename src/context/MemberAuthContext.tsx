'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { sanitizePhone } from '@/lib/utils';

interface MemberAuthContextType {
    isGoldenCircleUser: boolean;
    phoneNumber: string | null;
    login: (phone: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
    const [isGoldenCircleUser, setIsGoldenCircleUser] = useState<boolean>(false);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Persist login state in local storage
    useEffect(() => {
        const storedPhone = localStorage.getItem('gc_member_phone');
        const storedIsGC = localStorage.getItem('is_gc_member');
        
        if (storedPhone && storedIsGC === 'true') {
            setPhoneNumber(storedPhone);
            setIsGoldenCircleUser(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (phone: string) => {
        setIsLoading(true);
        const sanitized = sanitizePhone(phone);
        try {
            // Document ID is the phone number as per strict requirement
            const userRef = doc(db, 'goldenCircleUsers', sanitized);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().isActive === true) {
                setIsGoldenCircleUser(true);
                setPhoneNumber(sanitized);
                localStorage.setItem('gc_member_phone', sanitized);
                localStorage.setItem('is_gc_member', 'true');
                setIsLoading(false);
                return { success: true };
            } else {
                setIsLoading(false);
                return { success: false, error: "Not a Golden Circle member" };
            }
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
            return { success: false, error: "Authentication failed. Please try again." };
        }
    };

    const logout = () => {
        setIsGoldenCircleUser(false);
        setPhoneNumber(null);
        localStorage.removeItem('gc_member_phone');
        localStorage.removeItem('is_gc_member');
    };

    return (
        <MemberAuthContext.Provider value={{ isGoldenCircleUser, phoneNumber, login, logout, isLoading }}>
            {children}
        </MemberAuthContext.Provider>
    );
}

export function useMemberAuth() {
    const context = useContext(MemberAuthContext);
    if (context === undefined) {
        throw new Error('useMemberAuth must be used within a MemberAuthProvider');
    }
    return context;
}
