import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
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

async function audit() {
    console.log("🔍 Auditing Firestore Catalog...");

    try {
        const prodRef = collection(db, 'products');
        const snapshot = await getDocs(prodRef);
        console.log(`📊 Total Products Found: ${snapshot.size}`);

        const problematicId = "6323";
        const docRef = doc(db, 'products', problematicId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`✅ Document ${problematicId} exists!`);
        } else {
            console.log(`❌ Document ${problematicId} DOES NOT EXIST.`);
        }
    } catch (err) {
        console.error("❌ Audit failed:", err);
    }
    process.exit(0);
}

audit();
