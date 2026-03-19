import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Load the direct service account file from the corrupted directory
const serviceAccountPath = 'C:\\Users\\Imam Ud Doula\\Desktop\\PrimeImportsBD\\prime-imports-bd-firebase-adminsdk-fbsvc-13a44c67ef.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const targetDb = getFirestore('primeimportsdb');

async function extractProducts() {
    try {
        console.log('Connecting to: primeimportsdb using the old JSON credential...');
        const productsRef = targetDb.collection('products');
        const snapshot = await productsRef.get();
        const products = [];

        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        fs.writeFileSync('resolved_products.json', JSON.stringify(products, null, 2));
        console.log(`[SUCCESS] Extracted ${products.length} products to resolved_products.json!`);
        process.exit(0);
    } catch (error) {
        console.error('Error recovering products:', error);
        process.exit(1);
    }
}

extractProducts();
