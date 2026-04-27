"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { moods } from "@/lib/moods"
import { moodPrompts } from "@/lib/questions"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

const MOOD_COLORS: Record<string, string> = {
  joy: "#facc15", trust: "#4ade80", fear: "#f97316", surprise: "#ec4899",
  sad: "#3b82f6", disgust: "#a855f7", anger: "#ef4444", anticipation: "#06b6d4"
}

export default function JournalPage() {
  const params = useParams()
  const router = useRouter()
  const initialMood = params.mood as string

  const currentPrompts = moodPrompts[initialMood] || moodPrompts.default

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
  const [finalMood, setFinalMood] = useState<string>(initialMood)
  const [isSaving, setIsSaving] = useState(false)
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])

  // TAMBAHAN STATE UNTUK LEVEL UP
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [newLevelReached, setNewLevelReached] = useState(1)

  useEffect(() => {
    if (currentPrompts.length > 0) {
      setExpandedPrompt(currentPrompts[0].id)
    }
  }, [currentPrompts])

  function updateAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  async function saveJournal() {
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      const userId = session.user.id

      const formattedContent = currentPrompts
        .filter(item => answers[item.id] && answers[item.id].trim() !== "")
        .map(item => `Q: ${item.title}\nA: ${answers[item.id]}`)
        .join("\n\n")

      if (!formattedContent) {
        alert("Isi minimal satu pertanyaan ya!")
        setIsSaving(false)
        return
      }

      // 1. Simpan Jurnal ke Database
      const { error: journalError } = await supabase.from('journals').insert([
        { user_id: userId, mood: finalMood, content: formattedContent }
      ])
      if (journalError) throw journalError
      
      // BUG DI SINI SUDAH DIHAPUS (router.push dipindah ke bawah)

      // 2. Hitung jumlah jurnal hari ini untuk Limit Reward
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count: todayJournalsCount } = await supabase
        .from('journals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString());

      // 3. Ambil data profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, coins, current_streak, last_journal_date')
        .eq('id', userId)
        .single()

      if (profile) {
        const todayDateStr = new Date().toLocaleDateString('en-CA'); 
        
        let newXp = profile.xp || 0;
        let newCoins = profile.coins || 0;
        let newLevel = profile.level || 1;
        let newStreak = profile.current_streak || 0;
        let isProfileUpdated = false;
        let isLevelUp = false; // Penanda kalau naik level

        // --- LOGIKA DAILY CAP (Maks 20 Jurnal/Hari = 500 XP & 200 Koin) ---
        if (todayJournalsCount && todayJournalsCount <= 20) {
          newCoins += 10;
          newXp += 25;

          // Logika Level Progresif (Target XP = Level * 100)
          let xpTarget = newLevel * 100;
          if (newXp >= xpTarget) {
            newXp = newXp - xpTarget; 
            newLevel += 1;            
            isLevelUp = true; // Tandai naik level
          }
          isProfileUpdated = true;
        }

        // --- LOGIKA STREAK (Hanya nambah di jurnal PERTAMA hari ini) ---
        if (profile.last_journal_date !== todayDateStr) {
          if (profile.last_journal_date) {
            const lastDate = new Date(profile.last_journal_date);
            const currentDate = new Date(todayDateStr);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) newStreak += 1;
            else newStreak = 1;
          } else {
            newStreak = 1;
          }
          isProfileUpdated = true;
        }

        // 4. Update Profil HANYA jika ada reward masuk atau streak nambah
        if (isProfileUpdated) {
          const { error: updateError } = await supabase.from('profiles').update({
            xp: newXp, coins: newCoins, level: newLevel, current_streak: newStreak, last_journal_date: todayDateStr
          }).eq('id', userId)
          if (updateError) throw updateError
        }

        // 5. Sistem Medali (Pop-up Achievements)
        const { data: ownedBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        const ownedBadgeIds = ownedBadges ? ownedBadges.map(b => b.badge_id) : []
        const newAchievements = []

        if (!ownedBadgeIds.includes(1)) {
             await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 1 }])
             newAchievements.push({ id: 1, name: "Langkah Pertama", img: "badge_1.jpg" })
        }
        
        if (!ownedBadgeIds.includes(2)) {
             const { data: freeJournals } = await supabase.from('journals').select('id').eq('user_id', userId).not('content', 'ilike', 'Q:%')
             if (freeJournals && freeJournals.length >= 5) {
                 await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 2 }])
                 newAchievements.push({ id: 2, name: "Si Paling Bebas", img: "badge_2.jpg" })
             }
        }

        if (!ownedBadgeIds.includes(3)) {
             const { data: joyJournals } = await supabase.from('journals').select('id').eq('user_id', userId).eq('mood', 'joy')
             if (joyJournals && joyJournals.length >= 5) {
                 await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 3 }])
                 newAchievements.push({ id: 3, name: "Si Paling Joy", img: "badge_3.jpg" })
             }
        }

        if (!ownedBadgeIds.includes(4)) {
             const { data: allJournals } = await supabase.from('journals').select('mood').eq('user_id', userId)
             const uniqueMoods = new Set(allJournals?.map(j => j.mood) || [])
             if (uniqueMoods.size >= 8) {
                 await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 4 }])
                 newAchievements.push({ id: 4, name: "Pawang Emosi", img: "badge_4.jpg" })
             }
        }

        if (!ownedBadgeIds.includes(5) && newStreak >= 7) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 5 }])
            newAchievements.push({ id: 5, name: "Si Paling Konsisten", img: "badge_5.jpg" })
        }

        if (!ownedBadgeIds.includes(8) && newCoins >= 1000) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 8 }])
            newAchievements.push({ id: 8, name: "Sultan Musang King", img: "badge_8.jpg" })
        }

        // Kalau Naik Level, Tampilkan Pop-up Level Dulu
        if (isLevelUp) {
          setNewLevelReached(newLevel);
          setShowLevelUpModal(true);
          if (newAchievements.length > 0) {
            setUnlockedBadges(newAchievements);
          }
          setIsSaving(false);
          return; 
        }

        // Kalau nggak naik level, tapi dapet medali
        if (newAchievements.length > 0) {
           setUnlockedBadges(newAchievements)
           setIsSaving(false)
           return 
        }
      }

      // Kalau tidak ada medali dan tidak naik level, langsung pindah
      router.push("/result")
    } catch (error: any) {
      alert("Waduh, gagal simpan: " + error.message)
      setIsSaving(false)
    }
  }

  const initialHex = MOOD_COLORS[initialMood.toLowerCase()] || "#6366f1"

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-20 relative transition-colors duration-300">
      <Navbar />

      <div className="max-w-3xl mx-auto pt-[100px] px-5 relative z-10">
        
        <div className="mb-10 text-center sm:text-left">
          <button onClick={() => router.push("/dashboard")} className="text-slate-500 hover:text-indigo-600 dark:text-indigo-200/70 dark:hover:text-white font-bold transition mb-6 flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-sm inline-flex">
            &larr; Kembali
          </button>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-2 justify-center sm:justify-start">
             <div 
               className="p-3 rounded-3xl border-2 flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14 shadow-md"
               style={{ background: `linear-gradient(to top, ${initialHex}40 0%, ${initialHex}05 100%)`, borderColor: `${initialHex}50` }}
             >
                <img src={`/mood/${initialMood}.png`} alt={initialMood} className="w-12 h-12 sm:w-10 sm:h-10 drop-shadow-md" />
             </div>
             <div className="mt-2 sm:mt-0">
               <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm">Refleksi Hari Ini</h1>
               <p className="text-slate-500 dark:text-indigo-200/80 mt-1 font-medium">Luangkan waktu sejenak untuk memahami perasaan <span className="capitalize font-black text-indigo-600 dark:text-indigo-300" style={{ color: initialHex }}>{initialMood}</span>-mu.</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-12">
          {currentPrompts.map((item) => (
            <div key={item.id} className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300">
              <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0f1423] transition-colors"
                onClick={() => setExpandedPrompt(expandedPrompt === item.id ? null : item.id)}
              >
                <h2 className="font-black text-lg text-slate-700 dark:text-white">{item.title}</h2>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-indigo-300 ${expandedPrompt === item.id ? 'rotate-180' : ''}`}>
                    ▼
                </div>
              </div>
              
              <div className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${expandedPrompt === item.id ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}`}>
                <p className="text-slate-500 dark:text-indigo-200/70 text-sm mb-4 font-bold italic border-l-4 border-indigo-400 pl-3">{item.prompt}</p>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-indigo-500/30 p-5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none text-base font-medium shadow-inner"
                  rows={4}
                  placeholder="Tuliskan dengan bebas..."
                  value={answers[item.id] || ""}
                  onChange={(e) => updateAnswer(item.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-slate-200 dark:border-indigo-500/20 pt-10 text-center bg-white/40 dark:bg-[#13192B]/40 backdrop-blur-md rounded-t-[3rem] px-6 mt-8">
          <p className="text-slate-500 dark:text-indigo-200/70 mb-6 font-medium">
            Awalnya kamu merasa <span className="font-black capitalize bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700" style={{ color: initialHex }}>{initialMood}</span>.
          </p>

          <h3 className="text-2xl font-black text-center mb-8 text-slate-800 dark:text-white">Bagaimana perasaanmu sekarang?</h3>
          
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 mb-10">
            {moods.map((m) => {
              const hexColor = MOOD_COLORS[m.id] || "#6366f1";
              const isSelected = finalMood === m.id;

              return (
                <div 
                  key={m.id} 
                  onClick={() => setFinalMood(m.id)}
                  className={`aspect-square p-3 sm:p-4 rounded-3xl border-2 transition-all duration-300 transform cursor-pointer group flex flex-col items-center justify-center relative overflow-hidden
                    ${isSelected ? 'scale-110 z-10 shadow-xl' : 'hover:-translate-y-2 hover:shadow-lg opacity-70 hover:opacity-100'}
                  `}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(to top, ${hexColor}60 0%, ${hexColor}20 100%)` 
                      : `linear-gradient(to top, ${hexColor}20 0%, ${hexColor}05 100%)`,
                    borderColor: isSelected ? hexColor : `${hexColor}50`,
                    boxShadow: isSelected ? `0 8px 25px -5px ${hexColor}60` : `0 8px 20px -5px ${hexColor}20`
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 20px ${hexColor}40` }}
                  />
                  <img src={`/mood/${m.icon}`} alt={m.label} className={`w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span 
                    className="text-[10px] sm:text-xs font-extrabold mt-2 relative z-10 transition-colors"
                    style={{ color: isSelected ? hexColor : '' }}
                  >
                    {m.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center pb-8">
            <button 
              className={`font-black py-4 px-12 rounded-2xl transition-all duration-300 shadow-md text-lg w-full sm:w-auto ${
                isSaving ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30'
              }`}
              onClick={saveJournal}
              disabled={isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan & Selesai"}
            </button>
          </div>
        </div>

      </div>

{/* ========================================== */}
      {/* POP-UP LEVEL UP (ELEGAN + ANIMASI ROKET)   */}
      {/* ========================================== */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border border-indigo-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-bounce-in text-center relative overflow-hidden flex flex-col items-center">
            
            {/* Latar Belakang Animasi Bintang (Stardust Muter Pelan) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-[spin_60s_linear_infinite] pointer-events-none -z-10"></div>
            
            {/* Efek Cahaya Latar Belakang */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-indigo-500/20 to-transparent -z-10"></div>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-[60px] -z-10 animate-pulse"></div>

            {/* Lingkaran Mewah + Roket Terbang (Bounce) */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6 mt-2">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl animate-pulse opacity-50"></div>
              <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center relative z-10 border-4 border-white dark:border-[#13192B] shadow-2xl overflow-hidden">
                {/* ANIMASI ROKET TERBANG DI SINI */}
                <span className="text-6xl sm:text-7xl drop-shadow-lg animate-bounce mt-4">🚀</span>
              </div>
            </div>

            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-2 uppercase tracking-wide">
              Level Up!
            </h2>
            <p className="text-slate-500 dark:text-slate-300 mb-8 font-medium text-base sm:text-lg">
              Pencapaian luar biasa! Kamu berhasil menembus <span className="text-indigo-600 dark:text-indigo-400 font-black text-xl">Level {newLevelReached}</span>.
            </p>

            <button 
              onClick={() => {
                setShowLevelUpModal(false);
                if (unlockedBadges.length === 0) {
                  router.refresh();
                  router.push("/result");
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">Lanjut &rarr;</span>
              {/* Animasi Cahaya Tombol pas di-hover */}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POP-UP ACHIEVEMENT MEWAH                   */}
      {/* ========================================== */}
      {unlockedBadges.length > 0 && !showLevelUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md animate-fade-in px-4">
          <div className="text-center animate-bounce-in max-w-lg w-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <h2 className="text-4xl md:text-5xl font-black text-yellow-500 dark:text-yellow-400 mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] uppercase">
              Achievement Unlocked!
            </h2>
            <p className="text-white mb-10 text-lg font-medium">Luar biasa! Kamu mendapatkan {unlockedBadges.length} pencapaian baru.</p>
            
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {unlockedBadges.map((badge, idx) => (
                <div key={idx} className="bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-500/20 dark:to-orange-600/20 border-2 border-yellow-400 p-6 md:p-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(250,204,21,0.4)] flex flex-col items-center transform transition hover:scale-105 relative overflow-hidden">
                  <div className="w-28 h-28 md:w-32 md:h-32 mb-6 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center relative z-10">
                     <img src={`/badges/${badge.img}`} alt={badge.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-2 relative z-10">{badge.name}</h3>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest relative z-10 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-lg">Medali Tersimpan</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => router.push("/result")}
              className="bg-yellow-400 hover:bg-yellow-500 dark:bg-gradient-to-r dark:from-yellow-400 dark:to-orange-500 text-yellow-950 font-black text-lg px-12 py-4 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.5)] transition-all hover:scale-105"
            >
              Lanjut Lihat Hasil &rarr;
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Custom Scrollbar untuk Modal di HP */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }
      `}</style>
    </div>
  )
}