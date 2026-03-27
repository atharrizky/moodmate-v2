"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/storage"
import html2canvas from "html2canvas"

const affirmations = [
  "Kamu sangat tangguh, kuat, dan berani.",
  "Perasaanmu valid. Tarik napas dalam-dalam.",
  "Langkah kecil tetaplah sebuah kemajuan. Banggalah.",
  "Kamu telah berhasil melewati 100% hari-hari burukmu.",
  "Berikan dirimu ruang untuk bertumbuh dan pulih."
]

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

export default function ResultPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [entry, setEntry] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(true)
  const [countdown, setCountdown] = useState(6)
  const [quote] = useState(affirmations[Math.floor(Math.random() * affirmations.length)])

  useEffect(() => {
    const data = getUser()
    if (!data || data.entries.length === 0) {
      router.push("/dashboard")
      return
    }
    setUser(data)
    setEntry(data.entries[data.entries.length - 1])
  }, [router])

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

  if (!entry) return null

  const activeMood = entry.finalMood || entry.mood || "default"
  const theme = moodThemes[activeMood] || moodThemes.default
  const activePet = user?.activePet || (user?.pets?.length > 0 ? user.pets[user.pets.length - 1] : null)

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: theme.hex })
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `MoodMate_Reflection.png`
      link.click()
    } catch (err) {
      console.error("Gagal mendownload gambar", err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-24 pb-12 px-5 relative overflow-hidden">
      
      <button 
        className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition"
        onClick={() => router.push("/dashboard")}
      >
        &larr; Back to Dashboard
      </button>

      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold text-white mb-2">Your Entry is Saved!</h1>
        <p className="text-gray-400 mb-6">Here's your wonderful reflection. Feel free to share it!</p>
        
        <p className="text-lg text-gray-300">
          You went from feeling <span className="font-bold text-white capitalize">{entry.mood}</span> to <span className="font-bold text-white capitalize">{activeMood}</span>.
        </p>
      </div>

      <div 
        ref={cardRef}
        className={`${theme.bgClass} ${theme.textClass} w-full max-w-2xl rounded-xl p-8 md:p-12 shadow-2xl relative z-10 transition-colors duration-500`}
      >
        <div className={`flex justify-between items-start mb-8 border-b ${theme.borderClass} pb-4`}>
          <div>
            <h2 className="text-2xl font-bold">
              {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <p className="italic opacity-80 mt-1">"Today's Reflections"</p>
          </div>
          <img src={`/mood/${activeMood}.png`} alt="mood" className="w-10 h-10 opacity-80" />
        </div>

        <div className="flex flex-col gap-6">
          {entry.answers?.map((ans: any, index: number) => (
            <div key={index}>
              {/* Cek apakah format lama (string) atau format baru (object) */}
              {typeof ans === 'string' ? (
                <>
                  <p className="font-semibold text-lg mb-1">Catatan {index + 1}</p>
                  <p className="leading-relaxed opacity-90">{ans}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-lg mb-1">{ans.questionTitle}</p>
                  <p className="leading-relaxed opacity-90">{ans.answer}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between items-end">
          {activePet ? (
             <img src={`/pets/${activePet}.png`} alt="pet" className="w-16 h-16 drop-shadow-md" />
          ) : (
             <div className="w-16 h-16"></div>
          )}
          <span className={`px-4 py-1.5 text-xs rounded-full font-bold uppercase tracking-wider opacity-80 ${theme.borderClass} border`}>
            Created with MoodMate
          </span>
        </div>
      </div>

      <button 
        onClick={handleDownload}
        className="mt-8 bg-primary hover:bg-purple-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-3 z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Screenshot & Share
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-800 p-8 md:p-12 rounded-2xl text-center shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-6">A moment for you.</h2>
            <p className="text-lg italic text-gray-300 mb-8">"{quote}"</p>
            <p className="text-sm text-gray-500 mb-6">Closing in {countdown} seconds...</p>
            <button 
              onClick={() => setShowModal(false)}
              className="bg-primary hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-medium transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}