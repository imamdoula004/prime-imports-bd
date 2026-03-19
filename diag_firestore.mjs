import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const {
    NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID
} = process.env;

async function checkFirestore() {
    const dbId = "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/${dbId}/documents?key=${NEXT_PUBLIC_FIREBASE_API_KEY}`;

    console.log(`Checking Firestore URL: ${url}`);

    try {
        const response = await fetch(url);
        const text = await response.text();

        try {
            const data = JSON.parse(text);
            if (response.ok) {
                console.log("✅ REST API Success!");
                console.log("Documents Found:", data.documents ? data.documents.length : 0);
            } else {
                console.error("❌ REST API Failed!");
                console.error("Status:", response.status);
                console.error("Error Detail:", JSON.stringify(data, null, 2));
            }
        } catch (e) {
            console.error("❌ Response was not JSON!");
            console.log("Response text start:", text.substring(0, 1000));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

checkFirestore();
