import sharp from 'sharp';
import axios from 'axios';

async function fetchImageBuffer(url) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000,
        });
        return Buffer.from(response.data);
    } catch (error) {
        // console.warn(`Failed to fetch image: ${url}`);
        return null;
    }
}

async function checkWhiteBackground(buffer, metadata) {
    try {
        // Heuristic: check corner pixels
        const { width, height } = metadata;
        // Extract a 10x10 patch from top-left corner
        const corner = await sharp(buffer)
            .extract({ left: 0, top: 0, width: Math.min(10, width), height: Math.min(10, height) })
            .stats();

        // Check if corner is mostly white
        const isWhite = corner.channels.every(c => c.mean > 220); // Very light
        return isWhite;
    } catch (error) {
        return false;
    }
}

export async function selectBestImage(candidateUrls) {
    for (const url of candidateUrls) {
        const lowerUrl = url.toLowerCase();

        // Ignore obviously bad URLs or small thumbnails
        if (lowerUrl.includes('logo') || lowerUrl.includes('banner') || lowerUrl.includes('icon')) continue;
        if (lowerUrl.includes('favicon') || lowerUrl.includes('placeholder')) continue;

        const buffer = await fetchImageBuffer(url);
        if (!buffer) continue;

        try {
            const metadata = await sharp(buffer).metadata();

            // Resolution check: we want at least 400px for a decent base, ideally more but let's be realistic
            if (metadata.width < 300 || metadata.height < 300) continue;

            const isWhiteBg = await checkWhiteBackground(buffer, metadata);

            // In precheck/initial phase, if it's white bg and decent size, it's a winner
            if (isWhiteBg) {
                return { url, buffer, metadata, isWhiteBg };
            }

            // If we don't find a white bg one, we might take a non-white one and the standardizer will try to pad it
            // but for now let's stick to searching for white bg. 
        } catch (error) {
            // skip
        }
    }

    // Fallback: if no white bg found, just take the first one that is large enough
    for (const url of candidateUrls) {
        const buffer = await fetchImageBuffer(url);
        if (!buffer) continue;
        try {
            const metadata = await sharp(buffer).metadata();
            if (metadata.width > 400 && metadata.height > 400) {
                return { url, buffer, metadata, isWhiteBg: false };
            }
        } catch (e) { }
    }

    return null;
}
