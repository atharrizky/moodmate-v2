import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingHelp from '@/components/FloatingHelp'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MoodMate',
  description: 'Aplikasi Jurnal Kesehatan Mental',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <FloatingHelp /> {/* Menambahkan tombol bantuan ke seluruh aplikasi */}
      </body>
    </html>
  )
}