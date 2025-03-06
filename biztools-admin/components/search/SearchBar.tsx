'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiLoader, FiSettings } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (query: string, rerank: boolean) => void;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  loading = false,
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [rerank, setRerank] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), rerank);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="flex w-full">
        <div className="relative flex items-center w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-500" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          
          {loading ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FiLoader className="text-gray-400 animate-spin" />
            </div>
          ) : query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 ml-2 text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
          aria-label="Search options"
        >
          <FiSettings />
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 ml-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
          disabled={!query.trim() || loading}
        >
          Search
        </button>
      </form>
      
      {showOptions && (
        <div 
          ref={optionsRef}
          className="absolute right-0 z-10 p-4 mt-2 bg-white border border-gray-200 rounded-md shadow-lg"
        >
          <div className="text-sm font-medium text-gray-700 mb-2">Search Options</div>
          <div className="flex items-center">
            <input
              id="rerank-option"
              type="checkbox"
              checked={rerank}
              onChange={() => setRerank(!rerank)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="rerank-option" className="ml-2 text-sm text-gray-700">
              Use LLaMA for reranking
            </label>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Reranking improves results but is slower
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 