import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    // Relying on FIREBASE_CONFIG env var or service account path being set externally if needed,
    // or assume orchestrator already configures it.
}

export async function uploadToFirebase(productId, localFiles) {
    try {
        const bucket = getStorage().bucket();
        const db = getFirestore();

        const urls = {};

        // localFiles is an object like: { catalog: path, zoom: path, lifestyle: path }
        for (const [variant, localFilePath] of Object.entries(localFiles)) {
            const destination = `product-images/${productId}/${variant}.webp`;

            await bucket.upload(localFilePath, {
                destination: destination,
                metadata: {
                    contentType: 'image/webp',
                }
            });

            // Make the file publicly accessible
            const file = bucket.file(destination);
            await file.makePublic();
            urls[variant] = file.publicUrl();
        }

        // Update Firestore
        await db.collection('products').doc(productId).set({
            images: {
                catalog: urls.catalog,
                zoom: urls.zoom,
                style1: urls.lifestyle
            },
            // Fallbacks for older frontend versions
            image: urls.catalog,
            imageURL: urls.catalog,
            imageUpdatedAt: new Date().toISOString(),
            processingStatus: 'COMPLETED'
        }, { merge: true });

        return urls;
    } catch (error) {
        console.error(`Firebase upload failed for productId ${productId}:`, error.message);
        return null; // Return null on major failure
    }
}
