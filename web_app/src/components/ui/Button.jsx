import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onClick,
  type = 'button',
  className = ''
}) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'bg-transparent border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30',
    white: 'bg-white text-gray-800 hover:bg-gray-50 shadow-lg'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  const isButtonDisabled = isDisabled || isLoading;

  return (
    <motion.button
      whileHover={!isButtonDisabled ? { scale: 1.02 } : {}}
      whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <Loader2 className="w-5 h-5 animate-spin" />
      )}
      {!isLoading && LeftIcon && (
        <LeftIcon className="w-5 h-5" />
      )}
      {children}
      {!isLoading && RightIcon && (
        <RightIcon className="w-5 h-5" />
      )}
    </motion.button>
  );
};

export default Button;
