"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase" // Import Supabase

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
    <header className="fixed top-0 w-full bg-[#0f172a]/90 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-[70px]">
        
        {/* LOGO & BRAND NAME */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-gray-700 group-hover:border-primary transition shadow-lg">
            <img 
              src="/logo.png" 
              alt="MoodMate Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg tracking-wide text-white group-hover:text-primary transition hidden sm:block">
            MoodMate 🌙
          </span>
        </Link>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <Link href="/history" className="hover:text-white transition">Riwayat</Link>
          <Link href="/shop" className="hover:text-white transition">Toko Pet</Link>
          <Link href="/leaderboard" className="hover:text-white transition text-primary">Komunitas</Link>
          
          {/* Link ke Profil Sendiri (Dinamis) */}
          {myUsername && (
            <Link href={`/profile/${myUsername}`} className="flex items-center gap-2 text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-primary transition">
              👤 Profil
            </Link>
          )}

          <button 
            onClick={handleLogout} 
            className="ml-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl transition font-semibold text-xs uppercase tracking-wider"
          >
            Keluar
          </button>
        </nav>

        {/* Hamburger Icon (Mobile) */}
        <button 
          className="md:hidden text-gray-400 hover:text-white p-2"
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

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-gray-800 px-5 pt-2 pb-6 flex flex-col gap-4 text-sm text-gray-400 shadow-2xl absolute w-full animate-fade-in-down">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="hover:text-white transition block py-2 border-b border-gray-800/50">Dashboard</Link>
          <Link href="/history" onClick={() => setIsOpen(false)} className="hover:text-white transition block py-2 border-b border-gray-800/50">Riwayat</Link>
          <Link href="/shop" onClick={() => setIsOpen(false)} className="hover:text-white transition block py-2 border-b border-gray-800/50">Toko Pet</Link>
          <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="hover:text-white transition block py-2 border-b border-gray-800/50 text-primary">Komunitas</Link>
          
          {/* Link Profil Mobile */}
          {myUsername && (
            <Link href={`/profile/${myUsername}`} onClick={() => setIsOpen(false)} className="hover:text-white transition block py-2 border-b border-gray-800/50 text-white font-bold">
               👤 Profil Saya
            </Link>
          )}
          
          <button 
            onClick={() => { setIsOpen(false); handleLogout(); }} 
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition font-bold w-full mt-2 text-center"
          >
            KELUAR
          </button>
        </div>
      )}
    </header>
  )
}