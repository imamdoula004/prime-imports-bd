import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import fs from "fs";
import path from "path";
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

async function seed() {
    try {
        const filePath = path.join(process.cwd(), 'resolved_products.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(fileContents);

        console.log(`Loaded ${products.length} products to seed.`);

        const chunks = [];
        for (let i = 0; i < products.length; i += 400) {
            chunks.push(products.slice(i, i + 400));
        }

        const collRef = collection(db, 'products');

        for (let i = 0; i < chunks.length; i++) {
            const batch = writeBatch(db);
            for (const product of chunks[i]) {
                const docRef = doc(collRef, product.slug || product.id.toString());
                batch.set(docRef, product);
            }
            await batch.commit();
            console.log(`Committed batch ${i + 1}/${chunks.length}`);
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seed();
