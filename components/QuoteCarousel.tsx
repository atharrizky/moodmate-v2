"use client"
import { useState, useEffect, useCallback } from "react"

const quotesData = [
  // JOY
  { mood: "joy", en: "Joy is not in things; it is in us.", id: "Kegembiraan tidak ada pada benda-benda; ia ada di dalam diri kita.", author: "Richard Wagner" },
  { mood: "joy", en: "Find joy in the ordinary.", id: "Temukan kegembiraan dalam hal-hal biasa.", author: "Max Lucado" },
  // TRUST
  { mood: "trust", en: "Trust is the glue of life.", id: "Kepercayaan adalah perekat kehidupan.", author: "Stephen Covey" },
  { mood: "trust", en: "To be trusted is a greater compliment than being loved.", id: "Dipercaya adalah pujian yang jauh lebih besar daripada dicintai.", author: "George MacDonald" },
  // FEAR
  { mood: "fear", en: "Fears are nothing more than a state of mind.", id: "Ketakutan tidak lebih dari sekadar keadaan pikiran.", author: "Napoleon Hill" },
  { mood: "fear", en: "Do the thing you fear, and the death of fear is certain.", id: "Lakukan hal yang kamu takuti, dan matinya ketakutan itu pasti.", author: "Ralph Waldo Emerson" },
  // SURPRISE
  { mood: "surprise", en: "Expect nothing. Live frugally on surprise.", id: "Jangan harapkan apa-apa. Hiduplah dari kejutan-kejutan kecil.", author: "Alice Walker" },
  { mood: "surprise", en: "The secret to humor is surprise.", id: "Rahasia dari humor adalah sebuah kejutan.", author: "Aristotle" },
  // SAD
  { mood: "sad", en: "Tears come from the heart and not from the brain.", id: "Air mata berasal dari hati, bukan dari otak.", author: "Leonardo da Vinci" },
  { mood: "sad", en: "Healing takes time, and asking for help is a courageous step.", id: "Penyembuhan butuh waktu, dan meminta bantuan adalah langkah yang berani.", author: "Mariska Hargitay" },
  // DISGUST
  { mood: "disgust", en: "You get to decide what you let into your life.", id: "Kamu berhak memutuskan apa yang kamu biarkan masuk ke dalam hidupmu.", author: "Anonymous" },
  { mood: "disgust", en: "Boundaries are a sign of self-respect.", id: "Batasan (boundaries) adalah tanda rasa hormat pada diri sendiri.", author: "Anonymous" },
  // ANGER
  { mood: "anger", en: "For every minute you are angry you lose sixty seconds of happiness.", id: "Untuk setiap menit kamu marah, kamu kehilangan enam puluh detik kebahagiaan.", author: "Ralph Waldo Emerson" },
  { mood: "anger", en: "Speak when you are angry and you will make the best speech you will ever regret.", id: "Bicaralah saat kamu marah dan kamu akan membuat pidato terbaik yang akan selalu kamu sesali.", author: "Ambrose Bierce" },
  // ANTICIPATION
  { mood: "anticipation", en: "The future belongs to those who believe in the beauty of their dreams.", id: "Masa depan adalah milik mereka yang percaya pada keindahan mimpi mereka.", author: "Eleanor Roosevelt" },
  { mood: "anticipation", en: "Anticipation is sometimes more exciting than actual events.", id: "Antisipasi terkadang lebih mengasyikkan daripada kejadian itu sendiri.", author: "Anonymous" }
]

// Diperbarui: Warna untuk Light Mode & Dark Mode agar selalu terbaca
const moodThemes: Record<string, { colorClass: string, icon: string, label: string }> = {
  joy: { colorClass: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20", icon: "🌟", label: "Joy" },
  trust: { colorClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 border-green-200 dark:border-green-400/20", icon: "🤝", label: "Trust" },
  fear: { colorClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10 border-orange-200 dark:border-orange-400/20", icon: "😨", label: "Fear" },
  surprise: { colorClass: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-400/10 border-pink-200 dark:border-pink-400/20", icon: "😲", label: "Surprise" },
  sad: { colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20", icon: "😢", label: "Sadness" },
  disgust: { colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-400/10 border-purple-200 dark:border-purple-400/20", icon: "🤢", label: "Disgust" },
  anger: { colorClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20", icon: "😡", label: "Anger" },
  anticipation: { colorClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-400/10 border-cyan-200 dark:border-cyan-400/20", icon: "🤔", label: "Anticipation" }
}

export default function QuoteCarousel() {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)

  const randomizeQuote = useCallback(() => {
    setIsFading(true)
    setTimeout(() => {
      setQuoteIndex((prevIndex) => {
        let newIndex
        do {
          newIndex = Math.floor(Math.random() * quotesData.length)
        } while (newIndex === prevIndex)
        return newIndex
      })
      setIsFading(false)
    }, 300) 
  }, [])

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * quotesData.length))
    const interval = setInterval(() => {
      randomizeQuote()
    }, 8000)
    return () => clearInterval(interval)
  }, [randomizeQuote])

  const currentQuote = quotesData[quoteIndex]
  if (!currentQuote) return null

  const theme = moodThemes[currentQuote.mood]

  return (
    <div className="relative bg-white dark:bg-[#13192B] border border-slate-200 dark:border-indigo-500/20 p-8 sm:p-10 rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.05)] text-center flex flex-col items-center justify-center min-h-[260px] overflow-hidden group transition-colors duration-300">
      
      {/* Tombol Refresh */}
      <button 
        onClick={randomizeQuote}
        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-white bg-slate-100 hover:bg-purple-100 dark:bg-slate-800/40 dark:hover:bg-slate-700 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:outline-none"
        aria-label="Acak Kutipan"
        title="Ganti Kutipan"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Konten Quote (Dengan efek Fade) */}
      <div className={`transition-opacity duration-300 max-w-2xl px-4 sm:px-8 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Badge Emosi */}
        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-extrabold mb-6 ${theme.colorClass}`}>
          <span className="text-sm">{theme.icon}</span>
          <span className="uppercase tracking-wider">{theme.label}</span>
        </div>

        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-3 leading-relaxed">
          "{currentQuote.en}"
        </p>
        <p className="text-sm md:text-base font-medium text-slate-500 dark:text-gray-400 italic mb-6">
          "{currentQuote.id}"
        </p>
        
        <div className="inline-block bg-indigo-50 dark:bg-indigo-950/30 px-5 py-2 rounded-full border border-indigo-100 dark:border-indigo-800/50">
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">— {currentQuote.author}</span>
        </div>

      </div>

    </div>
  )
}