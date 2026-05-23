const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

/**
 * SETUP INSTRUCTIONS:
 * -------------------
 * This script uses the Firebase Admin SDK and requires credentials.
 * 
 * 1. Ensure you have the Firebase CLI installed and are logged in.
 * 2. Run: gcloud auth application-default login
 *    OR 
 *    Download a Service Account JSON from Firebase Console and set:
 *    $env:GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json" (PowerShell)
 *    set GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json (CMD)
 */

// Initialize Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
const db = (dbId && dbId !== '(default)') ? admin.firestore(dbId) : admin.firestore();

/**
 * Recursively removes undefined values from an object to prevent Firestore errors.
 */
function sanitizeForFirestore(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
    }

    const sanitized = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            sanitized[key] = sanitizeForFirestore(obj[key]);
        }
    }
    return sanitized;
}

const CATEGORY_MAP = [
    { id: "beverages", name: "Beverages & Drinks", keywords: ["beverage", "drink", "juice", "soda", "water", "cola", "pepsi", "coke", "fanta", "sprite", "red bull", "monster", "prime", "smoothie", "shake", "tealive", "voss", "schweppes", "a&w", "7 up", "7up"] },
    { id: "tea-coffee", name: "Tea & Coffee", keywords: ["tea", "coffee", "latte", "espresso", "cappuccino", "nescafe", "starbucks", "lipton", "matcha", "bean", "ah huat", "tesco coffee", "tesco tea", "yogi", "tora bika"] },
    { id: "chocolates", name: "Chocolate Bars", keywords: ["chocolate", "choco", "candy", "cocoa", "hershey", "dairy milk", "kitkat", "snickers", "mars", "bounty", "ferrero", "lindt", "kinder", "toblerone", "aero", "reese", "roshen", "toren", "maltesers"] },
    { id: "biscuits", name: "Biscuits & Cookies", keywords: ["biscuit", "cookie", "cracker", "oreo", "biscoff", "digestive", "mcvities", "lotus", "wafer", "tango", "white castle", "zess", "tower gate"] },
    { id: "snacks", name: "Snacks & Confectionery", keywords: ["snack", "chip", "crisp", "popcorn", "pringles", "lays", "doritos", "confectionery", "sweet", "gummy", "pocky", "pretzel", "takis", "marshmallow", "trident", "cheetos", "kurkure"] },
    { id: "beauty", name: "Cosmetics & Beauty", keywords: ["cosmetic", "beauty", "makeup", "skin", "face", "lotion", "cream", "shampoo", "soap", "body", "care", "perfume", "serum", "l'oreal", "moisturizer", "deodorant", "active woman"] },
    { id: "health-wellness", name: "Health & Wellness", keywords: ["health", "wellness", "vitamin", "supplement", "medicine", "sanitizer", "mask", "advil", "actikid", "glutathione", "trunature", "seven seas"] },
    { id: "grocery", name: "Grocery and Essentials", keywords: ["grocery", "essential", "oil", "rice", "spice", "salt", "sugar", "flour", "pasta", "noodle", "sauce", "ketchup", "mayo", "ragu", "agastya", "cardamom", "soy sauce", "mct oil", "vinegar", "honey", "7 bahar"] },
    { id: "dairy", name: "Dairy & Cheese", keywords: ["dairy", "cheese", "milk", "butter", "yogurt", "cream", "mozzarella", "cheddar", "puck", "kiri", "almarai"] },
    { id: "baby", name: "Baby Care Imports", keywords: ["baby", "diaper", "wipe", "formula", "pampers", "johnson", "huggies", "cerelac", "nappy", "breast pump", "similac"] },
    { id: "home", name: "Home & Kitchen", keywords: ["home", "kitchen", "cleaning", "detergent", "dish", "towel", "air freshener", "tide", "finish", "fairy"] },
    { id: "gifts", name: "Hampers & Gifts", keywords: ["hamper", "gift", "box", "present", "basket"] },
];

function determineCategory(product) {
    const textToSearch = `${product.category || ''} ${product.title || ''} ${product.brand || ''}`.toLowerCase();
    for (const cat of CATEGORY_MAP) {
        if (cat.keywords.some(kw => textToSearch.includes(kw.toLowerCase()))) {
            return { id: cat.id, name: cat.name };
        }
    }
    return { id: "grocery", name: "Grocery and Essentials" };
}

