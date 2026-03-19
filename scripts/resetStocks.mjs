import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc, deleteField } from "firebase/firestore";
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

async function migrate() {
    console.log("🚀 Starting Global Migration: Resetting Stocks to 0 & Cleaning IDs...");

    try {
        const prodRef = collection(db, 'products');
        const snapshot = await getDocs(prodRef);
        console.log(`📦 Found ${snapshot.size} products to process.`);

        let batch = writeBatch(db);
        let count = 0;
        let batchCount = 0;

        for (const docSnap of snapshot.docs) {
            const docRef = doc(db, 'products', docSnap.id);

            // 1. Reset stock to 0
            // 2. Remove conflicting 'id' field if it exists
            batch.update(docRef, {
                stock: 0,
                id: deleteField()
            });

            count++;
            batchCount++;

            // Firestore batch limit is 500 operations
            if (batchCount === 500) {
                console.log(`⏳ Committing batch... (${count}/${snapshot.size})`);
                await batch.commit();
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            console.log(`⏳ Committing final batch... (${count}/${snapshot.size})`);
            await batch.commit();
        }

        console.log("✅ SUCCESS! All products have been updated.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    }
    process.exit(0);
}

migrate();
