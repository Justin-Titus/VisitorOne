import { useState, useEffect } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import StatCard from '../../components/ui/StatCard';
import Loader from '../../components/ui/Loader';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import VisitorDetailModal from '../../components/modals/VisitorDetailModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CalendarDays, UserCheck, Clock, UserPlus, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodayString } from '../../utils/helpers';

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState(null);
  const [todayVisitors, setTodayVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayStr = getTodayString();
      const [dashRes, reqRes] = await Promise.all([
        api.get('/dashboard/receptionist'),
        api.get('/visitor-requests', { params: { limit: 6, visitDate: todayStr, activeOnly: true } }),
      ]);
      setStats(dashRes.data.data);
      setTodayVisitors(reqRes.data.data.data || []);
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

  const handleAction = async (action, id) => {
    setActionLoading(action);
    try {
      await api.patch(`/visitor-requests/${id}/${action}`, {});
      toast.success(`Visitor marked as ${action.replace('-', ' ')}`);
      fetchData();
    } catch {
    } finally {
      setActionLoading('');
    }
  };

  if (loading) return <Loader text="Loading reception gatekeeper cockpit..." />;

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
            Reception Gatekeeper Station
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time visitor check-in, check-out, and pass issuance
          </p>
        </div>

        <button
          onClick={() => navigate('/register-visitor')}
          className="btn-cyber text-xs font-bold self-start sm:self-auto"
        >
          <UserPlus size={14} /> Issue New Pass <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Today's Scheduled"
          value={stats?.todaysScheduled || 0}
          icon={CalendarDays}
          delay={0}
          color="amber"
        />
        <StatCard
          title="Currently Inside"
          value={stats?.currentlyInside || 0}
          icon={UserCheck}
          delay={0.06}
          color="emerald"
        />
        <StatCard
          title="Awaiting Check-in"
          value={stats?.pendingCheckIns || 0}
          icon={Clock}
          delay={0.12}
          color="indigo"
        />
      </div>

      {/* Today's Active Passes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Active Gate Passes
          </h2>
          <button
            onClick={() => navigate('/visitor-requests')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All passes <ArrowRight size={12} />
          </button>
        </div>

        {todayVisitors.length === 0 ? (
          <div className="bento-card p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            No visitor passes scheduled for today yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todayVisitors.map((req) => (
              <VisitorBadgeCard
                key={req._id}
                req={req}
                userRole="receptionist"
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

