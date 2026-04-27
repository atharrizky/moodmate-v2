"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase" 

// Warna pastel elegan disamakan dengan result page agar hasil download cantik
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

export default function History() {
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [userName, setUserName] = useState("User")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      
      setUserName(profile?.full_name || session.user.email?.split('@')[0])

      const { data: journals, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(journals || [])
    } catch (err) {
      console.error("Gagal mengambil riwayat:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!modalRef.current || !selectedEntry) return
    try {
      const activeMood = selectedEntry.mood || "default"
      const theme = moodThemes[activeMood] || moodThemes.default

      const canvas = await html2canvas(modalRef.current, { 
        scale: 2, 
        backgroundColor: theme.hex,
        useCORS: true 
      })
      
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `MoodMate_Archive_${new Date(selectedEntry.created_at).getTime()}.png`
      link.click()
    } catch (err) {
      console.error("Gagal mendownload gambar", err)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-20 relative transition-colors duration-300">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-[100px] px-5 relative z-10">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm">Arsip Jurnal {userName} 📖</h1>
          <p className="text-slate-500 dark:text-indigo-200/80 mt-2 font-medium">Lihat kembali perjalanan refleksimu di sini.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Memuat riwayat...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 p-8 md:p-12 rounded-[2rem] text-center shadow-sm">
            <span className="text-5xl mb-4 block opacity-50">📝</span>
            <p className="text-slate-500 dark:text-indigo-200/70 font-medium text-lg">Belum ada jurnal yang dibuat. Yuk, mulai refleksimu hari ini!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                onClick={() => setSelectedEntry(entry)}
                className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {new Date(entry.created_at).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Refleksi Hari Ini</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-full border border-slate-100 dark:border-slate-700">
                     <img src={`/mood/${entry.mood}.png`} alt={entry.mood} className="w-8 h-8 drop-shadow-md group-hover:scale-125 transition-transform duration-300" />
                  </div>
                </div>
                
                <div className="text-sm font-medium text-slate-600 dark:text-indigo-100/70 line-clamp-4 leading-relaxed flex-grow whitespace-pre-line mt-2">
                  {entry.content || <span className="italic text-slate-400 dark:text-slate-600">(Tidak ada catatan tertulis)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POP-UP MODAL (Dipertahankan HTML2Canvas logic-nya) */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in transition-colors">
          {(() => {
            const activeMood = selectedEntry.mood || "default"
            const theme = moodThemes[activeMood] || moodThemes.default

            return (
              <div 
                ref={modalRef}
                className={`${theme.bgClass} ${theme.textClass} w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto border-4 border-white/40`}
              >
                <button 
                  onClick={() => setSelectedEntry(null)}
                  data-html2canvas-ignore="true"
                  className={`absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition ${theme.textClass} text-xl font-bold`}
                >
                  ✕
                </button>

                <div className={`flex justify-between items-start mb-8 border-b-2 ${theme.borderClass} pb-6 border-opacity-30 pr-10`}>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black">
                      {new Date(selectedEntry.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="font-bold opacity-70 mt-2 uppercase tracking-wider text-xs sm:text-sm">"Detail Refleksi"</p>
                  </div>
                  <img src={`/mood/${activeMood}.png`} alt="mood" className="w-14 h-14 opacity-90 drop-shadow-md" />
                </div>

                <div className="flex flex-col gap-4 mb-8">
                  <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">Catatan Jurnal:</p>
                  <div className="leading-relaxed font-medium text-lg sm:text-xl whitespace-pre-line">
                    {selectedEntry.content || "Tidak ada teks."}
                  </div>
                </div>

                <div data-html2canvas-ignore="true" className="mt-10 flex justify-center pt-2">
                  <button 
                    onClick={handleDownload}
                    className="bg-white/30 hover:bg-white/50 text-current font-black py-4 px-8 rounded-2xl shadow-sm transition flex items-center gap-3 backdrop-blur-md border border-white/40"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Kartu Jurnal
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}