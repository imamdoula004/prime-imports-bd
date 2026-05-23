import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAEf04hZPNYd1AurLk9e3pH-8O2pHwwRl4",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prime-imports-bd.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prime-imports-bd",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prime-imports-bd.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "386718416337",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:386718416337:web:ca43b18f00f3298758b4f0",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MJW0HPRVH2",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the explicit database ID since the old project used it
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)");
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Analytics only in client-side environments
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, db, auth, storage, analytics };
