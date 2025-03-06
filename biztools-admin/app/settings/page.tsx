'use client'

import { useState } from 'react'
import { FiSave, FiRefreshCw } from 'react-icons/fi'
import PageLayout from '@/components/PageLayout'
import { PageSection } from '@/components/PageSection'
import styles from './settings.module.css'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [generalForm, setGeneralForm] = useState({
    siteName: 'BizTools Admin',
    siteUrl: 'https://biztools.example.com',
    supportEmail: 'support@biztools.example.com'
  })
  
  const [recommenderForm, setRecommenderForm] = useState({
    modelPath: '/models/tinyllama-1.1b/tinyllama-1.1b-chat-v0.3.q4_0.gguf',
    cacheSize: '10000',
    falsePositiveRate: '0.01',
    contextSize: '512'
  })
  
  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Success message would go here
    setLoading(false)
  }
  
  const handleRecommenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Success message would go here
    setLoading(false)
  }

  return (
    <PageLayout
      title="Settings"
      description="Configure your application settings and preferences"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Settings' }
      ]}
    >
      <PageSection 
        title="General Settings" 
        description="Basic configuration for your BizTools instance"
      >
        <form onSubmit={handleGeneralSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="siteName" className={styles.label}>Site Name</label>
            <input
              id="siteName"
              type="text"
              value={generalForm.siteName}
              onChange={(e) => setGeneralForm({...generalForm, siteName: e.target.value})}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="siteUrl" className={styles.label}>Site URL</label>
            <input
              id="siteUrl"
              type="url"
              value={generalForm.siteUrl}
              onChange={(e) => setGeneralForm({...generalForm, siteUrl: e.target.value})}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="supportEmail" className={styles.label}>Support Email</label>
            <input
              id="supportEmail"
              type="email"
              value={generalForm.supportEmail}
              onChange={(e) => setGeneralForm({...generalForm, supportEmail: e.target.value})}
              className={styles.input}
            />
          </div>
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <FiRefreshCw className={styles.spinIcon} /> : <FiSave />}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </PageSection>
      
      <PageSection 
        title="Recommender Settings" 
        description="Configure the recommendation engine parameters"
      >
        <form onSubmit={handleRecommenderSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="modelPath" className={styles.label}>Model Path</label>
            <input
              id="modelPath"
              type="text"
              value={recommenderForm.modelPath}
              onChange={(e) => setRecommenderForm({...recommenderForm, modelPath: e.target.value})}
              className={styles.input}
            />
            <p className={styles.hint}>Path to the LLaMA/TinyLlama model file (.gguf)</p>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cacheSize" className={styles.label}>Cache Size</label>
              <input
                id="cacheSize"
                type="number"
                value={recommenderForm.cacheSize}
                onChange={(e) => setRecommenderForm({...recommenderForm, cacheSize: e.target.value})}
                className={styles.input}
              />
              <p className={styles.hint}>Maximum number of items in cache</p>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="falsePositiveRate" className={styles.label}>False Positive Rate</label>
              <input
                id="falsePositiveRate"
                type="number"
                step="0.001"
                min="0.001"
                max="0.1"
                value={recommenderForm.falsePositiveRate}
                onChange={(e) => setRecommenderForm({...recommenderForm, falsePositiveRate: e.target.value})}
                className={styles.input}
              />
              <p className={styles.hint}>Bloom filter false positive rate (0.001-0.1)</p>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contextSize" className={styles.label}>Context Size</label>
              <input
                id="contextSize"
                type="number"
                value={recommenderForm.contextSize}
                onChange={(e) => setRecommenderForm({...recommenderForm, contextSize: e.target.value})}
                className={styles.input}
              />
              <p className={styles.hint}>Maximum token context size</p>
            </div>
          </div>
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <FiRefreshCw className={styles.spinIcon} /> : <FiSave />}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </PageSection>
    </PageLayout>
  )
} 