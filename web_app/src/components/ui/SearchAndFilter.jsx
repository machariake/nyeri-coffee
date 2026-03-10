import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input, Button } from './index';

const SearchAndFilter = ({
  onSearch,
  onFilterChange,
  filters = [],
  placeholder = 'Search...',
  searchDebounce = 300
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      onSearch?.(value);
    }, searchDebounce);
    
    setDebounceTimer(timer);
  }, [debounceTimer, onSearch, searchDebounce]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    
    if (!value || value === 'all') {
      delete newFilters[filterKey];
    }
    
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchValue('');
    onSearch?.('');
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchValue;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
              focus:outline-none transition-all"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        
        {filters.length > 0 && (
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={Filter}
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {Object.keys(activeFilters).length + (searchValue ? 1 : 0)}
              </span>
            )}
          </Button>
        )}
        
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} leftIcon={X}>
            Clear
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-xl p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {filter.label}
                  </label>
                  
                  {filter.type === 'select' && (
                    <div className="relative">
                      <select
                        value={activeFilters[filter.key] || 'all'}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl
                          text-gray-900 appearance-none
                          focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                          focus:outline-none transition-all"
                      >
                        <option value="all">All {filter.label}</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                  
                  {filter.type === 'date' && (
                    <input
                      type="date"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl
                        text-gray-900
                        focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                        focus:outline-none transition-all"
                    />
                  )}
                  
                  {filter.type === 'text' && (
                    <input
                      type="text"
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder || ''}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl
                        text-gray-900 placeholder-gray-400
                        focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                        focus:outline-none transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {searchValue && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              Search: {searchValue}
              <button onClick={() => handleSearch('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find(f => f.key === key);
            const optionLabel = filter?.options?.find(o => o.value === value)?.label || value;
            return (
              <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {filter?.label}: {optionLabel}
                <button onClick={() => handleFilterChange(key, null)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default SearchAndFilter;
