'use client'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
}

interface InvoiceFormData {
  customer: string
  amount: number
  dueDate: string
  description: string
  billingFrequency: 'monthly' | 'quarterly' | 'yearly'
}

export default function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<InvoiceFormData>()

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      // TODO: Implement invoice creation
      console.log('Creating invoice:', data)
      onClose()
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create New Invoice</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Customer</FormLabel>
                <Select {...register('customer')} placeholder="Select customer">
                  <option value="john@example.com">John Doe</option>
                  <option value="jane@example.com">Jane Smith</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField {...register('amount')} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Due Date</FormLabel>
                <Input type="date" {...register('dueDate')} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Billing Frequency</FormLabel>
                <Select {...register('billingFrequency')}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input {...register('description')} />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isSubmitting}
            >
              Create Invoice
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
} 