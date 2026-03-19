import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

// Pipeline steps
import { getCandidateImages } from './imageScraper.mjs';
import { selectBestImage } from './imageSelector.mjs';
import { processImageLocally } from './run_local_ai.mjs';
import { uploadToFirebase } from './firebaseUploader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(projectRoot, '.env.local') });

const SERVICE_ACCOUNT_PATH = 'C:\\Users\\Imam Ud Doula\\Desktop\\PrimeImportsBD\\prime-imports-bd-firebase-adminsdk-fbsvc-13a44c67ef.json';
const SANDBOX_DIR = path.join(__dirname, 'sandbox');
const PRECHECK_DIR = path.join(SANDBOX_DIR, 'precheck');
const FINAL_DIR = path.join(SANDBOX_DIR, 'final');
const TEMP_DIR = path.join(__dirname, 'sandbox', 'downloads');
const LOG_FILE = path.join(__dirname, 'image_pipeline_log.txt');

// Ensure directories exist
[SANDBOX_DIR, PRECHECK_DIR, FINAL_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'prime-imports-bd.firebasestorage.app'
    });
}

const db = getFirestore();

function log(message) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMsg);
}

async function processProduct(browser, product, isPrecheck = false) {
    const productId = product.id;
    const productName = product.productName || product.name || product.title;
    const brand = product.brand || '';
    const category = product.category || 'General';
    const competitorUrl = product.competitorUrl || product.sourceURL || '';

    log(`Processing Product: ${productId} - ${productName}`);

    try {
        // 0. Clean and normalize name for better image discovery
        const cleanName = productName
            .replace(/&amp;/g, '&')
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Fix entities like 8217
            .replace(/[^\w\s\-,]/g, '') // Remove weird chars
            .replace(/-/g, ' ') // Replace hyphens with spaces for better NLP matching
            .replace(/\s+/g, ' ') // Deduplicate spaces
            .trim();

        log(`[INFO] Searching for: "${cleanName}" (Original: ${productName})`);

        // 1. Scrape Candidates
        const candidates = await getCandidateImages(browser, cleanName, (brand === 'Prime' ? '' : brand), competitorUrl);
        if (!candidates.length) {
            log(`[FAIL] No candidate images found for ${productId}`);
            return { productId, status: 'NO_CANDIDATES' };
        }

        // 2. Select Best
        const bestImage = await selectBestImage(candidates);
        if (!bestImage) {
            log(`[FAIL] No suitable image selected for ${productId}`);
            return { productId, status: 'NO_SUITABLE_IMAGE' };
        }

        // 3. Save reference image locally for the Python pipeline
        const rawImagePath = path.join(TEMP_DIR, `${productId}_raw.jpg`);
        fs.writeFileSync(rawImagePath, bestImage.buffer);

        // 4. Run native Python/JS AI Pipeline (clean, cutout, upscale, brand)
        log(`[INFO] Sending ${productId} through robust AI local pipeline...`);
        const finalVariants = await processImageLocally(rawImagePath, productId, category);

        if (!finalVariants) {
            log(`[FAIL] Local AI generation failed for ${productId}`);
            if (fs.existsSync(rawImagePath)) fs.unlinkSync(rawImagePath);
            return { productId, status: 'PIPELINE_FAILED' };
        }

        // Cleanup raw image
        if (fs.existsSync(rawImagePath)) fs.unlinkSync(rawImagePath);

        // 5. Upload to Firebase
        if (!isPrecheck) {
            log(`[INFO] Uploading variants to Firebase for ${productId}...`);
            const publicUrls = await uploadToFirebase(productId, finalVariants);

            if (publicUrls && publicUrls.catalog) {
                // UPDATE FIRESTORE is handled in firebaseUploader, but we log the success here
                log(`[SUCCESS] Fully processed and uploaded 3 variants for ${productId}`);
            } else {
                log(`[FAIL] Firebase upload failed for ${productId}`);
            }
        } else {
            log(`[PREVIEW] Product ${productId} AI pipeline completed to sandbox.`);
        }

        return {
            productId,
            status: 'SUCCESS'
        };

    } catch (error) {
        log(`[ERROR] Processing ${productId}: ${error.message}`);
        return { productId, status: 'ERROR', error: error.message };
    }
}

async function run() {
    const args = process.argv.slice(2);
    const isPrecheck = args.includes('--precheck');
    const isFull = args.includes('--full');

    if (!isPrecheck && !isFull) {
        console.log('Usage: node orchestrator.mjs [--precheck | --full]');
        process.exit(1);
    }

    log(`Starting Robust Hybrid Image Pipeline (Mode: ${isPrecheck ? 'PRECHECK' : 'FULL'})`);

    let browser;
    try {
        // Shared Browser Instance
        const profileDir = path.join(SANDBOX_DIR, 'puppeteer_profile');
        if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

        browser = await puppeteer.launch({
            headless: "new",
            userDataDir: profileDir, // Fix EBUSY on Windows by using persistent profile
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const productsRef = db.collection('products');
        let snapshot;

        if (isPrecheck) {
            snapshot = await productsRef.limit(5).get(); // Changed to 5 for precheck
        } else {
            snapshot = await productsRef.where('processingStatus', '!=', 'COMPLETED').get();
            if (snapshot.empty) {
                snapshot = await productsRef.get();
            }
        }

        const products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Skip already completed products to avoid an endless loop
            if (!isPrecheck && data.processingStatus === 'COMPLETED') return;
            products.push({ id: doc.id, ...data });
        });

        log(`Found ${products.length} products to map in queue.`);

        // Limit completely native pipeline to 3 concurrent tasks to maintain stable laptop thermals 
        // given heavy use of LaMa/U2Net PyTorch models
        const concurrency = isPrecheck ? 1 : 3;
        const limit = pLimit(concurrency);

        const tasks = products.map((product) => limit(() => processProduct(browser, product, isPrecheck)));

        log(`Queue executing at concurrency=${concurrency}...`);
        const results = await Promise.all(tasks);

        const successCount = results.filter(r => r && r.status === 'SUCCESS').length;
        log(`Pipeline execution finished. Success: ${successCount}/${products.length}`);

        if (isPrecheck) {
            log('Precheck complete. Review sandbox paths.');
        }

    } catch (error) {
        log(`[CRITICAL] Pipeline crashed: ${error.message}`);
    } finally {
        if (browser) await browser.close();
    }
}

run();
