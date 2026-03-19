const axios = require('axios');
const fs = require('fs');

function generateSlug(text) {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

async function fetchProducts(domain, websiteName, limit = 5000) {
    let allProducts = [];
    let page = 1;
    const perPage = 100; // Increased per_page for speed

    console.log(`\n=== Fetching from ${domain} ===`);

    while (allProducts.length < limit) {
        try {
            const url = `https://${domain}/wp-json/wc/store/products?per_page=${perPage}&page=${page}`;
            console.log(`GET ${url} (Total: ${allProducts.length})`);

            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
                timeout: 15000
            });
            const items = res.data;

            if (!items || items.length === 0) {
                console.log(`No more items found on page ${page}.`);
                break;
            }

            for (const item of items) {
                const minorUnit = item.prices?.currency_minor_unit || 0;
                const rawPrice = parseInt(item.prices?.price || 0, 10);
                const rawRegularPrice = parseInt(item.prices?.regular_price || 0, 10);

                const factor = Math.pow(10, minorUnit);
                const price = rawPrice / factor;
                const originalPrice = rawRegularPrice / factor;

                let categoryStr = item.categories && item.categories.length > 0
                    ? item.categories[0].name
                    : 'General';

                const product = {
                    id: item.id.toString(),
                    title: item.name || '',
                    subtitle: '',
                    description: stripHtml(item.description || item.short_description || ''),
                    price: price,
                    originalPrice: originalPrice > price ? originalPrice : price,
                    category: categoryStr,
                    normalizedCategory: categoryStr,
                    stock: item.is_in_stock ? 100 : 0,
                    statusLabel: item.is_in_stock ? "In Stock" : "Out of Stock",
                    sourceURL: item.permalink || `https://${domain}`,
                    sourceWebsite: websiteName,
                    slug: generateSlug(item.name || ''),
                    lowercaseTitle: (item.name || '').toLowerCase()
                };

                allProducts.push(product);
                if (allProducts.length >= limit) break;
            }

            // Check headers for total pages if available
            const totalPages = parseInt(res.headers['x-wp-totalpages'], 10);
            if (totalPages && page >= totalPages) {
                console.log(`Reached last page (${totalPages}).`);
                break;
            }

            page++;
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log("Reached end of pages (400 error).");
            } else {
                console.log(`Error fetching page ${page}: ${e.message}`);
            }
            break;
        }
    }

    console.log(`Fetched ${allProducts.length} from ${domain}.`);
    return allProducts;
}

async function run() {
    try {
        console.log("Starting full WooCommerce Extraction...");
        // marketdaybd.com has ~2700 products
        const marketDayProducts = await fetchProducts('marketdaybd.com', 'MarketDay BD', 4000);
        // chocolateshopbd.com has 500+
        const chocolateShopProducts = await fetchProducts('chocolateshopbd.com', 'Chocolate Shop BD', 2000);

        const combined = [...marketDayProducts, ...chocolateShopProducts];

        // Remove exact duplicates by Title
        const unique = [];
        const seen = new Set();
        for (const p of combined) {
            if (!seen.has(p.lowercaseTitle)) {
                seen.add(p.lowercaseTitle);
                unique.push(p);
            }
        }

        fs.writeFileSync('resolved_products.json', JSON.stringify(unique, null, 2));
        console.log(`\n[SUCCESS] Extracted ${unique.length} unique products to resolved_products.json!`);
    } catch (e) {
        console.error("Critical Failure:", e);
    }
}

run();
