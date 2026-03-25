import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy, limit, startAfter, addDoc, deleteDoc } from "firebase/firestore";
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
    console.log("🚀 Starting Soft Delete Migration...");

    // 1. Update existing products to have isDeleted: false if missing
    console.log("📦 Normalizing 'products' collection...");
    const prodRef = collection(db, 'products');
    const prodSnap = await getDocs(prodRef);
    let updatedCount = 0;

    for (const docSnap of prodSnap.docs) {
        const data = docSnap.data();
        if (data.isDeleted === undefined) {
            await updateDoc(docSnap.ref, {
                isDeleted: false,
                deletedAt: null
            });
            updatedCount++;
        }
    }
    console.log(`✅ Normalized ${updatedCount} products.`);

    // 2. Move items from 'deleted_products' to 'products' with isDeleted: true
    console.log("♻️  Migrating 'deleted_products' to 'products' (Soft Delete)...");
    const oldDeletedRef = collection(db, 'deleted_products');
    const oldDeletedSnap = await getDocs(oldDeletedRef);
    let migratedCount = 0;

    for (const docSnap of oldDeletedSnap.docs) {
        const data = docSnap.data();
        await addDoc(prodRef, {
            ...data,
            isDeleted: true,
            deletedAt: data.deletedAt || serverTimestamp(),
            status: 'archived'
        });
        await deleteDoc(docSnap.ref);
        migratedCount++;
    }
    console.log(`✅ Migrated ${migratedCount} deleted products.`);
    console.log("✨ Migration COMPLETED!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
