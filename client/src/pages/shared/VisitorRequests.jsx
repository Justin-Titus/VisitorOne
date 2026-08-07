import { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import VisitorDetailModal from '../../components/modals/VisitorDetailModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusBadgeClass, getStatusLabel, formatDate, formatDateTime } from '../../utils/helpers';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Ban,
  Clock,
  LayoutGrid,
  List,
  Printer,
  Shield,
  Building2,
  Calendar,
  Hash,
  Sparkles,
  RotateCw,
  QrCode,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

export default function VisitorRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewMode, setViewMode] = useState('badges'); // 'badges' | 'table'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'checked_in' | 'completed'

  const [filters, setFilters] = useState({
    visitorName: '',
    employeeName: '',
    status: '',
    visitDate: '',
  });

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [badgeFlipped, setBadgeFlipped] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [remarkText, setRemarkText] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchRequests = useCallback(
    async (page = 1, isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const params = { page, limit: 12 };
        if (filters.visitorName) params.visitorName = filters.visitorName;
        if (filters.employeeName) params.employeeName = filters.employeeName;
        if (filters.visitDate) params.visitDate = filters.visitDate;

        // Status from active tab or explicit filter
        if (activeTab === 'pending') params.status = 'pending';
        else if (activeTab === 'approved') params.status = 'approved';
        else if (activeTab === 'checked_in') params.status = 'checked_in';
        else if (activeTab === 'completed') params.status = 'checked_out';
        else if (activeTab === 'cancelled') params.status = 'cancelled';
        else if (filters.status) params.status = filters.status;

        const res = await api.get('/visitor-requests', { params });
        setRequests(res.data.data.data);
        setPagination({
          page: res.data.data.page,
          totalPages: res.data.data.totalPages,
          total: res.data.data.total,
        });
      } catch {
        // error handled by api interceptor
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [filters, activeTab]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const openDetail = async (req) => {
    setSelected(req);
    setBadgeFlipped(false);
    setDetailOpen(true);
    try {
      const res = await api.get(`/visitor-requests/${req._id}/activity`);
      setActivityLog(res.data.data);
    } catch {
      setActivityLog([]);
    }
  };

  const openPrint = (req) => {
    setSelected(req);
    setPrintOpen(true);
  };

  const handleAction = async (action, id) => {
    setActionLoading(action);
    try {
      const body =
        action === 'reject' || action === 'cancel'
          ? { remarks: remarkText || 'No remarks provided' }
          : {};
      await api.patch(`/visitor-requests/${id}/${action}`, body);
      toast.success(`Action '${action.replace('-', ' ')}' completed`);
      setDetailOpen(false);
      setRemarkText('');
      fetchRequests(pagination.page, true);
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading('');
    }
  };

  const actionMap = {
    created: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/15', dot: 'bg-blue-500' },
    approved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
    rejected: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/15', dot: 'bg-rose-500' },
    checked_in: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15', dot: 'bg-cyan-500' },
    checked_out: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10 dark:bg-slate-500/15', dot: 'bg-slate-400' },
    cancelled: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/15', dot: 'bg-amber-500' },
  };

  const filterTabs = [
    { id: 'all', label: 'All Passes' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'checked_in', label: 'Inside Facility' },
    { id: 'completed', label: 'Checked Out' },
    ...(user.role !== 'employee' ? [{ id: 'cancelled', label: 'Cancelled' }] : []),
  ];

  return (
    <AnimatedPage className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
            Visitor Requests & Passes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user.role === 'employee'
              ? 'Manage visitor access permissions assigned to you'
              : 'Enterprise security access registry & pass issuing'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="relative inline-flex items-center p-1 bg-slate-200/70 dark:bg-white/[0.05] rounded-xl border border-slate-300/60 dark:border-white/[0.08] self-start sm:self-auto select-none">
          <button
            type="button"
            onClick={() => setViewMode('badges')}
            className={`relative z-10 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 ${
              viewMode === 'badges'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {viewMode === 'badges' && (
              <motion.div
                layoutId="activeViewPill"
                className="absolute inset-0 bg-white dark:bg-[#111726] rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <LayoutGrid size={13} />
              <span>Badge Cards</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`relative z-10 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 ${
              viewMode === 'table'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {viewMode === 'table' && (
              <motion.div
                layoutId="activeViewPill"
                className="absolute inset-0 bg-white dark:bg-[#111726] rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <List size={13} />
              <span>Linear Table</span>
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/60 dark:border-white/[0.04]">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterTab"
                  className="absolute inset-0 bg-indigo-600 rounded-lg shadow-xs"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bento-card p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              placeholder="Search visitor..."
              value={filters.visitorName}
              onChange={(e) => setFilters({ ...filters, visitorName: e.target.value })}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>

          {user.role !== 'employee' && (
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                placeholder="Search host employee..."
                value={filters.employeeName}
                onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })}
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
          )}

          {activeTab === 'all' && user.role !== 'employee' && (
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          <div className="relative">
            <Calendar
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="date"
              value={filters.visitDate}
              onChange={(e) => setFilters({ ...filters, visitDate: e.target.value })}
              className="input-field pl-9 py-2 text-xs w-full"
              title="Filter by visit date"
            />
            {!filters.visitDate && (
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none select-none sm:hidden">
                Visit Date
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content View: Badges Grid OR Linear Table */}
      {loading ? (
        <Loader text="Loading security access records..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No visitor passes found"
          description="No visitor requests match your selected filters."
        />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'badges' ? (
            /* Physical Badge Cards Grid View */
            <motion.div
              key="view-badges"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {requests.map((req) => (
                <VisitorBadgeCard
                  key={req._id}
                  req={req}
                  userRole={user.role}
                  onOpenDetail={openDetail}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                  onPrint={openPrint}
                />
              ))}
            </motion.div>
          ) : (
            /* Linear-Style Data Table View */
            <motion.div
              key="view-table"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bento-card overflow-hidden"
            >
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-black/20 border-b border-slate-200 dark:border-white/[0.06]">
                      {['Pass ID', 'Visitor', 'Host Employee', 'Purpose', 'Date & Time', 'Status', 'Actions'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                    {requests.map((req) => (
                      <tr key={req._id} onClick={() => openDetail(req)} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">#{req._id.slice(-6).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{req.visitor?.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{req.visitor?.phone || req.visitor?.company}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800 dark:text-slate-200 font-medium">{req.employeeToVisit?.name}</p>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{req.employeeToVisit?.department}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{req.purpose}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <p>{formatDate(req.visitDate)}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{req.expectedArrivalTime}</p>
                        </td>
                        <td className="px-4 py-3"><span className={`badge ${getStatusBadgeClass(req.status)}`}>{getStatusLabel(req.status)}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openDetail(req)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Inspect Details"><Eye size={13} /></button>
                            <button onClick={() => openPrint(req)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Print Pass"><Printer size={13} /></button>
                            {user.role === 'employee' && req.status === 'pending' && (<><button onClick={() => handleAction('approve', req._id)} className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors" title="Approve"><CheckCircle size={13} /></button><button onClick={() => openDetail(req)} className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors" title="Reject"><XCircle size={13} /></button></>)}
                            {user.role === 'receptionist' && req.status === 'approved' && (<button onClick={() => handleAction('check-in', req._id)} className="w-7 h-7 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-colors" title="Check In"><LogIn size={13} /></button>)}
                            {user.role === 'receptionist' && req.status === 'checked_in' && (<button onClick={() => handleAction('check-out', req._id)} className="w-7 h-7 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors" title="Check Out"><LogOut size={13} /></button>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
                {requests.map((req) => (
                  <div key={req._id} onClick={() => openDetail(req)} className="p-4 space-y-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{req.visitor?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{req.visitor?.phone || req.visitor?.company}</p>
                      </div>
                      <span className={`badge flex-shrink-0 ${getStatusBadgeClass(req.status)}`}>{getStatusLabel(req.status)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <p className="text-slate-600 dark:text-slate-400">Host: <span className="font-semibold text-slate-900 dark:text-white">{req.employeeToVisit?.name}</span></p>
                        <p className="text-[11px] text-slate-400 font-mono">{formatDate(req.visitDate)} · {req.expectedArrivalTime}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); openPrint(req); }} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-500 transition-colors" title="Print"><Printer size={13} /></button>
                        {user.role === 'employee' && req.status === 'pending' && (<button onClick={(e) => { e.stopPropagation(); handleAction('approve', req._id); }} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-colors" title="Approve"><CheckCircle size={13} /></button>)}
                        {user.role === 'receptionist' && req.status === 'approved' && (<button onClick={(e) => { e.stopPropagation(); handleAction('check-in', req._id); }} className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center transition-colors" title="Check In"><LogIn size={13} /></button>)}
                        {user.role === 'receptionist' && req.status === 'checked_in' && (<button onClick={(e) => { e.stopPropagation(); handleAction('check-out', req._id); }} className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center transition-colors" title="Check Out"><LogOut size={13} /></button>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {requests.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <p>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchRequests(pagination.page - 1)}
              className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchRequests(pagination.page + 1)}
              className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <VisitorDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        selected={selected}
        onActionSuccess={() => fetchRequests(pagination.page)}
      />

      {/* Print Pass Modal */}
      <Modal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Print Security Visitor Badge"
        size="md"
      >
        {selected && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Printable visitor access badge with barcode verification.
            </p>
            <div className="p-4 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10 max-w-sm mx-auto">
              <VisitorBadgeCard
                req={selected}
                userRole={user.role}
                isInteractive={false}
              />
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-cyber flex items-center gap-1.5"
              >
                <Printer size={15} /> Print Badge Pass
              </button>
              <button onClick={() => setPrintOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}

