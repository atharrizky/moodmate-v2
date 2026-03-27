"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

export default function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Sembunyikan tombol help di halaman login
  if (pathname === "/login" || pathname === "/") return null

  return (
    <>
      {/* FLOATING BUBBLE BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-primary hover:bg-purple-500 text-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center text-2xl font-bold transition-all hover:scale-110 z-[90] group"
        aria-label="Panduan Emosi"
      >
        ?
        <span className="absolute right-16 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Panduan Emosi
        </span>
      </button>

      {/* MODAL PENJELASAN */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-white mb-2 text-center mt-2">Panduan 8 Emosi Plutchik 🌙</h2>
            <p className="text-gray-400 text-center mb-6 text-sm">Pahami emosi dasarmu untuk mengenali dirimu lebih baik.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/joy.png" alt="joy" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-yellow-400">Joy (Gembira)</h3>
                </div>
                <p className="text-xs text-gray-300">Perasaan senang, puas, dan bahagia terhadap apa yang terjadi.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/trust.png" alt="trust" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-green-400">Trust (Percaya)</h3>
                </div>
                <p className="text-xs text-gray-300">Rasa aman, penerimaan, dan keyakinan terhadap seseorang atau situasi.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/fear.png" alt="fear" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-orange-400">Fear (Takut)</h3>
                </div>
                <p className="text-xs text-gray-300">Respons alamiah saat menghadapi ancaman, bahaya, atau kecemasan.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/surprise.png" alt="surprise" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-pink-400">Surprise (Terkejut)</h3>
                </div>
                <p className="text-xs text-gray-300">Reaksi singkat terhadap hal-hal yang tidak terduga atau di luar rencana.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/sad.png" alt="sad" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-blue-400">Sad (Sedih)</h3>
                </div>
                <p className="text-xs text-gray-300">Perasaan duka, kehilangan, atau kekecewaan yang membutuhkan waktu untuk pulih.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/disgust.png" alt="disgust" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-purple-400">Disgust (Jijik)</h3>
                </div>
                <p className="text-xs text-gray-300">Rasa penolakan kuat terhadap sesuatu yang dianggap tidak pantas atau kotor.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/anger.png" alt="anger" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-red-400">Anger (Marah)</h3>
                </div>
                <p className="text-xs text-gray-300">Respons terhadap ketidakadilan, hambatan, atau rasa frustrasi.</p>
              </div>
              <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/anticipation.png" alt="anticipation" className="w-8 h-8 drop-shadow-md" />
                  <h3 className="font-semibold text-cyan-400">Anticipation (Antisipasi)</h3>
                </div>
                <p className="text-xs text-gray-300">Perasaan menunggu, berharap, atau merencanakan sesuatu di masa depan.</p>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-full bg-primary hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition duration-200"
            >
              Saya Mengerti, Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </>
  )
}