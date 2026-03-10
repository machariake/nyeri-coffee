import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500'
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-6 left-1/2 z-50"
        >
          <div className={`${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px]`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
