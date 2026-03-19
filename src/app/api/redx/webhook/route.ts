import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';
import { mapRedXStatusToPlatform } from '@/lib/redx';
import { Order } from '@/types';

// Security Token - Configured in .env.local
const WEBHOOK_TOKEN = process.env.REDX_WEBHOOK_TOKEN;

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        // 1. Security Validation
        if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
            console.error('Unauthorized RedX Webhook attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tracking_number, status: redxStatus } = body;

        if (!tracking_number || !redxStatus) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Received RedX Update: Tracking #${tracking_number}, Status: ${redxStatus}`);

        // 2. Find Order in Firebase
        const ordersRef = adminDb.collection('orders');
        const snapshot = await ordersRef.where('delivery.trackingId', '==', tracking_number).limit(1).get();

        if (snapshot.empty) {
            console.error(`Order not found for tracking ID: ${tracking_number}`);
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 200 });
        }

        const orderDoc = snapshot.docs[0];
        const orderData = orderDoc.data() as Order;
        const currentStatus = orderData.status;

        // 3. Status Update Rules
        if (currentStatus === 'Delivered' || currentStatus === 'Completed') {
            console.log(`Ignoring update for order ${orderDoc.id} as it is already ${currentStatus}`);
            return NextResponse.json({ success: true, message: 'Status already finalized' });
        }

        const newPlatformStatus = mapRedXStatusToPlatform(redxStatus);

        if (newPlatformStatus === currentStatus) {
            return NextResponse.json({ success: true, message: 'Status unchanged' });
        }

        const statusUpdate = {
            status: newPlatformStatus,
            'delivery.status': redxStatus,
            'delivery.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
                status: newPlatformStatus,
                timestamp: new Date(),
                source: 'RedX',
                originalStatus: redxStatus
            })
        };

        // 4. Update Firebase
        await orderDoc.ref.update(statusUpdate as any);

        console.log(`Successfully updated Order ${orderDoc.id} to ${newPlatformStatus} (Source: RedX)`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('RedX Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
