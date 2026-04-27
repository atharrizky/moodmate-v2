"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ThemeToggle from "./ThemeToggle" // <--- IMPORT TOMBOL TEMA

export default function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [myUsername, setMyUsername] = useState<string | null>(null)

  useEffect(() => {
    fetchMyUsername()
  }, [])

  async function fetchMyUsername() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()
      
      if (profile) setMyUsername(profile.username)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="fixed top-0 w-full bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 z-50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-[70px]">
        
        {/* LOGO & BRAND NAME */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-slate-300 dark:border-gray-700 group-hover:border-primary transition shadow-md">
            <img 
              src="/logo.png" 
              alt="MoodMate Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white group-hover:text-primary transition hidden sm:block">
            MoodMate 🌙
          </span>
        </Link>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-gray-400 font-medium">
          <Link href="/dashboard" className="hover:text-primary dark:hover:text-white transition">Dashboard</Link>
          <Link href="/history" className="hover:text-primary dark:hover:text-white transition">Riwayat</Link>
          <Link href="/shop" className="hover:text-primary dark:hover:text-white transition">Toko Pet</Link>
          <Link href="/leaderboard" className="text-primary hover:text-purple-600 dark:hover:text-purple-400 transition font-bold">Komunitas</Link>
          
          {/* TOMBOL TEMA (MATAHARI/BULAN) */}
          <div className="border-l border-slate-300 dark:border-gray-700 pl-6 flex items-center gap-4">
             <ThemeToggle />
             
             {/* Link ke Profil Sendiri */}
             {myUsername && (
               <Link href={`/profile/${myUsername}`} className="flex items-center gap-2 text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition shadow-sm">
                 👤 Profil
               </Link>
             )}

             <button 
               onClick={handleLogout} 
               className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2 rounded-xl transition font-bold text-xs uppercase tracking-wider"
             >
               Keluar
             </button>
          </div>
        </nav>

        {/* Hamburger Icon (Mobile) */}
        <div className="flex items-center gap-4 md:hidden">
          {/* Taruh tombol tema di luar menu mobile biar gampang diakses */}
          <ThemeToggle />
          
          <button 
            className="text-slate-600 dark:text-gray-400 hover:text-primary dark:hover:text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-gray-800 px-5 pt-2 pb-6 flex flex-col gap-4 text-sm text-slate-600 dark:text-gray-400 shadow-2xl absolute w-full animate-fade-in-down transition-colors duration-300">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="hover:text-primary dark:hover:text-white transition block py-2 border-b border-slate-100 dark:border-gray-800/50">Dashboard</Link>
          <Link href="/history" onClick={() => setIsOpen(false)} className="hover:text-primary dark:hover:text-white transition block py-2 border-b border-slate-100 dark:border-gray-800/50">Riwayat</Link>
          <Link href="/shop" onClick={() => setIsOpen(false)} className="hover:text-primary dark:hover:text-white transition block py-2 border-b border-slate-100 dark:border-gray-800/50">Toko Pet</Link>
          <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="text-primary font-bold transition block py-2 border-b border-slate-100 dark:border-gray-800/50">Komunitas</Link>
          
          {/* Link Profil Mobile */}
          {myUsername && (
            <Link href={`/profile/${myUsername}`} onClick={() => setIsOpen(false)} className="hover:text-primary dark:hover:text-white transition block py-2 border-b border-slate-100 dark:border-gray-800/50 text-slate-800 dark:text-white font-bold">
               👤 Profil Saya
            </Link>
          )}
          
          <button 
            onClick={() => { setIsOpen(false); handleLogout(); }} 
            className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-3 rounded-xl transition font-bold w-full mt-2 text-center shadow-sm"
          >
            KELUAR
          </button>
        </div>
      )}
    </header>
  )
}