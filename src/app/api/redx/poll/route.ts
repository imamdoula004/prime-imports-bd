import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { getRedXStatus, mapRedXStatusToPlatform } from '@/lib/redx';
import { Order } from '@/types';

// Security Token for polling trigger - Configured in .env.local
const POLL_TOKEN = process.env.REDX_POLL_TOKEN;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!POLL_TOKEN || token !== POLL_TOKEN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting RedX Status Polling...');

        // 1. Fetch orders in active delivery states with trackingId
        const activeStatuses = ['Confirmed', 'Shipped', 'OutForDelivery'];
        const ordersRef = adminDb.collection('orders');
        const snapshot = await ordersRef
            .where('status', 'in', activeStatuses)
            .where('delivery.trackingId', '!=', null)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No active orders to poll' });
        }

        console.log(`Polling ${snapshot.size} orders...`);
        const results = [];

        for (const orderDoc of snapshot.docs) {
            const orderData = orderDoc.data() as Order;
            const trackingId = orderData.delivery?.trackingId;

            if (!trackingId) continue;

            const redxData = await getRedXStatus(trackingId);
            if (!redxData) continue;

            const newPlatformStatus = mapRedXStatusToPlatform(redxData.status);
            const currentStatus = orderData.status;

            // Apply update rules
            if (newPlatformStatus !== currentStatus && currentStatus !== 'Delivered' && currentStatus !== 'Completed') {
                const statusUpdate = {
                    status: newPlatformStatus,
                    'delivery.status': redxData.status,
                    'delivery.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
                    statusHistory: admin.firestore.FieldValue.arrayUnion({
                        status: newPlatformStatus,
                        timestamp: new Date(),
                        source: 'RedX (Poll)',
                        originalStatus: redxData.status
                    })
                };

                await orderDoc.ref.update(statusUpdate as any);
                results.push({ orderId: orderDoc.id, from: currentStatus, to: newPlatformStatus });
                console.log(`Polled: Updated order ${orderDoc.id} to ${newPlatformStatus}`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            polledCount: snapshot.size,
            updatedCount: results.length,
            updates: results
        });

    } catch (error) {
        console.error('RedX Polling Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
