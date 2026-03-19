import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, or } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnose() {
    console.log("Checking orders for potential matches...");
    const snapshot = await getDocs(collection(db, 'orders'));
    console.log(`Total orders found: ${snapshot.size}`);
    
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Log all phones if they have anything resembling the suffix
        if (data.customerPhone?.includes("4886478") || data.customerPhone?.includes("161488")) {
            console.log(`FOUND ORDER: ${doc.id}`);
            console.log(`Stored Phone: "${data.customerPhone}"`);
            console.log(`Stored Email: "${data.customerEmail}"`);
        }
    });

    console.log("\nChecking member data...");
    const memberSnap = await getDocs(collection(db, 'goldenCircleApplications'));
    memberSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.phone?.includes("4886478") || doc.id.includes("4886478")) {
            console.log(`FOUND MEMBER: ${doc.id}`);
            console.log(`Stored Phone: "${data.phone}"`);
            console.log(`Stored Email: "${data.email}"`);
        }
    });
}

diagnose();
