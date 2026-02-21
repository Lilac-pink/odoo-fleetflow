import { useEffect, useRef, useState } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck } from 'lucide-react';

interface IntroScreenProps {
    /** Path to a video file in the public folder, e.g. "/intro.mp4" */
    videoSrc?: string;
    /** Called when the intro finishes (video ended / timer / skip) */
    onComplete: () => void;
}

/**
 * Splash / intro screen shown once per session before the main app.
 * - If videoSrc is provided it plays the video, then calls onComplete.
 * - Without a video it shows an animated branded splash for ~3s.
 * - Always shows a "Skip →" button.
 */
const IntroScreen = ({ videoSrc, onComplete }: IntroScreenProps) => {
    const { authLoading } = useFleet();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [leaving, setLeaving] = useState(false);

    const finish = () => {
        if (leaving) return;
        setLeaving(true);
        // Give the exit animation 500ms, then hand off
        setTimeout(onComplete, 500);
    };

    // Fallback timer: redirect after 3s when no video and auth is resolved
    useEffect(() => {
        if (!videoSrc && !authLoading) {
            const t = setTimeout(finish, 3000);
            return () => clearTimeout(t);
        }
    }, [videoSrc, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AnimatePresence>
            {!leaving && (
                <motion.div
                    key="intro"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#21295C] overflow-hidden"
                >
                    {videoSrc ? (
                        /* ── Video mode ── */
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            autoPlay
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover"
                            onEnded={finish}
                        />
                    ) : (
                        /* ── Branded animated splash ── */
                        <div className="flex flex-col items-center gap-6 select-none">
                            {/* Logo with pulse rings */}
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="relative"
                            >
                                {[1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border-2 border-white/20"
                                        animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.4, 0] }}
                                        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
                                    />
                                ))}
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#065A82] shadow-2xl">
                                    <Truck className="h-12 w-12 text-white" />
                                </div>
                            </motion.div>

                            {/* Brand name */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-center"
                            >
                                <h1 className="text-5xl font-extrabold tracking-tight text-white">
                                    Fleet<span className="text-[#9EB3C2]">Flow</span>
                                </h1>
                                <p className="mt-2 text-sm font-medium uppercase tracking-[0.3em] text-white/50">
                                    Intelligent Fleet Management
                                </p>
                            </motion.div>

                            {/* Loading bar */}
                            <motion.div
                                className="mt-4 h-0.5 w-48 overflow-hidden rounded-full bg-white/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <motion.div
                                    className="h-full bg-[#1C7293]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.8 }}
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Skip button — always visible */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={finish}
                        className="absolute bottom-8 right-8 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                    >
                        Skip →
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntroScreen;
