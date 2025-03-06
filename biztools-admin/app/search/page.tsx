'use client';

import React, { useState } from 'react';
import { FiSearch, FiDatabase, FiAlertCircle } from 'react-icons/fi';
import PageLayout from '@/components/PageLayout';
import { PageSection } from '@/components/PageSection';
import SearchBar from '@/components/search/SearchBar';
import SearchResults, { SearchResult } from '@/components/search/SearchResults';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [reranked, setReranked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [indexBuilt, setIndexBuilt] = useState(false);

  const handleSearch = async (query: string, rerank: boolean) => {
    setLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&rerank=${rerank}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform search');
      }
      
      const data = await response.json();
      setResults(data.results || []);
      setReranked(data.reranked || false);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const buildSearchIndex = async () => {
    setIndexBuilding(true);
    setError(null);

    try {
      const response = await fetch('/api/search/build-index', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to build search index');
      }
      
      setIndexBuilt(true);
    } catch (error) {
      console.error('Index building error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while building the index');
    } finally {
      setIndexBuilding(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Selected result:', result);
    // You can implement navigation or detail view here
  };

  return (
    <PageLayout title="Search">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Search</h1>
        <div>
          <button
            onClick={buildSearchIndex}
            disabled={indexBuilding}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-300"
          >
            <FiDatabase className="mr-2" />
            {indexBuilding ? 'Building Index...' : 'Build Search Index'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {indexBuilt && (
        <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50 text-green-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiDatabase className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Search index built successfully! You can now search for documents.
              </p>
            </div>
          </div>
        </div>
      )}

      <PageSection>
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch} 
            loading={loading}
            placeholder="Search for documents..."
            autoFocus
          />
        </div>

        {searchQuery && (
          <div className="mt-4">
            <SearchResults 
              results={results} 
              query={searchQuery} 
              reranked={reranked}
              onResultClick={handleResultClick}
            />
          </div>
        )}

        {!searchQuery && !loading && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <FiSearch className="text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">Fast Search with Embeddings</h3>
            <p className="text-center max-w-md mb-6">
              This search uses sentence-transformers for fast embedding-based retrieval 
              with optional LLaMA reranking for more accurate results.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Lightweight:</strong> Uses a small, efficient embedding model (all-MiniLM-L6-v2)
              </li>
              <li>
                <strong>Fast:</strong> Vector search with FAISS for near-instant results
              </li>
              <li>
                <strong>Intelligent:</strong> Optional LLaMA reranking for better relevance
              </li>
              <li>
                <strong>Flexible:</strong> Supports various content types and metadata
              </li>
            </ul>
          </div>
        )}
      </PageSection>
    </PageLayout>
  );
} 