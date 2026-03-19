import * as admin from 'firebase-admin';

// Initialize Firebase Admin only if it hasn't been initialized
if (!admin.apps.length) {
    // Determine the environment and load credentials
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // In production, we'd use service account. For local dev with this recovery, 
    // we use default application credentials or specific env vars.
    admin.initializeApp({
        projectId: projectId,
        // credential: admin.credential.cert(serviceAccountConfig) 
        // We will add the explicit service account if needed for admin overrides
    });
}

const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });

export { adminDb, admin };
