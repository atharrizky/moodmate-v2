import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import FloatingHelp from '@/components/FloatingHelp'
import { ThemeProvider } from '@/components/ThemeProvider' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MoodMate - Catat & Pahami Emosimu Harian',
  description: 'Ruang amanmu untuk mengenali diri dan merawat emosi setiap hari.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen relative overflow-x-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#0B0F19]`}>
        
        <ThemeProvider>
          {/* ============================================================== */}
          {/* LAYER 1: BACKGROUND MALAM (Bintang & Aurora) - KHUSUS DARK MODE */}
          {/* ============================================================== */}
          <div className="fixed inset-0 pointer-events-none z-[-1] hidden dark:block bg-night-sky overflow-hidden">
            <div className="aurora-1"></div>
            <div className="aurora-2"></div>
            <div className="stars-1"></div>
            <div className="stars-2"></div>
            <div className="stars-3"></div>
          </div>

          {/* ============================================================== */}
          {/* LAYER 2: BACKGROUND SIANG (Awan & Cahaya Pagi) - KHUSUS LIGHT MODE */}
          {/* ============================================================== */}
          <div className="fixed inset-0 pointer-events-none z-[-1] block dark:hidden bg-day-sky overflow-hidden">
            <div className="cloud-1"></div>
            <div className="cloud-2"></div>
            <div className="sun-glow"></div>
            <div className="absolute inset-0 day-particles"></div>
          </div>

          {/* KONTEN UTAMA */}
          <div className="relative z-10">
            {children}
            <FloatingHelp />
          </div>
        </ThemeProvider>

      </body>
    </html>
  )
}