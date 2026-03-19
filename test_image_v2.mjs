import { standardizeImage } from './scripts/pipeline/imageStandardizer.mjs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function verify() {
    console.log('--- Verification: New Image Pipeline (rembg) ---');

    const testUrls = [
        'https://m.media-amazon.com/images/I/61NfXpM6S8L._SL1500_.jpg', // Coffee bag
        'https://m.media-amazon.com/images/I/71R2c5v0m6L._SL1500_.jpg', // Nutella
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000' // Simple objects
    ];

    const outputPath = path.resolve('verification_product.webp');

    for (const testUrl of testUrls) {
        try {
            console.log(`\nAttempting: ${testUrl}`);
            const response = await axios.get(testUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const buffer = Buffer.from(response.data);

            console.log('Running standardization (AI Background Removal)...');
            const startTime = Date.now();
            const success = await standardizeImage(buffer, outputPath);
            const endTime = Date.now();

            if (success) {
                console.log(`SUCCESS! Image processed in ${((endTime - startTime) / 1000).toFixed(2)}s`);
                console.log(`Result saved to: ${outputPath}`);
                return; // Stop after first success
            }
        } catch (error) {
            console.error(`Failed with URL ${testUrl}: ${error.message}`);
        }
    }

    console.error('\nALL ATTEMPTS FAILED.');
}

verify();
