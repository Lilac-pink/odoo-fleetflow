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
  1: 'text-white',
  2: 'text-white',
  3: 'text-white',
  4: 'text-[#21295C]',
};

const ICON: Record<1 | 2 | 3 | 4, string> = {
  1: 'text-white/70',
  2: 'text-white/70',
  3: 'text-white/70',
  4: 'text-[#21295C]/70',
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 1 | 2 | 3 | 4;
  iconColor?: string;
}

export const KPICard = ({ title, value, icon: Icon, accent = 1 }: KPICardProps) => {
  // Count-up for numeric values
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value.replace(/[$%,]/g, ''))));
  const numericTarget = isNumeric ? Number(String(value).replace(/[$%,]/g, '')) : 0;
  const counted = useCountUp(numericTarget, 1200);

  // Rebuild display string with original prefix/suffix
  const displayValue = isNumeric
    ? String(value).replace(/[\d.]+/, counted)
    : value;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className={`rounded-xl p-6 shadow-sm flex flex-col gap-3 cursor-default ${BG[accent]}`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold uppercase tracking-wide opacity-80 ${TEXT[accent]}`}>
          {title}
        </p>
        <Icon className={`h-5 w-5 ${ICON[accent]}`} />
      </div>
      <p className={`text-3xl font-bold tabular-nums ${TEXT[accent]}`}>{displayValue}</p>
    </motion.div>
  );
};
