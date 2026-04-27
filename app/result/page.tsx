"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" 
import html2canvas from "html2canvas"

const affirmations = [
  "Kamu sangat tangguh, kuat, dan berani.",
  "Perasaanmu valid. Tarik napas dalam-dalam.",
  "Langkah kecil tetaplah sebuah kemajuan. Banggalah.",
  "Kamu telah berhasil melewati 100% hari-hari burukmu.",
  "Berikan dirimu ruang untuk bertumbuh dan pulih."
]

// Warna Pastel Diperbarui agar lebih estetik saat didownload
const moodThemes: Record<string, { bgClass: string, textClass: string, borderClass: string, hex: string }> = {
  joy: { bgClass: "bg-gradient-to-br from-[#fef08a] to-[#fde047]", textClass: "text-[#854d0e]", borderClass: "border-[#eab308]", hex: "#fef08a" },
  surprise: { bgClass: "bg-gradient-to-br from-[#fbcfe8] to-[#f9a8d4]", textClass: "text-[#831843]", borderClass: "border-[#ec4899]", hex: "#fbcfe8" },
  fear: { bgClass: "bg-gradient-to-br from-[#fed7aa] to-[#fdba74]", textClass: "text-[#7c2d12]", borderClass: "border-[#ea580c]", hex: "#fed7aa" },
  sad: { bgClass: "bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]", textClass: "text-[#1e3a8a]", borderClass: "border-[#3b82f6]", hex: "#bfdbfe" },
  disgust: { bgClass: "bg-gradient-to-br from-[#e9d5ff] to-[#d8b4fe]", textClass: "text-[#4c1d95]", borderClass: "border-[#9333ea]", hex: "#e9d5ff" },
  anger: { bgClass: "bg-gradient-to-br from-[#fecaca] to-[#fca5a5]", textClass: "text-[#7f1d1d]", borderClass: "border-[#ef4444]", hex: "#fecaca" },
  trust: { bgClass: "bg-gradient-to-br from-[#bbf7d0] to-[#86efac]", textClass: "text-[#14532d]", borderClass: "border-[#22c55e]", hex: "#bbf7d0" },
  anticipation: { bgClass: "bg-gradient-to-br from-[#a5f3fc] to-[#67e8f9]", textClass: "text-[#164e63]", borderClass: "border-[#06b6d4]", hex: "#a5f3fc" },
  default: { bgClass: "bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0]", textClass: "text-[#334155]", borderClass: "border-[#cbd5e1]", hex: "#f1f5f9" }
}

export default function ResultPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [entry, setEntry] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showModal, setShowModal] = useState(true)
  const [countdown, setCountdown] = useState(6)
  const [quote] = useState(affirmations[Math.floor(Math.random() * affirmations.length)])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestData()
  }, [])

  async function fetchLatestData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data: latestJournal, error: jError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (jError) throw jError

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, equipped_pet_id')
        .eq('id', session.user.id)
        .single()

      let petName = null
      if (profile?.equipped_pet_id) {
        const { data: pet } = await supabase
          .from('pets')
          .select('name')
          .eq('id', profile.equipped_pet_id)
          .single()
        petName = pet?.name.toLowerCase()
      }

      setEntry(latestJournal)
      setUserProfile({ ...profile, activePet: petName })
    } catch (err) {
      console.error("Error loading result:", err)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!showModal) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowModal(false)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showModal])

  const handleDownload = async () => {
    if (!cardRef.current || !entry) return
    try {
      const theme = moodThemes[entry.mood] || moodThemes.default
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: theme.hex })
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `MoodMate_Reflection_${new Date().getTime()}.png`
      link.click()
    } catch (err) {
      console.error("Gagal mendownload gambar", err)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center text-slate-800 dark:text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="animate-pulse font-bold text-indigo-600 dark:text-indigo-400">Menyiapkan kartu apresiasi...</p>
    </div>
  )
  
  if (!entry) return null

  const activeMood = entry.mood || "default"
  const theme = moodThemes[activeMood] || moodThemes.default
  const activePet = userProfile?.activePet

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center pt-24 pb-12 px-5 relative overflow-hidden transition-colors duration-300">
      
      <button 
        className="absolute top-8 left-5 sm:left-8 text-slate-500 hover:text-indigo-600 dark:text-indigo-200/70 dark:hover:text-white font-bold transition flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-sm z-20"
        onClick={() => router.push("/dashboard")}
      >
        &larr; Kembali
      </button>

      <div className="text-center mb-8 z-10 mt-8 sm:mt-0">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 drop-shadow-sm">Tersimpan! ✨</h1>
        <p className="text-slate-600 dark:text-indigo-200/80 mb-6 font-medium">Ini adalah refleksi jujurmu hari ini. Boleh disimpan atau dibagikan!</p>
        
        <div className="inline-flex bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 px-6 py-3 rounded-full shadow-sm">
           <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-indigo-100">
             Kamu sedang merasa <span className={`font-black uppercase tracking-wide ${theme.textClass}`}>{activeMood}</span>
           </p>
        </div>
      </div>

      <div 
        ref={cardRef}
        className={`${theme.bgClass} ${theme.textClass} w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 transition-colors duration-500 border-4 border-white/40`}
      >
        <div className={`flex justify-between items-start mb-8 border-b-2 ${theme.borderClass} pb-4 border-opacity-30`}>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              {new Date(entry.created_at).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <p className="font-bold opacity-70 mt-1 uppercase tracking-wider text-xs sm:text-sm">"Refleksi Hari Ini"</p>
          </div>
          <img src={`/mood/${activeMood}.png`} alt="mood" className="w-12 h-12 drop-shadow-md" />
        </div>

        <div className="flex flex-col gap-6">
            <div className="whitespace-pre-line leading-relaxed font-medium opacity-90 text-lg sm:text-xl">
                {entry.content}
            </div>
        </div>

        <div className="mt-12 flex justify-between items-end">
          {activePet ? (
             <img src={`/pets/${activePet}.png`} alt="pet" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />
          ) : (
             <div className="w-16 h-16"></div>
          )}
          <span className={`px-5 py-2 text-[10px] sm:text-xs rounded-full font-black uppercase tracking-widest opacity-80 ${theme.borderClass} border-2 bg-white/20 backdrop-blur-sm`}>
            Created with MoodMate
          </span>
        </div>
      </div>

      <button 
        onClick={handleDownload}
        className="mt-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-white font-black py-4 px-10 rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_25px_rgba(79,70,229,0.4)] flex items-center gap-3 z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Simpan Kartu
      </button>

      {/* POP-UP AFIRMASI */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 p-8 md:p-12 rounded-[2.5rem] text-center shadow-2xl max-w-md w-full relative overflow-hidden animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 relative z-10">Momen untukmu.</h2>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl mb-8 border border-indigo-100 dark:border-indigo-800/30">
               <p className="text-lg font-bold italic text-indigo-700 dark:text-indigo-200">"{quote}"</p>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-widest">Menutup dalam {countdown} detik</p>
            <button 
              onClick={() => setShowModal(false)}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:text-indigo-900 text-white px-8 py-3 rounded-xl font-black transition-all shadow-md w-full hover:scale-105"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}