function generateSearchKeywords(title, brand, category) {
    const keywords = new Set();
    const fullString = `${title || ''} ${brand || ''} ${category || ''}`.toLowerCase();
    const cleanString = fullString.replace(/[^a-z0-9\s]/g, ' ');
    const words = cleanString.split(/\s+/).filter(w => w.length >= 2);
    words.forEach(word => {
        keywords.add(word);
        for (let i = 3; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });
    return Array.from(keywords);
}

async function uploadProducts() {
    try {
        console.log("Reading resolved_products.json...");
        const data = fs.readFileSync('resolved_products.json', 'utf8');
        const products = JSON.parse(data);
        console.log(`Found ${products.length} products to upload.`);

        // Admin SDK can handle 500 operations per batch
        const chunks = [];
        for (let i = 0; i < products.length; i += 500) {
            chunks.push(products.slice(i, i + 500));
        }

        console.log(`Uploading in ${chunks.length} batches (optimized with db.getAll)...`);
        let globalCount = 0;

        for (const chunk of chunks) {
            const batch = db.batch();
            const productsRef = db.collection('products');
            
            // Map chunk to doc references
            const docRefs = chunk.map((product, index) => {
                const docId = product.slug || product.id || `prod_${globalCount + index}`;
                return productsRef.doc(docId);
            });

            // Bulk fetch existing data for price comparison
            console.log(`Fetching existing data for batch starting at ${globalCount}...`);
            const snapshots = await db.getAll(...docRefs);
            const existingDataMap = new Map();
            snapshots.forEach(snap => {
                if (snap.exists) {
                    existingDataMap.set(snap.id, snap.data());
                }
            });

            chunk.forEach((product, index) => {
                const docRef = docRefs[index];
                const existingData = existingDataMap.get(docRef.id);
                
                const scrapedPrice = parseFloat(product.price) || 0;
                product.buyingPrice = scrapedPrice;

                let currentPrice = 0;
                if (existingData) {
                    currentPrice = parseFloat(existingData.price) || 0;
                }

                // ADMIN PRICE CONTROL
                let targetPrice = scrapedPrice;
                if (scrapedPrice > 1000) {
                    targetPrice = scrapedPrice + 15; 
                }

                // NEVER DECREASE RULE
                if (currentPrice > 0 && targetPrice < currentPrice) {
                    product.price = currentPrice; 
                } else {
                    product.price = targetPrice;
                }

                product.originalPrice = parseFloat(product.originalPrice) || product.price;
                product.stock = parseInt(product.stock) || 100;

                if (!product.productID) {
                    product.productID = `PI-${(product.id || Date.now() + globalCount + index)}`;
                }

                // FIX TITLES
                if (product.title) {
                    product.title = product.title
                        .replace(/L\s+'Oreal/gi, "L'Oreal")
                        .replace(/L\s+'oreal/gi, "L'Oreal")
                        .replace(/L' Oreal/gi, "L'Oreal")
                        .replace(/L\s*'\s*oreal/gi, "L'Oreal")
                        .trim();
                }

                // FIX DESCRIPTION
                if (product.description) {
                    product.description = product.description
                        .replace(/marketdaybd\.com/gi, "primeimportsbd.com")
                        .replace(/marketdaybd/gi, "primeimportsbd")
                        .replace(/chocolateshopbd\.com/gi, "primeimportsbd.com")
                        .replace(/chocolateshopbd/gi, "primeimportsbd");
                }

                // NORMALIZE CATEGORY & GENERATE KEYWORDS
                const { id: categoryId, name: categoryName } = determineCategory(product);
                product.categoryId = categoryId;
                product.category = categoryName;
                product.normalizedCategory = categoryName;
                product.searchKeywords = generateSearchKeywords(product.title, product.brand, categoryName);
                product.lowercaseTitle = (product.title || '').toLowerCase();
                product.isDeleted = false;
                product.isActive = true;
                
                // Use Server Timestamps
                product.createdAt = existingData ? (existingData.createdAt || admin.firestore.FieldValue.serverTimestamp()) : admin.firestore.FieldValue.serverTimestamp();
                product.updatedAt = admin.firestore.FieldValue.serverTimestamp();

                // Sanitize and add to batch
                const sanitizedProduct = sanitizeForFirestore(product);
                batch.set(docRef, sanitizedProduct, { merge: true });
            });

            await batch.commit();
            globalCount += chunk.length;
            console.log(`Committed batch. Total processed: ${globalCount} / ${products.length}`);

            // Small delay to prevent hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("Successfully uploaded and normalized all products in Firestore!");
        process.exit(0);
    } catch (e) {
        console.error("Failed to upload:", e);
        process.exit(1);
    }
}


uploadProducts();

