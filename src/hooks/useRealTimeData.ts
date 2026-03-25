'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    limit,
    doc,
    where
} from 'firebase/firestore';
import { Product, Order, GoldenMember, Ticket, GoldenCircleRequest } from '@/types';

export type TimeRange = 'today' | 'week' | 'month' | 'year' | string;

interface TopProduct {
    id: string;
    title: string;
    profit: number;
    unitsSold: number;
}

interface AreaStat {
    area: string;
    count: number;
    percentage: number;
}

export function useRealTimeAdminStats(timeRange: TimeRange = 'month', targetMonth?: string) {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        todayRevenue: 0,
        activeOrders: 0,
        avgOrderValue: 0,
        memberCount: 0,
        totalMemberSavings: 0,
        totalMemberSpending: 0,
        inventoryValuation: 0,
        criticalStockItems: [] as Product[],
        recentOrders: [] as Order[],
        topCategories: [] as { name: string; sales: number; items: number }[],
        topProducts: [] as TopProduct[],
        areaStats: [] as AreaStat[],
        hourlyProfit: 0,
        monthlySales: 0,
        monthlyProfit: 0,
        monthlyTarget: 100000,
        monthlyProfitTarget: 30000,
        loading: true,
    });

    useEffect(() => {
        let isMounted = true;
        let productCostMap = new Map<string, number>(); // productId -> buyingPrice
        let latestOrders: Order[] = [];

        // ── Helpers ──
        const isDelivered = (s: string) =>
            s === 'delivered' || s === 'Delivered' || s === 'Completed' || s === 'completed';

        const getOrderDate = (o: Order) =>
            o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(0);

        const isInRange = (d: Date): boolean => {
            const now = new Date();
            switch (timeRange) {
                case 'today': {
                    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    return d >= s;
                }
                case 'week': {
                    const s = new Date(now);
                    s.setDate(now.getDate() - now.getDay());
                    s.setHours(0, 0, 0, 0);
                    return d >= s;
                }
                case 'month':
                    return d >= new Date(now.getFullYear(), now.getMonth(), 1);
                case 'year':
                    return d >= new Date(now.getFullYear(), 0, 1);
                default: {
                    // Custom month: 'MM-YYYY'
                    if (timeRange.includes('-')) {
                        const [m, y] = timeRange.split('-').map(Number);
                        return d.getMonth() === (m - 1) && d.getFullYear() === y;
                    }
                    return true;
                }
            }
        };

        // Profit: only count items that have a buyingPrice (from order item or product cost map)
        const calcItemProfit = (item: any): number => {
            let cost = Number(item.buyingPrice || 0);
            if (cost <= 0) {
                const pid = item.productId || item.id;
                if (pid) cost = productCostMap.get(pid) || 0;
            }
            if (cost <= 0) return 0; // No buying price → 0 profit contribution
            return (Number(item.price || 0) - cost) * (item.quantity || 1);
        };

        // ── Main recalculation ──
        const recalculate = () => {
            if (!isMounted) return;
            const orders = latestOrders;
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Delivered orders in the selected time range
            const delivered = orders.filter(o => isDelivered(o.status) && isInRange(getOrderDate(o)));

            // Revenue (from delivered in range)
            const totalRevenue = delivered.reduce((a, o) => a + (o.total || (o as any).pricing?.total || 0), 0);

            // Profit (from delivered in range, only items with buyingPrice)
            const totalProfit = delivered.reduce((a, o) =>
                a + (o.items?.reduce((p, item) => p + calcItemProfit(item), 0) || 0), 0);

            // Active orders (all time, not delivered/completed/cancelled)
            const activeOrders = orders.filter(o => !isDelivered(o.status) && o.status !== 'cancelled').length;

            // Avg order value (all orders)
            const allTotal = orders.reduce((a, o) => a + (o.total || (o as any).pricing?.total || 0), 0);
            const avgOrderValue = orders.length > 0 ? allTotal / orders.length : 0;

            // Today's revenue (always today, ignoring timeRange)
            const todayRevenue = orders
                .filter(o => isDelivered(o.status) && getOrderDate(o) >= startOfDay)
                .reduce((a, o) => a + (o.total || (o as any).pricing?.total || 0), 0);

            // Hourly profit (24h average)
            const recent24 = orders.filter(o => isDelivered(o.status) && getOrderDate(o) >= h24Ago);
            const hourlyProfit = recent24.reduce((a, o) =>
                a + (o.items?.reduce((p, i) => p + calcItemProfit(i), 0) || 0), 0) / 24;

            // Monthly target data — respects targetMonth if set, otherwise current month
            let targetMonthStart: Date;
            let targetMonthEnd: Date;
            if (targetMonth && targetMonth.includes('-')) {
                const [tm, ty] = targetMonth.split('-').map(Number);
                targetMonthStart = new Date(ty, tm - 1, 1);
                targetMonthEnd = new Date(ty, tm, 0, 23, 59, 59, 999);
            } else {
                targetMonthStart = startOfMonth;
                targetMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
            const targetMonthOrders = orders.filter(o => {
                if (!isDelivered(o.status)) return false;
                const d = getOrderDate(o);
                return d >= targetMonthStart && d <= targetMonthEnd;
            });
            const monthlySales = targetMonthOrders.reduce((a, o) => a + (o.total || (o as any).pricing?.total || 0), 0);
            const monthlyProfit = targetMonthOrders.reduce((a, o) =>
                a + (o.items?.reduce((p, i) => p + calcItemProfit(i), 0) || 0), 0);

            // Category shares (from delivered in range)
            const catMap = new Map<string, { sales: number; items: number }>();
            delivered.forEach(o => o.items?.forEach(item => {
                const c = item.category || 'Uncategorized';
                const cur = catMap.get(c) || { sales: 0, items: 0 };
                catMap.set(c, { sales: cur.sales + item.price * item.quantity, items: cur.items + item.quantity });
            }));
            const topCategories = [...catMap.entries()]
                .map(([name, d]) => ({ name, ...d }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);

            // Top profit products (from delivered in range, using product cost map)
            const ppMap = new Map<string, { title: string; profit: number; unitsSold: number }>();
            delivered.forEach(o => o.items?.forEach((item: any) => {
                const key = item.productId || item.name || item.title || 'Unknown';
                const profit = calcItemProfit(item);
                const cur = ppMap.get(key) || { title: item.name || item.title || key, profit: 0, unitsSold: 0 };
                ppMap.set(key, { title: cur.title, profit: cur.profit + profit, unitsSold: cur.unitsSold + (item.quantity || 1) });
            }));
            const topProducts = [...ppMap.entries()]
                .map(([id, d]) => ({ id, ...d }))
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 5);

            // Delivery density (from delivered in range, no Unknown)
            const aMap = new Map<string, number>();
            delivered.forEach(o => {
                const od = o as any;
                const area = od.shippingAddress?.city || od.customerInfo?.city || od.customer?.city || od.deliveryArea;
                if (area && area !== 'Unknown' && area.trim()) aMap.set(area, (aMap.get(area) || 0) + 1);
            });
            const areaTotal = [...aMap.values()].reduce((a, b) => a + b, 0);
            const areaStats: AreaStat[] = [...aMap.entries()]
                .map(([area, count]) => ({ area, count, percentage: areaTotal > 0 ? Math.round((count / areaTotal) * 100) : 0 }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setStats(prev => ({
                ...prev,
                totalRevenue, totalProfit, todayRevenue, activeOrders, avgOrderValue,
                recentOrders: orders.slice(0, 5), topCategories, topProducts, areaStats,
                hourlyProfit, monthlySales, monthlyProfit,
            }));
        };

        // ── 1. Orders listener ──
        const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
        const unsubOrders = onSnapshot(qOrders, snap => {
            if (!isMounted) return;
            latestOrders = snap.docs.map(d => ({ ...d.data(), id: d.id } as Order));
            recalculate();
        }, err => {
            console.error('Orders sync error:', err);
            if (isMounted) setStats(p => ({ ...p, loading: false }));
        });

        // ── 2. Products listener (cost map + stock + valuation) ──
        const qProducts = query(collection(db, 'products'), where('isDeleted', '==', false), limit(1000));
        const unsubProducts = onSnapshot(qProducts, snap => {
            if (!isMounted) return;
            const costMap = new Map<string, number>();
            let valuation = 0;
            const criticalItems: Product[] = [];

            snap.docs.forEach(d => {
                const p = d.data();
                const price = Number(String(p.price || 0).replace(/[^0-9.]/g, ''));
                const stock = Number(String(p.stock || 0).replace(/[^0-9]/g, ''));
                const bp = Number(p.buyingPrice || 0);
                if (bp > 0) costMap.set(d.id, bp);
                valuation += price * stock;
                if (stock <= 5) criticalItems.push({ ...p, id: d.id } as Product);
            });

            productCostMap = costMap;
            setStats(p => ({ ...p, inventoryValuation: valuation, criticalStockItems: criticalItems.slice(0, 10), loading: false }));
            recalculate();
        }, err => {
            console.error('Products sync error:', err);
            if (isMounted) setStats(p => ({ ...p, loading: false }));
        });

        // ── 3. Members listener ──
        const unsubMembers = onSnapshot(collection(db, 'goldenCircleUsers'), snap => {
            if (!isMounted) return;
            const members = snap.docs.map(d => d.data() as GoldenMember);
            setStats(p => ({
                ...p,
                memberCount: snap.size,
                totalMemberSavings: members.reduce((a, m) => a + (m.totalSaved || 0), 0),
                totalMemberSpending: members.reduce((a, m) => a + (m.totalSpent || 0), 0),
            }));
        });

        // ── 4. Settings listener ──
        const unsubSettings = onSnapshot(doc(db, 'admin', 'settings'), snap => {
            if (!isMounted || !snap.exists()) return;
            const d = snap.data();
            if (d?.monthlyTarget) {
                setStats(p => ({
                    ...p,
                    monthlyTarget: d.monthlyTarget,
                    monthlyProfitTarget: d.monthlyProfitTarget || Math.round(d.monthlyTarget * 0.3),
                }));
            }
        });

        const timer = setTimeout(() => { if (isMounted) setStats(p => ({ ...p, loading: false })); }, 3000);

        return () => {
            isMounted = false;
            unsubOrders(); unsubProducts(); unsubMembers(); unsubSettings();
            clearTimeout(timer);
        };
    }, [timeRange, targetMonth]); // Re-subscribe when time range or target month changes

    return stats;
}

export function useRealTimeTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ticket));
            setTickets(data);
            setLoading(false);
        }, (err) => {
            console.error("Tickets sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { tickets, loading };
}

export function useRealTimeMembers() {
    const [members, setMembers] = useState<GoldenMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const membersRef = collection(db, 'goldenCircleUsers');
        const q = query(membersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GoldenMember));
            setMembers(data);
            setLoading(false);
        }, (err) => {
            console.error("Members sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { members, loading };
}

export function useRealTimeProducts(
    category?: string,
    categoryId?: string,
    searchQuery?: string,
    sort?: string,
    filters?: {
        brands?: string[];
        genders?: string[];
        subcategories?: string[];
    }
) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        if (products.length === 0) setLoading(true);

        const productsRef = collection(db, 'products');
        let q = query(productsRef, where('isDeleted', '==', false));

        // 1. Category Filter (Primary) - Prioritize categoryId
        if (categoryId && categoryId !== 'all') {
            q = query(q, where('categoryId', '==', categoryId));
        } else if (category && category !== 'All Imports' && category !== 'all') {
            q = query(q, where('category', '==', category));
        }

        // 2. Search Keyword Filter
        if (searchQuery) {
            const firstWord = searchQuery.toLowerCase().trim().split(' ')[0];
            if (firstWord && firstWord.length > 2) {
                q = query(q, where('searchKeywords', 'array-contains', firstWord));
            }
        }

        // 3. Normalized Attribute Filters (Server-side where possible)
        // Note: Firestore only allows one 'in' or 'array-contains' per query.
        // We prioritize Category > Search > Filters.
        if (filters) {
            if (filters.genders && filters.genders.length > 0) {
                if (filters.genders.length === 1) {
                    q = query(q, where('gender', '==', filters.genders[0]));
                } else if (!searchQuery) { // Can't combine searchKeywords array-contains with 'in'
                    q = query(q, where('gender', 'in', filters.genders.slice(0, 10)));
                }
            }

            if (filters.brands && filters.brands.length > 0) {
                if (filters.brands.length === 1) {
                    q = query(q, where('brand', '==', filters.brands[0]));
                } else if (!searchQuery && (!filters.genders || filters.genders.length <= 1)) {
                    q = query(q, where('brand', 'in', filters.brands.slice(0, 10)));
                }
            }

            if (filters.subcategories && filters.subcategories.length > 0) {
                if (filters.subcategories.length === 1) {
                    q = query(q, where('subcategory', '==', filters.subcategories[0]));
                } else if (!searchQuery && (!filters.brands || filters.brands.length <= 1) && (!filters.genders || filters.genders.length <= 1)) {
                     q = query(q, where('subcategory', 'in', filters.subcategories.slice(0, 10)));
                }
            }
        }

        // Limit results for performance
        q = query(q, limit(1000));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!isMounted) return;
            const data = snapshot.docs.map(doc => {
                const raw = doc.data();
                return {
                    ...raw,
                    id: doc.id,
                    createdAt: raw.createdAt?.toDate?.()?.toISOString() || raw.createdAt || null,
                    updatedAt: raw.updatedAt?.toDate?.()?.toISOString() || raw.updatedAt || null,
                    price: Number(raw.price || 0),
                    stock: Number(raw.stock || 0)
                } as Product;
            });
            setProducts(data);
            setLoading(false);
        }, (err) => {
            console.error("Products sync error:", err);
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [category, searchQuery, sort, JSON.stringify(filters)]);

    return { products, loading };
}

