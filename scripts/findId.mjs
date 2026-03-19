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

async function findId() {
    console.log("🔍 Deep Scan for ID 6323...");

    try {
        const prodRef = collection(db, 'products');
        const snapshot = await getDocs(prodRef);

        let found = false;
        snapshot.docs.forEach(doc => {
            if (doc.id === "6323") {
                console.log(`✅ FOUND! Document ID 6323 exists.`);
                console.log("Data:", JSON.stringify(doc.data(), null, 2));
                found = true;
            }
        });

        if (!found) {
            console.log("❌ ID 6323 was not found in the entire list of IDs.");
        }
    } catch (err) {
        console.error("❌ Scan failed:", err);
    }
    process.exit(0);
}

findId();
