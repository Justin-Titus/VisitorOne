import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage from '../../components/shared/AnimatedPage';
import StatCard from '../../components/ui/StatCard';
import Loader from '../../components/ui/Loader';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import VisitorDetailModal from '../../components/modals/VisitorDetailModal';
import api from '../../services/api';
import {
  Users,
  ShieldCheck,
  Clock,
  UserCheck,
  Activity,
  ArrowRight,
  Sparkles,
  UserCog,
  History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DailyTrendsChart, StatusDistributionChart } from '../../components/ui/AnalyticsCharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, reqRes, analyticsRes] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/visitor-requests', { params: { limit: 3 } }),
        api.get('/reports/visitor-analytics', { params: { range: 'week' } }),
      ]);
      setStats(dashRes.data.data);
      setRecentRequests(reqRes.data.data.data || []);
      setAnalytics(analyticsRes.data.data);
    } catch {
      // error handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (req) => {
    setSelectedReq(req);
    setDetailOpen(true);
  };

  if (loading) return <Loader text="Initializing Super Admin Security Command..." />;

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={26} />
            Security Command & Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Global system statistics, access logs, user management, and security audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/activity-history')} className="btn-secondary text-xs">
            <History size={14} /> Activity Log
          </button>
          <button onClick={() => navigate('/users')} className="btn-cyber text-xs">
            <Users size={14} /> User Directory
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Visitors Registered"
          value={stats?.totalVisitors ?? 0}
          icon={Users}
          delay={0}
          color="indigo"
          subtitle="All-time visitor records"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingRequests ?? 0}
          icon={Clock}
          delay={0.05}
          color="amber"
          subtitle="Awaiting employee decision"
        />
        <StatCard
          title="Active On-Premises"
          value={stats?.checkedInVisitors ?? 0}
          icon={UserCheck}
          delay={0.1}
          color="emerald"
          subtitle="Currently inside facility"
        />
        <StatCard
          title="Total System Staff"
          value={stats?.totalUsers ?? 0}
          icon={Activity}
          delay={0.15}
          color="cyan"
          subtitle="Active admin & staff accounts"
        />
      </div>

      {/* Graphical Telemetry Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DailyTrendsChart data={analytics.dailyTrends || []} />
          <StatusDistributionChart summary={analytics.summary || {}} />
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25 }}
          onClick={() => navigate('/visitor-requests')}
          className="bento-card p-5 cursor-pointer hover:border-indigo-500/40 group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={20} />
            </span>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Visitor Requests & Passes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit, filter, approve, check-in, or cancel any pass in the system
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.08 }}
          onClick={() => navigate('/activity-history')}
          className="bento-card p-5 cursor-pointer hover:border-cyan-500/40 group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Activity size={20} />
            </span>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Security Audit Log</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View immutable time-stamped timeline of every status transition
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.16 }}
          onClick={() => navigate('/users')}
          className="bento-card p-5 cursor-pointer hover:border-purple-500/40 group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCog size={20} />
            </span>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">User Access Control</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage system roles, create employee profiles, and edit clearances
          </p>
        </motion.div>
      </div>

      {/* Recent Passes Grid */}
      {recentRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-500" /> Recent Security Passes
            </h2>
            <button
              onClick={() => navigate('/visitor-requests')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View all passes <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentRequests.map((req) => (
              <VisitorBadgeCard
                key={req._id}
                req={req}
                userRole="admin"
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instant Badge Inspection Modal */}
      <VisitorDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        selected={selectedReq}
        onActionSuccess={fetchData}
      />
    </AnimatedPage>
  );
}
