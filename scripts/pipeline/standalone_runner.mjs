import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';
import pLimit from 'p-limit'; // Easy concurrency control

dotenv.config();

// Re-use same credentials you already have in workspace
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("Missing service-account.json !");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'prime-imports-bd.firebasestorage.app'
});

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const HUGGINGFACE_TOKENS = [
    process.env.HF_TOKEN // Unified token name
].filter(Boolean);

if (HUGGINGFACE_TOKENS.length === 0) {
    console.error("Missing HF_TOKEN in .env");
    process.exit(1);
}

const LOG_FILE = path.join(process.cwd(), 'scripts', 'pipeline', 'sandbox', 'n8n_upload_log.json');
const BRANDING_SCRIPT = path.join(process.cwd(), 'scripts', 'pipeline', 'branding.mjs');

// Helper to write logs
function logProgress(productId, status, error = null) {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        try {
            logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        } catch (e) { }
    }

    logs.push({
        productId,
        status,
        timestamp: new Date().toISOString(),
        error: error ? error.toString() : null
    });

    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}
// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate Image via HuggingFace with Rate Limit protection
async function generateImage(prompt, attempt = 1) {
    const token = HUGGINGFACE_TOKENS[0]; // Simple single token for now

    // Safety delay to prevent hitting free tier rate limits (approx 30 req/min depending on model)
    // Delaying 2 seconds between every call guarantees we don't bombard it.
    await sleep(2000);

    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                responseType: 'arraybuffer'
            }
        );
        return response.data; // Binary buffer
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn(`[HF Rate Limit] Hit free tier ceiling. Retrying in 30 seconds... (Attempt ${attempt}/3)`);
            if (attempt < 3) {
                await sleep(30000);
                return generateImage(prompt, attempt + 1);
            } else {
                throw new Error("HuggingFace Free Tier Limit Reached permanently for this batch.");
            }
        } else if (error.response && error.response.status === 503) {
            // Model is loading
            const estimatedTime = error.response.data.estimated_time || 10;
            console.warn(`[HF Model Loading] Waiting ${estimatedTime} seconds for model to mount...`);
            await sleep(Math.ceil(estimatedTime * 1000));
            return generateImage(prompt, attempt);
        }

        console.error(`[HF Error] ${error.message}`);
        throw error;
    }
}

// Process a single product
async function processProduct(doc) {
    const product = doc.data();
    const id = doc.id;
    console.log(`[START] Processing ${id}...`);

    try {
        // 1. Skip if already processed in our local log (optional protection)
        let logs = [];
        if (fs.existsSync(LOG_FILE)) logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        if (logs.find(l => l.productId === id && l.status === 'success')) {
            console.log(`[SKIP] ${id} already processed.`);
            return;
        }

        // 2. Generate Prompt & Call HuggingFace
        const prompt = `Professional studio photography, a single package of ${product.title} ${product.brand || ''}, centered, facing forward, pure white background, sharp focus, high resolution 8k, realistic food packaging layout, bright even lighting, e-commerce style`;

        console.log(`[>>] Generating raw image for ${id}...`);
        const rawImageBuffer = await generateImage(prompt);

        const rawPath = path.join(process.cwd(), 'scripts', 'pipeline', 'sandbox', 'tmp_raw.webp');
        const outPath = path.join(process.cwd(), 'scripts', 'pipeline', 'sandbox', `tmp_out_${id}.webp`);

        fs.writeFileSync(rawPath, rawImageBuffer);

        // 3. Pass to Branding Engine
        console.log(`[>>] Applying branding to ${id}...`);
        execSync(`node "${BRANDING_SCRIPT}" "${rawPath}" "${outPath}" catalog`);

        // 4. Upload to Firebase
        console.log(`[>>] Uploading ${id} to Firebase...`);
        const destination = `product-images/${id}/catalog_hf.webp`; // Saved as catalog_hf to not overwrite scraper
        await bucket.upload(outPath + '.webp', {
            destination: destination,
            metadata: { contentType: 'image/webp' }
        });

        // 5. Update Firestore
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destination)}`;

        // Only update if images map is empty or doesn't have a catalog
        let imagesMap = product.images || {};
        imagesMap.ai_catalog = publicUrl; // Save alongside scraped images

        await db.collection('products').doc(id).update({ images: imagesMap });

        console.log(`[SUCCESS] ${id} finished.`);
        logProgress(id, 'success');

        // Cleanup
        fs.unlinkSync(rawPath);
        fs.unlinkSync(outPath + '.webp');

    } catch (error) {
        console.error(`[FAIL] Error processing ${id}:`, error.message);
        logProgress(id, 'failed', error.message);
    }
}

async function startPipeline() {
    console.log("=== STARTING AI IMAGE PIPELINE ===");

    // Fetch products that might need images
    const snapshot = await db.collection('products').limit(5).get(); // Limit 5 for test

    if (snapshot.empty) {
        console.log("No products found.");
        return;
    }

    const limit = pLimit(2); // Process 2 at a time
    const promises = [];

    snapshot.forEach(doc => {
        promises.push(limit(() => processProduct(doc)));
    });

    await Promise.all(promises);
    console.log("=== BATCH COMPLETE ===");
}

startPipeline().catch(console.error);
