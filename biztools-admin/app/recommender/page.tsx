'use client'

import { useState } from 'react'
import { Item } from '@prisma/client'
import { RecommendationList } from '@/components/recommender/RecommendationList'
import { FiSearch, FiRefreshCw, FiPlus } from 'react-icons/fi'
import PageLayout from '@/components/PageLayout'
import { PageSection, PageSectionGrid } from '@/components/PageSection'
import styles from './recommender.module.css'

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
      setError('An error occurred while fetching recommendations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: Item) => {
    console.log('Item clicked:', item)
    // Additional logic to handle item click if needed
  }

  return (
    <PageLayout 
      title="Recommender System" 
      description="Generate and manage product recommendations for your customers"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Recommender' }
      ]}
      actions={
        <button 
          className={styles.actionButton}
          onClick={() => alert('Add item functionality to be implemented')}
        >
          <FiPlus size={18} />
          <span>Add Item</span>
        </button>
      }
    >
      <PageSection
        title="Search Recommendations"
        description="Find recommendations based on a query or user profile"
      >
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter a search query..."
            className={styles.searchInput}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className={styles.searchButton} onClick={handleSearch} disabled={loading}>
            {loading ? <FiRefreshCw className={styles.spinIcon} /> : <FiSearch />}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
      </PageSection>

      <PageSection title="Recommendations">
        {loading ? (
          <div className={styles.loading}>
            <FiRefreshCw className={styles.spinIcon} />
            <span>Generating recommendations...</span>
          </div>
        ) : items.length > 0 ? (
          <RecommendationList items={items} onItemClick={handleItemClick} />
        ) : (
          <div className={styles.emptyState}>
            <p>No recommendations found. Try a different search query or add more items to your catalog.</p>
          </div>
        )}
      </PageSection>
    </PageLayout>
  )
} 