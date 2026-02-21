import type { Variants } from 'framer-motion';

/** Fade up — used for cards and table rows */
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/** Fade + scale — used for modals / login card */
export const fadeScale: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Slide up — bottom-sheet style panels */
export const slideUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Slide in from left — table rows */
export const slideLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Shake — validation errors / danger confirmations */
export const shake: Variants = {
    initial: { x: 0 },
    animate: {
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.5, ease: 'easeInOut' },
    },
};

/** Stagger container — wraps rows/cards to stagger their children */
export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

/** Scale pop — success checkmark / badge pop */
export const scalePop: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
    },
};
