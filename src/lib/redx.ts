
// RedX Logistics Integration Utility
// Using Production URL and Token as provided

const REDX_BASE_URL = 'https://openapi.redx.com.bd/v1.0.0-beta';
const REDX_TOKEN = process.env.REDX_API_TOKEN;

export interface RedXTrackingResponse {
    tracking_id: string;
    status: string;
    message_en?: string;
    message_bn?: string;
    last_updated?: string;
}

/**
 * Maps RedX status to our platform status
 */
export function mapRedXStatusToPlatform(redxStatus: string): 'Pending' | 'Confirmed' | 'Shipped' | 'OutForDelivery' | 'Delivered' | 'cancelled' {
    const status = redxStatus.toLowerCase();
    
    // Confirmed statuses
    if (['parcel_created', 'pickup-pending', 'ready-for-delivery'].includes(status)) {
        return 'Confirmed';
    }
    
    // Out For Delivery statuses
    if (['picked_up', 'in_transit', 'delivery-in-progress'].includes(status)) {
        return 'OutForDelivery';
    }
    
    // Delivered statuses
    if (status === 'delivered') {
        return 'Delivered';
    }
    
    // Cancelled / Issue statuses -> Mark as Pending for manual review or handled separately
    if (['cancelled', 'failed', 'returned', 'agent-returning'].includes(status)) {
        // Keeping it as pending to alert admin something went wrong with the automated flow
        return 'Pending';
    }

    return 'Pending';
}

/**
 * Fetch real-time status from RedX
 */
export async function getRedXStatus(trackingId: string): Promise<RedXTrackingResponse | null> {
    try {
        const response = await fetch(`${REDX_BASE_URL}/parcel/info/${trackingId}`, {
            headers: {
                'API-ACCESS-TOKEN': `Bearer ${REDX_TOKEN}`,
            }
        });

        if (!response.ok) {
            console.error(`RedX API Error: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.parcel) {
            return {
                tracking_id: data.parcel.tracking_id,
                status: data.parcel.status,
                last_updated: data.parcel.updated_at || data.parcel.created_at
            };
        }
        return null;
    } catch (error) {
        console.error('RedX fetch error:', error);
        return null;
    }
}

export const STATUS_COLORS: Record<string, string> = {
    'parcel_created': 'text-amber-600 bg-amber-50',
    'pickup-pending': 'text-blue-600 bg-blue-50',
    'ready-for-delivery': 'text-blue-600 bg-blue-50',
    'picked_up': 'text-indigo-600 bg-indigo-50',
    'in_transit': 'text-indigo-600 bg-indigo-50',
    'delivery-in-progress': 'text-indigo-600 bg-indigo-50',
    'delivered': 'text-emerald-600 bg-emerald-50',
    'cancelled': 'text-rose-600 bg-rose-50',
    'failed': 'text-rose-700 bg-rose-100',
    'returned': 'text-rose-700 bg-rose-100',
    'agent-hold': 'text-amber-700 bg-amber-100',
    'unsettled': 'text-rose-700 bg-rose-100 animate-pulse'
};
