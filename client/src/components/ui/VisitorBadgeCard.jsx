import { motion } from 'framer-motion';
import { formatDate, getStatusLabel } from '../../utils/helpers';
import {
  Building2,
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function VisitorBadgeCard({
  req,
  userRole,
  onOpenDetail,
  onAction,
  actionLoading,
  isInteractive = true,
  onPrint,
}) {
  const visitor = req?.visitor || {};
  const employee = req?.employeeToVisit || {};
  const status = req?.status || 'pending';
  const passId = req?._id ? req._id.slice(-6).toUpperCase() : 'DRAFT';

  const stampClass =
    {
      pending: 'stamp-pending',
      approved: 'stamp-approved',
      checked_in: 'stamp-checked-in',
      checked_out: 'stamp-checked-out',
      rejected: 'stamp-rejected',
      cancelled: 'stamp-cancelled',
    }[status] || 'stamp-pending';

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10px' }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="physical-badge relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
      >
        {/* Top Lanyard Attachment Slot & Header */}
        <div className="pt-3 pb-2 px-5 bg-slate-50 dark:bg-black/20 border-b border-slate-200/80 dark:border-white/[0.06] relative z-10">
          <div className="lanyard-slot mb-2" title="Lanyard Attachment Slot" />
          <div className="flex items-center justify-between text-[11px] font-mono dark:text-slate-400 text-slate-500">
            <span className="flex items-center gap-1.5 font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={13} className="text-indigo-500" /> SECURITY ACCESS PASS
            </span>
          </div>
        </div>

        {/* Holographic Security Strip */}
        <div className="h-1.5 holographic-strip w-full opacity-80 relative z-10" />

        {/* Main Badge Body */}
        <div className="p-5 flex-1 flex flex-col justify-between relative z-10">
          {/* Stamp Overlay */}
          <div className="absolute right-4 top-4 pointer-events-none z-10">
            <div className={`badge-stamp ${stampClass}`}>
              {status === 'checked_in' ? 'CHECKED IN' : getStatusLabel(status)}
            </div>
          </div>

          <div>
            {/* Visitor Avatar & Identity */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-indigo-400/30 flex-shrink-0">
                {visitor.name ? visitor.name.charAt(0).toUpperCase() : 'V'}
              </div>
              <div className="min-w-0 pr-16">
                <h3 className="font-bold text-base dark:text-white text-slate-900 leading-tight truncate">
                  {visitor.name || 'Visitor Name'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <Building2 size={12} className="flex-shrink-0 text-slate-400" />
                  {visitor.company || 'Independent Visitor'}
                </p>
                {visitor.phone && (
                  <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    {visitor.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] text-xs mb-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                  Host / Employee
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {employee.name || 'Staff Member'}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {employee.department || 'Department'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                  Schedule
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  {req?.visitDate ? formatDate(req.visitDate) : 'Today'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock size={10} className="text-slate-400" />
                  {req?.expectedArrivalTime || '—'}
                </p>
              </div>

              <div className="col-span-2 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                  Purpose
                </span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-1 italic text-[11px]">
                  "{req?.purpose || 'Official Visit'}"
                </p>
              </div>
            </div>
          </div>

          {/* Security Barcode & Machine-Readable Line */}
          <div className="relative pt-2 border-t border-dashed border-slate-200 dark:border-white/[0.08] flex items-center justify-between overflow-hidden">
            {/* Live laser scan beam for on-site active visitors */}
            {status === 'checked_in' && <div className="laser-scan-bar" />}

            <div className="flex items-center gap-0.5 h-5 opacity-70">
              {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-800 dark:bg-slate-300 h-full rounded-xs"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
              {status === 'checked_in' && <Sparkles size={10} className="text-cyan-500 animate-pulse" />}
              AUTH::{passId}
            </span>
          </div>
        </div>

        {/* Footer: Preview Mode Status or Interactive Action Bar */}
        {userRole === 'preview' ? (
          <div className="p-2.5 px-4 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500 relative z-10">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
              <Sparkles size={12} className="animate-pulse" /> LIVE DRAFT PREVIEW
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              UNISSUED PASS
            </span>
          </div>
        ) : (
          isInteractive && (
            <div className="p-3 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2 relative z-10">
              {onOpenDetail && (
                <button
                  onClick={() => onOpenDetail(req)}
                  className="btn-secondary !px-2.5 !py-1.5 text-xs flex items-center gap-1.5"
                  title="Inspect Badge Details & Security Audit"
                >
                  <Eye size={13} />
                  <span>Details</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                {onPrint && (
                  <button
                    onClick={() => onPrint(req)}
                    className="btn-secondary !px-2.5 !py-1.5 text-xs text-slate-600 dark:text-slate-300"
                    title="Print Security Badge"
                  >
                    <Printer size={13} />
                  </button>
                )}

                {/* Employee Quick Approval */}
                {userRole === 'employee' && status === 'pending' && onAction && (
                  <>
                    <button
                      onClick={() => onAction('approve', req._id)}
                      disabled={actionLoading === 'approve'}
                      className="btn-cyber !px-2.5 !py-1.5 text-xs !bg-emerald-600 hover:!bg-emerald-700"
                    >
                      <CheckCircle size={13} />
                      <span>Approve</span>
                    </button>
                    {onOpenDetail && (
                      <button
                        onClick={() => onOpenDetail(req)}
                        className="btn-danger !px-2.5 !py-1.5 text-xs"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    )}
                  </>
                )}

                {/* Receptionist Quick Check-In */}
                {userRole === 'receptionist' && status === 'approved' && onAction && (
                  <button
                    onClick={() => onAction('check-in', req._id)}
                    disabled={actionLoading === 'check-in'}
                    className="btn-cyber !px-3 !py-1.5 text-xs !bg-cyan-600 hover:!bg-cyan-700"
                  >
                    <LogIn size={13} />
                    <span>Check In</span>
                  </button>
                )}

                {/* Receptionist Quick Check-Out */}
                {userRole === 'receptionist' && status === 'checked_in' && onAction && (
                  <button
                    onClick={() => onAction('check-out', req._id)}
                    disabled={actionLoading === 'check-out'}
                    className="btn-cyber !px-3 !py-1.5 text-xs !bg-slate-700 hover:!bg-slate-800"
                  >
                    <LogOut size={13} />
                    <span>Check Out</span>
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
