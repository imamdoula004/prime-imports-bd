const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

try {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    const db = admin.firestore();
    console.log("Admin initialized. Attempting a test read...");
    db.collection('products').limit(1).get()
        .then(snapshot => {
            console.log("Success! Read", snapshot.size, "docs");
            process.exit(0);
        })
        .catch(err => {
            console.error("Failed test read:", err.message);
            process.exit(1);
        });
} catch (e) {
    console.error("Failed to initialize admin:", e.message);
    process.exit(1);
}
