const axios = require('axios');

async function checkApi(url) {
    console.log(`\n--- Checking API for ${url} ---`);
    const endpoints = [
        `${url}/wp-json/wc/store/products?per_page=1`,
        `${url}/wp-json/wp/v2/product?per_page=1`
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying ${endpoint}...`);
            const res = await axios.get(endpoint, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000
            });
            if (res.data && Array.isArray(res.data)) {
                console.log(`SUCCESS! Found ${res.data.length} items at ${endpoint}`);
                if (res.data.length > 0) {
                    console.log(`Sample item title: ${res.data[0].name || res.data[0].title?.rendered}`);
                    console.log(`Sample price: ${res.data[0].prices?.price || res.data[0].price}`);
                }
                return; // Found a working endpoint!
            }
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
    }
    console.log(`No public standard API found for ${url}.`);
}

async function run() {
    await checkApi('https://marketdaybd.com');
    await checkApi('https://chocolateshopbd.com');
}

run();
