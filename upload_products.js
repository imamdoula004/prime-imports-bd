const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, getDoc } = require('firebase/firestore');
const fs = require('fs');
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

function normalizeCategory(rawCat) {
    if (!rawCat) return 'Grocery and Essentials';

    // Decode HTML entities like &amp;
    let cat = rawCat.replace(/&amp;/g, '&')
        .replace(/&#038;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .toLowerCase();

    if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('cleanser') || cat.includes('skincare') || cat.includes('scrub')) {
        return 'Cosmetics & Beauty';
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('soft drink') || cat.includes('juice') || cat.includes('soda')) {
        return 'Beverages & Drinks';
    }
    if (cat.includes('tea') || cat.includes('coffee') || cat.includes('nestle') || cat.includes('nescafe')) {
        return 'Tea & Coffee';
    }
    if (cat.includes('chocolate') || cat.includes('cadbury') || cat.includes('mars') || cat.includes('snickers')) {
        return 'Chocolate Bars';
    }
    if (cat.includes('biscuit') || cat.includes('cookie') || cat.includes('wafer')) {
        return 'Biscuits & Cookies';
    }
    if (cat.includes('snack') || cat.includes('sweet') || cat.includes('candy') || cat.includes('gum')) {
        return 'Snacks & Sweets Haven';
    }
    if (cat.includes('sauce') || cat.includes('condiment') || cat.includes('oil') || cat.includes('ketchup') || cat.includes('vinegar')) {
        return 'Sauces & Condiments';
    }
    if (cat.includes('breakfast') || cat.includes('cereal') || cat.includes('oat') || cat.includes('muesli')) {
        return 'Breakfast & Cereals';
    }
    if (cat.includes('dairy') || cat.includes('cheese') || cat.includes('butter') || cat.includes('milk') || cat.includes('yogurt')) {
        return 'Dairy & Cheese';
    }
    if (cat.includes('baking') || cat.includes('flour') || cat.includes('yeast') || cat.includes('sugar') || cat.includes('cake mix')) {
        return 'Baking Essentials';
    }
    if (cat.includes('baby') || cat.includes('diaper') || cat.includes('feeder') || cat.includes('lactogen')) {
        return 'Baby Care Imports';
    }
    if (cat.includes('health') || cat.includes('wellness') || cat.includes('supplement') || cat.includes('vitamin') || cat.includes('pain relief') || cat.includes('first aid')) {
        return 'Health & Wellness';
    }
    if (cat.includes('home') || cat.includes('kitchen') || cat.includes('detergent') || cat.includes('cleaner') || cat.includes('dishwash') || cat.includes('tissue')) {
        return 'Home & Kitchen';
    }
    if (cat.includes('gift') || cat.includes('hamper') || cat.includes('box')) {
        return 'Gift Boxes & Hampers';
    }
    if (cat.includes('fruit') || cat.includes('exotic')) {
        return 'Exotic Fruits';
    }

    // Default fallback for everything else
    return 'Grocery and Essentials';
}

async function uploadProducts() {
    try {
        console.log("Reading resolved_products.json...");
        const data = fs.readFileSync('resolved_products.json', 'utf8');
        const products = JSON.parse(data);
        console.log(`Found ${products.length} products to upload.`);

        const chunks = [];
        for (let i = 0; i < products.length; i += 100) {
            chunks.push(products.slice(i, i + 100));
        }

        console.log(`Uploading in ${chunks.length} batches...`);
        let count = 0;

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            const productsRef = collection(db, 'products');

            for (const product of chunk) {
                const scrapedPrice = parseFloat(product.price) || 0;
                product.buyingPrice = scrapedPrice; // PI-BD Cost is the scraped price

                // Fetch existing product for price comparison
                const docId = product.slug || product.id || `prod_${count}`;
                const productsRef = collection(db, 'products');
                const docRef = doc(productsRef, docId);
                const existingDoc = await getDoc(docRef);
                let currentPrice = 0;
                if (existingDoc.exists()) {
                    currentPrice = parseFloat(existingDoc.data().price) || 0;
                }

                // ADMIN PRICE CONTROL: 
                // Only update maximum 15BDT and min 10BDT for products above 1000BDT
                // Keep same price for products below 1000BDT
                let targetPrice = scrapedPrice;
                if (scrapedPrice > 1000) {
                    targetPrice = scrapedPrice + 15; // Applying standard 15 BDT markup
                }

                // NEVER DECREASE RULE
                if (currentPrice > 0 && targetPrice < currentPrice) {
                    product.price = currentPrice; // Stick to higher historical price
                } else {
                    product.price = targetPrice;
                }

                product.originalPrice = parseFloat(product.originalPrice) || product.price;
                product.stock = parseInt(product.stock) || 100;

                // Add productID
                if (!product.productID) {
                    product.productID = `PI-${(product.id || Date.now() + count)}`;
                }

                // FIX TITLES (e.g., L 'Oreal -> L'Oreal)
                if (product.title) {
                    product.title = product.title
                        .replace(/L\s+'Oreal/gi, "L'Oreal")
                        .replace(/L\s+'oreal/gi, "L'Oreal")
                        .replace(/L' Oreal/gi, "L'Oreal")
                        .replace(/L\s*'\s*oreal/gi, "L'Oreal")
                        .trim();
                }

                // FIX DESCRIPTION (Replace competitors)
                if (product.description) {
                    product.description = product.description
                        .replace(/marketdaybd\.com/gi, "primeimportsbd.com")
                        .replace(/marketdaybd/gi, "primeimportsbd")
                        .replace(/chocolateshopbd\.com/gi, "primeimportsbd.com")
                        .replace(/chocolateshopbd/gi, "primeimportsbd");
                }

                // NORMALIZE CATEGORY TO MATCH UI
                product.rawCategory = product.category; // Preserve original
                product.category = normalizeCategory(product.category);
                product.normalizedCategory = product.category;

                const docId = product.slug || product.id || `prod_${count}`;
                const docRef = doc(productsRef, docId);

                batch.set(docRef, product, { merge: true });
                count++;
            }

            await batch.commit();
            console.log(`Committed batch. Total uploaded: ${count} / ${products.length}`);

            // Wait 5 seconds between batches to avoid RESOURCE_EXHAUSTED (very safe)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log("Successfully uploaded and normalized all products in Firestore!");
        process.exit(0);
    } catch (e) {
        console.error("Failed to upload:", e);
        process.exit(1);
    }
}

uploadProducts();
