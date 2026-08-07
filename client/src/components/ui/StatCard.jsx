import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, delay = 0, color = 'indigo' }) {
  const colorStyles = {
    indigo: {
      border: 'hover:border-indigo-500/40',
      icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      glow: 'group-hover:bg-indigo-500/5',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      glow: 'group-hover:bg-amber-500/5',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'group-hover:bg-emerald-500/5',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      icon: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      glow: 'group-hover:bg-rose-500/5',
    },
    blue: {
      border: 'hover:border-blue-500/40',
      icon: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      glow: 'group-hover:bg-blue-500/5',
    },
  };

  const currentStyle = colorStyles[color] || colorStyles.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className={`bento-card p-4 group transition-all duration-200 ${currentStyle.border}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-105 ${currentStyle.icon}`}>
          <Icon size={15} />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold font-mono ${
              trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
