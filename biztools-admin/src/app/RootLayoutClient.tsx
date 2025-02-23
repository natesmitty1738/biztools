'use client'

import { Providers } from './providers'
import { Box, Flex } from '@chakra-ui/react'
import Sidebar from '../components/Sidebar'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <Flex h="100vh">
        <Sidebar />
        <Box flex="1" p="6" bg="gray.50" overflowY="auto">
          {children}
        </Box>
      </Flex>
    </Providers>
  )
} 