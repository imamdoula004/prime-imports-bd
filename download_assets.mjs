import fs from 'fs';
import https from 'https';
import path from 'path';

const files = [
    {
        url: 'https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2Q3NjQwMjI0ZTVhNzQ1ZjM5MjJhZGE0MzEwNmEwYzk4EgsSBxCs_MPGyQYYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDQyMjg1ODMxOTE5MTAwNzEy&filename=&opi=89354086',
        dest: 'stitch_home.html'
    },
    {
        url: 'https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzY0OWI5NzY0OThjNDQ3NWViMzE4M2M5YzJmZGVjNDA1EgsSBxCs_MPGyQYYAZIBIwoKcHJvamVjdF9pZBIVQhMxMDQyMjg1ODMxOTE5MTAwNzEy&filename=&opi=89354086',
        dest: 'stitch_drawer.html'
    },
    {
        url: 'https://lh3.googleusercontent.com/aida/AOfcidW0kT6SK8Epw9UOfIfKvweYoqTOLi47C9WvLoJ0FvtAgahOGcmk0AtjjWwSvWVBSu5dfh0MkFXJKPzeSuxrIaJ8KSMqwZ2KNh700eV1nhXQoLxVBiyoqQf1iDdcIVk-BcFXTAOV-XbmI9s64M0niNkk7oZ44KbImeuCCs6T88eWHOc1m_fZpa0fhx24R1cgsFz4685VI81MUM-ap6E1kyYyfT1wJV3X1DsKFjbJ2iScvyd_4TiMCTI40bxRpKTqmpYFEeKGPbFC8g',
        dest: 'public/brand_logo_new.png'
    }
];

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }

            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function run() {
    for (const file of files) {
        try {
            console.log(`Downloading ${file.url} to ${file.dest}...`);
            await downloadFile(file.url, file.dest);
            console.log(`Successfully downloaded ${file.dest}`);
        } catch (error) {
            console.error(`Failed to download ${file.dest}: ${error.message}`);
        }
    }
}

run();
