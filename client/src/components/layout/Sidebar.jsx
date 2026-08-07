import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  FileBarChart,
  History,
  UserPlus,
  LogOut as LogOutIcon,
  Shield,
  Pin,
  PinOff,
  X,
} from 'lucide-react';

const navByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/users', label: 'User Accounts', icon: UserCog },
    { to: '/visitor-requests', label: 'Visitor Requests', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: FileBarChart },
    { to: '/activity-history', label: 'Activity History', icon: History },
  ],
  receptionist: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/register-visitor', label: 'Register Visitor', icon: UserPlus },
    { to: '/visitor-requests', label: 'Visitor History', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: FileBarChart },
  ],
  employee: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/visitor-requests', label: 'Visitor Requests', icon: ClipboardList },
  ],
};

const transitionConfig = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1],
};

export default function Sidebar({
  isPinned,
  setIsPinned,
  isHovered,
  setIsHovered,
  mobileOpen,
  setMobileOpen,
  isMobile,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = navByRole[user?.role] || [];

  const isExpanded = isMobile ? true : isPinned || isHovered;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  // Mobile: slide in/out from left
  // Desktop: animate width between 72 and 240
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed left-0 top-0 bottom-0 h-dvh w-[260px] z-40 flex flex-col justify-between overflow-hidden
              bg-white dark:bg-[#0c101b]
              border-r border-slate-200 dark:border-white/[0.08] shadow-2xl"
          >
            {/* Logo Section */}
            <div className="h-15 flex items-center px-3 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <img src="/favicon.svg" alt="VisitorOne" className="w-10 h-10 object-contain drop-shadow-sm" />
              </div>
              <div className="flex-1 pl-1">
                <span className="font-bold text-base text-slate-900 dark:text-white whitespace-nowrap">
                  Visitor<span className="text-indigo-600 dark:text-indigo-400">One</span>
                </span>
              </div>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-3 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
              {links.map((link) => {
                const isActive =
                  location.pathname === link.to ||
                  (link.to !== '/dashboard' && location.pathname.startsWith(link.to));

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={handleNavClick}
                    className={`relative flex items-center h-10.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileSidebarActivePill"
                        className="absolute inset-0 bg-indigo-50/90 dark:bg-indigo-950/50 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <div className="relative z-10 w-12 h-full flex items-center justify-center flex-shrink-0">
                      <link.icon size={18} />
                    </div>
                    <div className="relative z-10 flex-1 pl-1 pr-2">
                      <span className="block whitespace-nowrap text-xs">{link.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] flex-shrink-0">
              {/* User info */}
              <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="relative flex items-center w-full h-10.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:!text-rose-600 hover:!bg-rose-500/10 transition-colors"
              >
                <div className="w-12 h-full flex items-center justify-center flex-shrink-0">
                  <LogOutIcon size={18} />
                </div>
                <div className="flex-1 pl-1 pr-2">
                  <span className="block whitespace-nowrap text-xs text-left">Logout</span>
                </div>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: existing hover-expand icon sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={transitionConfig}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden lg:flex fixed left-0 top-0 h-screen z-40 flex-col overflow-hidden
        bg-white dark:bg-[#0c101b]
        border-r border-slate-200 dark:border-white/[0.08] transition-shadow duration-200 ${
          isExpanded ? 'shadow-xl dark:shadow-black/60' : 'shadow-xs'
        }`}
    >
      {/* Logo Section */}
      <div className="h-15 flex items-center px-3 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0 overflow-hidden">
        <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
          <img src="/favicon.svg" alt="VisitorOne" className="w-10 h-10 object-contain drop-shadow-sm" />
        </div>
        <div className="flex-1 overflow-hidden min-w-0 pl-1">
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -6 }}
            transition={{ duration: 0.15 }}
            className="font-bold text-base text-slate-900 dark:text-white whitespace-nowrap block overflow-hidden text-ellipsis"
          >
            Visitor<span className="text-indigo-600 dark:text-indigo-400">One</span>
          </motion.span>
        </div>
        <motion.div
          animate={{
            opacity: isExpanded ? 1 : 0,
            scale: isExpanded ? 1 : 0.8,
            pointerEvents: isExpanded ? 'auto' : 'none',
          }}
          transition={{ duration: 0.15 }}
          className="flex-shrink-0"
        >
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin Sidebar (Ctrl+B)' : 'Pin Sidebar (Ctrl+B)'}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 transition-colors"
          >
            {isPinned ? <PinOff size={13} className="text-indigo-500" /> : <Pin size={13} />}
          </button>
        </motion.div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden relative">
        {links.map((link) => {
          const isActive =
            location.pathname === link.to ||
            (link.to !== '/dashboard' && location.pathname.startsWith(link.to));

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`relative flex items-center h-10.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
              }`}
              title={!isExpanded ? link.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  className="absolute inset-0 bg-indigo-50/90 dark:bg-indigo-950/50 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <div className="relative z-10 w-12 h-full flex items-center justify-center flex-shrink-0">
                <link.icon size={18} />
              </div>
              <div className="relative z-10 flex-1 overflow-hidden min-w-0 pl-1 pr-2">
                <motion.span
                  animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -6 }}
                  transition={{ duration: 0.15 }}
                  className="block whitespace-nowrap overflow-hidden text-ellipsis text-xs"
                >
                  {link.label}
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] flex-shrink-0">
        <button
          onClick={handleLogout}
          className="relative flex items-center w-full h-10.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:!text-rose-600 hover:!bg-rose-500/10 transition-colors"
          title={!isExpanded ? 'Logout' : undefined}
        >
          <div className="w-12 h-full flex items-center justify-center flex-shrink-0">
            <LogOutIcon size={18} />
          </div>
          <div className="flex-1 overflow-hidden min-w-0 pl-1 pr-2">
            <motion.span
              animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -6 }}
              transition={{ duration: 0.15 }}
              className="block whitespace-nowrap overflow-hidden text-ellipsis text-xs text-left"
            >
              Logout
            </motion.span>
          </div>
        </button>
      </div>
    </motion.aside>
  );
}
