"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Kalau udah login, langsung lempar ke Dashboard!
      router.push("/dashboard")
    } else {
      // Kalau belum, biarkan di halaman ini
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat...</div>

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center text-white relative overflow-hidden">
      
      {/* Background Ornamen */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-lg">
        <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-3xl border-2 border-primary/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          <img src="/logo.png" alt="MoodMate Logo" className="w-16 h-16 object-contain" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">MoodMate</span> 🌙
        </h1>
        
        <p className="text-lg text-gray-400 mb-10 leading-relaxed">
          Ruang aman untuk melacak emosimu, menulis jurnal, dan membangun kebiasaan sehat lewat gamifikasi yang seru.
        </p>

        <Link href="/login">
          <button className="w-full sm:w-auto bg-primary hover:bg-purple-500 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg hover:shadow-primary/50 transition-all hover:-translate-y-1">
            Mulai Perjalananmu
          </button>
        </Link>
      </div>
    </div>
  )
}