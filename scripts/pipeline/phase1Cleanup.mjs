import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const serviceAccountPath = 'C:\\Users\\Imam Ud Doula\\Desktop\\PrimeImportsBD\\prime-imports-bd-firebase-adminsdk-fbsvc-13a44c67ef.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = getFirestore();

function decodeEntities(text) {
    if (!text) return '';
    return text
        .replace(/&#8217;/g, "'")
        .replace(/&#8211;/g, '-')
        .replace(/&#038;/g, '&')
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8216;/g, "'")
        .replace(/&amp;/g, '&');
}

async function runCleanup() {
    console.log('Starting Phase 1 Cleanup...');
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    const products = [];
    snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${products.length} products.`);

    const updates = [];
    const duplicateMap = new Map();

    for (const product of products) {
        let name = product.productName || product.name || '';
        let description = product.description || '';
        let price = Number(product.price) || 0;

        // 1. Fix Titles
        const newName = decodeEntities(name).trim();

        // 2. Sanitize Descriptions
        let newDescription = decodeEntities(description)
            .replace(/marketdaybd\.com/gi, 'primeimportsbd.com')
            .replace(/chocolateshopbd\.com/gi, 'primeimportsbd.com')
            .replace(/marketdaybd/gi, 'PrimeImportsBD')
            .replace(/chocolateshopbd/gi, 'PrimeImportsBD')
            .replace(/Chocolate Shop Bangladesh/gi, 'PrimeImportsBD');

        // 3. Deduplication Logic
        const normalizedName = newName.toLowerCase().replace(/\s+/g, ' ');
        if (!duplicateMap.has(normalizedName)) {
            duplicateMap.set(normalizedName, { id: product.id, price: price, name: newName, description: newDescription });
        } else {
            const existing = duplicateMap.get(normalizedName);
            if (price > existing.price) {
                // Current is higher price, keep this one and mark old for deletion
                updates.push({ id: existing.id, action: 'delete' });
                duplicateMap.set(normalizedName, { id: product.id, price: price, name: newName, description: newDescription });
            } else {
                // Current is lower or equal, mark current for deletion
                updates.push({ id: product.id, action: 'delete' });
                continue; // Skip update for this doc as it will be deleted
            }
        }

        // Check if update is needed
        if (newName !== name || newDescription !== description) {
            updates.push({
                id: product.id,
                action: 'update',
                data: {
                    productName: newName,
                    name: newName,
                    description: newDescription,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            });
        }
    }

    console.log(`Planned ${updates.filter(u => u.action === 'update').length} updates and ${updates.filter(u => u.action === 'delete').length} deletions.`);

    // Execute in batches
    const batchSize = 400;
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = db.batch();
        const currentBatch = updates.slice(i, i + batchSize);

        for (const op of currentBatch) {
            const ref = productsRef.doc(op.id);
            if (op.action === 'update') {
                batch.update(ref, op.data);
            } else if (op.action === 'delete') {
                // Instead of hard delete, move to recently deleted or just delete as requested
                // User said: "Removing from admin keeps a backup in admin side saying 'Recently Deleted'"
                // For deduplication, we might want to just delete or move them.
                // Let's move them to 'deleted_products' collection.
                const productData = products.find(p => p.id === op.id);
                const deletedRef = db.collection('deleted_products').doc(op.id);
                batch.set(deletedRef, { ...productData, deletedAt: admin.firestore.FieldValue.serverTimestamp(), reason: 'duplicate' });
                batch.delete(ref);
            }
        }

        await batch.commit();
        console.log(`Committed batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log('Phase 1 Cleanup Completed.');
}

runCleanup().catch(console.error);
