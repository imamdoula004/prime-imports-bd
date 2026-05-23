'use client';

import { motion, useAnimation } from 'framer-motion';
import { Shield, Zap, Lock, Cpu, Globe, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuantumGateProps {
    href: string;
    label: string;
    sublabel?: string;
    icon?: any;
    variant?: 'primary' | 'secondary' | 'danger';
}

export function QuantumGate({ href, label, sublabel, icon: Icon = Key, variant = 'primary' }: QuantumGateProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [encryptionLevel, setEncryptionLevel] = useState(0);

    useEffect(() => {
        if (isHovered) {
            const interval = setInterval(() => {
                setEncryptionLevel(prev => (prev + 1) % 100);
            }, 50);
            return () => clearInterval(interval);
        } else {
            setEncryptionLevel(0);
        }
    }, [isHovered]);

    const colors = {
        primary: {
            border: 'border-brand-gold-400/30',
            bg: 'bg-brand-blue-900/40',
            text: 'text-white',
            accent: 'text-brand-gold-400',
            glow: 'shadow-brand-gold-400/20'
        },
        secondary: {
            border: 'border-blue-400/30',
            bg: 'bg-blue-900/40',
            text: 'text-white',
            accent: 'text-blue-400',
            glow: 'shadow-blue-400/20'
        },
        danger: {
            border: 'border-rose-400/30',
            bg: 'bg-rose-900/40',
            text: 'text-white',
            accent: 'text-rose-400',
            glow: 'shadow-rose-400/20'
        }
    }[variant];

    return (
        <Link href={href} className="block w-full max-w-md mx-auto group">
            <motion.div
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-[2rem] p-8 border ${colors.border} ${colors.bg} backdrop-blur-xl shadow-2xl transition-all duration-300`}
            >
                {/* Background Grid Animation */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] animate-pulse" />
                </div>

                {/* Animated Scanline */}
                <motion.div
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"
                />

                <div className="relative z-20 flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className={`${colors.accent} group-hover:animate-pulse`} size={32} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-black uppercase tracking-[0.1em] ${colors.text}`}>{label}</h3>
                        {sublabel && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sublabel}</p>}
                    </div>

                    {/* Encryption Status Indicator */}
                    <div className="text-right hidden sm:block">
                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${colors.accent}`}>Auth Layer</p>
                        <p className="text-xs font-mono font-bold text-white mt-1">
                            {isHovered ? `0x${encryptionLevel.toString(16).padStart(2, '0')}...` : 'SECURE'}
                        </p>
                    </div>
                </div>

                {/* Quantum Stream Particles (Visible on Hover) */}
                {isHovered && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 400, opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                className={`absolute h-px w-20 bg-gradient-to-r from-transparent via-${colors.accent.split('-')[1]}-400 to-transparent`}
                                style={{ top: `${15 + i * 15}%`, left: '-50px' }}
                            />
                        ))}
                    </div>
                )}

                {/* Encryption Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isHovered ? '100%' : '0%' }}
                        className={`h-full bg-gradient-to-r from-transparent via-${colors.accent.split('-')[1]}-400 to-transparent`}
                    />
                </div>
            </motion.div>
        </Link>
    );
}
