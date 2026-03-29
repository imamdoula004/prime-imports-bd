export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';
import type { Product } from '@/types';
import { notFound } from 'next/navigation';

function sanitizeProduct(doc: any): Product {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        lastSoldAt: data.lastSoldAt?.toDate?.()?.toISOString() || null,
        price: Number(data.price || 0),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.marketPrice ? Number(data.marketPrice) : null),
        stock: Number(data.stock || 0),
    } as Product;
}

async function getProductData(slugOrId: string) {
    try {
        const productsRef = collection(db, 'products');
        let currentProduct: Product | null = null;

        // 1. Get Current
        const docRef = doc(db, 'products', slugOrId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isDeleted) return null; // Prevent viewing deleted products
            currentProduct = sanitizeProduct(docSnap);
        } else {
            const q = query(productsRef, where('slug', '==', slugOrId), where('isDeleted', '==', false), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) currentProduct = sanitizeProduct(querySnapshot.docs[0]);
        }

        if (!currentProduct) return null;

        // 2. Fetch Discovery Layers Defensively
        const fetchSimilar = async () => {
            if (!currentProduct?.category) return [];
            try {
                const q = query(productsRef, where('category', '==', currentProduct.category), where('isDeleted', '==', false), limit(12));
                const snap = await getDocs(q);
                if (!snap.empty) return snap.docs.map(sanitizeProduct);
                const fallback = await getDocs(query(productsRef, where('isDeleted', '==', false), limit(12)));
                return fallback.docs.map(sanitizeProduct);
            } catch (e) {
                const fallback = await getDocs(query(productsRef, where('isDeleted', '==', false), limit(12)));
                return fallback.docs.map(sanitizeProduct);
            }
        };

        const [similar, popular, trending] = await Promise.all([
            fetchSimilar(),
            getDocs(query(productsRef, where('isDeleted', '==', false), limit(12))).then(s => s.docs.map(sanitizeProduct)).catch(() => []),
            getDocs(query(productsRef, where('isDeleted', '==', false), limit(12))).then(s => s.docs.map(sanitizeProduct)).catch(() => [])
        ]);

        return {
            product: currentProduct,
            similar: similar.filter(p => p.id !== currentProduct?.id),
            popular: popular.filter(p => p.id !== currentProduct?.id),
            trending: trending.filter(p => p.id !== currentProduct?.id)
        };
    } catch (error) {
        console.error("Failed to load product data", error);
        return null;
    }
}

import { ProductDetailClient } from '@/components/product/ProductDetailClient';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getProductData(slug);

    if (!data) notFound();
    const { product, similar, popular, trending } = data;

    return (
        <ProductDetailClient
            initialProduct={product}
            similar={similar}
            popular={popular}
            trending={trending}
        />
    );
}
