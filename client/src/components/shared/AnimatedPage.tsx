import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className={className}>
      {children}
    </motion.div>
  );
}
