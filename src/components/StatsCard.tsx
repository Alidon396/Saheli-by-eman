import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'warning' | 'success';
  trend?: string;
}

export const StatsCard = ({ title, value, icon: Icon, variant = 'default', trend }: StatsCardProps) => {
  const variants = {
    default: 'bg-card border-border',
    primary: 'bg-primary/5 border-primary/20',
    warning: 'bg-warning/5 border-warning/20',
    success: 'bg-success/5 border-success/20',
  };

  const iconVariants = {
    default: 'text-muted-foreground bg-muted',
    primary: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  };

  return (
    <div className={`rounded-lg border p-6 shadow-sm transition-all hover:shadow-md animate-slide-up ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${iconVariants[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
