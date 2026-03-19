const axios = require('axios');
const cheerio = require('cheerio');

async function scout(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        let platform = 'Unknown';
        if (html.includes('wp-content')) platform = 'WordPress/WooCommerce';
        else if (html.includes('shopify')) platform = 'Shopify';

        console.log(`=== ${url} ===`);
        console.log(`Detected Platform: ${platform}`);

        // Let's look for common product link patterns or category links
        const navLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('category') || href.includes('product-category') || href.includes('collections'))) {
                navLinks.push(href);
            }
        });

        console.log(`Category links found: ${new Set(navLinks).size}`);
        console.log([...new Set(navLinks)].slice(0, 5));

    } catch (e) {
        console.error(`Error fetching ${url}:`, e.message);
    }
}

async function run() {
    await scout('https://marketdaybd.com');
    await scout('https://chocolateshopbd.com');
}

run();
