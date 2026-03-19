import fetch from 'node-fetch';

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL_ID = 'stabilityai/stable-diffusion-xl-base-1.0'; // Or any robust Image-to-Image model
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

const MAX_RETRIES = 5;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function enhanceWithHuggingFace(imageBuffer, prompt) {
    if (!HF_TOKEN) {
        console.warn("[HF ENGINE] HF_TOKEN not set. Skipping AI enhancement.");
        return imageBuffer; // Fallback to original
    }

    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            console.log(`[HF ENGINE] Attempt ${attempt + 1}: Calling Hugging Face API...`);
            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: prompt,
                    // Note: Basic Inference API might not strictly support img2img without specific model structures,
                    // but we will send the request. If the free API rejects it or rate limits, we fallback gracefully.
                }),
            });

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                console.log(`[HF ENGINE] Success!`);
                return Buffer.from(arrayBuffer);
            }

            const errorText = await response.text();

            // Handle Rate Limits specifically
            if (response.status === 429) {
                const waitTime = Math.pow(2, attempt) * 5000; // Exponential backoff: 5s, 10s, 20s, 40s
                console.warn(`[HF ENGINE] Rate limited (429). Waiting ${waitTime / 1000} seconds...`);
                await sleep(waitTime);
                attempt++;
                continue;
            }

            // Handle Model Loading
            if (response.status === 503 && errorText.includes('loading')) {
                console.log(`[HF ENGINE] Model is loading. Waiting 15 seconds...`);
                await sleep(15000);
                attempt++;
                continue;
            }

            console.warn(`[HF ENGINE] API Error ${response.status}: ${errorText}. Falling back to local pipeline.`);
            return imageBuffer; // Fallback to local on hard error

        } catch (error) {
            console.error(`[HF ENGINE] Network Error: ${error.message}. Falling back.`);
            return imageBuffer;
        }
    }

    console.warn(`[HF ENGINE] Max retries reached. Falling back to local pipeline.`);
    return imageBuffer;
}
