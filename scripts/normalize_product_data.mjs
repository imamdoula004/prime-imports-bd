import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

const BRANDS = ['Nike', 'Apple', 'Samsung', 'Adidas', 'Sony', 'HP', 'Dell', 'Logitech', 'Razer', 'Canon', 'Nikon', 'Nestle', 'Cadbury', 'Pringles', 'Dove', 'L\'Oreal', 'Nivea'];

async function normalizeProducts() {
  console.log('--- Starting Production-Grade Product Normalization ---');
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const productDoc of snapshot.docs) {
      const data = productDoc.data();
      const title = data.title || data.name || '';
      const desc = data.description || '';
      const fullText = `${title} ${desc}`.toLowerCase();

      let updates = {};
      let needsUpdate = false;

      // 1. Extract BRAND
      if (!data.brand || data.brand === '') {
        const foundBrand = BRANDS.find(b => fullText.includes(b.toLowerCase()));
        if (foundBrand) {
          updates.brand = foundBrand;
          needsUpdate = true;
        }
      } else {
          // Normalize existing brand
          const normalized = BRANDS.find(b => b.toLowerCase() === data.brand.toLowerCase());
          if (normalized && normalized !== data.brand) {
              updates.brand = normalized;
              needsUpdate = true;
          }
      }

      // 2. Extract GENDER
      if (!data.gender || data.gender === 'Unisex') {
        if (fullText.includes('women') || fullText.includes('female') || fullText.includes('ladies') || fullText.includes('girl')) {
          updates.gender = 'Women';
          needsUpdate = true;
        } else if (fullText.includes('men') || fullText.includes('male') || fullText.includes('gents') || fullText.includes('boy')) {
          updates.gender = 'Men';
          needsUpdate = true;
        } else if (fullText.includes('kid') || fullText.includes('children')) {
          updates.gender = 'Kids';
          needsUpdate = true;
        } else if (!data.gender) {
          updates.gender = 'Unisex';
          needsUpdate = true;
        }
      }

      // 3. Extract TYPE (Subcategory)
      if (!data.subcategory || data.subcategory === '') {
          const types = [
              'Keyboard', 'Mouse', 'Headphone', 'Earbuds', 'Laptop', 'Desktop', 'Phone', 'Tablet',
              'Watch', 'Camera', 'Speaker', 'Monitor', 'Printer', 'Software', 'Game',
              'Chocolate', 'Biscuit', 'Tea', 'Coffee', 'Juice', 'Soft Drink',
              'Shampoo', 'Soap', 'Cream', 'Lotion', 'Perfume', 'Makeup',
              'Oil', 'Rice', 'Flour', 'Sugar', 'Salt', 'Sauce'
          ];
          const foundType = types.find(t => fullText.includes(t.toLowerCase()));
          if (foundType) {
              updates.subcategory = foundType;
              if (!data.productType) updates.productType = foundType;
              needsUpdate = true;
          }
      }

      // 4. searchKeywords
      if (!data.searchKeywords || data.searchKeywords.length === 0) {
          const keywords = new Set();
          title.toLowerCase().split(/\s+/).forEach(w => { if(w.length > 2) keywords.add(w) });
          const brand = updates.brand || data.brand;
          if (brand) keywords.add(brand.toLowerCase());
          const cat = updates.category || data.category;
          if (cat) keywords.add(cat.toLowerCase());
          updates.searchKeywords = Array.from(keywords);
          needsUpdate = true;
      }

      if (needsUpdate) {
        await updateDoc(doc(db, 'products', productDoc.id), updates);
        updatedCount++;
        console.log(`[UPDATED] ${title.substring(0, 30)}... -> ${Object.keys(updates).join(', ')}`);
      } else {
        skippedCount++;
      }
    }

    console.log('----------------------------------------------------');
    console.log(`Normalization Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Normalization Failed:', error);
    process.exit(1);
  }
}

normalizeProducts();
