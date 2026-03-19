import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const {
    NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_ID
} = process.env;

async function checkCategories() {
    const dbId = NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/${dbId}/documents/products?key=${NEXT_PUBLIC_FIREBASE_API_KEY}&pageSize=20`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.documents) {
            const categories = new Set();
            data.documents.forEach(doc => {
                const cat = doc.fields?.category?.stringValue;
                if (cat) categories.add(cat);
            });
            console.log("Found Categories in DB:", Array.from(categories));
        } else {
            console.log("No documents found or error:", data);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

checkCategories();
