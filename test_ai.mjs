import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import axios from 'axios';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
    try {
        const pkgPath = path.resolve(__dirname, 'node_modules/@imgly/background-removal-node/dist/');
        const publicPath = pathToFileURL(pkgPath).href + '/';

        console.log('Testing with publicPath:', publicPath);

        // Fetch a high-res JPEG to test (Coca-Cola is easy to find)
        const sampleUrl = 'https://m.media-amazon.com/images/I/51v8ny97SBL._SL1500_.jpg';
        console.log('Fetching sample:', sampleUrl);
        const response = await axios.get(sampleUrl, { responseType: 'arraybuffer' });
        let buffer = Buffer.from(response.data);

        // PRE-CONVERT TO UNCOMPRESSED PNG TO AVOID DECODING ISSUES IN THE LIBRARY
        console.log('Pre-converting to PNG with Sharp...');
        buffer = await sharp(buffer).png().toBuffer();

        const config = {
            publicPath: publicPath,
            debug: true,
            model: 'small' // Use small model for faster test
        };

        console.log('Calling removeBackground...');
        const resultBlob = await removeBackground(new Uint8Array(buffer), config);
        const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

        fs.writeFileSync('test_output.png', resultBuffer);
        console.log('Success! Output saved to test_output.png');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
