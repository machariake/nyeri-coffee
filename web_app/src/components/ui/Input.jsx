import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({
  label,
  error,
  helper,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5
            bg-white border-2 border-gray-200
            rounded-xl
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
            focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500
            ${LeftIcon ? 'pl-11' : ''}
            ${RightIcon ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <RightIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
      
      {helper && !error && (
        <p className="mt-1.5 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
