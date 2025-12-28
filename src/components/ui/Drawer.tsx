import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string; // e.g., 'md:w-[600px]'
}

export const Drawer: React.FC<OverlayProps> = ({ isOpen, onClose, title, children, footer, width = 'md:w-[600px]' }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed top-0 right-0 h-full w-full ${width} bg-white dark:bg-zinc-900 z-[101] shadow-2xl flex flex-col`}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
            <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              {title}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-8 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900 flex justify-end gap-4">
              {footer}
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
