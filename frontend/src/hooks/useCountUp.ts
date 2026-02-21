import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → `target` when the component mounts,
 * or re-animates whenever `target` changes.
 *
 * @param target   The final number to count to.
 * @param duration Duration in ms (default 1000).
 * @param decimals Number of decimal places to display (default 0).
 */
export function useCountUp(target: number, duration = 1000, decimals = 0): string {
    const [display, setDisplay] = useState('0');
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const fromRef = useRef(0);

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        fromRef.current = 0;
        startRef.current = null;

        const step = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp;
            const elapsed = timestamp - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = fromRef.current + (target - fromRef.current) * eased;
            setDisplay(current.toFixed(decimals));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                setDisplay(target.toFixed(decimals));
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, duration, decimals]);

    return display;
}
