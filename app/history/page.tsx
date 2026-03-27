"use client"

import Navbar from "@/components/Navbar"
import { getUser } from "@/lib/storage"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"

// Menambahkan kode warna "hex" agar html2canvas bisa mewarnai background hasil screenshot dengan akurat
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
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  
  // Ref untuk menargetkan area yang akan di-screenshot
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setUserName(user.name || user.email?.split('@')[0])
    const sortedEntries = [...user.entries].reverse()
    setEntries(sortedEntries)
  }, [router])

  const handleDownload = async () => {
    if (!modalRef.current || !selectedEntry) return
    try {
      const activeMood = selectedEntry.finalMood || selectedEntry.mood || "default"
      const theme = moodThemes[activeMood] || moodThemes.default

      const canvas = await html2canvas(modalRef.current, { 
        scale: 2, 
        backgroundColor: theme.hex 
      })
      
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `MoodMate_Archive_${new Date(selectedEntry.date).getTime()}.png`
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

        {entries.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 p-8 rounded-2xl text-center">
            <p className="text-gray-400">Belum ada jurnal yang dibuat. Yuk, mulai refleksimu hari ini!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, index) => {
              const displayMood = entry.finalMood || entry.mood
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-sm hover:border-primary transition cursor-pointer group flex flex-col h-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white group-hover:text-primary transition">
                      {new Date(entry.date).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    <img src={`/mood/${displayMood}.png`} alt={displayMood} className="w-8 h-8 drop-shadow-md group-hover:scale-110 transition" />
                  </div>
                  
                  <p className="text-sm text-gray-500 italic mb-4">"Refleksi Hari Ini"</p>
                  
                  <div className="text-sm text-gray-300 line-clamp-3 leading-relaxed flex-grow">
                    {entry.answers && entry.answers.length > 0 
                      ? entry.answers.map((a: any) => typeof a === 'string' ? a : a.answer).join(" | ") 
                      : <span className="italic text-gray-600">(Tidak ada catatan tertulis)</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* POP-UP MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          {(() => {
            const activeMood = selectedEntry.finalMood || selectedEntry.mood || "default"
            const theme = moodThemes[activeMood] || moodThemes.default

            return (
              <div 
                ref={modalRef}
                className={`${theme.bgClass} ${theme.textClass} w-full max-w-2xl rounded-2xl p-8 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto`}
              >
                
                {/* Tombol Tutup (Diabaikan saat screenshot) */}
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
                      {new Date(selectedEntry.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="italic opacity-80 mt-1">"Detail Refleksi"</p>
                  </div>
                  <img src={`/mood/${activeMood}.png`} alt="mood" className="w-12 h-12 opacity-90 drop-shadow-md" />
                </div>

                <div className="flex flex-col gap-2 mb-8 bg-white/20 p-4 rounded-xl border border-white/30">
                   <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">Perubahan Emosi:</p>
                   <p className="text-lg font-medium">Dari <span className="font-bold capitalize">{selectedEntry.mood}</span> menjadi <span className="font-bold capitalize">{activeMood}</span></p>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Catatan Jurnal:</p>
                  {selectedEntry.answers?.map((ans: any, i: number) => (
                    <div key={i} className={`mb-3 pb-3 border-b ${theme.borderClass} border-opacity-30 last:border-0`}>
                      {typeof ans === 'string' ? (
                        // Format Jurnal Lama
                        <p className="leading-relaxed font-medium">{ans}</p>
                      ) : (
                        // Format Jurnal Baru (Ada Pertanyaan & Jawaban)
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold opacity-75">{ans.questionTitle}</p>
                          <p className="leading-relaxed font-medium text-lg">{ans.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedEntry.answers || selectedEntry.answers.length === 0) && (
                    <p className="italic opacity-70 font-medium">Tidak ada teks yang ditulis pada sesi ini.</p>
                  )}
                </div>

                {/* Tombol Screenshot (Diabaikan saat html2canvas berjalan) */}
                <div data-html2canvas-ignore="true" className="mt-8 flex justify-center border-t border-black/10 pt-6">
                  <button 
                    onClick={handleDownload}
                    className="bg-[#0f172a] hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Arsip
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