'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'
import {
  FiHome,
  FiBox,
  FiSearch,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiSettings,
  FiChevronRight
} from 'react-icons/fi'

const menuItems = [
  {
    title: 'Getting Started',
    items: [
      { name: 'Dashboard', icon: FiHome, href: '/' },
      { name: 'Components', icon: FiBox, href: '/components' },
    ],
  },
  {
    title: 'Core Features',
    items: [
      { name: 'Search', icon: FiSearch, href: '/search' },
      { name: 'Recommender', icon: FiTrendingUp, href: '/recommender' },
      { name: 'Billing', icon: FiDollarSign, href: '/billing' },
    ],
  },
  {
    title: 'Management',
    items: [
      { name: 'Customers', icon: FiUsers, href: '/customers' },
      { name: 'Settings', icon: FiSettings, href: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleSection = (title: string) => {
    setCollapsed(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Link href="/" className={styles.logo}>
          BizTools
        </Link>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((section) => (
          <div key={section.title} className={styles.section}>
            <button
              className={styles.sectionTitle}
              onClick={() => toggleSection(section.title)}
            >
              <FiChevronRight
                className={`${styles.chevron} ${
                  collapsed[section.title] ? styles.collapsed : ''
                }`}
              />
              {section.title}
            </button>
            <ul
              className={`${styles.sectionItems} ${
                collapsed[section.title] ? styles.collapsed : ''
              }`}
            >
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.link} ${
                      pathname === item.href ? styles.active : ''
                    }`}
                  >
                    <item.icon className={styles.icon} />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
} 