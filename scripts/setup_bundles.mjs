import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (e) {
  console.log('No serviceAccountKey.json found. Cannot run script automatically.');
  process.exit(0);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
    console.log("Fetching some active products...");
    // 1. Get up to 3 active products
    const snapshot = await db.collection('products')
                             .where('isActive', '==', true)
                             .limit(3)
                             .get();
                             
    if(snapshot.empty || snapshot.docs.length < 2) {
        console.log("Not enough active products found to create a bundle (need at least 2).");
        return;
    }
    
    const docs = snapshot.docs;
    const productIds = docs.map(d => d.id);
    let totalMarketPrice = 0;
    
    docs.forEach(d => {
        const p = d.data();
        totalMarketPrice += Number(p.price || p.originalPrice || 0);
    });
    
    // Apply a 15% discount
    const bundlePrice = Math.round(totalMarketPrice * 0.85);

    const bundleData = {
        name: "Starter Pack Combo",
        products: productIds,
        active: true,
        marketPrice: totalMarketPrice,
        bundlePrice: bundlePrice,
        createdAt: new Date().toISOString()
    };
    
    await db.collection('bundles').add(bundleData);
    console.log("Mock bundle created successfully:");
    console.log(bundleData);
}

run()
  .then(() => process.exit(0))
  .catch(e => {
      console.error(e);
      process.exit(1);
  });
