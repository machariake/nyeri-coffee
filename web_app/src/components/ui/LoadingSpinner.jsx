import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'emerald',
  fullScreen = false,
  text = ''
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colors = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    orange: 'border-orange-500',
    white: 'border-white'
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        className={`
          ${sizes[size]}
          border-4 border-gray-200 ${colors[color]} border-t-transparent
          rounded-full
        `}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 text-sm font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
