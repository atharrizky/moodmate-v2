"use client"

import { useParams, useRouter } from "next/navigation"
import { addJournal } from "@/lib/storage"
import { useState, useEffect } from "react"
import { moods } from "@/lib/moods"
import { moodPrompts } from "@/lib/questions"

export default function JournalPage() {
  const params = useParams()
  const router = useRouter()
  const initialMood: any = params.mood

  const currentPrompts = moodPrompts[initialMood] || moodPrompts.default

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
  const [finalMood, setFinalMood] = useState<string>(initialMood)

  useEffect(() => {
    if (currentPrompts.length > 0) {
      setExpandedPrompt(currentPrompts[0].id)
    }
  }, [])

  function updateAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function saveJournal() {
    // FIX: Simpan pertanyaan DAN jawaban ke dalam array
    const filledAnswers = currentPrompts
      .filter(item => answers[item.id] && answers[item.id].trim() !== "")
      .map(item => ({
        questionTitle: item.title,
        questionText: item.prompt,
        answer: answers[item.id]
      }))
    
    addJournal({
      date: new Date().toISOString(),
      mood: initialMood,
      finalMood: finalMood,
      answers: filledAnswers
    })
    router.push("/result")
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <div className="max-w-3xl mx-auto pt-[100px] px-5">
        
        <div className="mb-8">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition">
            &larr; Kembali
          </button>
          <div className="flex items-center gap-4 mb-2">
             <img src={`/mood/${initialMood}.png`} alt={initialMood} className="w-10 h-10" />
             <h1 className="text-3xl font-bold">Refleksi Hari Ini</h1>
          </div>
          <p className="text-gray-400">Luangkan waktu sejenak untuk memahami perasaan <span className="capitalize font-semibold text-white">{initialMood}</span>-mu. Jawablah sesuai isi hatimu.</p>
        </div>

        <div className="flex flex-col gap-4 mb-12">
          {currentPrompts.map((item) => (
            <div key={item.id} className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-[#0f172a] transition"
                onClick={() => setExpandedPrompt(expandedPrompt === item.id ? null : item.id)}
              >
                <h2 className="font-semibold text-lg">{item.title}</h2>
                <span className="text-gray-400">{expandedPrompt === item.id ? '▲' : '▼'}</span>
              </div>
              
              {expandedPrompt === item.id && (
                <div className="px-5 pb-5">
                  <p className="text-gray-400 text-sm mb-4 italic">{item.prompt}</p>
                  <textarea
                    className="w-full bg-[#0b1220] border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-primary transition resize-none text-sm"
                    rows={4}
                    placeholder="Tuliskan dengan bebas..."
                    value={answers[item.id] || ""}
                    onChange={(e) => updateAnswer(item.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 mb-6">
            Awalnya kamu merasa <span className="text-white font-semibold capitalize">{initialMood}</span>.
          </p>

          <h3 className="text-xl font-bold text-left mb-4">Setelah menulis jurnal, bagaimana perasaanmu sekarang?</h3>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
            {moods.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setFinalMood(m.id)}
                className={`bg-[#0f172a] border border-gray-800 p-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer 
                  ${finalMood === m.id ? 'ring-2 ring-primary border-transparent' : 'hover:-translate-y-1 hover:border-gray-600'}`}
              >
                <img src={`/mood/${m.icon}`} alt={m.label} className="w-8 h-8 drop-shadow-md" />
                <span className="text-xs font-medium text-gray-300">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-start">
            <button 
              className="bg-primary hover:bg-purple-500 text-white font-medium py-3 px-8 rounded-xl transition duration-200 shadow-md"
              onClick={saveJournal}
            >
              Simpan & Lihat Hasil
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}