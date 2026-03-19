const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// Using the default database ID to test
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "primeimportsdb");

async function test() {
    try {
        console.log("Connecting to Firestore on project: " + firebaseConfig.projectId);
        const snapshot = await getDocs(query(collection(db, 'products'), limit(1)));
        console.log("Success! Found " + snapshot.size + " documents in 'products' collection.");
        if (snapshot.size > 0) {
            console.log("First document data:", JSON.stringify(snapshot.docs[0].data(), null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error("Connection Error:", e.message);
        process.exit(1);
    }
}

test();
