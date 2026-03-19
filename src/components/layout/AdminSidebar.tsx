'use client';

import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Ticket,
    Image as ImageIcon,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    PanelLeftClose,
    PanelLeftOpen,
    Bell,
    Zap,
    PackageSearch
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAdminAuth();
    const sidebarRef = useRef<HTMLElement>(null);

    // Auto-collapse on click outside or scroll
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // If the user clicks on the collapse toggle button itself, we don't want to force collapse again, 
            // but the contains check handles since the button is inside the aside.
            if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsCollapsed(true);
            }
        };

        const handleScroll = () => {
            if (!isCollapsed) {
                setIsCollapsed(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isCollapsed]);

    // Do not show sidebar on login page
    if (pathname === '/admin/login') return null;

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Storefront', icon: PanelLeftOpen, path: '/admin/storefront' },
        { name: 'Inventory & Products', icon: Package, path: '/admin/inventory' },
        { name: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
        { name: 'Golden Circle', icon: Users, path: '/admin/golden-circle' },
        { name: 'Support Tickets', icon: Ticket, path: '/admin/tickets' },
        { name: 'Banner Manager', icon: ImageIcon, path: '/admin/banners' },
        { name: 'Restock Waitlist', icon: Bell, path: '/admin/waitlist' },
        { name: 'Snack Bundles', icon: Zap, path: '/admin/bundles' },
        { name: 'Requested Items', icon: PackageSearch, path: '/admin/requested-items' },
    ];

    return (
        <motion.aside
            ref={sidebarRef as any}
            initial={false}
            animate={{ width: isCollapsed ? 80 : 288 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 bg-[#0a192f] text-slate-300 flex flex-col border-r border-slate-800 z-[80] shadow-2xl"
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 w-7 h-7 bg-brand-gold-400 text-brand-blue-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[90] border-2 border-[#0a192f]"
            >
                {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            {/* Header / Brand */}
            <div className="p-6 flex flex-col items-center border-b border-slate-800/50 mb-6">
                <motion.div
                    layout
                    className="relative w-12 h-12 rounded-xl bg-white p-1 mb-3 shadow-xl overflow-hidden border border-brand-gold-400/30"
                >
                    <Image
                        src="/brand_logo.jpeg"
                        alt="Prime Admin"
                        fill
                        className="object-contain p-1"
                    />
                </motion.div>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-center overflow-hidden"
                        >
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">Prime Management</h2>
                            <p className="text-[9px] font-bold text-brand-gold-400 uppercase tracking-widest mt-1 whitespace-nowrap">Admin Dashboard</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pb-6">
                {navItems.map((item, idx) => {
                    const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/admin');
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden ${isActive ? 'bg-brand-blue-600/20 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
                        >
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-brand-gold-400' : 'group-hover:text-brand-gold-400 transition-colors'} />
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className={`text-[11px] font-black uppercase tracking-widest flex-1 whitespace-nowrap`}
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-gold-400 rounded-r-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Auth */}
            <div className="p-4 border-t border-slate-800/50">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-slate-900/50 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-brand-gold-500/10 text-brand-gold-400 flex items-center justify-center font-black border border-brand-gold-500/20">
                                    AD
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase text-white tracking-tight truncate">System Admin</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">Full Authority</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all font-black uppercase tracking-[0.2em] text-[10px] border border-rose-500/20"
                            >
                                <LogOut size={14} strokeWidth={3} />
                                Logout
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={logout}
                            className="w-full flex items-center justify-center py-4 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
}
