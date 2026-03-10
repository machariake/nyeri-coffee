import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  subtitle = '', 
  icon: Icon,
  trend = null, // { value: number, isPositive: boolean }
  color = 'green',
  delay = 0
}) => {
  const colorClasses = {
    green: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600'
  };

  const bgClasses = {
    green: 'bg-emerald-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    gray: 'bg-gray-50'
  };

  const iconColorClasses = {
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden relative"
    >
      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-5 rounded-full -mr-16 -mt-16`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
            {Icon && <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="text-3xl font-bold text-gray-900"
        >
          {value}
        </motion.p>
        
        {subtitle && (
          <p className="text-gray-400 text-xs mt-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
