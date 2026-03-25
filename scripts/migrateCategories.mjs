import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, writeBatch, doc } from "firebase/firestore";
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
const db = getFirestore(app);

// Canonical categories based on src/config/categories.ts
const CATEGORIES = [
  { id: "beverages", name: "Beverages & Drinks", keywords: ["beverage", "drink", "juice", "soda", "water", "cola", "pepsi", "coke", "fanta", "sprite", "red bull", "monster", "prime"] },
  { id: "tea-coffee", name: "Tea & Coffee", keywords: ["tea", "coffee", "latte", "espresso", "cappuccino", "nescafe", "starbucks", "lipton", "matcha", "bean"] },
  { id: "chocolates", name: "Chocolate Bars", keywords: ["chocolate", "choco", "candy", "cocoa", "hershey", "dairy milk", "kitkat", "snickers", "mars", "bounty", "ferrero", "lindt", "kinder", "toblerone"] },
  { id: "biscuits", name: "Biscuits & Cookies", keywords: ["biscuit", "cookie", "cracker", "oreo", "biscoff", "digestive", "mcvities", "lotus"] },
  { id: "snacks", name: "Snacks & Confectionery", keywords: ["snack", "chip", "crisp", "popcorn", "pringles", "lays", "doritos", "confectionery", "sweet", "gummy", "pocky", "pretzel"] },
  { id: "beauty", name: "Cosmetics & Beauty", keywords: ["cosmetic", "beauty", "makeup", "skin", "face", "lotion", "cream", "shampoo", "soap", "body", "care", "perfume", "serum"] },
  { id: "grocery", name: "Grocery and Essentials", keywords: ["grocery", "essential", "oil", "rice", "spice", "salt", "sugar", "flour", "pasta", "noodle", "sauce", "ketchup", "mayo"] },
  { id: "dairy", name: "Dairy & Cheese", keywords: ["dairy", "cheese", "milk", "butter", "yogurt", "cream", "mozzarella", "cheddar"] },
  { id: "baby", name: "Baby Care Imports", keywords: ["baby", "diaper", "wipe", "formula", "pampers", "johnson", "huggies", "cerelac"] },
  { id: "home", name: "Home & Kitchen", keywords: ["home", "kitchen", "cleaning", "detergent", "dish", "towel", "air freshener"] },
  { id: "gifts", name: "Hampers & Gifts", keywords: ["hamper", "gift", "box", "present", "basket"] }
];

function mapCategory(productName, oldCategory) {
  const text = (String(productName || "") + " " + String(oldCategory || "")).toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => text.includes(k))) {
      return cat.id;
    }
  }

  // Fallback map for specific common strings
  if (text.includes("choc")) return "chocolates";
  if (text.includes("drink") || text.includes("bev")) return "beverages";
  if (text.includes("bisc") || text.includes("cook")) return "biscuits";

  return "uncategorized";
}

async function migrate() {
    console.log("🚀 Starting Category Migration (Client SDK)...");
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    console.log(`Starting migration for ${snapshot.docs.length} products...`);

    let batch = writeBatch(db);
    let count = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const newCategoryId = mapCategory(data.name || data.title, data.category);
        
        const matchingCat = CATEGORIES.find(c => c.id === newCategoryId);
        const keywords = matchingCat ? matchingCat.keywords : [];

        batch.update(docSnap.ref, {
            categoryId: newCategoryId,
            categoryKeywords: keywords,
            updatedAt: new Date()
        });

        count++;
        if (count % 450 === 0) { // Safety margin below 500
            await batch.commit();
            console.log(`Updated ${count} products...`);
            batch = writeBatch(db);
        }
    }

    if (count % 450 !== 0) {
        await batch.commit();
    }

    console.log(`✨ Category Migration COMPLETED! Total updated: ${count}`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
