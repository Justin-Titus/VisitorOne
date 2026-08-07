import { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { History, Search, ChevronLeft, ChevronRight, Clock, Shield } from 'lucide-react';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';

export default function ActivityHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs', { params: { page, limit: 15 } });
      setLogs(res.data.data.data);
      setPagination({
        page: res.data.data.page,
        totalPages: res.data.data.totalPages,
        total: res.data.data.total,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const actionMap = {
    created: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    approved: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    rejected: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    checked_in: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    checked_out: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.performedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.remarks?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatedPage className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="text-indigo-600 dark:text-indigo-400" size={24} />
            System Audit & Activity History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of all visitor authorizations, security checks, and gate events
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bento-card p-3.5">
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            placeholder="Search audit trail by operator or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading audit log telemetry..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState title="No activity records found" />
      ) : (
        <div className="bento-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-black/20 border-b border-slate-200 dark:border-white/[0.06]">
                  {['Timestamp', 'Security Action', 'Performed By', 'Remarks / Details'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                {filteredLogs.map((log, i) => (
                  <motion.tr
                    key={log._id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10px' }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase border ${actionMap[log.action] || 'text-slate-400 bg-slate-500/10'}`}>
                        {getStatusLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{log.performedBy?.name || 'System Operator'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{log.performedBy?.role}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {log.remarks ? <span className="italic">"{log.remarks}"</span> : <span className="text-slate-400 italic">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filteredLogs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
                className="p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase border ${actionMap[log.action] || 'text-slate-400 bg-slate-500/10'}`}>
                    {getStatusLabel(log.action)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(log.performedBy?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{log.performedBy?.name || 'System Operator'}</p>
                    <p className="text-[10px] font-mono text-slate-400 capitalize">{log.performedBy?.role}</p>
                  </div>
                </div>
                {log.remarks && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-8">"{log.remarks}"</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <p>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total log entries)
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}

