'use client'

import { useState } from 'react'
import { Item } from '@prisma/client'
import { RecommendationList } from '@/components/recommender/RecommendationList'
import { FiSearch, FiRefreshCw } from 'react-icons/fi'

export default function RecommenderPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/recommendations?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError('Failed to fetch recommendations. Please try again.')
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = async (item: Item) => {
    try {
      await fetch(`/api/recommendations/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item.id }),
      })
    } catch (err) {
      console.error('Error recording click:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Product Recommendations
        </h1>
        <p className="text-gray-600 mb-6">
          Discover products tailored to your needs using our AI-powered recommendation system.
        </p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Describe what you're looking for..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <RecommendationList items={items} onItemClick={handleItemClick} />
      ) : !loading && (
        <div className="text-center py-12 text-gray-500">
          Enter a search query to get personalized recommendations
        </div>
      )}
    </div>
  )
} 