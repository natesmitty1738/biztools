'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './CreateInvoiceModal.module.css'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InvoiceFormData {
  customer: string
  amount: number
  dueDate: string
  description: string
  billingFrequency: 'monthly' | 'quarterly' | 'yearly'
}

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<InvoiceFormData>()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setError(null)
      const response = await fetch('/api/billing/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: data.customer,
          amount: parseFloat(data.amount.toString()),
          due_date: new Date(data.dueDate).toISOString(),
          description: data.description,
          billing_frequency: data.billingFrequency,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const result = await response.json()
      console.log('Invoice created:', result)
      reset() // Reset form
      onSuccess() // Call success callback instead of onClose
    } catch (error) {
      console.error('Error creating invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to create invoice')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.header}>
            <h2 className={styles.title}>Create New Invoice</h2>
            <button 
              type="button" 
              className={styles.closeButton}
              onClick={onClose}
            >
              ×
            </button>
          </div>
          
          <div className={styles.body}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Customer
                <select {...register('customer')} className={styles.select}>
                  <option value="">Select customer</option>
                  <option value="john@example.com">John Doe</option>
                  <option value="jane@example.com">Jane Smith</option>
                </select>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Amount
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  {...register('amount')} 
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Due Date
                <input 
                  type="date" 
                  {...register('dueDate')} 
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Billing Frequency
                <select {...register('billingFrequency')} className={styles.select}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Description
                <input 
                  type="text" 
                  {...register('description')} 
                  className={styles.input}
                />
              </label>
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              onClick={onClose}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 