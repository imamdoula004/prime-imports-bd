import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
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

const CATEGORY_MAP = {
    'Beverages': 'Beverages & Drinks',
    'Snacks': 'Snacks & Confectionery',
    'Snacks & Sweets Haven': 'Snacks & Confectionery',
    'Snacks & Sweets': 'Snacks & Confectionery',
    'Cosmetics': 'Cosmetics & Beauty',
    'Grocery Essentials': 'Grocery and Essentials',
    'Grocery': 'Grocery and Essentials',
    'Dairy': 'Dairy & Cheese',
    'Baby Care': 'Baby Care Imports',
    'Supplements': 'Health & Wellness',
    'Health': 'Health & Wellness',
    'Kitchen': 'Home & Kitchen',
    'Home & Living': 'Home & Kitchen'
};

async function unifyCategories() {
  console.log('--- Unifying Categories for Perfect Matching ---');
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    let updatedCount = 0;

    for (const productDoc of snapshot.docs) {
      const data = productDoc.data();
      const currentCat = data.category;
      
      if (CATEGORY_MAP[currentCat]) {
          const newCat = CATEGORY_MAP[currentCat];
          await updateDoc(doc(db, 'products', productDoc.id), {
              category: newCat
          });
          updatedCount++;
          console.log(`[MAP] "${currentCat}" -> "${newCat}" (${productDoc.id})`);
      }
    }

    console.log('----------------------------------------------------');
    console.log(`Unification Complete. Updated: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

unifyCategories();
