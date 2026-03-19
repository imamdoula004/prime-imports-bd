import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { ProductRequestCard } from '../ui/ProductRequestCard';
import { usePathname } from 'next/navigation';
import { useFilterStore } from '@/store/useFilterStore';

export function Footer() {
    const pathname = usePathname();
    
    const { requestCardVisible } = useFilterStore();
    
    // Condition to show ProductRequestCard only on specific pages:
    // 1. Homepage ("/")
    // 2. Product Detail Page ("/products/...")
    // 3. Category Page ("/category/...")
    const showRequestCard = 
        !requestCardVisible && (
            pathname === '/' || 
            pathname.startsWith('/products/') || 
            pathname.startsWith('/category/')
        );

    return (
        <footer className="bg-white text-slate-600 pb-12 md:pb-8 border-t border-slate-100">
            {showRequestCard && (
                <div className="pt-20">
                    <ProductRequestCard />
                </div>
            )}
            <div className="container mx-auto px-4 md:px-8 lg:px-16 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    <div className="md:col-span-1">
                        <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2 mb-4">
                            <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0">
                                <Image
                                    src="/brand_logo.jpeg"
                                    alt="Prime Imports BD Logo"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <span className="text-brand-blue-600">PRIME</span> <span className="text-brand-gold-500">IMPORTS</span> <span className="text-brand-blue-600">BD</span>
                        </Link>
                        <p className="text-slate-500 font-medium leading-relaxed text-sm mb-4">
                            Curating the world's finest chocolates, premium snacks, global beverages, and luxury cosmetics. Delivered with speed and care.
                        </p>
                        <div className="flex items-center gap-2">
                            <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:bg-brand-blue-600 hover:text-white transition-all duration-200 shadow-sm"><Facebook size={18} /></a>
                            <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:bg-brand-blue-600 hover:text-white transition-all duration-200 shadow-sm"><Instagram size={18} /></a>
                            <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:bg-brand-blue-600 hover:text-white transition-all duration-200 shadow-sm"><Twitter size={18} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-brand-blue-900 font-black mb-4 uppercase tracking-widest text-xs">Premium Selection</h4>
                        <ul className="space-y-3 text-sm font-bold">
                            <li><Link href="/products?category=Chocolate Bars" className="hover:text-brand-blue-600 transition-colors">Chocolate Bars</Link></li>
                            <li><Link href="/products?category=Beverages & Drinks" className="hover:text-brand-blue-600 transition-colors">Beverages & Drinks</Link></li>
                            <li><Link href="/products?category=Tea & Coffee" className="hover:text-brand-blue-600 transition-colors">Tea & Coffee</Link></li>
                            <li><Link href="/products?category=Cosmetics & Beauty" className="hover:text-brand-blue-600 transition-colors">Cosmetics & Beauty</Link></li>
                            <li><Link href="/products" className="text-brand-blue-600 font-black flex items-center gap-1 group">Shop All <span className="group-hover:translate-x-1 transition-transform">→</span></Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-brand-blue-900 font-black mb-4 uppercase tracking-widest text-xs">Customer Service</h4>
                        <ul className="space-y-3 text-sm font-bold">
                            <li><Link href="/contact" className="hover:text-brand-blue-600 transition-colors">Contact Us</Link></li>
                            <li><Link href="/shipping" className="hover:text-brand-blue-600 transition-colors">Shipping & Delivery</Link></li>
                            <li><Link href="/returns" className="hover:text-brand-blue-600 transition-colors">Returns & Refunds</Link></li>
                            <li><Link href="/authenticity" className="hover:text-brand-blue-600 transition-colors">Authenticity Guarantee</Link></li>
                            <li><Link href="/faqs" className="hover:text-brand-blue-600 transition-colors">Common FAQs</Link></li>
                            <li><Link href="/request-product" className="hover:text-brand-blue-600 transition-colors text-brand-blue-600">Can&apos;t find an item? Request Product</Link></li>
                        </ul>
                    </div>

                    <div className="bg-brand-blue-50/50 p-5 rounded-2xl border border-brand-blue-100">
                        <h4 className="text-brand-blue-900 font-black mb-3 uppercase tracking-widest text-xs">Golden Circle Rewards</h4>
                        <p className="text-sm font-bold text-slate-600 mb-4 leading-relaxed">Join 5,000+ members saving 3% on every premium import order.</p>
                        <Link href="/golden-circle" className="flex items-center justify-center w-full bg-brand-blue-600 text-white px-4 py-3 rounded-xl font-black hover:bg-brand-blue-700 transition-all shadow-lg active:scale-[0.98] text-xs uppercase tracking-widest">
                            Join the Club
                        </Link>
                    </div>

                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                        <p className="text-xs font-black text-brand-blue-900">© {new Date().getFullYear()} Prime Imports BD. Luxury Imported Goods.</p>
                        <p className="text-[10px] font-black text-brand-blue-900/80 uppercase tracking-widest">Curated with excellence. Worldwide Imports.</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3">
                        <div className="flex items-center gap-3 transition-all duration-500 w-full max-w-[600px] mt-2">
                            <div className="relative w-full flex justify-center md:justify-end">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-05.png"
                                    alt="SSL Secured Payments - Visa, Mastercard, bKash, Nagad"
                                    className="object-contain w-full max-w-[350px] md:max-w-[600px] h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Link href="/privacy" className="hover:text-brand-blue-600 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-brand-blue-600 transition-colors">Terms</Link>
                            <Link href="/contact" className="hover:text-brand-blue-600 transition-colors">Support</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
