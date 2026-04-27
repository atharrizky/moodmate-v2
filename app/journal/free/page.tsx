"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { moods } from "@/lib/moods"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"

const MOOD_COLORS: Record<string, string> = {
  joy: "#facc15", trust: "#4ade80", fear: "#f97316", surprise: "#ec4899",
  sad: "#3b82f6", disgust: "#a855f7", anger: "#ef4444", anticipation: "#06b6d4"
}

export default function FreeJournalPage() {
  const router = useRouter()
  
  const [content, setContent] = useState("")
  const [finalMood, setFinalMood] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])

  // STATE KHUSUS UNTUK AI
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiReason, setAiReason] = useState<string | null>(null)
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  // STATE KHUSUS UNTUK LEVEL UP
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [newLevelReached, setNewLevelReached] = useState(1)

  // FUNGSI ANALISIS AI
  const handleAnalyzeAI = async () => {
    if (content.trim().length < 10) {
      alert("Tuliskan perasaanmu lebih panjang sedikit ya (minimal 10 karakter) biar AI bisa menebak dengan akurat!")
      return
    }

    setIsAnalyzing(true)
    setAiReason(null)
    setAiAdvice(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })

      if (!response.ok) throw new Error("Gagal terhubung ke API AI")
      
      const data = await response.json()
      
      if (data.mood) {
        setFinalMood(data.mood.toLowerCase())
        setAiReason(data.reason)
        setAiAdvice(data.advice || null)
        setShowAiModal(true)
      }
    } catch (error) {
      alert("Waduh, AI-nya gagal menganalisis. Coba cek console browser atau pastikan file route.ts sudah benar!")
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function saveJournal() {
    if (!content.trim() || !finalMood) return
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      const userId = session.user.id

      const { error: journalError } = await supabase.from('journals').insert([
        { user_id: userId, mood: finalMood, content: content }
      ])
      if (journalError) throw journalError

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count: todayJournalsCount } = await supabase
        .from('journals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString());

      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, coins, current_streak, last_journal_date')
        .eq('id', userId)
        .single()

      let isLevelUp = false;

      if (profile) {
        const todayDateStr = new Date().toLocaleDateString('en-CA'); 
        
        let newXp = profile.xp || 0;
        let newCoins = profile.coins || 0;
        let newLevel = profile.level || 1;
        let newStreak = profile.current_streak || 0;
        let isProfileUpdated = false;

        if (todayJournalsCount && todayJournalsCount <= 20) {
          newCoins += 10;
          newXp += 25;
          let xpTarget = newLevel * 100;
          if (newXp >= xpTarget) {
            newXp = newXp - xpTarget; 
            newLevel += 1;            
            isLevelUp = true;
          }
          isProfileUpdated = true;
        }

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

        if (isProfileUpdated) {
          const { error: updateError } = await supabase.from('profiles').update({
            xp: newXp, coins: newCoins, level: newLevel, current_streak: newStreak, last_journal_date: todayDateStr
          }).eq('id', userId)
          if (updateError) throw updateError
        }

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

        if (isLevelUp) {
          setNewLevelReached(newLevel);
          setShowLevelUpModal(true);
          if (newAchievements.length > 0) {
            setUnlockedBadges(newAchievements);
          }
          setIsSaving(false);
          return;
        }

        if (newAchievements.length > 0) {
           setUnlockedBadges(newAchievements)
           setIsSaving(false)
           return 
        }
      }

      router.refresh();
      router.push("/result")
    } catch (error: any) {
      alert("Waduh, gagal simpan: " + error.message)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-20 relative transition-colors duration-300">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-[100px] px-5 relative z-10">
        
        <div className="mb-8 text-center sm:text-left">
          <button onClick={() => router.push("/dashboard")} className="text-slate-500 hover:text-indigo-600 dark:text-indigo-200/70 dark:hover:text-white font-bold transition mb-6 flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-sm inline-flex">
            &larr; Kembali
          </button>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-2 justify-center sm:justify-start">
             <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14">
                <span className="text-3xl drop-shadow-sm">💭</span>
             </div>
             <div className="mt-2 sm:mt-0">
               <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm">Jurnal Bebas</h1>
               <p className="text-slate-500 dark:text-indigo-200/80 mt-1 font-medium">Luangkan waktu sejenak untuk meluapkan semua pikiranmu tanpa batasan.</p>
             </div>
          </div>
        </div>

        <div className="mb-4 relative group">
           <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
           <textarea
              className="w-full bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border-2 border-slate-200 dark:border-indigo-500/30 p-8 rounded-[2rem] text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none text-lg font-medium shadow-sm leading-relaxed relative z-10"
              rows={12}
              placeholder="Ceritakan semuanya di sini secara bebas. Tidak ada yang menilai..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
        </div>

        {/* AREA TOMBOL AI */}
        <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 mb-12">
          
          {/* Tombol kecil untuk buka lagi Pop-Up kalau sudah di-close */}
          {aiReason && !showAiModal && (
            <button 
              onClick={() => setShowAiModal(true)} 
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-bold flex items-center gap-2 transition-all px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl"
            >
              👁️ Lihat Kembali Hasil AI
            </button>
          )}

          <button 
            onClick={handleAnalyzeAI}
            disabled={isAnalyzing || content.length < 10}
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-md w-full sm:w-auto
              ${isAnalyzing || content.length < 10 
                ? 'bg-slate-200 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105 hover:shadow-indigo-500/30'}
            `}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menganalisis...
              </>
            ) : (
              <>✨ Analisis Perasaanku dengan AI</>
            )}
          </button>
        </div>

        <div className="border-t-2 border-slate-200 dark:border-indigo-500/20 pt-10 text-center bg-white/40 dark:bg-[#13192B]/40 backdrop-blur-md rounded-t-[3rem] px-6 mt-8">
          
          <h3 className="text-2xl font-black text-center mb-8 text-slate-800 dark:text-white">Setelah menulis, bagaimana perasaanmu sekarang?</h3>
          
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
                isSaving || !content.trim() || !finalMood ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30'
              }`}
              onClick={saveJournal}
              disabled={isSaving || !content.trim() || !finalMood}
            >
              {isSaving ? "Menyimpan..." : "Simpan & Selesai"}
            </button>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* POP-UP MODAL HASIL AI (DISEMPURNAKAN UTK PC) */}
      {/* ========================================== */}
      {showAiModal && aiReason && finalMood && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-[2rem] p-6 md:p-10 shadow-2xl transform transition-all animate-bounce-in relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div 
              className="absolute top-0 left-0 w-full h-2 md:h-3" 
              style={{ backgroundColor: MOOD_COLORS[finalMood] || '#6366f1' }}
            ></div>
            
            <div className="flex justify-between items-center mb-6 md:mb-8 pt-2">
              <h3 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <span className="text-3xl md:text-4xl drop-shadow-sm">🤖</span> Hasil Analisis AI
              </h3>
              <button 
                onClick={() => setShowAiModal(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-6">
              
              <div 
                className="p-5 md:p-8 rounded-2xl md:rounded-[2rem] border"
                style={{ 
                  backgroundColor: `${MOOD_COLORS[finalMood] || '#6366f1'}15`, 
                  borderColor: `${MOOD_COLORS[finalMood] || '#6366f1'}40` 
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="relative flex h-3 w-3 md:h-4 md:w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: MOOD_COLORS[finalMood] || '#6366f1' }}></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4" style={{ backgroundColor: MOOD_COLORS[finalMood] || '#6366f1' }}></span>
                  </span>
                  <p className="text-xs md:text-sm font-black tracking-widest uppercase" style={{ color: MOOD_COLORS[finalMood] || '#6366f1' }}>
                    Emosi Dominan: {finalMood}
                  </p>
                </div>
                
                <p className="text-slate-700 dark:text-slate-100 font-medium text-base md:text-xl leading-relaxed italic">
                  "{aiReason}"
                </p>
              </div>
              
              {aiAdvice && (
                <div className="p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/40">
                  <p className="text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                    💡 Solusi & Saran Untukmu:
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 text-sm md:text-lg leading-relaxed font-medium">
                    {aiAdvice}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 md:mt-10">
              <button 
                onClick={() => setShowAiModal(false)} 
                className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-[1.02] transition-transform shadow-lg"
              >
                Tutup & Lanjut Simpan
              </button>
              <p className="text-center text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
                *Pilihan emosi di bawah sudah otomatis disesuaikan oleh AI.
              </p>
            </div>
            
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POP-UP LEVEL UP (ELEGAN + ANIMASI ROKET)   */}
      {/* ========================================== */}
      {showLevelUpModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border border-indigo-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-bounce-in text-center relative overflow-hidden flex flex-col items-center">
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-[spin_60s_linear_infinite] pointer-events-none -z-10"></div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-indigo-500/20 to-transparent -z-10"></div>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-[60px] -z-10 animate-pulse"></div>

            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6 mt-2">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl animate-pulse opacity-50"></div>
              <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center relative z-10 border-4 border-white dark:border-[#13192B] shadow-2xl overflow-hidden">
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
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POP-UP ACHIEVEMENT (REVISI LAYOUT MAX 4)   */}
      {/* ========================================== */}
      {unlockedBadges.length > 0 && !showLevelUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 dark:bg-black/95 backdrop-blur-md animate-fade-in p-4 sm:p-6">
          <div className="text-center animate-bounce-in w-full max-w-4xl relative flex flex-col max-h-[95vh]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-96 bg-yellow-400/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            
            <h2 className="text-3xl sm:text-5xl font-black text-yellow-400 mb-2 tracking-widest drop-shadow-lg uppercase shrink-0">
              Achievement Unlocked!
            </h2>
            <p className="text-white/80 mb-6 text-base sm:text-lg font-medium shrink-0">Luar biasa! Kamu mendapatkan {unlockedBadges.length} pencapaian baru.</p>
            
            <div className="overflow-y-auto custom-scrollbar px-2 pb-4 shrink-1">
              <div className={`grid gap-4 sm:gap-6 ${unlockedBadges.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-' + unlockedBadges.length} justify-center items-stretch`}>
                {unlockedBadges.map((badge, idx) => (
                  <div key={idx} className="bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-2 border-yellow-400/80 p-4 sm:p-6 rounded-3xl shadow-[0_0_30px_rgba(250,204,21,0.2)] flex flex-col items-center transform transition hover:-translate-y-2 relative h-full">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 mb-4 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden bg-white flex items-center justify-center">
                       <img src={`/badges/${badge.img}`} alt={badge.name} className="w-[80%] h-[80%] object-contain" 
                            onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/5243/5243405.png'; }} />
                    </div>
                    <h3 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white mb-2 leading-tight flex-1 flex items-center">{badge.name}</h3>
                    <span className="text-[10px] sm:text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-md uppercase tracking-wider">Tersimpan</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 shrink-0">
              <button 
                onClick={() => {
                  router.refresh();
                  router.push("/result");
                }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-950 font-black text-base sm:text-lg px-10 py-4 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.4)] transition-all hover:scale-105 w-full sm:w-auto"
              >
                Lanjut Lihat Hasil &rarr;
              </button>
            </div>
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

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }
      `}</style>
    </div>
  )
}