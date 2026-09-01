import { useState, useEffect } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Loader from '../../components/ui/Loader';
import StatCard from '../../components/ui/StatCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FileBarChart,
  Calendar,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileType,
  Printer,
  User,
} from 'lucide-react';
import { getTodayString } from '../../utils/helpers';
import {
  DailyTrendsChart,
  PeakHoursChart,
  StatusDistributionChart,
  DepartmentChart,
} from '../../components/ui/AnalyticsCharts';

interface Filters {
  startDate: string;
  endDate: string;
  department: string;
}

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activePreset, setActivePreset] = useState('custom'); // 'today' | 'week' | 'custom'
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: getTodayString(),
    department: '',
  });

  const fetchReports = async (overridePreset = activePreset, overrideFilters = filters) => {
    setLoading(true);
    try {
      const params: any = {};
      if (overridePreset === 'today' || overridePreset === 'week') {
        params.range = overridePreset;
      } else {
        if (overrideFilters.startDate) params.startDate = overrideFilters.startDate;
        if (overrideFilters.endDate) params.endDate = overrideFilters.endDate;
      }
      if (overrideFilters.department) params.department = overrideFilters.department;

      const res = await api.get('/reports/visitor-analytics', { params });
      setData(res.data.data);
    } catch {
      // error handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    void fetchReports(preset, filters);
  };

  const handleExport = async (format: string) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`, { id: 'export-toast' });
      const params: any = {};
      if (activePreset === 'today' || activePreset === 'week') {
        params.range = activePreset;
      } else {
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
      }
      if (filters.department) params.department = filters.department;

      const response = await api.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `VisitorOne_${format.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.${
          format === 'excel' ? 'xlsx' : 'pdf'
        }`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} Report Downloaded!`, { id: 'export-toast' });
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()} report`, { id: 'export-toast' });
    }
  };

  return (
    <AnimatedPage className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileBarChart className="text-indigo-600 dark:text-indigo-400" size={24} />
            Security Reports & Graphical Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive audit reports, PDF/Excel downloads, and visitor traffic telemetry
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleExport('pdf')}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5 border-indigo-500/30 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400"
          >
            <FileType size={14} /> PDF Report
          </button>
          <button
            onClick={() => void handleExport('excel')}
            className="btn-secondary text-xs font-semibold flex items-center gap-1.5 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400"
          >
            <FileSpreadsheet size={14} /> Excel Export
          </button>
          <button
            onClick={() => window.print()}
            className="btn-cyber text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer size={14} /> Print Page
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bento-card p-4 space-y-3">
        {/* Preset Range Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-1">
            Timeframe:
          </span>
          {[
            { id: 'today', label: "Today's Visitors" },
            { id: 'week', label: 'This Week' },
            { id: 'custom', label: 'Custom Date Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePreset === preset.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchReports(activePreset, filters);
          }}
          className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
              />
              <input
                type="date"
                disabled={activePreset !== 'custom'}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="input-field pl-9 py-2 text-xs w-full disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
              />
              <input
                type="date"
                disabled={activePreset !== 'custom'}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="input-field pl-9 py-2 text-xs w-full disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Filter
            </label>
            <input
              placeholder="e.g. Engineering"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="input-field py-2 text-xs"
            />
          </div>

          <button type="submit" className="btn-cyber text-xs h-9 justify-center">
            <Filter size={13} /> Apply Filter
          </button>
        </form>
      </div>

      {loading ? (
        <Loader text="Compiling security telemetry and logs..." />
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Total Passes Issued"
              value={data.summary?.total || 0}
              icon={Users}
              delay={0}
              color="indigo"
            />
            <StatCard
              title="Completed Visits"
              value={data.summary?.checkedOut || 0}
              icon={CheckCircle}
              delay={0.05}
              color="emerald"
            />
            <StatCard
              title="Currently Active"
              value={data.summary?.checkedIn || 0}
              icon={Clock}
              delay={0.1}
              color="amber"
            />
            <StatCard
              title="Rejected / Cancelled"
              value={(data.summary?.rejected || 0) + (data.summary?.cancelled || 0)}
              icon={XCircle}
              delay={0.15}
              color="rose"
            />
          </div>

          {/* Graphical Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4 }}
            >
              <DailyTrendsChart data={data.dailyTrends || []} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <StatusDistributionChart summary={data.summary || {}} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <PeakHoursChart data={data.peakHoursBreakdown || []} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <DepartmentChart data={data.byDepartment || []} />
            </motion.div>
          </div>

          {/* Host Breakdown + Avg Duration row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Hosts */}
            {data.byHost && data.byHost.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bento-card p-5"
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 font-mono flex items-center gap-1.5">
                  <User size={14} className="text-emerald-500" /> Top Visit Hosts
                </h2>
                <div className="space-y-2.5">
                  {data.byHost.slice(0, 8).map((host: any, i: number) => {
                    const maxCount = Math.max(...data.byHost.map((h: any) => h.count), 1);
                    const pct = Math.round((host.count / maxCount) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {host.employeeName || 'Unknown'}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0">
                            {host.count} visit{host.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Avg Visit Duration */}
            {data.avgDurationMinutes > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bento-card p-5 flex flex-col justify-center items-center text-center gap-2"
              >
                <span className="p-3 rounded-2xl bg-amber-500/10">
                  <Clock size={24} className="text-amber-500" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Avg Visit Duration
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white font-mono">
                  {data.avgDurationMinutes}
                  <span className="text-lg font-semibold text-slate-400 ml-1">min</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Average time from check-in to check-out across completed visits
                </p>
              </motion.div>
            )}
          </div>
        </div>
      ) : null}
    </AnimatedPage>
  );
}
