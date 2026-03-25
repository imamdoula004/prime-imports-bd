import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
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

async function resetData() {
    console.log("🚀 Starting Production Data Reset...");

    const commitBatch = async (docs, operation) => {
        const chunks = [];
        for (let i = 0; i < docs.length; i += 400) {
            chunks.push(docs.slice(i, i + 400));
        }

        for (let i = 0; i < chunks.length; i++) {
            const batch = writeBatch(db);
            chunks[i].forEach(snap => {
                if (operation === 'update_stock') batch.update(snap.ref, { stock: 0 });
                if (operation === 'delete') batch.delete(snap.ref);
                if (operation === 'reset_gc') batch.update(snap.ref, { totalSpent: 0, totalSaved: 0, ordersCount: 0, spending: [] });
            });
            await batch.commit();
            console.log(`✅ Batch ${i + 1}/${chunks.length} committed.`);
        }
    };

    try {
        // 1. Reset Product Stocks to 0
        console.log("📦 Zeroing out Product stocks...");
        const pSnap = await getDocs(collection(db, 'products'));
        await commitBatch(pSnap.docs, 'update_stock');
        console.log(`✅ ${pSnap.size} products zeroed.`);

        // 2. Delete Orders
        console.log("📜 Deleting Orders...");
        const oSnap = await getDocs(collection(db, 'orders'));
        await commitBatch(oSnap.docs, 'delete');
        console.log(`✅ ${oSnap.size} orders deleted.`);

        // 3. Delete Golden Circle Members
        console.log("💎 Deleting Golden Circle users...");
        const gcSnap = await getDocs(collection(db, 'goldenCircleUsers'));
        await commitBatch(gcSnap.docs, 'delete');
        console.log(`✅ ${gcSnap.size} members deleted.`);

        // 4. Delete Transactional Data
        const collectionsToDelete = ['tickets', 'goldenCircleRequests', 'requestedItems'];
        for (const collName of collectionsToDelete) {
            console.log(`扫 Clearing ${collName}...`);
            const snap = await getDocs(collection(db, collName));
            await commitBatch(snap.docs, 'delete');
        }

        console.log("🎉 Production Reset Complete! The admin dashboard should now show zero for all stats.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Reset Failed:", err);
        process.exit(1);
    }
}

resetData();
