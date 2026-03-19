import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'C:\\Users\\Imam Ud Doula\\Desktop\\PrimeImportsBD\\prime-imports-bd-firebase-adminsdk-fbsvc-13a44c67ef.json';

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore();

async function checkStatus() {
    const productsRef = db.collection('products');

    const totalSnapshot = await productsRef.count().get();
    const total = totalSnapshot.data().count;

    const completedSnapshot = await productsRef.where('processingStatus', '==', 'COMPLETED').count().get();
    const completed = completedSnapshot.data().count;

    console.log(`--- Image Pipeline Status ---`);
    console.log(`Total Products: ${total}`);
    console.log(`Completed: ${completed}`);
    console.log(`Remaining: ${total - completed}`);

    // Check some sample incomplete products
    const incompleteSample = await productsRef.where('processingStatus', '!=', 'COMPLETED').limit(5).get();
    console.log(`\nSample Incomplete Products:`);
    incompleteSample.forEach(doc => {
        console.log(`- ${doc.id}: ${doc.data().productName || doc.data().name || doc.data().title}`);
    });

    process.exit(0);
}

checkStatus();
