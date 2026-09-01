import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion, AnimatePresence } from 'framer-motion';

const transitionConfig = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

interface AppLayoutProps {
  _placeholder?: never;
}

export default function AppLayout(_props: AppLayoutProps) {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 1023px)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0 });
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (!isMobile) setIsPinned((prev) => !prev);
      }
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileOpen]);

  const desktopMargin = isMobile ? 0 : isPinned ? 240 : 72;

  return (
    <div className="relative flex h-screen dark:bg-[#090d16] bg-slate-50 transition-colors duration-200 overflow-hidden bg-cyber-grid">
      <div className="fixed -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none z-0 dark:from-indigo-600/25 dark:via-purple-600/15" />
      <div className="fixed -bottom-40 left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none z-0 dark:from-cyan-600/15" />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isMobile={isMobile}
      />

      <motion.div
        initial={false}
        animate={{ marginLeft: desktopMargin }}
        transition={transitionConfig}
        className="relative z-10 flex-1 flex flex-col h-screen min-w-0 overflow-hidden"
      >
        <Topbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen as Dispatch<SetStateAction<boolean>>} isMobile={isMobile} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
}
