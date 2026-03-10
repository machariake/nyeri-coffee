import React from 'react';
import { motion } from 'framer-motion';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  animated = false,
  className = ''
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-emerald-100 text-emerald-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-600',
    'outline-primary': 'bg-transparent border-2 border-emerald-500 text-emerald-600'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const Component = animated ? motion.span : 'span';
  const animationProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      {...animationProps}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

export default Badge;
