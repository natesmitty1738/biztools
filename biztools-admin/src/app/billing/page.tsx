'use client'

import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Card,
  CardBody,
  Stack,
  Text
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FiDownload, FiEye, FiBell } from 'react-icons/fi';
import { CreateInvoiceModal } from '../../components/billing/CreateInvoiceModal';

const invoices = [
  {
    id: 'INV-2024-001',
    customer: 'John Doe',
    amount: 99.99,
    status: 'paid',
    date: '2024-02-01',
    dueDate: '2024-03-01',
  },
  {
    id: 'INV-2024-002',
    customer: 'Jane Smith',
    amount: 499.99,
    status: 'pending',
    date: '2024-02-15',
    dueDate: '2024-03-15',
  },
  // Add more sample data as needed
]

export default function BillingPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Billing & Invoices</Heading>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            colorScheme="blue"
            leftIcon={<AddIcon />}
          >
            Create Invoice
          </Button>
        </Box>

        <Card>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Invoice ID</Th>
                    <Th>Customer</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Due Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.map((invoice) => (
                    <Tr key={invoice.id}>
                      <Td>{invoice.id}</Td>
                      <Td>{invoice.customer}</Td>
                      <Td>${invoice.amount}</Td>
                      <Td>
                        <Text color={invoice.status === 'Paid' ? 'green.500' : 'orange.500'}>
                          {invoice.status}
                        </Text>
                      </Td>
                      <Td>{invoice.date}</Td>
                      <Td>{invoice.dueDate}</Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<ChevronDownIcon />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem icon={<FiEye />}>View Details</MenuItem>
                            <MenuItem icon={<FiBell />}>Send Reminder</MenuItem>
                            <MenuItem icon={<FiDownload />}>Download PDF</MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </Stack>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
} 