import sharp from 'sharp';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.join(__dirname, 'remove_bg.py');
const TEMP_DIR = path.join(__dirname, '../../tmp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

export async function standardizeImage(inputBuffer, outputPath) {
    const tempInput = path.join(TEMP_DIR, `in_${Date.now()}.png`);

    try {
        // 1. Try Python Background Removal (rembg)
        console.log(`[PIPELINE] Attempting AI Background Removal...`);
        fs.writeFileSync(tempInput, inputBuffer);

        try {
            const cmd = `python "${PYTHON_SCRIPT}" "${tempInput}" "${outputPath}"`;
            execSync(cmd, { stdio: 'pipe' });
            console.log(`[AI] Background removal successful!`);
            return true;
        } catch (aiError) {
            console.warn(`[AI] Background removal failed, falling back to Sharp:`, aiError.message);
            // Fallback to basic Sharp standardization
        }

        // 2. Fallback: Standardize with Sharp (No background removal, just framing)
        console.log(`[SHARP] Using fallback standardization...`);
        await sharp(inputBuffer)
            .trim()
            .resize({
                width: 1024,
                height: 1024,
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .webp({ quality: 85 })
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error(`[FATAL] Standardization failed:`, error.message);
        return false;
    } finally {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    }
}
