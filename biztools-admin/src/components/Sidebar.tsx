'use client'

import {
  Box,
  VStack,
  Icon,
  Text,
  Link,
  Flex,
  Heading,
} from '@chakra-ui/react'
import {
  FiHome,
  FiDollarSign,
  FiSearch,
  FiTrendingUp,
  FiSettings,
  FiUsers,
} from 'react-icons/fi'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Billing', icon: FiDollarSign, path: '/billing' },
  { name: 'Search', icon: FiSearch, path: '/search' },
  { name: 'Recommender', icon: FiTrendingUp, path: '/recommender' },
  { name: 'Customers', icon: FiUsers, path: '/customers' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      bg="white"
      w="64"
      h="100vh"
      py="6"
      px="4"
      borderRight="1px"
      borderColor="gray.200"
    >
      <Flex mb="8" px="4">
        <Heading size="md" color="brand.500">
          BizTools
        </Heading>
      </Flex>
      <VStack spacing="2" align="stretch">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              as={NextLink}
              href={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                px="4"
                py="3"
                borderRadius="md"
                role="group"
                cursor="pointer"
                bg={isActive ? 'brand.50' : 'transparent'}
                color={isActive ? 'brand.500' : 'gray.600'}
                _hover={{
                  bg: 'brand.50',
                  color: 'brand.500',
                }}
              >
                <Icon
                  as={item.icon}
                  mr="4"
                  boxSize="5"
                  _groupHover={{ color: 'brand.500' }}
                />
                <Text fontSize="sm" fontWeight="medium">
                  {item.name}
                </Text>
              </Flex>
            </Link>
          )
        })}
      </VStack>
    </Box>
  )
} 