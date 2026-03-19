import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'primeimportsdb');

async function extractProducts() {
    try {
        console.log('Connecting to [primeimportsdb] using standard Web Client SDK...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);

        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        fs.writeFileSync('resolved_products.json', JSON.stringify(products, null, 2));
        console.log(`[SUCCESS] Extracted ${products.length} products to resolved_products.json!`);
        process.exit(0);
    } catch (error) {
        console.error('Error recovering products via Web Client SDK:', error);
        process.exit(1);
    }
}

extractProducts();
