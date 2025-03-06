'use client';

import React from 'react';
import { FiBookOpen, FiTag, FiBarChart2 } from 'react-icons/fi';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
  llama_score?: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  reranked?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  reranked = false,
  onResultClick
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No results found for "{query}"
      </div>
    );
  }

  // Function to highlight query terms in text
  const highlightQuery = (text: string) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className="bg-yellow-200">{part}</span> : 
        part
    );
  };

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Function to format score as percentage
  const formatScore = (score: number) => {
    // Convert to percentage and fix to 1 decimal place
    return `${Math.round(score * 1000) / 10}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm mb-4">
        <div className="text-gray-500">
          Found {results.length} results for "{query}"
        </div>
        {reranked && (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            Results reranked with LLaMA
          </div>
        )}
      </div>
      
      {results.map((result) => (
        <div 
          key={result.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onResultClick && onResultClick(result)}
        >
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900">{highlightQuery(result.title)}</h3>
            <div className={`text-sm font-semibold ${getScoreColorClass(result.score)}`}>
              {formatScore(result.score)}
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-700">
            {highlightQuery(result.content.length > 200 ? 
              `${result.content.substring(0, 200)}...` : 
              result.content
            )}
          </div>
          
          <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
            <div className="flex items-center">
              <FiBookOpen className="mr-1" />
              <span>ID: {result.id}</span>
            </div>
            
            {result.metadata && result.metadata.category && (
              <div className="flex items-center">
                <FiTag className="mr-1" />
                <span>Category: {result.metadata.category}</span>
              </div>
            )}
            
            {result.llama_score !== undefined && (
              <div className="flex items-center">
                <FiBarChart2 className="mr-1" />
                <span>LLaMA Score: {formatScore(result.llama_score)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults; 