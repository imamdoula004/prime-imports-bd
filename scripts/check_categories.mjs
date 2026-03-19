import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

async function checkCategories() {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(query(productsRef, limit(2000)));

    const categories = new Set();
    const productCountPerCategory = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'NO_CATEGORY';
      categories.add(cat);
      productCountPerCategory[cat] = (productCountPerCategory[cat] || 0) + 1;
    });

    console.log('--- Unique Categories found in first 2000 products ---');
    console.log(Array.from(categories).sort());
    console.log('\n--- Counts per Category ---');
    console.log(productCountPerCategory);
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

checkCategories();
