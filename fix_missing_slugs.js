const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
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

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fixSlugs() {
    try {
        console.log("Fetching all products...");
        const snapshot = await getDocs(collection(db, 'products'));
        console.log(`Found ${snapshot.size} products.`);

        let updated = 0;
        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            console.log(`Checking doc ${docSnapshot.id}: slug=${data.slug}`);
            if (!data.slug) {
                const newSlug = generateSlug(data.title || 'product');
                console.log(`Generating slug for doc ${docSnapshot.id}: ${newSlug}`);
                await updateDoc(doc(db, 'products', docSnapshot.id), {
                    slug: newSlug
                });
                updated++;
                if (updated % 50 === 0) console.log(`Updated ${updated} slugs...`);
            }
        }

        console.log(`Finished! Updated ${updated} missing slugs.`);
        process.exit(0);
    } catch (e) {
        console.error("Error fixing slugs:", e);
        process.exit(1);
    }
}

fixSlugs();
