'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Navbar.module.css'
import { FiSearch, FiGithub, FiMenu, FiX } from 'react-icons/fi'

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.navLeft}>
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <div className={styles.navCenter}>
          {isSearchOpen ? (
            <div className={styles.searchContainer}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search documentation..."
                className={styles.searchInput}
                autoFocus
              />
              <button
                className={styles.closeSearch}
                onClick={() => setIsSearchOpen(false)}
              >
                <FiX />
              </button>
            </div>
          ) : (
            <button
              className={styles.searchButton}
              onClick={() => setIsSearchOpen(true)}
            >
              <FiSearch className={styles.searchIcon} />
              <span>Search documentation...</span>
              <div className={styles.searchShortcut}>⌘K</div>
            </button>
          )}
        </div>

        <div className={styles.navRight}>
          <Link
            href="https://github.com/yourusername/biztools"
            target="_blank"
            className={styles.githubLink}
          >
            <FiGithub />
          </Link>
        </div>
      </div>
    </nav>
  )
} 