export interface Product {
    id?: string;
    productID: string; // PI-1001
    sourceURL?: string;
    sourceWebsite?: string;
    name: string; // User requested 'name'
    title?: string; // Keeping title as optional for compatibility if used
    brand?: string;
    image?: string; // High-res image URL from storage
    imageURL?: string; // Fallback / original URL
    images?: {
        catalog?: string;
        zoom?: string;
        lifestyle?: string;
    };
    description: string;
    price: number;
    marketPrice?: number | null; // User requested 'marketPrice'
    oldPrice?: number | null; // Keeping oldPrice as fallback
    originalPrice?: number | null; // Added for compatibility
    category: string;
    subcategory?: string; // New
    productType?: string; // New
    stock: number;
    isActive: boolean; // New
    status: 'active' | 'draft' | 'archived';
    slug: string;
    tags: string[]; // New
    searchKeywords: string[]; // New
    // Merchandising
    totalSales: number;
    weeklySales: number;
    monthlySales: number;
    lastSoldAt?: any;
    // Features
    suggestedWith?: string[]; // Category tags for suggestions
    notifyMeEnabled?: boolean;
    isBundle?: boolean;
    bundleProducts?: string[];
    bundlePrice?: number;
    bundleProductImages?: string[];
    createdAt?: any;
    updatedAt?: any;
    // Admin specific
    buyingPrice?: number | null; // PI-BD Cost
    normalized_title?: string; // New: for exact matching
    aliases?: string[]; // New: for fuzzy search
    weight?: string; // New: for duplicate detection
    size?: string; // New: for metadata
    supplier?: string; // New: for inventory tracking
    origin?: string; // New: for metadata
    gender?: string; // New: for filtering
    deletedAt?: any; // For backup
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id?: string;
    orderId: string;
    customer?: {
        name: string;
        phone: string;
        address: string;
        city?: string;
    };
    customerInfo?: {
        name: string;
        phone: string;
        address: string;
        city?: string;
        zone: 'inside_dhaka' | 'outside_dhaka';
        notes?: string;
    };
    items: {
        id?: string;
        name: string;
        title?: string;
        price: number;
        originalPrice?: number | null;
        marketPrice?: number | null;
        quantity: number;
        image?: string;
        imageURL?: string;
        brand?: string;
        category?: string;
        isBundle?: boolean;
    }[];
    pricing: {
        subtotal: number;
        deliveryFee: number;
        discount: number;
        total: number;
        finalTotal?: number; // Added for compatibility
    };
    // Kept for backward compatibility during transition
    subtotal?: number;
    deliveryCharge?: number;
    total?: number;
    status: 'Pending' | 'Confirmed' | 'Shipped' | 'OutForDelivery' | 'Delivered' | 'Completed' | 'pending' | 'shipped' | 'cancelled';
    statusHistory?: {
        status: string;
        timestamp: any;
    }[];
    delivery?: {
        trackingId?: string;
        service?: 'redx' | 'pathao' | 'steadfast';
        status?: string;
        lastUpdated?: any;
    };
    paymentMethod?: string;
    paymentStatus?: 'pending' | 'verified' | 'failed';
    createdAt: any;
}

export interface Ticket {
    id?: string;
    subject: string;
    customerName: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'open' | 'closed';
    createdAt: any;
    messages: {
        role: 'user' | 'admin';
        text: string;
        timestamp: any;
    }[];
}

export interface GoldenMember {
    id?: string;
    phoneNumber?: string;
    phone?: string; // Fallback
    name?: string;
    fullName?: string; // Fallback
    email?: string;
    joinDate?: any;
    createdAt?: any;
    isActive?: boolean;
    lifetimeSavings?: number;
    totalSpending?: number;
    totalSpent?: number;
    totalPurchases?: number; // New field for stats
    totalSaved?: number;
    address?: string; // New field for shipping
    city?: string; // New field for shipping
    profileImage?: string; // New field for profile picture
    status?: 'active' | 'inactive' | 'suspended';
    notes?: string;
}


export interface Bundle {
    id?: string;
    name: string;
    description?: string;
    products: string[]; // IDs of products included (the documents in 'products' collection)
    bundlePrice: number;
    marketPrice: number; // Regular price sum
    active: boolean;
    priorityScore: number;
    imageURL?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface RequestedItem {
    id?: string;
    title: string;
    brand: string;
    description: string;
    imageUrl: string;
    phone: string;
    customerName?: string;
    status: 'Pending' | 'Reviewed' | 'Sourced' | 'Rejected';
    createdAt: any;
    adminNotes: string;
}

export interface GoldenCircleRequest {
    id?: string;
    phoneNumber: string;
    name: string;
    email?: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: any;
    source: 'manual' | 'checkout';
    orderId?: string; // If from checkout
    orderTotal?: number;
    notes?: string;
}
