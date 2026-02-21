import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useCountUp } from '@/hooks/useCountUp';

const BG: Record<1 | 2 | 3 | 4, string> = {
  1: 'bg-[#1B3B6F]',
  2: 'bg-[#065A82]',
  3: 'bg-[#1C7293]',
  4: 'bg-[#9EB3C2]',
};
const TEXT: Record<1 | 2 | 3 | 4, string> = {
  1: 'text-white', 2: 'text-white', 3: 'text-white', 4: 'text-[#21295C]',
};
const ICON: Record<1 | 2 | 3 | 4, string> = {
  1: 'text-white/70', 2: 'text-white/70', 3: 'text-white/70', 4: 'text-[#21295C]/70',
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 1 | 2 | 3 | 4;
  iconColor?: string;
}

/**
 * Parses a display value like "$1,234", "42%", "-5.43%" into parts so we can
 * animate only the numeric portion without corrupting sign/prefix/suffix.
 */
function parseValue(value: string | number) {
  const str = String(value);
  // Prefix: leading non-digit, non-minus chars  (e.g. "$")
  const prefixMatch = str.match(/^([^0-9\-]*)/);
  const prefix = prefixMatch?.[1] ?? '';
  // Suffix: trailing non-digit chars             (e.g. "%" or " km")
  const suffixMatch = str.match(/([^0-9]+)$/);
  const suffix = suffixMatch?.[1] ?? '';
  // Middle: everything between prefix and suffix (e.g. "-5.43")
  const middle = str.slice(prefix.length, suffix.length ? str.length - suffix.length : undefined);
  const numeric = Number(middle.replace(/,/g, ''));
  const isNum = middle.trim() !== '' && isFinite(numeric);

  return { prefix, suffix, middle, numeric, isNum };
}

export const KPICard = ({ title, value, icon: Icon, accent = 1 }: KPICardProps) => {
  const { prefix, suffix, numeric, isNum } = parseValue(value);
  const absTarget = isNum ? Math.abs(numeric) : 0;
  const decimals = isNum ? (String(Math.abs(numeric)).split('.')[1]?.length ?? 0) : 0;
  const counted = useCountUp(absTarget, 1200, decimals);

  // Reconstruct: keep prefix, prepend sign if negative, append suffix
  const sign = isNum && numeric < 0 ? '-' : '';
  const display = isNum ? `${prefix}${sign}${counted}${suffix}` : value;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className={`rounded-xl p-6 shadow-sm flex flex-col gap-3 cursor-default ${BG[accent]}`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold uppercase tracking-wide opacity-80 ${TEXT[accent]}`}>{title}</p>
        <Icon className={`h-5 w-5 ${ICON[accent]}`} />
      </div>
      <p className={`text-3xl font-bold tabular-nums ${TEXT[accent]}`}>{display}</p>
    </motion.div>
  );
};
