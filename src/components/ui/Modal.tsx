import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<OverlayProps & { maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => (
    <AnimatePresence>
    {isOpen && (
        <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                aria-hidden="true"
                onClick={onClose}
            />
            
            <div className="fixed inset-0 z-[101] overflow-y-auto pointer-events-none">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 pointer-events-auto" onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full ${maxWidth} bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-zinc-100 dark:border-white/10 text-left relative`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
                            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {children}
                    </motion.div>
                </div>
            </div>
        </>
    )}
  </AnimatePresence>
);

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Вы уверены?", 
  message = "Это действие нельзя отменить."
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="">
     <div className="text-center pt-2">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400 ring-4 ring-red-50 dark:ring-red-500/5">
           <AlertTriangle size={32} />
        </div>
        <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-xs mx-auto">
           {message}
        </p>
        <div className="grid grid-cols-2 gap-3">
           <button 
              onClick={onClose}
              className="py-3 rounded-xl border border-zinc-200 dark:border-white/10 font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
           >
              Отмена
           </button>
           <button 
              onClick={onConfirm}
              className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
           >
              Удалить
           </button>
        </div>
     </div>
  </Modal>
);
