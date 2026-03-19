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

async function deepDiagnose() {
    const targetSuffix = "1614886478";
    console.log(`Searching for orders containing "${targetSuffix}"...`);
    
    const ordersSnap = await getDocs(collection(db, 'orders'));
    let foundOrders = 0;
    ordersSnap.docs.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data);
        if (str.includes(targetSuffix)) {
            foundOrders++;
            console.log(`\n--- MATCHING ORDER: ${doc.id} ---`);
            console.log(JSON.stringify(data, null, 2));
        }
    });
    console.log(`Total matching orders found: ${foundOrders}`);

    console.log(`\nSearching for member data containing "${targetSuffix}"...`);
    const memberSnap = await getDocs(collection(db, 'goldenCircleUsers'));
    memberSnap.docs.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data);
        if (str.includes(targetSuffix) || doc.id.includes(targetSuffix)) {
            console.log(`\n--- MATCHING MEMBER: ${doc.id} ---`);
            console.log(JSON.stringify(data, null, 2));
        }
    });

    const appSnap = await getDocs(collection(db, 'goldenCircleApplications'));
    appSnap.docs.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data);
        if (str.includes(targetSuffix)) {
            console.log(`\n--- MATCHING APPLICATION: ${doc.id} ---`);
            console.log(JSON.stringify(data, null, 2));
        }
    });
}

deepDiagnose();
