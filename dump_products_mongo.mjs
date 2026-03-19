import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use the exact MongoDB compatibility string provided in process.env
const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('<username>')) {
    console.error('[ERROR] MONGODB_URI is not set properly. Please update .env.local with your <username> and <password>.');
    process.exit(1);
}

const client = new MongoClient(uri);

async function extractProducts() {
    try {
        console.log('Connecting to Firestore via MongoDB Compatibility layer...');
        await client.connect();

        // Connect to the specific database 'primeimportsdb'
        const db = client.db('primeimportsdb');
        const productsCollection = db.collection('products');

        console.log('Fetching products...');
        const snapshot = await productsCollection.find({}).toArray();

        // MongoDB uses _id instead of id natively, we map it for our Next.js frontend
        const products = snapshot.map(doc => {
            const { _id, ...rest } = doc;
            return { id: _id.toString(), ...rest };
        });

        fs.writeFileSync('resolved_products.json', JSON.stringify(products, null, 2));
        console.log(`[SUCCESS] Extracted ${products.length} products to resolved_products.json!`);
        process.exit(0);
    } catch (error) {
        console.error('Error recovering products via MongoDB connection:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

extractProducts();
