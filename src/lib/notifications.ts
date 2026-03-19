import { db } from './firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

/**
 * Triggers restock notifications for a specific product.
 * Fetches the waitlist from Firestore, sends data to n8n webhook, and clears the waitlist.
 */
export async function triggerRestockNotifications(productId: string, productName: string) {
    try {
        const waitlistRef = doc(db, 'waitlists', productId);
        const waitlistSnap = await getDoc(waitlistRef);

        if (!waitlistSnap.exists()) {
            console.log(`[NOTIFY] No active waitlist for ${productId}`);
            return;
        }

        const data = waitlistSnap.data();
        const users = data.users || [];

        if (users.length === 0) {
            await deleteDoc(waitlistRef);
            return;
        }

        console.log(`[NOTIFY] Sending restock alerts for "${productName}" to ${users.length} users...`);

        // Trigger n8n automation pipeline
        // The user mentioned an existing n8n pipeline; we'll use a configurable environment variable.
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_RESTOCK_WEBHOOK_URL;

        if (webhookUrl) {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    productName,
                    users,
                    timestamp: new Date().toISOString(),
                    message: `Prime Imports BD: Your product is back! ${productName} is now in stock. Order quickly before it sells out.`
                })
            });

            if (!response.ok) {
                throw new Error(`n8n webhook failed: ${response.statusText}`);
            }
            console.log(`[NOTIFY] n8n webhook triggered successfully`);
        } else {
            console.warn(`[NOTIFY] No NEXT_PUBLIC_N8N_RESTOCK_WEBHOOK_URL found. Skipping webhook call.`);
        }

        // Clear the waitlist for this product after notifications are dispatched
        await deleteDoc(waitlistRef);
        console.log(`[NOTIFY] Waitlist document deleted for ${productId}`);

    } catch (error) {
        console.error('[NOTIFY] Error in triggerRestockNotifications:', error);
    }
}
