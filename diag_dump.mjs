import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function dump() {
    console.log("Dumping all customerPhone values from orders...");
    const snapshot = await getDocs(collection(db, 'orders'));
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Order: ${doc.id} | Phone: "${data.customerPhone}" | Items: ${data.items?.length || 0}`);
    });

    console.log("\nDumping all member phones...");
    const memberSnap = await getDocs(collection(db, 'goldenCircleApplications'));
    memberSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Member: ${doc.id} | Name: "${data.name}" | Phone: "${data.phone}"`);
    });
}

dump();
