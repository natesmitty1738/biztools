'use client'

import React from 'react'
import styles from './PageLayout.module.css'

interface PageSectionProps {
  title?: string
  description?: string
  className?: string
  children: React.ReactNode
}

export function PageSection({ 
  title, 
  description, 
  className, 
  children 
}: PageSectionProps) {
  return (
    <div className={`${styles.section} ${className || ''}`}>
      {title && <h2 className={styles.sectionTitle}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  )
}

interface PageSectionGridProps {
  children: React.ReactNode
  className?: string
}

export function PageSectionGrid({ children, className }: PageSectionGridProps) {
  return (
    <div className={`${styles.grid} ${className || ''}`}>
      {children}
    </div>
  )
} 