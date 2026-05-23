'use client';

import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Package, Loader2, Target, Edit2, Calendar } from 'lucide-react';
import { useRealTimeAdminStats, type TimeRange } from '@/hooks/useRealTimeData';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
            if (count === 3) result = ',' + result;
            else if (count > 3 && (count - 3) % 2 === 0) result = ',' + result;
            result = numStr[i] + result;
            count++;
        }
        return result;
    }
}

// Get default target month as 'MM-YYYY' for current month
function getCurrentMonthKey(): string {
    const now = new Date();
    const m = now.getMonth() + 1;
    return `${m < 10 ? '0' + m : m}-${now.getFullYear()}`;
}

export default function AdminDashboardPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [targetMonth, setTargetMonth] = useState<string>(getCurrentMonthKey());
    const {
        totalRevenue,
        totalProfit,
        todayRevenue,
        activeOrders,
        avgOrderValue,
        memberCount,
        totalMemberSavings,
        totalMemberSpending,
        inventoryValuation,
        topCategories,
        topProducts,
        areaStats,
        hourlyProfit,
        monthlySales,
        monthlyProfit,
        monthlyTarget,
        monthlyProfitTarget,
        loading
    } = useRealTimeAdminStats(timeRange, targetMonth);

    // Format targetMonth for display
    const targetMonthLabel = (() => {
        if (!targetMonth || !targetMonth.includes('-')) return 'This Month';
        const [m, y] = targetMonth.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    })();

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-brand-blue-600" />
                <p className="font-black uppercase tracking-widest text-[10px]">Synchronizing Live Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Sales Analytics</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Real-time Performance Metrics</p>
                </div>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>


            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard title="Total Revenue" value={`৳${formatIndianNumber(totalRevenue)}`} trend="+LIVE" icon={DollarSign} positive={true} />
                <MetricCard title="Total Profit" value={`৳${formatIndianNumber(Math.round(totalProfit))}`} trend="LIVE" icon={TrendingUp} positive={totalProfit > 0} />
                <MetricCard title="Today Revenue" value={`৳${formatIndianNumber(Math.round(todayRevenue))}`} trend="TODAY" icon={DollarSign} positive={true} />
                <MetricCard title="Active Orders" value={activeOrders.toString()} trend="LIVE" icon={ShoppingBag} positive={true} />
                <MetricCard title="Golden Members" value={memberCount.toString()} trend="LIVE" icon={Users} positive={true} />
                <MetricCard title="Est. Stock Value" value={`৳${formatIndianNumber(Math.round(inventoryValuation))}`} trend="LIVE" icon={Package} positive={true} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div>
                    <h2 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Performance Goals</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status vs Monthly Targets</p>
                </div>
                <MonthSelector value={targetMonth} onChange={setTargetMonth} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TargetCard 
                    title="Monthly Sales Target" 
                    subtitle={`${targetMonthLabel} Sales`}
                    current={monthlySales} 
                    target={monthlyTarget} 
                    settingsKey="monthlyTarget" 
                />
                <TargetCard 
                    title="Monthly Profit Goal" 
                    subtitle={`${targetMonthLabel} Profit`}
                    current={monthlyProfit} 
                    target={monthlyProfitTarget} 
                    settingsKey="monthlyProfitTarget" 
                    accentColor="emerald" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MetricCard title="Avg. Hourly Profit" value={`৳${Math.round(hourlyProfit).toLocaleString()}`} trend="24H Avg" icon={TrendingUp} positive={hourlyProfit > 0} />
                <MetricCard title="Monthly Net Profit" value={`৳${Math.round(monthlyProfit).toLocaleString()}`} trend="This Month" icon={DollarSign} positive={monthlyProfit > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real-time Sales Trend */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Top Profit Products</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Feed</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Product</span>
                            <div className="flex gap-8">
                                <span>Units</span>
                                <span>Profit</span>
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
                        ) : topProducts.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center opacity-40">
                                <Package size={40} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No order data yet</p>
                            </div>
                        ) : (
                            topProducts.map((product, idx) => (
                                <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-brand-blue-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${idx === 0 ? 'bg-emerald-100 text-emerald-600' : idx === 1 ? 'bg-brand-gold-100 text-brand-gold-600' : 'bg-slate-100 text-slate-500'} flex items-center justify-center font-black text-xs`}>
                                            #{idx + 1}
                                        </div>
                                        <span className="text-sm font-black text-brand-blue-900 uppercase truncate max-w-[200px]">{product.title}</span>
                                    </div>
                                    <div className="flex gap-8 items-center">
                                        <span className="text-xs font-bold text-slate-500">{product.unitsSold}</span>
                                        <span className="text-sm font-black text-emerald-600">৳{Math.round(product.profit).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Real-time Category Shares */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Category Shares</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
                        {topCategories.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40">
                                <Package size={40} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Sales Recorded</p>
                            </div>
                        ) : (
                            topCategories.map((cat, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-brand-blue-600 hover:text-white transition-colors border border-transparent hover:border-brand-blue-600 group">
                                    <div className="w-10 h-10 rounded-xl bg-brand-gold-500/10 text-brand-gold-600 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center font-black transition-colors">
                                        <Package size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-brand-blue-900 group-hover:text-white truncate uppercase tracking-tight transition-colors">{cat.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest transition-colors">{cat.items} items sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-brand-blue-600 group-hover:text-white transition-colors">৳{cat.sales.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Real-time Delivery Geographic Density */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                        <h2 className="text-lg font-black text-brand-blue-900 uppercase tracking-tight">Active Operations</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5"><ShoppingBag className="text-amber-600" size={18} /></div>
                                <div>
                                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Pending Orders</h3>
                                    <p className="text-xs text-amber-700/80 font-medium">Currently {activeOrders} orders require processing.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5"><Package className="text-blue-600" size={18} /></div>
                                <div>
                                    <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-1">Catalogue Live</h3>
                                    <p className="text-xs text-blue-700/80 font-medium">Real-time sync enabled. Updates reflect instantly.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5"><Users className="text-emerald-600" size={18} /></div>
                                <div>
                                    <h3 className="text-sm font-black text-emerald-900 uppercase tracking-tight mb-1">Membership Base</h3>
                                    <p className="text-xs text-emerald-700/80 font-medium">{memberCount} Golden Circle members active.</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-emerald-100/50 flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Lifetime Savings</p>
                                    <p className="text-sm font-black text-emerald-600">৳{Math.round(totalMemberSavings || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Total Spent</p>
                                    <p className="text-sm font-black text-emerald-900">৳{Math.round(totalMemberSpending || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-blue-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Delivery Density</h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-gold-400 animate-pulse" />
                                <span className="text-[10px] font-black text-brand-gold-400 uppercase tracking-[0.3em]">Live</span>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {loading ? (
                                <div className="h-32 flex items-center justify-center"><Loader2 className="animate-spin text-white/30" /></div>
                            ) : areaStats.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center opacity-40">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">No delivery data yet</p>
                                </div>
                            ) : (
                                areaStats.map((item, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end text-white">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{item.area}</span>
                                            <span className="text-xs font-black text-brand-gold-400">{item.count} Orders</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-gold-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MonthSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const months = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        months.push({
            label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
            value: `${m < 10 ? '0' + m : m}-${y}`
        });
    }

    return (
        <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 text-slate-400">
                <Calendar size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Target Month</span>
            </div>
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-brand-blue-900 uppercase tracking-tight shadow-sm outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all cursor-pointer"
            >
                {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
        </div>
    );
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange, onChange: (v: TimeRange) => void }) {
    // Generate last 6 months for the dropdown

    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        months.push({
            label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
            value: `${m < 10 ? '0' + m : m}-${y}`
        });
    }

    return (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="hidden sm:flex items-center gap-2 px-3 text-slate-400">
                <Calendar size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Range</span>
            </div>
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value as TimeRange)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-brand-blue-900 uppercase tracking-tight shadow-sm outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all cursor-pointer"
            >
                <optgroup label="Standard Ranges">
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </optgroup>
                <optgroup label="Monthly Breakdown">
                    {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </optgroup>
            </select>
        </div>
    );
}

function MetricCard({ title, value, trend, icon: Icon, positive }: { title: string, value: string, trend: string, icon: any, positive: boolean }) {

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-brand-blue-600 transition-all duration-200">
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
            </div>
        </div>
    );
}

function TargetCard({ title, subtitle, current, target, settingsKey, accentColor = 'blue' }: { title: string, subtitle: string, current: number, target: number, settingsKey: string, accentColor?: 'blue' | 'emerald' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTarget, setTempTarget] = useState(target);
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const isEmerald = accentColor === 'emerald';

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${isEmerald ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-brand-blue-600 shadow-brand-blue-600/20'} text-white flex items-center justify-center shadow-lg`}>
                        <Target size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{title}</h3>
                        <p className="text-sm font-black text-brand-blue-900 tracking-tight">{subtitle}</p>
                    </div>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                    <Edit2 size={16} />
                </button>
            </div>

            {isEditing ? (
                <div className="mb-6 flex gap-2">
                    <input type="number" value={tempTarget} onChange={(e) => setTempTarget(Number(e.target.value))} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-brand-blue-500" />
                    <button
                        onClick={async () => {
                            const settingsRef = doc(db, 'admin', 'settings');
                            await updateDoc(settingsRef, { [settingsKey]: tempTarget });
                            setIsEditing(false);
                        }}
                        className={`px-4 py-2 ${isEmerald ? 'bg-emerald-600' : 'bg-brand-blue-600'} text-white rounded-xl font-bold text-xs`}
                    >
                        Save
                    </button>
                </div>
            ) : (
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-3xl font-black text-brand-blue-900 tracking-tighter">
                            ৳{current.toLocaleString()}
                            <span className="text-sm text-slate-400 font-bold tracking-tight ml-2">/ ৳{target.toLocaleString()}</span>
                        </p>
                        <span className={`text-lg font-black ${isEmerald ? 'text-emerald-600' : 'text-brand-blue-600'}`}>{percentage}%</span>
                    </div>
                </div>
            )}

            <div className="relative h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div
                    className={`absolute top-0 left-0 h-full ${isEmerald ? 'bg-gradient-to-r from-emerald-500 to-emerald-700' : 'bg-gradient-to-r from-brand-blue-500 to-brand-blue-700'} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>৳0</span>
                <span>Goal: ৳{target.toLocaleString()}</span>
            </div>
        </div>
    );
}
