import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Clock, PieChart as PieIcon, Building2 } from 'lucide-react';

const STATUS_COLORS = {
  Approved: '#10b981', // emerald
  'Checked In': '#06b6d4', // cyan
  'Checked Out': '#64748b', // slate
  Pending: '#f59e0b', // amber
  Rejected: '#f43f5e', // rose
  Cancelled: '#e11d48', // rose-dark
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    let displayName = label || payload[0].name || 'Count';
    
    // Format YYYY-MM-DD to a readable date without timezone shifting
    if (typeof displayName === 'string' && displayName.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = displayName.split('-');
      const dateObj = new Date(y, m - 1, d);
      displayName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const color = payload[0].color || payload[0].payload?.fill || '#818cf8';
    
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs p-2.5 rounded-xl border border-white/10 shadow-xl">
        <p className="font-bold font-mono" style={{ color }}>{displayName}</p>
        <p className="text-slate-200 mt-1">
          <span className="font-semibold" style={{ color }}>{payload[0].value}</span> visitors
        </p>
      </div>
    );
  }
  return null;
};

export function DailyTrendsChart({ data = [] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  if (!data || data.length === 0) return null;

  // Fill in missing dates with 0 visitors so the chart scales time linearly
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const filledData = [];
  if (sortedData.length > 0) {
    const startParts = sortedData[0].date.split('-');
    let currDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const endParts = sortedData[sortedData.length - 1].date.split('-');
    const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    while (currDate <= endDate) {
      const y = currDate.getFullYear();
      const m = String(currDate.getMonth() + 1).padStart(2, '0');
      const d = String(currDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;
      
      const existing = sortedData.find(item => item.date === dateString);
      filledData.push({
        date: dateString,
        count: existing ? existing.count : 0
      });
      currDate.setDate(currDate.getDate() + 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
          <TrendingUp size={15} className="text-indigo-500" />
          Visitor Traffic Throughput Trend
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Daily Volume</span>
      </div>

      <div ref={ref} className="h-64 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filledData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => {
                  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [y, m, d] = val.split('-');
                    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }
                  return val;
                }}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#visitorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export function PeakHoursChart({ data = [] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
          <Clock size={15} className="text-cyan-500" />
          Peak Visitor Arrival Hours
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Hourly Distribution</span>
      </div>

      <div ref={ref} className="h-64 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export function StatusDistributionChart({ summary = {} }) {
  const chartData = [
    { name: 'Approved', value: summary.approved || 0 },
    { name: 'Checked In', value: summary.checkedIn || 0 },
    { name: 'Checked Out', value: summary.checkedOut || 0 },
    { name: 'Pending', value: summary.pending || 0 },
    { name: 'Rejected', value: summary.rejected || 0 },
    { name: 'Cancelled', value: summary.cancelled || 0 },
  ].filter((item) => item.value > 0);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-5 space-y-4 flex flex-col items-center"
    >
      <div className="w-full flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
          <PieIcon size={15} className="text-emerald-500" />
          Pass Status Breakdown
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Share Ratio</span>
      </div>

      <div ref={ref} className="h-64 w-full flex items-center justify-center">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export function DepartmentChart({ data = [] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    department: d.department || 'Unspecified',
    count: d.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
          <Building2 size={15} className="text-indigo-500" />
          Department Traffic Visual
        </h3>
        <span className="text-[11px] font-mono text-slate-400">By Department</span>
      </div>

      <div ref={ref} className="h-64 w-full">
        {isInView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
