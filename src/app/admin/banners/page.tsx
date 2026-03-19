'use client';

import { Image as ImageIcon, Play, Upload, Save, Eye, Trash2, Edit3, Smartphone, Monitor } from 'lucide-react';
import { useState } from 'react';

export default function AdminBannersPage() {
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-blue-900 uppercase tracking-tight">Banner Builder</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Hero Slider & Promotions</p>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
                    <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-brand-blue-50 text-brand-blue-600' : 'text-slate-400 hover:text-brand-blue-600'}`}
                    >
                        <Monitor size={16} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-brand-blue-50 text-brand-blue-600' : 'text-slate-400 hover:text-brand-blue-600'}`}
                    >
                        <Smartphone size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                            <ImageIcon size={20} className="text-brand-blue-600" />
                            <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Configuration Panel</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Visuals</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-blue-500 hover:bg-brand-blue-50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-brand-blue-100 transition-colors">
                                        <Upload size={20} className="text-slate-400 group-hover:text-brand-blue-600" />
                                    </div>
                                    <p className="text-sm font-black text-brand-blue-900">Replace Banner Image</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recommended: 1920x1080px</p>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Headline</label>
                                    <input
                                        type="text"
                                        defaultValue="Golden Circle Deals"
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subheadline</label>
                                    <textarea
                                        defaultValue="Exclusive luxury imports at unbeatable prices. Limited time offer."
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-brand-blue-500 resize-none h-24"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Button Text</label>
                                        <input
                                            type="text"
                                            defaultValue="Shop Now"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Button Link</label>
                                        <input
                                            type="text"
                                            defaultValue="/products"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue-900 focus:ring-2 focus:ring-brand-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Slider Settings */}
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Play size={16} className="fill-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-brand-blue-900">Auto-play Slider</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slides change every 5 seconds</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6">
                                <button className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-blue-700 transition-colors shadow-lg shadow-brand-blue-600/20 active:scale-95">
                                    <Save size={16} strokeWidth={3} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-2">
                                <Eye size={20} className="text-brand-blue-600" />
                                <h2 className="text-sm font-black text-brand-blue-900 uppercase tracking-widest">Live Preview</h2>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Published</span>
                        </div>

                        <div className="flex-1 bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                            {/* Simulated Device Frame */}
                            <div className={`transition-all duration-500 ease-in-out relative overflow-hidden bg-[#0A1118] text-white flex items-center justify-center ${previewMode === 'mobile' ? 'w-[320px] h-[568px] rounded-[2rem] border-8 border-slate-800 shadow-2xl' : 'w-full h-full min-h-[400px] rounded-xl'
                                }`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-gold-900/40 to-black/80 z-10"></div>
                                {/* Mock Background Image */}
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opactity-60 scale-105 group-hover:scale-100 transition-transform duration-1000"></div>

                                <div className={`relative z-20 flex flex-col p-8 ${previewMode === 'mobile' ? 'text-center items-center h-full justify-center' : 'w-full max-w-2xl px-12'}`}>
                                    <h2 className={`${previewMode === 'mobile' ? 'text-3xl' : 'text-5xl lg:text-6xl'} font-black text-white tracking-tighter mb-4`}>
                                        Golden Circle Deals
                                    </h2>
                                    <p className={`${previewMode === 'mobile' ? 'text-sm' : 'text-lg'} font-medium text-slate-300 mb-8 max-w-lg leading-relaxed`}>
                                        Exclusive luxury imports at unbeatable prices. Limited time offer.
                                    </p>
                                    <button className="bg-brand-blue-900 text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue-900/20 hover:bg-brand-blue-800 transition-all w-fit">
                                        Shop Now
                                    </button>
                                </div>

                                {/* Slider Pagination Dots */}
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                                    <div className="w-8 h-1.5 rounded-full bg-brand-gold-500"></div>
                                    <div className="w-2 h-1.5 rounded-full bg-white/30"></div>
                                    <div className="w-2 h-1.5 rounded-full bg-white/30"></div>
                                </div>
                            </div>
                        </div>

                        {/* Active Banners List */}
                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Other Active Banners</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-slate-200 rounded-md overflow-hidden bg-[url('https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=200')] bg-cover bg-center"></div>
                                        <div>
                                            <p className="text-xs font-black text-brand-blue-900 tracking-tight">Ramadan Essentials</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ends in 5 days</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-slate-400 hover:text-brand-blue-600 rounded bg-slate-50">
                                            <Edit3 size={12} />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-slate-50">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-slate-200 rounded-md overflow-hidden bg-[url('https://images.unsplash.com/photo-1549488344-c6a65529729c?q=80&w=200')] bg-cover bg-center"></div>
                                        <div>
                                            <p className="text-xs font-black text-brand-blue-900 tracking-tight">New Lindt Arrivals</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">On pause</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-slate-400 hover:text-brand-blue-600 rounded bg-slate-50">
                                            <Edit3 size={12} />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-rose-600 rounded bg-slate-50">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
