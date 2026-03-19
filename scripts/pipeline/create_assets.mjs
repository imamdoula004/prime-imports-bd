import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'scripts', 'pipeline', 'assets');
const TEMPLATES_DIR = path.join(ASSETS_DIR, 'templates');
const LOGO_SRC = path.join(process.cwd(), 'public', 'brand_logo.png');
const LOGO_DEST = path.join(ASSETS_DIR, 'logo_110px.png');

async function createLogo() {
    if (fs.existsSync(LOGO_SRC)) {
        // Create 110px logo and apply 90% opacity
        const buffer = await sharp(LOGO_SRC)
            .resize({ width: 110 })
            .toBuffer();

        // Ensure channels and change the alpha channel directly
        const { data, info } = await sharp(buffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        for (let i = 3; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.floor(data[i] * 0.9)); // 90% opacity
        }

        await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
            .png()
            .toFile(LOGO_DEST);
        console.log(`Created logo at ${LOGO_DEST}`);
    } else {
        console.error(`Source logo not found at ${LOGO_SRC}`);
    }
}

async function createTemplate(name, color1, color2) {
    const width = 1024;
    const height = 1024;
    const svg = `
        <svg width="${width}" height="${height}">
            <defs>
                <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
                </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad1)" />
            <!-- Soft shadow floor -->
            <ellipse cx="512" cy="800" rx="400" ry="100" fill="black" opacity="0.15" filter="blur(20px)" />
        </svg>
    `;

    const outPath = path.join(TEMPLATES_DIR, `${name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Created template at ${outPath}`);
}

async function main() {
    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
    if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

    await createLogo();

    // Create various category templates
    await createTemplate('default', '#fdfbfb', '#ebedee'); // Soft gray
    await createTemplate('chocolate', '#f6e5d8', '#dfbfa6'); // Warm mocha
    await createTemplate('snacks', '#fff5d7', '#ffda79'); // Bright yellow
    await createTemplate('ramen', '#ffeaa7', '#fab1a0'); // Spicy warm
    await createTemplate('pharmacy', '#e0f7fa', '#b2ebf2'); // Clean cyan
}

main().catch(console.error);
