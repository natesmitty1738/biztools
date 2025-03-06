'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './billing.module.css'
import CreateInvoiceModal from '@/components/billing/CreateInvoiceModal'
import { FiMoreVertical, FiTrash2, FiEye, FiEdit, FiPlus } from 'react-icons/fi'
import PageLayout from '@/components/PageLayout'
import { PageSection } from '@/components/PageSection'

interface Invoice {
  id: string
  customer_id: string
  amount: number
  status: string
  created_at: string
  paid_at: string | null
  subscription_id: string
}

export default function BillingPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices')
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return
    }

    try {
      setIsDeleting(invoiceId)
      const response = await fetch(`/api/billing/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }
      await fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Failed to delete invoice')
    } finally {
      setIsDeleting(null)
      setActiveMenu(null)
    }
  }

  const handleView = (invoice: Invoice) => {
    // For now, just show the invoice details in a console.log
    console.log('Viewing invoice:', invoice)
    alert('View functionality coming soon!')
    setActiveMenu(null)
  }

  const handleEdit = (invoice: Invoice) => {
    // For now, just show the invoice details in a console.log
    console.log('Editing invoice:', invoice)
    alert('Edit functionality coming soon!')
    setActiveMenu(null)
  }

  const handleInvoiceCreated = () => {
    fetchInvoices()
    setIsCreateModalOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeMenu) {
        const menuRef = menuRefs.current[activeMenu]
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setActiveMenu(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  return (
    <PageLayout
      title="Billing & Invoices"
      description="Manage your billing information, invoices, and payment methods."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Billing' }
      ]}
      actions={
        <button 
          className={styles.button}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <FiPlus size={18} />
          <span>New Invoice</span>
        </button>
      }
    >
      <PageSection title="Invoices">
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loading}>Loading invoices...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Paid</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.customer_id}</td>
                    <td className={styles.amountCell}>
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className={styles.dateCell}>
                      {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div 
                        className={styles.actionButtons} 
                        ref={el => {
                          menuRefs.current[invoice.id] = el
                        }}
                      >
                        <button 
                          className={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenu(activeMenu === invoice.id ? null : invoice.id)
                          }}
                        >
                          <FiMoreVertical />
                        </button>
                        {activeMenu === invoice.id && (
                          <div className={styles.menu}>
                            <button 
                              className={styles.menuItem}
                              onClick={() => handleView(invoice)}
                            >
                              <FiEye /> View
                            </button>
                            <button 
                              className={styles.menuItem}
                              onClick={() => handleEdit(invoice)}
                            >
                              <FiEdit /> Edit
                            </button>
                            <button 
                              className={`${styles.menuItem} ${styles.delete}`}
                              onClick={() => handleDelete(invoice.id)}
                              disabled={isDeleting === invoice.id}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageSection>

      {isCreateModalOpen && (
        <CreateInvoiceModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleInvoiceCreated}
        />
      )}
    </PageLayout>
  )
} 