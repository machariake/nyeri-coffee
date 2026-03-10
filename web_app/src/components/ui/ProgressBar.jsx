import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ 
  progress, 
  color = 'emerald',
  size = 'md',
  showLabel = true,
  animated = true,
  striped = false
}) => {
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      <div className={`w-full ${sizes[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`
            ${colors[color]} ${sizes[size]} rounded-full
            ${striped ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_20px]' : ''}
          `}
          style={striped ? {
            animation: 'stripe-slide 1s linear infinite'
          } : {}}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Progress</span>
          <motion.span 
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            className="text-xs font-medium text-gray-700"
          >
            {Math.round(clampedProgress)}%
          </motion.span>
        </div>
      )}
      
      <style>{`
        @keyframes stripe-slide {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
