'use client';

import { Package, TrendingUp, AlertTriangle, MapPin, ArrowUpRight, ArrowDownRight, DollarSign, Loader2, ArrowRight } from 'lucide-react';
import { useRealTimeAdminStats } from '@/hooks/useRealTimeData';
import Link from 'next/link';

function formatIndianNumber(num: number): string {
    if (!num || isNaN(num)) return '0';

    if (num >= 10000000) {
        return (num / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Crores';
    } else if (num >= 100000) {
        return (num / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Lakhs';
    } else {
        const numStr = Math.floor(num).toString();
        let result = '';
        let count = 0;

        for (let i = numStr.length - 1; i >= 0; i--) {
            if (count === 3) {
                result = ',' + result;
            } else if (count > 3 && (count - 3) % 2 === 0) {
                result = ',' + result;
            }
            result = numStr[i] + result;
            count++;
        }
        return result;
    }
}

export default function AdminInventoryPage() {
    const stats = useRealTimeAdminStats();
    const {
        inventoryValuation,
        activeOrders,
        criticalStockItems,
        totalRevenue,
        hourlyProfit,
        loading
    } = stats;

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Analyzing Inventory Health...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Inventory Insights</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Stock Levels & Performance Diagnostics</p>
                </div>
                <Link href="/admin/inventory/add">
                    <button className="bg-brand-blue-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue-900/20 hover:scale-105 active:scale-95 transition-all">
                        <Package size={16} />
                        Add New Product
                    </button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Estimated Stock Valuation"
                    value={`৳${formatIndianNumber(Math.round(inventoryValuation))}`}
                    trend="+2.4%"
                    icon={DollarSign}
                    positive={true}
                />
                <MetricCard
                    title="Avg. Hourly Profit"
                    value={`৳${formatIndianNumber(Math.round(hourlyProfit))}`}
                    trend={hourlyProfit > 0 ? "+5.2%" : "0%"}
                    icon={TrendingUp}
                    positive={true}
                    subtitle="Real-time (Last 24h)"
                />
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-brand-blue-100 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                        <div className="text-[10px] font-black text-brand-gold-600 bg-brand-gold-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                            Monthly Target
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-2xl font-black text-brand-blue-900 tracking-tighter">72%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">৳{(totalRevenue / 1000000).toFixed(1)}M / ৳1.8M</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-50">
                            <div className="bg-brand-gold-500 h-full rounded-full transition-all duration-1000 w-[72%]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Catalog Quick Link */}
                <Link href="/admin/inventory/items" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center group hover:border-brand-blue-100 transition-all cursor-pointer overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Package size={120} />
                    </div>
                    <div className="w-16 h-16 bg-brand-blue-50 text-brand-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Package size={32} />
                    </div>
                    <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight mb-2">Detailed Catalog</h2>
                    <p className="text-xs text-slate-400 font-medium max-w-[280px] mb-6">
                        Manage individual product specifications, high-res imagery, and pricing hierarchies.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-blue-600 hover:gap-3 transition-all">
                        View List Management <ArrowRight size={14} />
                    </div>
                </Link>

                {/* Dhaka Order Density */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[350px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50 z-0">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
                        <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-brand-gold-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                            <MapPin size={18} className="text-brand-blue-600" />
                            <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-tight">Geo-Density</h2>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Order Hotspot</p>
                            <p className="text-sm font-black text-brand-blue-900">Gulshan District (Live)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Status</p>
                            <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Connected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Stock Alerts */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500" />
                        <h2 className="text-lg font-black text-rose-600 uppercase tracking-tight">Critical Stock Alerts</h2>
                    </div>
                </div>

                {criticalStockItems.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inventory Health: Optimal</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">No items under critical stock thresholds found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {criticalStockItems.map((item: any, i: number) => (
                            <div key={i} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 flex flex-col justify-between hover:bg-rose-50 transition-all group">
                                <div>
                                    <p className="text-xs font-black text-rose-900 uppercase tracking-wider mb-2 truncate group-hover:text-clip">{item.title}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-rose-600 tracking-tighter">{item.stock}</p>
                                        <p className="text-[10px] font-black uppercase text-rose-400">Units Remaining</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">ID: {item.productID}</span>
                                    <Link href={`/admin/inventory/edit/${item.id}`}>
                                        <button className="text-[10px] font-black text-white bg-rose-500 px-3 py-1.5 rounded-lg shadow-lg shadow-rose-500/20 active:scale-95 transition-all">RESTOCK NOW</button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({ title, value, trend, icon: Icon, positive, subtitle }: { title: string, value: string, trend: string, icon: any, positive: boolean, subtitle?: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:border-brand-blue-100 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {positive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                    {trend}
                </div>
            </div>
            <div>
                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</h3>
                <p className="text-3xl font-black text-brand-blue-900 tracking-tighter">{value}</p>
                {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}

