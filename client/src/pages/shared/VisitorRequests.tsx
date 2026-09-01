import { useState, useEffect, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import VisitorDetailModal from '../../components/modals/VisitorDetailModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusBadgeClass, getStatusLabel, formatDate } from '../../utils/helpers';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Shield,
  Calendar,
  Printer,
  SlidersHorizontal,
  CheckSquare,
  Square,
  X,
  List,
  Clock,
  Ban,
} from 'lucide-react';

export default function VisitorRequests() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('badges'); // 'badges' | 'table'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'checked_in' | 'completed'

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    visitorName: '',
    employeeName: '',
    status: '',
    visitDate: '',
    startDate: '',
    endDate: '',
    department: '',
    phone: '',
    idProofNumber: '',
    purpose: '',
  });

  // Separate filters into debounced (text) and immediate (dropdowns)
  const textFiltersRaw = useMemo(() => ({
    visitorName: filters.visitorName,
    employeeName: filters.employeeName,
    phone: filters.phone,
    idProofNumber: filters.idProofNumber,
    purpose: filters.purpose,
  }), [
    filters.visitorName,
    filters.employeeName,
    filters.phone,
    filters.idProofNumber,
    filters.purpose
  ]);

  const debouncedTextFilters = useDebounce(textFiltersRaw, 400);

  const immediateFilters = useMemo(() => ({
    status: filters.status,
    visitDate: filters.visitDate,
    startDate: filters.startDate,
    endDate: filters.endDate,
    department: filters.department,
  }), [
    filters.status,
    filters.visitDate,
    filters.startDate,
    filters.endDate,
    filters.department
  ]);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Reset to page 1 when filters or tabs change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedTextFilters, immediateFilters, activeTab]);

  // React Query Fetching
  const { data: queryData, isLoading, refetch } = useQuery({
    queryKey: ['visitor-requests', page, debouncedTextFilters, immediateFilters, activeTab],
    queryFn: async () => {
      const params: any = { page, limit: 12, ...debouncedTextFilters, ...immediateFilters };
      
      // Clean up empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      // Status from active tab overrides general status filter
      if (activeTab === 'pending') params.status = 'pending';
      else if (activeTab === 'approved') params.status = 'approved';
      else if (activeTab === 'checked_in') params.status = 'checked_in';
      else if (activeTab === 'completed') params.status = 'checked_out';
      else if (activeTab === 'cancelled') params.status = 'cancelled';
      else if (activeTab === 'rejected') params.status = 'rejected';

      const res = await api.get('/visitor-requests', { params });
      return res.data.data;
    },
  });

  const requests: any[] = queryData?.data || [];
  const pagination = {
    page: Number(queryData?.page) || 1,
    totalPages: Number(queryData?.totalPages) || 1,
    total: Number(queryData?.total) || 0,
  };
  const loading = isLoading;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [, setActivityLog] = useState<any[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const handleClearFilters = () => {
    setFilters({
      visitorName: '',
      employeeName: '',
      status: '',
      visitDate: '',
      startDate: '',
      endDate: '',
      department: '',
      phone: '',
      idProofNumber: '',
      purpose: '',
    });
  };

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r: any) => r._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const endpoint = `/visitor-requests/bulk-${action}`;
      const payload: any = { ids: selectedIds };
      if (action === 'reject') payload.remarks = 'Bulk rejected by administrator';

      const res = await api.patch(endpoint, payload);
      const resultData = res.data.data;

      if (resultData && resultData.failed && resultData.failed.length > 0) {
        if (resultData.succeeded && resultData.succeeded.length > 0) {
          toast(res.data.message || `Bulk ${action} completed with warnings`, { icon: '⚠️', id: 'bulk-action-toast' });
        }
      } else {
        toast.success(res.data.message || `Bulk ${action} completed successfully`, { id: 'bulk-action-toast' });
      }

      setSelectedIds([]);
      void refetch();
    } catch {
      // Error toast is automatically handled with deduplication by api response interceptor
    } finally {
      setBulkLoading(false);
    }
  };

  const openDetail = async (req: any) => {
    setSelected(req);
    setDetailOpen(true);
    try {
      const res = await api.get(`/visitor-requests/${req._id}/activity`);
      setActivityLog(res.data.data);
    } catch {
      setActivityLog([]);
    }
  };

  const openPrint = (req: any) => {
    setSelected(req);
    setPrintOpen(true);
  };

  const handleAction = async (action: string, id: string) => {
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
      void refetch();
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading('');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Requests', icon: List, color: 'bg-indigo-500', activeText: 'text-white' },
    { id: 'pending', label: 'Pending Approval', icon: Clock, color: 'bg-amber-500', activeText: 'text-white' },
    { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-emerald-500', activeText: 'text-white' },
    { id: 'checked_in', label: 'Active', icon: LogIn, color: 'bg-cyan-500', activeText: 'text-white' },
    { id: 'completed', label: 'Completed', icon: LogOut, color: 'bg-slate-500', activeText: 'text-white' },
    ...(user?.role !== 'employee'
      ? [
          { id: 'rejected', label: 'Declined', icon: Ban, color: 'bg-rose-500', activeText: 'text-white' },
          { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-slate-600', activeText: 'text-white' }
        ]
      : []),
  ];

  return (
    <AnimatedPage className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
            Visitor Requests & Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.role === 'employee'
              ? 'Manage visitor access permissions assigned to you'
              : 'Enterprise security access registry, bulk management & pass issuing'}
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
              <span>Linear Table</span>
            </span>
          </button>
        </div>
      </div>

    {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 border ${
                isActive
                  ? `${tab.activeText} border-transparent`
                  : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterTab"
                  className={`absolute inset-0 rounded-xl shadow-md ${tab.color}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={14} className={isActive ? 'opacity-90' : 'opacity-70'} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bento-card p-3.5 space-y-3">
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

          {user?.role !== 'employee' && (
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
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn-secondary text-xs flex-1 justify-center py-2 ${
                showAdvancedFilters ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Advanced Filters</span>
            </button>
            {(filters.visitorName ||
              filters.employeeName ||
              filters.visitDate ||
              filters.startDate ||
              filters.endDate ||
              filters.department ||
              filters.phone ||
              filters.idProofNumber ||
              filters.purpose) && (
              <button
                onClick={handleClearFilters}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold"
                title="Clear all filters"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Multi-Condition Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-200/60 dark:border-white/[0.06] pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Start Date Range
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field py-1.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  End Date Range
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field py-1.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Department
                </label>
                <input
                  placeholder="e.g. Engineering"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="input-field py-1.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Phone / ID Proof
                </label>
                <input
                  placeholder="Phone or ID number..."
                  value={filters.phone}
                  onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                  className="input-field py-1.5 text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Visit Purpose Keyword
                </label>
                <input
                  placeholder="e.g. Audit, Interview"
                  value={filters.purpose}
                  onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                  className="input-field py-1.5 text-xs w-full"
                />
              </div>

              {activeTab === 'all' && user?.role !== 'employee' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Pass Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input-field py-1.5 text-xs w-full"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50 p-3 rounded-2xl bg-indigo-900/95 text-white backdrop-blur-md border border-indigo-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="p-1.5 rounded-lg bg-indigo-500/30">
              <CheckSquare size={16} />
            </span>
            <span>{selectedIds.length} Visitor Passes Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(user?.role === 'employee' || user?.role === 'admin') && (
              <>
                <button
                  disabled={bulkLoading}
                  onClick={() => void handleBulkAction('approve')}
                  className="btn-emerald text-xs py-1.5"
                  title="Bulk Approve Pending Passes"
                >
                  <CheckCircle size={13} /> Bulk Approve
                </button>
                <button
                  disabled={bulkLoading}
                  onClick={() => void handleBulkAction('reject')}
                  className="btn-rose text-xs py-1.5"
                  title="Bulk Reject Pending Passes"
                >
                  <XCircle size={13} /> Bulk Reject
                </button>
              </>
            )}

            {(user?.role === 'receptionist' || user?.role === 'admin') && (
              <button
                disabled={bulkLoading}
                onClick={() => void handleBulkAction('check-in')}
                className="btn-cyber text-xs py-1.5"
                title="Bulk Check-In Approved Passes"
              >
                <LogIn size={13} /> Bulk Check-In
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white underline ml-2"
            >
              Clear Selection
            </button>
          </div>
        </motion.div>
      )}

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
              {requests.map((req) => {
                const isSelected = selectedIds.includes(req._id);
                return (
                  <div key={req._id} className="relative group">
                    {/* Checkbox trigger overlay */}
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(req._id)}
                      className={`absolute top-3 right-3 z-30 p-1.5 rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md opacity-100'
                          : `bg-slate-900/60 text-slate-300 hover:bg-slate-900 ${
                              selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`
                      }`}
                      title="Select for bulk action"
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>

                    <VisitorBadgeCard
                      req={req}
                      userRole={user?.role || 'employee'}
                      onOpenDetail={openDetail}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      onPrint={openPrint}
                    />
                  </div>
                );
              })}
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
              <div className="hidden md:block overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-black/20 border-b border-slate-200 dark:border-white/[0.06]">
                      <th className="px-3 py-3 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.length === requests.length ? (
                            <CheckSquare size={16} className="text-indigo-500" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      {['Pass ID', 'Visitor', 'Host Employee', 'Purpose', 'Date & Time', 'Status', 'Actions'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                    {requests.map((req) => {
                      const isSelected = selectedIds.includes(req._id);
                      return (
                        <tr
                          key={req._id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-500/10 dark:bg-indigo-500/15' : ''
                          }`}
                        >
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleSelectOne(req._id)}>
                              {isSelected ? (
                                <CheckSquare size={16} className="text-indigo-500" />
                              ) : (
                                <Square size={16} className="text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                            #{req._id.slice(-6).toUpperCase()}
                          </td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{req.visitor?.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{req.visitor?.phone || req.visitor?.company}</p>
                          </td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3">
                            <p className="text-slate-800 dark:text-slate-200 font-medium">{req.employeeToVisit?.name}</p>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{req.employeeToVisit?.department}</p>
                          </td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{req.purpose}</td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            <p>{formatDate(req.visitDate)}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{req.expectedArrivalTime}</p>
                          </td>
                          <td onClick={() => void openDetail(req)} className="px-4 py-3">
                            <span className={`badge ${getStatusBadgeClass(req.status)}`}>{getStatusLabel(req.status)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => void openDetail(req)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Inspect Details"><Eye size={13} /></button>
                              <button onClick={() => void openPrint(req)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Print Pass"><Printer size={13} /></button>
                              {user?.role === 'employee' && req.status === 'pending' && (
                                <>
                                  <button onClick={() => void handleAction('approve', req._id)} className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors" title="Approve"><CheckCircle size={13} /></button>
                                  <button onClick={() => void openDetail(req)} className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors" title="Reject"><XCircle size={13} /></button>
                                </>
                              )}
                              {user?.role === 'receptionist' && req.status === 'approved' && (
                                <button onClick={() => void handleAction('check-in', req._id)} className="w-7 h-7 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-colors" title="Check In"><LogIn size={13} /></button>
                              )}
                              {user?.role === 'receptionist' && req.status === 'checked_in' && (
                                <button onClick={() => void handleAction('check-out', req._id)} className="w-7 h-7 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors" title="Check Out"><LogOut size={13} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
                {requests.map((req) => (
                  <div key={req._id} onClick={() => void openDetail(req)} className="p-4 space-y-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{req.visitor?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{req.visitor?.phone || req.visitor?.company}</p>
                      </div>
                      <span className={`badge flex-shrink-0 ${getStatusBadgeClass(req.status)}`}>{getStatusLabel(req.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Premium Pagination */}
      {requests.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-bold">{((pagination.page - 1) * 12) + 1}</span> to <span className="text-slate-900 dark:text-white font-bold">{Math.min(pagination.page * 12, pagination.total)}</span> of <span className="text-slate-900 dark:text-white font-bold">{pagination.total}</span> passes
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            
            <div className="flex items-center px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
              {pagination.page} / {pagination.totalPages}
            </div>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <VisitorDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        selected={selected}
        onActionSuccess={() => void refetch()}
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
                userRole={user?.role || 'employee'}
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
