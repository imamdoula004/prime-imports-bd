import fs from 'fs';
import path from 'path';

export async function getCandidateImages(browser, productName, brand, competitorUrl) {
    const candidates = [];

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 1000 });

        // 1. Try Competitor URL
        if (competitorUrl && (competitorUrl.includes('marketdaybd.com') || competitorUrl.includes('chocolateshopbd.com'))) {
            try {
                // console.log(`[SCRAPER] Navigating to competitor: ${competitorUrl}`);
                await page.goto(competitorUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                const images = await page.evaluate(() => {
                    const imgs = Array.from(document.querySelectorAll('img'));
                    return imgs
                        .map(img => img.src || img.dataset.src || img.dataset.lazySrc)
                        .filter(src => src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('banner'));
                });

                candidates.push(...images);
            } catch (err) {
                // console.warn(`[SCRAPER] Competitor scrape failed for ${competitorUrl}:`, err.message);
            }
        }

        // 2. Search Fallback (Bing High-Res Scrape)
        const query = `${productName} ${brand || ''} product`.trim();
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`;

        try {
            await page.goto(bingUrl, { waitUntil: 'networkidle2', timeout: 20000 });

            const bingMurls = await page.evaluate(() => {
                const results = Array.from(document.querySelectorAll('a.iusc'));
                return results.map(a => {
                    try {
                        const m = JSON.parse(a.getAttribute('m'));
                        return m.murl; // Media URL (High Res)
                    } catch (e) {
                        return null;
                    }
                }).filter(url => url && url.startsWith('http'));
            });

            candidates.push(...bingMurls);
        } catch (e) {
            // console.warn(`[SCRAPER] Bing failed:`, e.message);
        }

        // 3. Google Search (Keep as backup)
        if (candidates.length < 5) {
            const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&hl=en`;
            try {
                await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 20000 });
                const googleImages = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('img'))
                        .map(img => img.src || img.dataset.src || img.dataset.iurl)
                        .filter(src => src && src.startsWith('http') && !src.includes('gstatic.com'));
                });
                candidates.push(...googleImages);
            } catch (e) { }
        }

        await page.close();

    } catch (error) {
        // console.error('[SCRAPER] Global Error:', error);
    }

    return [...new Set(candidates)].slice(0, 20);
}
