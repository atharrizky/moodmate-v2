"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Peta Hadiah Login
const DAILY_REWARDS: Record<number, number> = {
  1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 40, 7: 50
}

export default function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const [loginDay, setLoginDay] = useState(1)
  const [totalStreak, setTotalStreak] = useState(0)
  const pathname = usePathname()

  // Ambil data streak user setiap kali modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const fetchStreak = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('login_streak')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        const currentStreak = profile.login_streak || 0
        setTotalStreak(currentStreak)
        
        // Hitung siklus 1-7
        // Jika streak 0 atau baru mulai, anggap hari 1. Jika streak 7, 14, dst anggap hari 7.
        let cycleDay = currentStreak % 7;
        if (cycleDay === 0 && currentStreak > 0) cycleDay = 7;
        if (currentStreak === 0) cycleDay = 1;
        
        setLoginDay(cycleDay)
      }
    }

    fetchStreak()
  }, [isOpen])

  // Sembunyikan tombol di halaman tertentu
  if (pathname === "/login" || pathname === "/register" || pathname === "/") return null

  return (
    <>
      {/* FLOATING BUBBLE BUTTON (KADO) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center text-3xl font-bold transition-all hover:scale-110 z-[90] group border-2 border-white dark:border-[#0B0F19]"
        aria-label="Cek Hadiah Harian"
      >
        <span className="drop-shadow-md group-hover:animate-bounce">🎁</span>
        <span className="absolute right-16 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium">
          Cek Hadiah Login
        </span>
      </button>

      {/* MODAL PENJELASAN */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border-2 border-indigo-200 dark:border-indigo-500/50 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-white transition font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-indigo-900 dark:text-white mb-1 uppercase tracking-wider text-center mt-2">7-Day Login Reward</h2>
            <p className="text-slate-500 dark:text-gray-400 text-center mb-6 text-sm font-medium">Login beruntun untuk hadiah yang lebih besar!</p>
            
            {/* GRID ROADMAP 7 HARI */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isClaimed = day <= loginDay && totalStreak > 0; 
                const coins = DAILY_REWARDS[day];

                return (
                  <div key={day} className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border-2 transition-all 
                    ${day === 7 ? 'col-span-4 sm:col-span-2 bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-orange-900/40 border-yellow-400' : 
                      isClaimed ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-500/50' : 
                      'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60'}
                  `}>
                    
                    <span className={`text-[10px] sm:text-xs font-bold mb-1 ${isClaimed ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Hari {day}</span>
                    
                    {day === 7 ? (
                      <div className="flex flex-row items-center justify-center gap-2 relative z-10">
                        {/* UPDATE: Pakai Badge ID 5 & badge_5.jpg */}
                        <div className="w-10 h-10 rounded-full border border-yellow-500/50 overflow-hidden bg-white/20">
                          <img src="/badges/badge_5.jpg" alt="medali" className={`w-full h-full object-cover ${!isClaimed ? 'opacity-40 grayscale' : 'drop-shadow-md'}`} />
                        </div>
                        <span className={`text-base sm:text-lg font-black ${!isClaimed ? 'text-slate-400' : 'text-yellow-600 dark:text-yellow-400'}`}>+{coins}</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-xl sm:text-2xl mb-1">{isClaimed ? '💰' : '🪙'}</div>
                        <span className={`text-xs sm:text-sm font-black ${isClaimed ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>+{coins}</span>
                      </>
                    )}

                    {/* OVERLAY CENTANG */}
                    {isClaimed && (
                      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 rounded-[14px] flex items-center justify-center backdrop-blur-[1px] z-20">
                        <div className="bg-green-500 rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                          <span className="text-white text-sm font-black">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
               <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                 Streak saat ini: <span className="text-indigo-600 dark:text-indigo-400 text-lg">{totalStreak} Hari</span> 🔥
               </p>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                 Pertahankan konsistensimu! Di hari ke-7, kamu akan mendapatkan Medali <span className="text-yellow-600 dark:text-yellow-500 font-bold">Si Paling Konsisten</span> secara otomatis.
               </p>
            </div>

          </div>
        </div>
      )}
    </>
  )
}