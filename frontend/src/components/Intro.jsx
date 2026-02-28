import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Intro({ onComplete }) {
    useEffect(() => {
        // Жесткое ограничение длительности в 4.5 секунды
        const timer = setTimeout(() => {
            onComplete();
        }, 4500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B14] overflow-hidden">
            {/* Плавный fade-out всей анимации перед переходом с 4-й по 4.5 секунды */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 4 }}
                className="absolute inset-0 w-full h-full"
            >
                <div className="absolute inset-0 flex items-center justify-center bg-[#050B14] overflow-hidden perspective-1000">
                    {/* Фон и частицы */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.15)_0%,_transparent_60%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

                        {/* Сетка на полу */}
                        <motion.div
                            initial={{ opacity: 0, rotateX: 60, scale: 2 }}
                            animate={{ opacity: 0.2, rotateX: 60, scale: 2, y: [0, 50] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-[-50%] w-[200%] h-[100%] left-[-50%] border-t border-[#7C3AED]/30"
                            style={{
                                backgroundImage: 'linear-gradient(to right, rgba(124,58,237,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,58,237,0.15) 1px, transparent 1px)',
                                backgroundSize: '100px 100px'
                            }}
                        />

                        {/* Плавающие частицы */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={`p-${i}`}
                                initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight, opacity: 0 }}
                                animate={{ y: -100, opacity: [0, 0.5, 0] }}
                                transition={{ duration: Math.random() * 5 + 5, delay: Math.random() * 2, repeat: Infinity }}
                                className="absolute w-1 h-1 bg-[#209CE9] rounded-full blur-[1px]"
                            />
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 1.5, bounce: 0.4 }}
                            className="relative flex items-center justify-center mb-16"
                        >
                            {/* Кибер-кольца вокруг логотипа */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-30px] rounded-full border border-dashed border-[#209CE9]/30"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-50px] rounded-full border border-dotted border-[#7C3AED]/30"
                            />

                            {/* Блок Логотипа */}
                            <div className="w-28 h-28 bg-[linear-gradient(135deg,#0F172A_0%,#1E293B_100%)] rounded-xl border border-white/10 shadow-[0_0_40px_rgba(32,156,233,0.3)] flex items-center justify-center backdrop-blur-md relative overflow-hidden">
                                <motion.img
                                    src="/logo-icon.png"
                                    alt="Logo"
                                    className="w-full h-full object-contain z-10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, filter: 'invert(1) grayscale(1) brightness(2) drop-shadow(0 0 8px rgba(32,156,233,0.6))' }}
                                    transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
                                />

                                {/* Эффект сканирования */}
                                <motion.div
                                    initial={{ top: '0%', opacity: 0 }}
                                    animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                    className="absolute w-full h-[2px] bg-[#209CE9] shadow-[0_0_15px_#209CE9] z-20"
                                />
                            </div>
                        </motion.div>

                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="flex items-center justify-center gap-4 mb-3"
                            >
                                <div className="h-[1px] w-8 bg-[#209CE9]/50" />
                                <span className="text-[#209CE9] font-mono text-[10px] uppercase tracking-[0.4em]">
                                    Welcome to
                                </span>
                                <div className="h-[1px] w-8 bg-[#209CE9]/50" />
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }}
                                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                                transition={{ duration: 1, delay: 1.5 }}
                                className="text-4xl md:text-6xl font-bold text-white tracking-widest whitespace-nowrap"
                                style={{ textShadow: "0 0 20px rgba(124,58,237,0.5)" }}
                            >
                                StrategyBRIX
                            </motion.h1>

                            <motion.div
                                className="mt-6 flex items-center justify-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.5 }}
                            >
                                <span className="text-[#7C3AED] font-mono text-xs uppercase tracking-widest animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]">
                                    INITIALIZING
                                </span>
                                <motion.span
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
