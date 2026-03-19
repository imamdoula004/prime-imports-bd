import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, limit } from "firebase/firestore";
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

async function diagnose() {
    console.log("🔍 Checking for field 'id' conflicts...");

    try {
        const prodRef = collection(db, 'products');
        const q = query(prodRef, limit(500)); // Check first 500
        const snapshot = await getDocs(q);

        let conflicts = 0;
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.id && data.id !== docSnap.id) {
                console.log(`⚠️ Conflict: DocID [${docSnap.id}] has field id [${data.id}]`);
                conflicts++;
            }
        });

        console.log(`📊 Checked 500 items. Found ${conflicts} conflicts.`);

        // Specifically search for id: "6323" as a field
        const q2 = query(prodRef, where('id', '==', '6323'), limit(1));
        const s2 = await getDocs(q2);
        if (!s2.empty) {
            console.log(`🎯 FOUND! Product with field id="6323":`, s2.docs[0].id);
        } else {
            // Try numeric 6323 just in case
            const q3 = query(prodRef, where('id', '==', 6323), limit(1));
            const s3 = await getDocs(q3);
            if (!s3.empty) {
                console.log(`🎯 FOUND! Product with numeric field id=6323:`, s3.docs[0].id);
            }
        }
    } catch (err) {
        console.error("❌ Diagnosis failed:", err);
    }
    process.exit(0);
}

diagnose();
