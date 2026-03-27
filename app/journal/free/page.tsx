"use client"

import { useRouter } from "next/navigation"
import { addJournal } from "@/lib/storage"
import { useState } from "react"
import { moods } from "@/lib/moods"

export default function FreeJournalPage() {
  const router = useRouter()
  
  // State untuk menampung isi jurnal dan emosi akhir
  const [content, setContent] = useState("")
  const [finalMood, setFinalMood] = useState<string | null>(null)

  function saveJournal() {
    if (!content.trim()) {
      alert("Yuk, tuliskan sesuatu dulu sebelum menyimpan! 📝")
      return
    }

    if (!finalMood) {
      alert("Pilih satu emosi di bawah yang paling menggambarkan perasaanmu saat ini ya. 🌙")
      return
    }

    // Format penyimpanan disamakan dengan jurnal biasa agar Result Page tidak error
    const filledAnswers = [
      {
        questionTitle: "Ruang Bebas",
        questionText: "Tumpahan pikiran dan perasaan hari ini.",
        answer: content
      }
    ]
    
    addJournal({
      date: new Date().toISOString(),
      mood: finalMood, // Di jurnal bebas, mood awal dianggap sama dengan mood akhir
      finalMood: finalMood,
      answers: filledAnswers
    })
    
    router.push("/result")
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <div className="max-w-3xl mx-auto pt-[100px] px-5">
        
        {/* Header Jurnal Bebas */}
        <div className="mb-8">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition">
            &larr; Kembali
          </button>
          <div className="flex items-center gap-4 mb-2">
             <span className="text-4xl">💭</span>
             <h1 className="text-3xl font-bold">Jurnal Bebas</h1>
          </div>
          <p className="text-gray-400">Tidak ada aturan di sini. Tuliskan apa saja yang sedang membebani pikiranmu, atau hal sekecil apapun yang membuatmu tersenyum hari ini.</p>
        </div>

        {/* Area Teks Jurnal */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-sm mb-12">
          <textarea
            className="w-full bg-[#0b1220] border border-gray-700 p-5 rounded-xl text-white focus:outline-none focus:border-primary transition resize-none text-base leading-relaxed"
            rows={10}
            placeholder="Hari ini aku merasa..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Pemilihan Emosi Kesimpulan */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <h3 className="text-xl font-bold text-left mb-2">Satu langkah lagi!</h3>
          <p className="text-gray-400 text-left mb-6">
            Setelah menumpahkan semuanya ke dalam tulisan, emosi apa yang paling mewakili perasaanmu sekarang?
          </p>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
            {moods.map((m) => (
              <div 
                key={m.id} 
                onClick={() => setFinalMood(m.id)}
                className={`bg-[#0f172a] border border-gray-800 p-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer 
                  ${finalMood === m.id ? 'ring-2 ring-primary border-transparent shadow-lg scale-105' : 'hover:-translate-y-1 hover:border-gray-600'}`}
              >
                <img src={`/mood/${m.icon}`} alt={m.label} className="w-8 h-8 drop-shadow-md" />
                <span className="text-xs font-medium text-gray-300">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-start">
            <button 
              className={`font-medium py-3 px-8 rounded-xl transition duration-200 shadow-md ${
                content.trim() && finalMood 
                ? 'bg-primary hover:bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              onClick={saveJournal}
              disabled={!content.trim() || !finalMood}
            >
              Simpan & Lihat Hasil
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}