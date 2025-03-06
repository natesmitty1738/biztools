'use client'

import React, { useState, useEffect } from 'react'
import { FiRefreshCw, FiUser, FiPackage, FiZap, FiSearch, FiBox, FiThumbsUp, FiShoppingCart, FiHeart } from 'react-icons/fi'
import PageLayout from '@/components/PageLayout'
import { PageSection } from '@/components/PageSection'
import styles from '../recommender.module.css'

interface Item {
  id: string;
  title: string;
  description: string;
  categories: string[];
  features: string[];
}

interface Recommendation {
  itemId: string;
  title: string;
  score: number;
}

interface SimilarItem {
  itemId: string;
  title: string;
  score: number;
}

interface User {
  id: string;
  name: string;
  preferences: string[];
}

const RecommenderTestPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [interactionType, setInteractionType] = useState<string>('click');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Initialize the recommender on page load
    initializeRecommender();
  }, []);

  const initializeRecommender = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommender/test/initialize', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize recommender');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setItems(data.items || []);
      setInitialized(true);
      showSuccess('Recommender initialized successfully');
    } catch (error) {
      console.error('Error initializing recommender:', error);
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!selectedUser) {
      showError('Please select a user first');
      return;
    }
    
    setLoading(true);
    setRecommendations([]);
    
    try {
      const response = await fetch(`/api/recommender/test/recommendations?userId=${selectedUser}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getSimilarItems = async () => {
    if (!selectedItem) {
      showError('Please select an item first');
      return;
    }
    
    setLoading(true);
    setSimilarItems([]);
    
    try {
      const response = await fetch(`/api/recommender/test/similar?itemId=${selectedItem}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get similar items');
      }
      
      const data = await response.json();
      setSimilarItems(data.similarItems || []);
    } catch (error) {
      console.error('Error getting similar items:', error);
      showError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const recordInteraction = async () => {
    if (!selectedUser || !selectedItem || !interactionType) {
      showError('Please select a user, item, and interaction type');
      return;
    }
    
    try {
      const response = await fetch('/api/recommender/test/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          itemId: selectedItem,
          interactionType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record interaction');
      }
      
      showSuccess(`Recorded ${interactionType} for ${selectedUser} on ${selectedItem}`);
    } catch (error) {
      console.error('Error recording interaction:', error);
      showError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getScoreColorClass = (score: number): string => {
    if (score >= 0.5) return 'text-green-600';
    if (score >= 0.3) return 'text-blue-600';
    if (score >= 0.1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <PageLayout
      title="Recommender System Test"
      description="Test the local LlamaBloomRecommender system with visual feedback"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Recommender', href: '/recommender' },
        { label: 'Test' }
      ]}
      actions={
        <button 
          className={styles.actionButton}
          onClick={initializeRecommender}
          disabled={loading}
        >
          <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>Reset Test</span>
        </button>
      }
    >
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <FiRefreshCw className="animate-spin mr-2" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageSection title="User Selection">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                disabled={!initialized || loading}
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.preferences.join(', ')})
                  </option>
                ))}
              </select>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
                onClick={getRecommendations}
                disabled={!selectedUser || loading}
              >
                <FiZap /> Get Recommendations
              </button>
            </div>
          </div>
        </PageSection>

        <PageSection title="Item Selection">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                disabled={!initialized || loading}
              >
                <option value="">Select an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center gap-2 hover:bg-green-600 disabled:opacity-50"
                onClick={getSimilarItems}
                disabled={!selectedItem || loading}
              >
                <FiSearch /> Find Similar
              </button>
            </div>
          </div>
        </PageSection>
      </div>

      <PageSection title="Simulate User Interaction">
        <div className="flex flex-wrap items-center gap-4">
          <select 
            className="w-64 p-2 border rounded-md"
            value={interactionType}
            onChange={e => setInteractionType(e.target.value)}
            disabled={loading}
          >
            <option value="click">Click</option>
            <option value="purchase">Purchase</option>
            <option value="wishlist">Wishlist</option>
          </select>
          <button 
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            onClick={recordInteraction}
            disabled={!selectedUser || !selectedItem || !interactionType || loading}
          >
            Record Interaction
          </button>
          <div className="text-sm text-gray-500">
            {selectedUser && selectedItem ? 
              `Record that ${users.find(u => u.id === selectedUser)?.name || selectedUser} ${interactionType}ed ${items.find(i => i.id === selectedItem)?.title || selectedItem}` : 
              'Select a user and item to record an interaction'
            }
          </div>
        </div>
      </PageSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PageSection title="Personalized Recommendations">
          {recommendations.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recommendations.map((rec, i) => (
                <div 
                  key={rec.itemId} 
                  className={`p-4 border rounded-lg ${getScoreColorClass(rec.score)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{rec.title}</h3>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-white shadow text-sm font-semibold">
                      {(rec.score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedUser ? (
            <div className="p-8 text-center text-gray-500">
              {initialized ? 'Get recommendations for this user' : 'Initialize the recommender first'}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Select a user to see recommendations</div>
          )}
        </PageSection>

        <PageSection title="Similar Items">
          {similarItems.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {similarItems.map((item, i) => (
                <div 
                  key={item.itemId} 
                  className={`p-4 border rounded-lg ${getScoreColorClass(item.score)}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="px-2 py-1 rounded-full bg-white shadow text-sm font-semibold">
                      {(item.score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedItem ? (
            <div className="p-8 text-center text-gray-500">
              {initialized ? 'Find similar items' : 'Initialize the recommender first'}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Select an item to find similar items</div>
          )}
        </PageSection>
      </div>
    </PageLayout>
  )
}

export default RecommenderTestPage 