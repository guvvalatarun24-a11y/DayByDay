import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string; // e.g. 'purple', 'violet', 'indigo', 'amber', 'emerald', 'rose'
  trendLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  accentColor = 'purple',
  trendLabel,
}) => {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'violet':
        return {
          iconBg: 'bg-violet-100 text-violet-700',
          borderHover: 'hover:border-violet-300',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-100 text-indigo-700',
          borderHover: 'hover:border-indigo-300',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-100 text-amber-700',
          borderHover: 'hover:border-amber-300',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          borderHover: 'hover:border-emerald-300',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-100 text-rose-700',
          borderHover: 'hover:border-rose-300',
        };
      case 'purple':
      default:
        return {
          iconBg: 'bg-purple-100 text-purple-700',
          borderHover: 'hover:border-purple-300',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      className={`relative bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm transition-all duration-200 ${styles.borderHover}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg} transition-transform duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-500">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trendLabel) && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {trendLabel && (
            <span className="font-medium text-purple-700">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
