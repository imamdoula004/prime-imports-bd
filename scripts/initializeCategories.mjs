import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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

const CATEGORIES = [
    {
        id: 'beverages',
        name: 'Beverages',
        subcategories: ['Soft Drinks', 'Energy Drinks', 'Juices', 'Coffee', 'Tea', 'Water', 'Mocktails'],
        icon: 'Cup'
    },
    {
        id: 'snacks',
        name: 'Snacks & Confectionery',
        subcategories: ['Chips', 'Chocolates', 'Cookies & biscuits', 'Wafers', 'Candy', 'Nuts & Seeds'],
        icon: 'Candy'
    },
    {
        id: 'cooking',
        name: 'Cooking Needs',
        subcategories: ['Oils', 'Spices', 'Flour', 'Rice', 'Pasta & Noodles', 'Sauces & Condiments', 'Canned Foods'],
        icon: 'Utensils'
    },
    {
        id: 'dairy',
        name: 'Breakfast & Dairy',
        subcategories: ['Milk', 'Butter & Ghee', 'Cheese', 'Yogurt', 'Cereals', 'Jams & Spreads'],
        icon: 'Milk'
    },
    {
        id: 'wellness',
        name: 'Health & Wellness',
        subcategories: ['Vitamins', 'Supplements', 'Personal Care', 'Baby Care', 'Household'],
        icon: 'Heart'
    }
];

async function initCategories() {
    console.log("📂 Initializing Category Registry...");
    try {
        for (const cat of CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), cat);
            console.log(`✅ ${cat.name} initialized.`);
        }
        console.log("✨ Category configuration complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Category Init Failed:", err);
        process.exit(1);
    }
}

initCategories();
