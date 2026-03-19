import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Usage: node branding.mjs <input_path> <output_path> <mode> <category_for_lifestyle>
const inputPath = process.argv[2];
const outputPath = process.argv[3];
const mode = process.argv[4] || 'catalog'; // catalog, zoom, lifestyle
const category = process.argv[5] || 'default'; // For lifestyle templates

const LOGO_PATH = path.join(process.cwd(), 'scripts', 'pipeline', 'assets', 'logo_110px.png');
const TEMPLATES_DIR = path.join(process.cwd(), 'scripts', 'pipeline', 'assets', 'templates');

async function processCatalog(image) {
    const metadata = await image.metadata();
    const width = 1024;
    const height = 1024;

    // Create a linear gradient from #F7F7F7 to #FFFFFF
    const gradientSvg = `
        <svg width="${width}" height="${height}">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#F7F7F7;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad1)" />
        </svg>
    `;

    // High-fidelity Lancaster native upscaling to avoid AI text hallucinations
    const productSize = Math.floor(width * 0.82);
    const productBuffer = await image
        .resize({ width: productSize, height: productSize, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
        .toBuffer();

    // Professional studio drop shadow beneath the product
    const shadowSvg = `
        <svg width="${width}" height="${height}">
            <defs>
                <filter id="shadowBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
                </filter>
            </defs>
            <!-- A subtle, wide ellipse acting as a floor shadow -->
            <ellipse cx="${width / 2}" cy="${width / 2 + (productSize / 2) - 15}" rx="${productSize / 2.5}" ry="12" fill="#000000" opacity="0.15" filter="url(#shadowBlur)" />
        </svg>
    `;

    // Composite: Gradient -> Shadow -> Product -> Logo
    let composites = [
        { input: Buffer.from(shadowSvg), gravity: 'center' },
        { input: productBuffer, gravity: 'center' }
    ];

    if (fs.existsSync(LOGO_PATH)) {
        composites.push({ input: LOGO_PATH, gravity: 'southeast' });
    } else {
        console.warn(`[WARNING] Logo not found at ${LOGO_PATH}`);
    }

    return sharp(Buffer.from(gradientSvg))
        .composite(composites)
        .webp({ quality: 90 });
}

async function processZoom(image) {
    // Zoom: Crop tighter and enhance clarity slightly
    const metadata = await image.metadata();

    // We assume the image is centered, so we extract the center 70%
    const extractSize = Math.floor(Math.min(metadata.width, metadata.height) * 0.7);
    const left = Math.floor((metadata.width - extractSize) / 2);
    const top = Math.floor((metadata.height - extractSize) / 2);

    return image
        .extract({ left, top, width: extractSize, height: extractSize })
        .resize(2048, 2048, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 }, kernel: sharp.kernel.lanczos3 })
        .modulate({ brightness: 1.05, saturation: 1.1 }) // Slight enhancement
        .sharpen()
        .webp({ quality: 95 });
}

async function processLifestyle(image) {
    const templatePath = path.join(TEMPLATES_DIR, `${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
    let finalTemplatePath = templatePath;

    if (!fs.existsSync(templatePath)) {
        console.warn(`[WARNING] Template for category '${category}' not found. Using default.`);
        finalTemplatePath = path.join(TEMPLATES_DIR, 'default.png');
    }

    if (!fs.existsSync(finalTemplatePath)) {
        console.warn(`[WARNING] Default template not found. Falling back to catalog mode.`);
        return processCatalog(image);
    }

    const template = sharp(finalTemplatePath);
    const productBuffer = await image
        // Use Lanczos to ensure product remains razor sharp on the template
        .resize({ width: 600, height: 600, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
        .toBuffer();

    // Professional shadow for lifestyle composites
    const shadowSvg = `
        <svg width="1024" height="1024">
            <defs>
                <filter id="lifestyleBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                </filter>
            </defs>
            <ellipse cx="512" cy="${512 + 280}" rx="220" ry="20" fill="#000000" opacity="0.25" filter="url(#lifestyleBlur)" />
        </svg>
    `;

    // Composite product onto template (adjust coordinates as needed per template, centering for now)
    return template
        .composite([
            { input: Buffer.from(shadowSvg), gravity: 'center' },
            { input: productBuffer, gravity: 'center' }
        ])
        .webp({ quality: 90 });
}

async function main() {
    try {
        if (!inputPath || !outputPath) {
            throw new Error('Input and output paths are required.');
        }

        const image = sharp(inputPath);
        let outputImage;

        switch (mode) {
            case 'catalog':
                outputImage = await processCatalog(image);
                break;
            case 'zoom':
                outputImage = await processZoom(image);
                break;
            case 'lifestyle':
                outputImage = await processLifestyle(image);
                break;
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }

        // Ensure output directory exists
        const outDir = path.dirname(outputPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        if (outputPath.endsWith('.webp')) {
            await outputImage.toFile(outputPath);
        } else {
            // Force webp output and append extension
            await outputImage.toFile(outputPath + '.webp');
        }

        console.log(`Successfully generated ${mode} image at ${outputPath}`);
    } catch (error) {
        console.error(`Error processing image: ${error.message}`);
        process.exit(1);
    }
}

main();
