import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "primeimportsdb");

async function verify() {
    const collections = ['products', 'orders', 'goldenCircleUsers', 'tickets', 'goldenCircleRequests', 'requestedItems'];
    
    console.log("📊 Verification Results:");
    for (const coll of collections) {
        const snap = await getDocs(collection(db, coll));
        console.log(`- ${coll}: ${snap.size} documents found.`);
        if (coll === 'products' && snap.size > 0) {
            const first = snap.docs[0].data();
            console.log(`  (Sample Product Stock: ${first.stock})`);
        }
    }
    process.exit(0);
}

verify();
