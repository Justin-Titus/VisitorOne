import { useState, useEffect } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import StatCard from '../../components/ui/StatCard';
import Loader from '../../components/ui/Loader';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import VisitorDetailModal from '../../components/modals/VisitorDetailModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, UserCheck, History, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmployeeStats {
  pendingCount: number;
  checkedInCount: number;
  totalHandled: number;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, reqRes] = await Promise.all([
        api.get('/dashboard/employee'),
        api.get('/visitor-requests', { params: { limit: 6 } }),
      ]);
      setStats(dashRes.data.data as EmployeeStats);
      setMyRequests(reqRes.data.data.data || []);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleOpenDetail = (req: any) => {
    setSelectedReq(req);
    setDetailOpen(true);
  };

  const handleAction = async (action: string, id: string) => {
    setActionLoading(action);
    try {
      await api.patch(`/visitor-requests/${id}/${action}`, {});
      toast.success(`Request ${action}d successfully`);
      void fetchData();
    } catch {
      // Error handled by interceptor
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Loader text="Loading Employee Workspace..." />;

  const pendingPasses = myRequests.filter((r) => r.status === 'pending');
  const otherPasses = myRequests.filter((r) => r.status !== 'pending');

  return (
    <AnimatedPage className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
            Host Employee Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review incoming visitor requests, manage active clearances, and track visitor arrivals
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingCount ?? 0}
          icon={Clock}
          color="amber"
          subtitle="Awaiting your decision"
        />
        <StatCard
          title="Visitors Checked-In"
          value={stats?.checkedInCount ?? 0}
          icon={UserCheck}
          color="emerald"
          subtitle="Currently inside facility"
        />
        <StatCard
          title="Total Visits Handled"
          value={stats?.totalHandled ?? 0}
          icon={History}
          color="indigo"
          subtitle="Historical clearance records"
        />
      </div>

      {/* Action Required: Pending Requests */}
      {pendingPasses.length > 0 && (
        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Action Required: Pending Pass Approvals ({pendingPasses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingPasses.map((req) => (
              <VisitorBadgeCard
                key={req._id}
                req={req}
                userRole="employee"
                onOpenDetail={handleOpenDetail}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processed & Past Passes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Processed & Past Visitor Passes
          </h2>
          <button
            onClick={() => navigate('/visitor-requests')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All passes <ArrowRight size={12} />
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="bento-card p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            No visitor passes found.
          </div>
        ) : otherPasses.length === 0 ? (
          <div className="bento-card p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            No past or processed visitor passes yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherPasses.map((req) => (
              <VisitorBadgeCard
                key={req._id}
                req={req}
                userRole="employee"
                onOpenDetail={handleOpenDetail}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

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
