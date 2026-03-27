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

const moodThemes: Record<string, { colorClass: string, icon: string, label: string }> = {
  joy: { colorClass: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: "🌟", label: "Joy" },
  trust: { colorClass: "text-green-400 bg-green-400/10 border-green-400/20", icon: "🤝", label: "Trust" },
  fear: { colorClass: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: "😨", label: "Fear" },
  surprise: { colorClass: "text-pink-400 bg-pink-400/10 border-pink-400/20", icon: "😲", label: "Surprise" },
  sad: { colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: "😢", label: "Sadness" },
  disgust: { colorClass: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: "🤢", label: "Disgust" },
  anger: { colorClass: "text-red-400 bg-red-400/10 border-red-400/20", icon: "😡", label: "Anger" },
  anticipation: { colorClass: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", icon: "🤔", label: "Anticipation" }
}

export default function QuoteCarousel() {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)

  // Fungsi untuk memutar kutipan secara acak (memastikan tidak muncul kutipan yang sama dua kali berturut-turut)
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
    }, 300) // Waktu transisi saat teks meredup
  }, [])

  // Auto-play: Berganti sendiri setiap 8 detik
  useEffect(() => {
    // Memilih quote acak saat pertama kali komponen dimuat
    setQuoteIndex(Math.floor(Math.random() * quotesData.length))

    const interval = setInterval(() => {
      randomizeQuote()
    }, 8000)

    // Membersihkan interval saat komponen dibongkar (agar tidak bocor memorinya)
    return () => clearInterval(interval)
  }, [randomizeQuote])

  const currentQuote = quotesData[quoteIndex]
  if (!currentQuote) return null

  const theme = moodThemes[currentQuote.mood]

  return (
    <div className="relative bg-[#111827] border border-gray-800 p-8 sm:p-10 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center min-h-[260px] overflow-hidden group">
      
      {/* Tombol Refresh/Randomize Tunggal di Pojok Kanan Atas */}
      <button 
        onClick={randomizeQuote}
        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-gray-800/40 hover:bg-gray-700 rounded-full transition opacity-0 group-hover:opacity-100 focus:outline-none"
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
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-6 ${theme.colorClass}`}>
          <span>{theme.icon}</span>
          <span className="uppercase tracking-wider">{theme.label}</span>
        </div>

        <p className="text-lg md:text-xl font-medium text-white mb-3 leading-relaxed">
          "{currentQuote.en}"
        </p>
        <p className="text-sm md:text-base text-gray-400 italic mb-6">
          "{currentQuote.id}"
        </p>
        
        <div className="inline-block bg-[#0f172a] px-4 py-1.5 rounded-full border border-gray-800">
          <span className="text-xs font-bold text-primary tracking-wide">— {currentQuote.author}</span>
        </div>

      </div>

    </div>
  )
}