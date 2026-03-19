import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNNER_DIR = path.join(__dirname, 'sandbox', 'runner');

// Ensure runner dir exists
if (!fs.existsSync(RUNNER_DIR)) fs.mkdirSync(RUNNER_DIR, { recursive: true });

export async function processImageLocally(inputPath, productId, category = 'General') {
    console.log(`[LOCAL AI] Starting pipeline for ${productId}...`);

    const cleanPath = path.join(RUNNER_DIR, `${productId}_clean.jpg`);
    const cutoutPath = path.join(RUNNER_DIR, `${productId}_cutout.png`);
    const upscalePath = path.join(RUNNER_DIR, `${productId}_upscaled.png`);

    const outCatalog = path.join(RUNNER_DIR, `${productId}_catalog.webp`);
    const outZoom = path.join(RUNNER_DIR, `${productId}_zoom.webp`);
    const outLifestyle = path.join(RUNNER_DIR, `${productId}_lifestyle.webp`);

    try {
        // 1. Background Removal (U2Net)
        // Bypassing LaMa because it hallucinates/erases product text
        console.log(`[LOCAL AI] 1/2 Removing background... (Skipping Watermark Inpainting to prevent artifacts)`);
        execSync(`python "${path.join(__dirname, 'cutout.py')}" "${inputPath}" "${cutoutPath}"`, { stdio: 'pipe' });

        // Bypassing Real-ESRGAN as GAN upscaling distorts small text. We use Sharp's Lancaster natively inside branding.mjs.

        // 2. Branding Composition (node)
        console.log(`[LOCAL AI] 2/2 Composing Professional Shadows for Catalog, Zoom, and Lifestyle...`);
        execSync(`node "${path.join(__dirname, 'branding.mjs')}" "${cutoutPath}" "${outCatalog}" catalog`, { stdio: 'pipe' });
        execSync(`node "${path.join(__dirname, 'branding.mjs')}" "${cutoutPath}" "${outZoom}" zoom`, { stdio: 'pipe' });
        execSync(`node "${path.join(__dirname, 'branding.mjs')}" "${cutoutPath}" "${outLifestyle}" lifestyle "${category}"`, { stdio: 'pipe' });

        return {
            catalog: outCatalog,
            zoom: outZoom,
            lifestyle: outLifestyle
        };
    } catch (error) {
        console.error(`[LOCAL AI ERROR] Pipeline failed for ${productId}: ${error.message}`);
        return null;
    } finally {
        // Cleanup intermediates to save space
        const intermediates = [cleanPath, cutoutPath, upscalePath];
        intermediates.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    }
}
