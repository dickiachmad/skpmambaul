import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  type = 'danger',
}) => {
  // Prevent body scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getThemeClasses = () => {
    switch (type) {
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
          accentBorder: 'border-amber-500',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
          accentBorder: 'border-blue-500',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white',
          accentBorder: 'border-rose-500',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 overflow-y-auto no-print">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Center the modal */}
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100"
            >
              {/* Close Button top-right */}
              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  {/* Icon */}
                  <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:mx-0 sm:h-11 sm:w-11 ${theme.iconBg}`}>
                    {type === 'danger' ? (
                      <Trash2 className="h-5 w-5" />
                    ) : type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                  </div>

                  {/* Title and message */}
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-300 transition-all sm:mt-0 sm:w-auto cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs focus:outline-hidden focus:ring-2 transition-all sm:w-auto cursor-pointer ${theme.confirmBtn}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
