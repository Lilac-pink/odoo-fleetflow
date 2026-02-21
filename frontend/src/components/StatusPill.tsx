import { cn } from '@/lib/utils';

const colorMap: Record<string, string> = {
  'Available': 'bg-success/10 text-success border-success/20',
  'On Trip': 'bg-primary/10 text-primary border-primary/20',
  'On Duty': 'bg-success/10 text-success border-success/20',
  'In Shop': 'bg-warning/10 text-warning border-warning/20',
  'Retired': 'bg-destructive/10 text-destructive border-destructive/20',
  'Suspended': 'bg-destructive/10 text-destructive border-destructive/20',
  'Draft': 'bg-muted text-muted-foreground border-border',
  'Dispatched': 'bg-primary/10 text-primary border-primary/20',
  'Completed': 'bg-success/10 text-success border-success/20',
  'Cancelled': 'bg-destructive/10 text-destructive border-destructive/20',
  'Off Duty': 'bg-warning/10 text-warning border-warning/20',
  'Taking a Break': 'bg-muted text-muted-foreground border-border',
  'Open': 'bg-warning/10 text-warning border-warning/20',
  'Closed': 'bg-success/10 text-success border-success/20',
};

export const StatusPill = ({ status }: { status: string }) => (
  <span className={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    colorMap[status] ?? 'bg-muted text-muted-foreground'
  )}>
    {status}
  </span>
);
