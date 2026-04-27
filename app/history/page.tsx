"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase" // Import Supabase

const moodThemes: Record<string, { bgClass: string, textClass: string, borderClass: string, hex: string }> = {
  joy: { bgClass: "bg-[#a3e635]", textClass: "text-[#064e3b]", borderClass: "border-[#65a30d]", hex: "#a3e635" },
  surprise: { bgClass: "bg-[#7dd3fc]", textClass: "text-[#0c4a6e]", borderClass: "border-[#0284c7]", hex: "#7dd3fc" },
  fear: { bgClass: "bg-[#fdba74]", textClass: "text-[#7c2d12]", borderClass: "border-[#ea580c]", hex: "#fdba74" },
  sad: { bgClass: "bg-[#93c5fd]", textClass: "text-[#1e3a8a]", borderClass: "border-[#2563eb]", hex: "#93c5fd" },
  disgust: { bgClass: "bg-[#d8b4fe]", textClass: "text-[#4c1d95]", borderClass: "border-[#7e22ce]", hex: "#d8b4fe" },
  anger: { bgClass: "bg-[#fca5a5]", textClass: "text-[#7f1d1d]", borderClass: "border-[#b91c1c]", hex: "#fca5a5" },
  trust: { bgClass: "bg-[#86efac]", textClass: "text-[#14532d]", borderClass: "border-[#166534]", hex: "#86efac" },
  anticipation: { bgClass: "bg-[#67e8f9]", textClass: "text-[#134e4a]", borderClass: "border-[#0f766e]", hex: "#67e8f9" },
  default: { bgClass: "bg-[#a3e635]", textClass: "text-[#064e3b]", borderClass: "border-[#65a30d]", hex: "#a3e635" }
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
      // 1. Ambil Session User
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      // 2. Ambil Nama User dari Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      
      setUserName(profile?.full_name || session.user.email?.split('@')[0])

      // 3. Ambil Data Jurnal dari Supabase
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
        useCORS: true // Penting jika ada gambar dari URL luar
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
    <div className="min-h-screen bg-background text-white pb-20 relative">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-[100px] px-5">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Arsip Jurnal {userName}</h1>
          <p className="text-gray-400 mt-2">Lihat kembali perjalanan refleksimu.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Memuat riwayat...</div>
        ) : entries.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 p-8 rounded-2xl text-center">
            <p className="text-gray-400">Belum ada jurnal yang dibuat. Yuk, mulai refleksimu hari ini!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                onClick={() => setSelectedEntry(entry)}
                className="bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-sm hover:border-primary transition cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white group-hover:text-primary transition">
                    {new Date(entry.created_at).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <img src={`/mood/${entry.mood}.png`} alt={entry.mood} className="w-8 h-8 drop-shadow-md group-hover:scale-110 transition" />
                </div>
                
                <p className="text-sm text-gray-500 italic mb-4">"Refleksi Hari Ini"</p>
                
                <div className="text-sm text-gray-300 line-clamp-3 leading-relaxed flex-grow whitespace-pre-line">
                  {entry.content || <span className="italic text-gray-600">(Tidak ada catatan tertulis)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POP-UP MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          {(() => {
            const activeMood = selectedEntry.mood || "default"
            const theme = moodThemes[activeMood] || moodThemes.default

            return (
              <div 
                ref={modalRef}
                className={`${theme.bgClass} ${theme.textClass} w-full max-w-2xl rounded-2xl p-8 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto`}
              >
                <button 
                  onClick={() => setSelectedEntry(null)}
                  data-html2canvas-ignore="true"
                  className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition ${theme.textClass} text-xl font-bold`}
                >
                  ✕
                </button>

                <div className={`flex justify-between items-start mb-6 border-b ${theme.borderClass} pb-4 pr-8`}>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {new Date(selectedEntry.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="italic opacity-80 mt-1">"Detail Refleksi"</p>
                  </div>
                  <img src={`/mood/${activeMood}.png`} alt="mood" className="w-12 h-12 opacity-90 drop-shadow-md" />
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Catatan Jurnal:</p>
                  <div className="leading-relaxed font-medium text-lg whitespace-pre-line">
                    {selectedEntry.content || "Tidak ada teks."}
                  </div>
                </div>

                <div data-html2canvas-ignore="true" className="mt-8 flex justify-center border-t border-black/10 pt-6">
                  <button 
                    onClick={handleDownload}
                    className="bg-[#0f172a] hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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