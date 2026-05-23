import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        console.log('Starting comprehensive visibility migration via Admin SDK...');
        const productsRef = adminDb.collection('products');
        
        // Fetch all products
        const snapshot = await productsRef.get();
        console.log(`Found ${snapshot.size} total products.`);

        let updateCount = 0;
        let batch = adminDb.batch();
        let batchCount = 0;

        for (const productDoc of snapshot.docs) {
            const data = productDoc.data();
            
            // Logic: 
            // 1. If isDeleted is true, leave it alone (or ensure isActive/status reflect it)
            // 2. If isDeleted is missing or false, ensure it is false AND isActive: true AND status: 'active'
            
            const needsIsDeleted = data.isDeleted === undefined || data.isDeleted === null;
            const needsIsActive = data.isActive === undefined || data.isActive === null;
            const needsStatus = !data.status;
            
            // We only want to "fix" things that aren't explicitly deleted
            if (data.isDeleted !== true) {
                if (needsIsDeleted || needsIsActive || needsStatus) {
                    batch.update(productDoc.ref, {
                        isDeleted: false,
                        isActive: true,
                        status: 'active',
                        updatedAt: new Date()
                    });
                    
                    updateCount++;
                    batchCount++;

                    // Firestore batch limit is 500
                    if (batchCount === 500) {
                        await batch.commit();
                        batch = adminDb.batch();
                        batchCount = 0;
                    }
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Migration complete. Updated ${updateCount} products to be visible.`,
            totalProcessed: snapshot.size
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
