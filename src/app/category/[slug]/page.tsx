export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES, getCategoryBySlug } from '@/config/categories';
import { CATEGORY_UI_METADATA, DEFAULT_METADATA } from '@/components/ui/CategoryBoxGrid';
import { RealTimeProductGrid } from '@/components/ui/RealTimeProductGrid';
import { ProductRequestCard } from '@/components/ui/ProductRequestCard';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { Box, Sparkles, ChevronRight, ShoppingBag } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ sort?: string, page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = getCategoryBySlug(slug);
    
    if (category.id === 'uncategorized') {
        return { title: 'Category Not Found | Prime Imports BD' };
    }

    return {
        title: `${category.name} | Premium Global Imports | Prime Imports BD`,
        description: `Browse our curated collection of premium ${category.name.toLowerCase()}. Pure quality, worldwide imports delivered to your doorstep in Bangladesh.`,
    };
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { sort, page: pageStr } = await searchParams;
    const page = parseInt(pageStr || '1');
    
    const category = getCategoryBySlug(slug);

    // If we truly can't find it or it's the uncategorized placeholder, 404
    if (category.id === 'uncategorized' && slug !== 'uncategorized') {
        notFound();
    }

    const ui = CATEGORY_UI_METADATA[category.id] || DEFAULT_METADATA;

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Premium Category Hero */}
            <div className="relative h-[30vh] md:h-[40vh] min-h-[250px] w-full overflow-hidden">
                <Image
                    src={ui.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className={`absolute inset-0 ${ui.overlay} backdrop-blur-[2px]`} />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="h-px w-8 md:w-12 bg-current opacity-30" />
                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${ui.textColor}`}>
                                Premium Collection
                            </span>
                            <div className="h-px w-8 md:w-12 bg-current opacity-30" />
                        </div>
                        <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6 ${ui.textColor}`}>
                            {category.name}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80 decoration-brand-gold-500 underline-offset-4">
                            <Link href="/" className={ui.textColor}>Home</Link>
                            <ChevronRight size={10} className={ui.textColor} />
                            <span className={ui.textColor}>{category.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container-pbd mx-auto max-w-[1320px] px-4 py-8 md:py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-brand-gold-500" />
                            <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">
                                Discover Excellence
                            </h2>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed">
                            Every item in our <span className="text-brand-blue-900 font-bold">{category.name}</span> collection is strictly vetted for authenticity and premium quality.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <SortDropdown />
                    </div>
                </div>

                {/* Product Grid */}
                <RealTimeProductGrid
                    categoryId={category.id}
                    sort={sort}
                    currentPage={page}
                    pageSize={24}
                />

                {/* Suggestions / Empty State logic is handled inside RealTimeProductGrid, 
                    but we can add a persistent request card or related categories below */}
                
                <div className="mt-20 border-t border-slate-100 pt-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black text-brand-blue-900 uppercase tracking-tight">Browse More</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Explore other premium categories</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {CATEGORIES.filter(c => c.featured && c.id !== category.id).slice(0, 5).map(other => (
                                <Link 
                                    key={other.id} 
                                    href={`/category/${other.slug}`}
                                    className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-brand-blue-900 uppercase tracking-widest hover:bg-brand-blue-600 hover:text-white hover:border-brand-blue-600 transition-all active:scale-95 shadow-sm"
                                >
                                    {other.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <ProductRequestCard />
                </div>
            </div>
        </div>
    );
}
