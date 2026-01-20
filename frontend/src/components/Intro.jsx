import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Intro({ onComplete }) {
    useEffect(() => {
        // Stage 1: Draw lines (0-1.5s)
        // Stage 2: Fill & Glow (1.5-2.5s)
        // Stage 3: Scan (2.5-3.5s)
        // Stage 4: Unlock/Exit (3.5-4.5s)
        const timer = setTimeout(() => {
            onComplete();
        }, 4500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B14] overflow-hidden perspective-1000">
            {/* Cinematic Background Grid & Fog */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(32,156,233,0.1)_0%,_transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

                {/* Animated Grid Floor */}
                <motion.div
                    initial={{ opacity: 0, rotateX: 60, scale: 2 }}
                    animate={{ opacity: 0.2, rotateX: 60, scale: 2, y: [0, 50] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-50%] w-[200%] h-[100%] left-[-50%] border-t border-nano-blue/30"
                    style={{
                        backgroundImage: 'linear-gradient(to right, rgba(32,156,233,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(32,156,233,0.1) 1px, transparent 1px)',
                        backgroundSize: '100px 100px'
                    }}
                />

                {/* Floating Particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight, opacity: 0 }}
                        animate={{ y: -100, opacity: [0, 0.5, 0] }}
                        transition={{ duration: Math.random() * 5 + 5, delay: Math.random() * 2, repeat: Infinity }}
                        className="absolute w-1 h-1 bg-nano-blue rounded-full blur-[1px]"
                    />
                ))}
            </div>

            {/* The Unbreakable Lock/Shield Container */}
            <motion.div
                layoutId="shared-lock-element"
                className="relative z-10 flex flex-col items-center justify-center p-12"
            >
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Spinning Cyber Rings */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-20px] rounded-full border border-dashed border-nano-blue/20"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-40px] rounded-full border border-dotted border-nano-purple/20"
                    />

                    {/* Icon Body Background (Simulated Glass) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-gradient-dark rounded-[2rem] shadow-[0_0_50px_rgba(32,156,233,0.15)] border border-white/5 backdrop-blur-xl"
                    />

                    {/* Scanner Beam */}
                    <motion.div
                        initial={{ top: '0%', opacity: 0 }}
                        animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, delay: 1.5, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute w-full h-[2px] bg-nano-blue shadow-[0_0_15px_#209CE9] z-20"
                    />

                    {/* The Shield Icon - Drawing Effect */}
                    <motion.svg
                        layoutId="shared-lock-icon"
                        className="w-24 h-24 text-nano-blue relative z-30"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <defs>
                            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#209CE9" />
                                <stop offset="100%" stopColor="#7C3AED" />
                            </linearGradient>
                        </defs>

                        {/* Path 1: Initial Wireframe Draw */}
                        <motion.path
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            stroke="url(#shieldGradient)"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 1 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        {/* Path 2: Solid Fill Fade In */}
                        <motion.path
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            fill="url(#shieldGradient)"
                            stroke="none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.2 }}
                            transition={{ delay: 1.5, duration: 1 }}
                        />
                    </motion.svg>
                </div>

                {/* Text Typing Effect */}
                <div className="mt-12 text-center h-16">
                    <motion.h1
                        initial={{ opacity: 0, letterSpacing: '1em' }}
                        animate={{ opacity: 1, letterSpacing: '0.2em' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-2xl font-bold text-white uppercase mb-2"
                    >
                        Security Portal
                    </motion.h1>
                    <motion.div
                        className="flex items-center justify-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="text-nano-blue font-mono text-xs">INITIALIZING</span>
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="w-2 h-2 bg-nano-blue inline-block"
                        />
                    </motion.div>
                </div>

            </motion.div>
        </div>
    );
}
