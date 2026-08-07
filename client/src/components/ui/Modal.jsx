import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Card — slides up on mobile, scales in on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-[#111726]
              rounded-t-2xl sm:rounded-2xl
              border border-slate-200 dark:border-white/[0.1] shadow-2xl overflow-hidden
              max-h-[92vh] sm:max-h-[85vh] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-black/20 flex-shrink-0">
              {/* Mobile drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-200 dark:bg-white/20 sm:hidden" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05]
                  hover:bg-slate-200 dark:hover:bg-white/[0.1]
                  flex items-center justify-center transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body — scrolls independently */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
