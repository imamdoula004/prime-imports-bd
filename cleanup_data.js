const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');
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
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "primeimportsdb");

async function cleanupData() {
    try {
        console.log("Fetching all products from Firestore...");
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);

        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Found ${products.length} products total.`);

        const groups = {};
        products.forEach(p => {
            let cleanTitle = (p.title || "")
                .replace(/L\s+'Oreal/gi, "L'Oreal")
                .replace(/L\s+'oreal/gi, "L'Oreal")
                .replace(/L' Oreal/gi, "L'Oreal")
                .replace(/L\s*'\s*oreal/gi, "L'Oreal")
                .replace(/&amp;/g, '&')
                .replace(/&#038;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .trim();

            p.title = cleanTitle;

            if (p.description) {
                p.description = p.description
                    .replace(/marketdaybd\.com/gi, "primeimportsbd.com")
                    .replace(/marketdaybd/gi, "primeimportsbd")
                    .replace(/chocolateshopbd\.com/gi, "primeimportsbd.com")
                    .replace(/chocolateshopbd/gi, "primeimportsbd");
            }

            const key = cleanTitle.toLowerCase();
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(p);
        });

        const toUpdate = [];
        const toDelete = [];

        Object.keys(groups).forEach(key => {
            const group = groups[key];
            if (group.length > 1) {
                group.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
                const kept = group[0];
                toUpdate.push(kept);
                for (let i = 1; i < group.length; i++) {
                    toDelete.push(group[i].id);
                }
            } else {
                toUpdate.push(group[0]);
            }
        });

        console.log(`Summary: ${toUpdate.length} kept/updated, ${toDelete.length} duplicates to remove.`);

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const CHUNK_SIZE = 100; // Smaller chunks to avoid stream issues

        // Deletions
        for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = toDelete.slice(i, i + CHUNK_SIZE);
            chunk.forEach(id => {
                batch.delete(doc(db, 'products', id));
            });
            await batch.commit();
            console.log(`Deleted ${i + chunk.length} / ${toDelete.length} duplicates...`);
            await delay(2000); // 2 second delay between batches
        }

        // Updates
        for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
            chunk.forEach(p => {
                const { id, ...data } = p;
                batch.set(doc(db, 'products', id), data, { merge: true });
            });
            await batch.commit();
            console.log(`Updated ${i + chunk.length} / ${toUpdate.length} products...`);
            await delay(2000); // 2 second delay between batches
        }

        console.log("Data cleanup and deduplication complete!");
        process.exit(0);
    } catch (e) {
        console.error("Cleanup failed:", e);
        process.exit(1);
    }
}

cleanupData();
