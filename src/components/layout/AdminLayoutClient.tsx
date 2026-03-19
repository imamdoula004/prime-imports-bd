'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    return (
        <div className={`min-h-[100dvh] ${isLoginPage ? 'bg-slate-900' : 'bg-slate-50'} font-sans text-brand-blue-900 selection:bg-brand-blue-500 selection:text-white`}>
            <AdminSidebar />
            <main className={`min-h-[100dvh] ${isLoginPage ? 'ml-0' : 'ml-10 min-[800px]:ml-[80px]'} relative z-[1]`}>
                <div className={`${isLoginPage ? '' : 'max-w-[1200px] mx-auto p-4 md:p-8'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
