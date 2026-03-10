import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer = null
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-full ${sizes[size]} z-50
              bg-white rounded-2xl shadow-2xl
              max-h-[90vh] overflow-hidden
            `}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
