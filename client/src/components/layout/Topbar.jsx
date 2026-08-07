import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import api from '../../services/api';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';
import { Sun, Moon, Bell, Check, Clock, UserCheck, ShieldAlert, ExternalLink, Shield, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Topbar({ mobileOpen, setMobileOpen, isMobile }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const routeTitles = {
    '/dashboard': { title: 'Dashboard Overview', category: 'Operations Command' },
    '/visitor-requests': { title: 'Visitor Requests & Passes', category: 'Access Control' },
    '/employees': { title: 'Staff Directory', category: 'Personnel Records' },
    '/users': { title: 'User Accounts & Roles', category: 'Security Administration' },
    '/reports': { title: 'Analytics & Reports', category: 'Security Intelligence' },
    '/activity-history': { title: 'Audit & Activity Logs', category: 'System Audit' },
    '/register-visitor': { title: 'Register New Visitor', category: 'Reception Desk' },
  };

  const currentRoute = Object.keys(routeTitles).find((path) =>
    location.pathname.startsWith(path)
  );

  const activeHeader = routeTitles[currentRoute] || {
    title: 'Security Operations',
    category: 'Authenticated Access',
  };

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const roleLabel = {
    admin: 'Administrator',
    receptionist: 'Receptionist',
    employee: 'Staff Host',
  };

  const storageKey = `vpms_read_notifs_${user?._id || 'default'}`;

  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`vpms_read_notifs_${user?._id || 'default'}`) || '[]');
    } catch {
      return [];
    }
  });

  // Unique key per request+status event so each status change = distinct notification
  const makeEventKey = (id, status) => `${id}::${status}`;

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Role-aware query: employees only see their own requests
      const params = { limit: 10 };
      // No extra filter needed — the backend already scopes employees to their own via req.user.employeeRef

      const res = await api.get('/visitor-requests', { params });
      const items = res.data.data.data || [];

      let currentRead = [];
      try {
        currentRead = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {
        currentRead = [];
      }

      const notifs = [];

      items.forEach((req) => {
        const role = user?.role;
        const visitorName = req.visitor?.name || 'Visitor';
        const employeeName = req.employeeToVisit?.name || 'Staff';

        // ----- Determine which notification(s) are relevant for this role -----

        // PENDING → employee needs to approve
        if (req.status === 'pending' && role === 'employee') {
          const key = makeEventKey(req._id, 'pending');
          notifs.push({
            id: key,
            title: 'Approval Required',
            desc: `${visitorName} wants to visit you`,
            time: req.createdAt,
            status: 'pending',
            isRead: currentRead.includes(key),
            icon: Clock,
            color: 'text-amber-500 bg-amber-500/10',
            reqId: req._id,
          });
        }

        // APPROVED → receptionist needs to check them in
        if (req.status === 'approved' && (role === 'receptionist' || role === 'admin')) {
          const key = makeEventKey(req._id, 'approved');
          notifs.push({
            id: key,
            title: 'Pass Approved — Awaiting Check-In',
            desc: `${visitorName} visiting ${employeeName} is cleared to enter`,
            time: req.decidedAt || req.updatedAt,
            status: 'approved',
            isRead: currentRead.includes(key),
            icon: Check,
            color: 'text-indigo-500 bg-indigo-500/10',
            reqId: req._id,
          });
        }

        // CHECKED_IN → notify the employee their visitor has arrived
        if (req.status === 'checked_in' && (role === 'employee' || role === 'admin')) {
          const key = makeEventKey(req._id, 'checked_in');
          notifs.push({
            id: key,
            title: 'Visitor Has Arrived',
            desc: `${visitorName} checked in at reception`,
            time: req.checkInTime || req.updatedAt,
            status: 'checked_in',
            isRead: currentRead.includes(key),
            icon: UserCheck,
            color: 'text-emerald-500 bg-emerald-500/10',
            reqId: req._id,
          });
        }

        // CHECKED_OUT → inform employee visit is complete
        if (req.status === 'checked_out' && role === 'employee') {
          const key = makeEventKey(req._id, 'checked_out');
          notifs.push({
            id: key,
            title: 'Visit Completed',
            desc: `${visitorName} has checked out`,
            time: req.checkOutTime || req.updatedAt,
            status: 'checked_out',
            isRead: currentRead.includes(key),
            icon: ShieldAlert,
            color: 'text-slate-400 bg-slate-500/10',
            reqId: req._id,
          });
        }

        // REJECTED → inform receptionist/admin pass was rejected
        if (req.status === 'rejected' && (role === 'receptionist' || role === 'admin')) {
          const key = makeEventKey(req._id, 'rejected');
          notifs.push({
            id: key,
            title: 'Pass Rejected',
            desc: `${visitorName}'s visit to ${employeeName} was declined`,
            time: req.decidedAt || req.updatedAt,
            status: 'rejected',
            isRead: currentRead.includes(key),
            icon: ShieldAlert,
            color: 'text-rose-500 bg-rose-500/10',
            reqId: req._id,
          });
        }

        // CANCELLED → admin awareness
        if (req.status === 'cancelled' && role === 'admin') {
          const key = makeEventKey(req._id, 'cancelled');
          notifs.push({
            id: key,
            title: 'Pass Cancelled',
            desc: `${visitorName}'s pass was cancelled`,
            time: req.cancelledAt || req.updatedAt,
            status: 'cancelled',
            isRead: currentRead.includes(key),
            icon: ShieldAlert,
            color: 'text-gray-400 bg-gray-500/10',
            reqId: req._id,
          });
        }
      });

      // Sort: unread first, then by time descending
      notifs.sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return new Date(b.time) - new Date(a.time);
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch {
      // Ignore background fetch errors silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNotificationClick = (notif) => {
    if (notif && notif.id && !notif.isRead) {
      const updatedRead = Array.from(new Set([...readIds, notif.id]));
      setReadIds(updatedRead);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedRead));
      } catch {}
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    navigate('/visitor-requests');
  };

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updatedRead = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updatedRead);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedRead));
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };


  return (
    <header className="h-15 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-[#0c101b]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] sticky top-0 z-30">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
        {/* Mobile Hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-8.5 h-8.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={16} />
        </motion.button>

        {/* Dynamic Page Identity */}
        <div className="min-w-0 flex flex-col justify-center">
          <h2 className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">
            {activeHeader.category}
          </h2>
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {activeHeader.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Notification Bell Dropdown Container */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) fetchNotifications();
            }}
            aria-label={`Security Notifications (${unreadCount} unread)`}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            className={`relative w-8.5 h-8.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
              isOpen
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.06]'
            }`}
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 bg-indigo-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center font-mono shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Animated Notification Popover */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                role="dialog"
                aria-label="Security Notifications List"
                className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2.5 sm:w-80 md:w-92 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/20">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                      Security Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {loading ? (
                    <div className="p-5 text-center text-xs text-slate-400 font-mono">
                      Loading alerts...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-mono">
                      No new alerts
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const IconComponent = n.icon;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer flex gap-2.5 group text-left relative ${
                            !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${n.color}`}
                          >
                            <IconComponent size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-xs flex items-center gap-1.5 truncate ${
                                !n.isRead
                                  ? 'font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                  : 'font-medium text-slate-600 dark:text-slate-300'
                              }`}>
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 flex-shrink-0 animate-pulse" />
                                )}
                                <span className="truncate">{n.title}</span>
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 ml-1 whitespace-nowrap">
                                {formatDateTime(n.time)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 text-center bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/visitor-requests');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 w-full"
                  >
                    View All Visitor Passes <ExternalLink size={11} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle Button */}
        <motion.button
          whileTap={{ scale: 0.9, rotate: 15 }}
          onClick={toggleTheme}
          className="w-8.5 h-8.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors text-slate-600 dark:text-slate-400 flex-shrink-0"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} />
            )}
          </motion.div>
        </motion.button>

        {/* User Badge Profile */}
        <div className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-200 dark:border-white/[0.08] flex-shrink-0">
          <div className="w-7.5 h-7.5 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs border border-indigo-400/20 font-mono flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block max-w-[110px] md:max-w-[150px] min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold uppercase truncate">
              {roleLabel[user?.role] || user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
