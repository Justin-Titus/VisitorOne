import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  RotateCw,
  Hash,
  QrCode,
  Wifi,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Ban,
} from 'lucide-react';
import Modal from '../ui/Modal';
import VisitorBadgeCard from '../ui/VisitorBadgeCard';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';

interface VisitorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: any;
  onActionSuccess?: () => void;
}

export default function VisitorDetailModal({ isOpen, onClose, selected, onActionSuccess }: VisitorDetailModalProps) {
  const { user } = useAuth();
  const [badgeFlipped, setBadgeFlipped] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    if (isOpen && selected?._id) {
      setBadgeFlipped(false);
      setRemarkText('');
      fetchActivityLog(selected._id);
    }
  }, [isOpen, selected]);

  const fetchActivityLog = async (id: string) => {
    try {
      const res = await api.get(`/visitor-requests/${id}/activity`);
      setActivityLog(res.data.data || []);
    } catch {
      setActivityLog([]);
    }
  };

  const handleAction = async (action: string) => {
    if (!selected?._id) return;
    setActionLoading(action);
    try {
      const needsRemarks = ['reject', 'cancel'].includes(action);
      const body = needsRemarks ? { remarks: remarkText || 'No remarks provided' } : {};
      await api.patch(`/visitor-requests/${selected._id}/${action}`, body);
      toast.success(`Action '${action}' completed successfully`);
      fetchActivityLog(selected._id);
      if (onActionSuccess) onActionSuccess();
    } catch {
      // Error handled by api interceptor
    } finally {
      setActionLoading('');
    }
  };

  const actionMap: Record<string, { color: string; bg: string; dot: string }> = {
    created: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/15', dot: 'bg-blue-500' },
    approved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', dot: 'bg-emerald-500' },
    rejected: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/15', dot: 'bg-rose-500' },
    checked_in: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15', dot: 'bg-cyan-500' },
    checked_out: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10 dark:bg-slate-500/15', dot: 'bg-slate-400' },
    cancelled: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/15', dot: 'bg-amber-500' },
  };

  if (!selected) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor Pass & Security Audit"
      size="lg"
    >
      <div className="space-y-5">
        {/* Visual Double-Sided 3D Badge Preview */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-500" />
              {badgeFlipped ? 'Security Clearance & QR (Back)' : 'Official Badge Pass (Front)'}
            </span>
            <button
              type="button"
              onClick={() => setBadgeFlipped(!badgeFlipped)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/40 transition-colors shadow-xs"
            >
              <RotateCw
                size={12}
                className={`transition-transform duration-500 ${badgeFlipped ? 'rotate-180' : ''}`}
              />
              <span>{badgeFlipped ? 'View Front ID' : 'Flip Badge (Back)'}</span>
            </button>
          </div>

          <div className="perspective-1000 w-full min-h-[380px]">
            <motion.div
              animate={{ rotateY: badgeFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="preserve-3d relative w-full h-full"
            >
              {/* Front Side: Access Pass */}
              <div className="backface-hidden w-full">
                <VisitorBadgeCard
                  req={selected}
                  userRole={user?.role || 'employee'}
                  isInteractive={false}
                />
              </div>

              {/* Back Side: Security Clearance, Wi-Fi & QR */}
              <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full">
                <div className="physical-badge flex flex-col justify-between h-full shadow-xl">
                  {/* Top Lanyard Header */}
                  <div className="pt-3 pb-2 px-5 bg-slate-50 dark:bg-black/20 border-b border-slate-200/80 dark:border-white/[0.06]">
                    <div className="lanyard-slot mb-2" title="Lanyard Attachment Slot" />
                    <div className="flex items-center justify-between text-[11px] font-mono dark:text-slate-400 text-slate-500">
                      <span className="flex items-center gap-1 font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                        <Shield size={12} /> PROTOCOL & CLEARANCE
                      </span>
                      <span className="flex items-center gap-0.5 opacity-80">
                        <Hash size={11} />
                        {selected._id ? selected._id.slice(-6).toUpperCase() : 'PASS'}
                      </span>
                    </div>
                  </div>

                  {/* Holographic Security Strip */}
                  <div className="h-1.5 holographic-strip w-full opacity-80" />

                  {/* Back Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Simulated High-DPI QR Code */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                        <div className="w-20 h-20 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center">
                          <QrCode size={64} className="text-white" />
                        </div>
                        <span className="font-mono text-[9px] text-slate-700 mt-1 font-bold">
                          SCAN TO AUDIT
                        </span>
                      </div>

                      {/* Zone & Network Access */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Zone Clearance
                          </span>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                            ZONE 1 & 2 (COMMON)
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Wifi size={10} className="text-indigo-500" /> Guest Wi-Fi
                          </span>
                          <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 mt-0.5 font-bold">
                            VPMS-GUEST-5G
                          </p>
                          <p className="font-mono text-[9px] text-slate-500">
                            Pass: VPMS{selected._id?.slice(-4) || '2026'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Safety & NDA Notice */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Shield size={11} /> Building Security Policy
                      </p>
                      <p className="leading-tight">
                        Badge must remain visibly worn at all times. Escort required in restricted labs. Return pass at front gate upon departure.
                      </p>
                    </div>

                    {/* Security Hash Machine String */}
                    <div className="pt-2 border-t border-dashed border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>SHA256::VERIFIED</span>
                      <span>SIG::{selected._id?.slice(0, 10).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Actions — only show if this role has at least one available action */}
        {((user?.role === 'employee' && selected.status === 'pending') ||
          (user?.role === 'receptionist' && ['approved', 'checked_in'].includes(selected.status)) ||
          (['admin', 'receptionist'].includes(user?.role || '') && ['pending', 'approved'].includes(selected.status))) && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Remarks / Notes
            </label>
            <textarea
              placeholder="Enter any notes or remarks..."
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="input-field min-h-[70px]"
            />

            <div className="flex gap-2 flex-wrap">
              {user?.role === 'employee' && selected.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading === 'approve'}
                    className="btn-cyber !bg-emerald-600 hover:!bg-emerald-700 text-xs"
                  >
                    <CheckCircle size={14} /> Approve Access
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading === 'reject'}
                    className="btn-danger text-xs"
                  >
                    <XCircle size={14} /> Reject Request
                  </button>
                </>
              )}

              {user?.role === 'receptionist' && selected.status === 'approved' && (
                <button
                  onClick={() => handleAction('check-in')}
                  disabled={actionLoading === 'check-in'}
                  className="btn-cyber !bg-cyan-600 hover:!bg-cyan-700 text-xs"
                >
                  <LogIn size={14} /> Mark Checked-In
                </button>
              )}

              {/* Receptionist: Check-Out only when Checked In */}
              {user?.role === 'receptionist' && selected.status === 'checked_in' && (
                <button
                  onClick={() => handleAction('check-out')}
                  disabled={actionLoading === 'check-out'}
                  className="btn-cyber !bg-slate-800 hover:!bg-slate-900 text-xs"
                >
                  <LogOut size={14} /> Mark Checked-Out
                </button>
              )}

              {/* Cancel Pass: strictly only valid before check-in (pending or approved) */}
              {['admin', 'receptionist'].includes(user?.role || '') &&
                ['pending', 'approved'].includes(selected.status) && (
                  <button
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading === 'cancel'}
                    className="btn-danger text-xs"
                  >
                    <Ban size={14} /> Cancel Pass
                  </button>
                )}
            </div>
          </div>
        )}

        {/* Audit Trail Timeline */}
        {activityLog.length > 0 && (
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5 font-mono">
              <Clock size={13} className="text-indigo-500" /> Security Audit Trail
            </h4>
            <div className="space-y-2">
              {activityLog.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-3 p-2.5 rounded-xl border border-transparent ${
                    actionMap[log.action]?.bg || 'bg-slate-500/10'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      actionMap[log.action]?.dot || 'bg-slate-400'
                    }`}
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <p className={`font-bold ${actionMap[log.action]?.color || 'text-slate-700 dark:text-slate-200'}`}>
                        {getStatusLabel(log.action)}
                      </p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      By <span className="font-semibold">{log.performedBy?.name}</span> (
                      {log.performedBy?.role})
                    </p>
                    {log.remarks && (
                      <p className="text-slate-500 dark:text-slate-400 italic mt-0.5">
                        "{log.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