export function useRealTimeOrder(orderId: string) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const orderRef = doc(db, 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                setOrder({ id: snapshot.id, ...snapshot.data() } as Order);
            }
            setLoading(false);
        }, (err) => {
            console.error("Order sync error:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [orderId]);

    return { order, loading };
}

export function useRealTimeTicket(ticketId: string) {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ticketId) return;
        const ticketRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketRef, (snapshot) => {
            if (snapshot.exists()) {
                setTicket({ id: snapshot.id, ...snapshot.data() } as Ticket);
            }
            setLoading(false);
        }, (err) => {
            console.error("Ticket sync error:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [ticketId]);

    return { ticket, loading };
}

export function useRealTimeMember(memberId: string) {
    const [member, setMember] = useState<GoldenMember | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!memberId) return;
        const memberRef = doc(db, 'goldenCircleUsers', memberId);
        const unsubscribe = onSnapshot(memberRef, (snapshot) => {
            if (snapshot.exists()) {
                setMember({ id: snapshot.id, ...snapshot.data() } as GoldenMember);
            }
            setLoading(false);
        }, (err) => {
            console.error("Member sync error:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [memberId]);

    return { member, loading };
}

export function useRealTimeGCRequests() {
    const [requests, setRequests] = useState<GoldenCircleRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const requestsRef = collection(db, 'goldenCircleRequests');
        const q = query(requestsRef, orderBy('requestedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GoldenCircleRequest));
            setRequests(data);
            setLoading(false);
        }, (err) => {
            console.error("Requests sync error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { requests, loading };
}
