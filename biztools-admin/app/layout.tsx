import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import styles from './layout.module.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'BizTools Admin',
  description: 'Admin panel for BizTools suite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={styles.html}>
      <body className={`${inter.className} ${styles.body}`} suppressHydrationWarning>
        <div className={styles.layout}>
          <Sidebar />
          <div className={styles.main}>
            <Navbar />
            <div className={styles.content}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
