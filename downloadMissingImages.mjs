import fs from 'fs';
import path from 'path';
import https from 'https';

const categories = [
    { name: 'chocolate_bars', url: 'https://images.unsplash.com/photo-1623660053975-cf75a8be0908?auto=format&fit=crop&w=600&q=80' },
    { name: 'baby_care', url: 'https://images.unsplash.com/photo-1721150643106-ac9f24ca84c1?auto=format&fit=crop&w=600&q=80' }
];

const dir = path.join(process.cwd(), 'public', 'category-images');

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

async function main() {
    console.log("Starting missing downloads...");
    for (const cat of categories) {
        const dest = path.join(dir, `${cat.name}.jpg`);
        try {
            await download(cat.url, dest);
            console.log(`Downloaded ${cat.name}.jpg`);
        } catch (e) {
            console.error(`Error downloading ${cat.name}:`, e);
        }
    }
    console.log("Done.");
}

main();
