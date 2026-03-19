const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');
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

async function checkData() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, limit(5));
        const querySnapshot = await getDocs(q);

        console.log("Found " + querySnapshot.size + " products.");
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log("ID: " + doc.id);
            console.log("Title: " + data.title);
            console.log("Category: " + data.category);
            console.log("NormalizedCategory: " + data.normalizedCategory);
            console.log("Slug: " + data.slug);
            console.log("-------------------");
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
