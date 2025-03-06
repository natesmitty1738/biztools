'use client'

import React from 'react'
import { FiChevronRight } from 'react-icons/fi'
import Link from 'next/link'
import styles from './PageLayout.module.css'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageLayoutProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function PageLayout({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <FiChevronRight className={styles.breadcrumbSeparator} />}
              {item.href ? (
                <Link href={item.href} className={styles.breadcrumbLink}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.breadcrumbText}>{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 