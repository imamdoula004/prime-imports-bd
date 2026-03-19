import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { AdminLayoutClient } from '@/components/layout/AdminLayoutClient';

export const metadata = {
    title: 'Admin Dashboard - Prime Imports BD',
    description: 'Administrative portal for Prime Imports BD',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminAuthProvider>
            <AdminLayoutClient>
                {children}
            </AdminLayoutClient>
        </AdminAuthProvider>
    );
}
