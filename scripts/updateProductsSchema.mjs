import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy, limit, startAfter } from "firebase/firestore";
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

function generateKeywords(name, brand, category) {
    const text = `${name} ${brand || ''} ${category}`.toLowerCase();
    const words = text.split(/[^a-z0-9]/).filter(w => w.length > 1);
    const variations = [];
    if (name.toLowerCase().includes('100 plus')) variations.push('100plus');
    return [...new Set([...words, ...variations])];
}

function inferCategory(name, currentCat) {
    const n = name.toLowerCase();
    if (n.includes('drink') || n.includes('water') || n.includes('juice') || n.includes('cola') || n.includes('soda'))
        return { category: 'Beverages', subcategory: n.includes('energy') ? 'Energy Drinks' : 'Soft Drinks' };
    if (n.includes('chip') || n.includes('lays') || n.includes('pringles') || n.includes('snack'))
        return { category: 'Snacks & Confectionery', subcategory: 'Chips' };
    if (n.includes('chocolate') || n.includes('dairy milk') || n.includes('kitkat') || n.includes('wafer'))
        return { category: 'Snacks & Confectionery', subcategory: n.includes('wafer') ? 'Wafers' : 'Chocolates' };
    if (n.includes('biscuit') || n.includes('cookie') || n.includes('oreo'))
        return { category: 'Snacks & Confectionery', subcategory: 'Cookies & biscuits' };
    if (n.includes('oil') || n.includes('rice') || n.includes('spice') || n.includes('salt') || n.includes('sugar') || n.includes('noodle') || n.includes('pasta'))
        return { category: 'Cooking Needs', subcategory: n.includes('noodle') || n.includes('pasta') ? 'Pasta & Noodles' : 'Basic Essentials' };
    if (n.includes('milk') || n.includes('cheese') || n.includes('butter') || n.includes('ghee') || n.includes('cereal'))
        return { category: 'Breakfast & Dairy', subcategory: n.includes('milk') ? 'Milk' : 'Dairy Products' };
    if (n.includes('soap') || n.includes('shampoo') || n.includes('paste') || n.includes('brush') || n.includes('diaper'))
        return { category: 'Health & Wellness', subcategory: n.includes('diaper') ? 'Baby Care' : 'Personal Care' };
    return { category: currentCat || 'General', subcategory: 'Others' };
}

async function updateSchema() {
    console.log("🚀 Starting Product Schema Update (Throttled Mode)...");
    const PAGE_SIZE = 100;
    let lastProcessedDoc = null;
    let totalProcessed = 0;
    let hasMore = true;

    while (hasMore) {
        try {
            const prodRef = collection(db, 'products');
            let q = query(prodRef, orderBy('__name__'), limit(PAGE_SIZE));
            if (lastProcessedDoc) {
                q = query(prodRef, orderBy('__name__'), startAfter(lastProcessedDoc), limit(PAGE_SIZE));
            }

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                hasMore = false;
                break;
            }

            // Using individual updates to avoid write batch queuing issues
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const name = data.name || data.title || "Untitled Product";
                const brand = data.brand || "Prime";
                const currentCat = data.category || "General";
                const { category, subcategory } = inferCategory(name, currentCat);

                const updatedData = {
                    name: name,
                    brand: brand,
                    category: category,
                    subcategory: subcategory,
                    price: Number(data.price) || 0,
                    marketPrice: Number(data.marketPrice || data.oldPrice) || 0,
                    stock: Number(data.stock !== undefined ? data.stock : 0),
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    tags: data.tags || [],
                    searchKeywords: generateKeywords(name, brand, category),
                    totalSales: data.totalSales || 0,
                    weeklySales: data.weeklySales || 0,
                    monthlySales: data.monthlySales || 0,
                    lastSoldAt: data.lastSoldAt || null,
                    updatedAt: serverTimestamp(),
                };

                await updateDoc(docSnap.ref, updatedData);
                // Tiny pause between docs
                await new Promise(r => setTimeout(r, 10));
            }

            totalProcessed += snapshot.size;
            lastProcessedDoc = snapshot.docs[snapshot.docs.length - 1];
            console.log(`✅ Progress: ${totalProcessed} products processed...`);

            // Wait 0.5 seconds between pages
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            console.error("❌ Page failed, retrying in 5s...", err.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log("✨ All products normalized successfully!");
    process.exit(0);
}

updateSchema();
