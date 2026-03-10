import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true,
  onClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={hover ? { 
        y: -4, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 }
      } : {}}
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-lg border border-gray-100
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
