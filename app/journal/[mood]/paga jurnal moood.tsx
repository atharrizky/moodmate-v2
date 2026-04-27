"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { moods } from "@/lib/moods"
import { moodPrompts } from "@/lib/questions"
import { supabase } from "@/lib/supabase"

export default function JournalPage() {
  const params = useParams()
  const router = useRouter()
  const initialMood: any = params.mood

  const currentPrompts = moodPrompts[initialMood] || moodPrompts.default

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)
  const [finalMood, setFinalMood] = useState<string>(initialMood)
  const [isSaving, setIsSaving] = useState(false)

  // State Khusus buat nampung Medali Baru (Pop-up Gacha)
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])

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

      // 2. Ambil Profil User
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, coins, current_streak, last_journal_date')
        .eq('id', userId)
        .single()

      if (profile) {
        const coinReward = 9 + profile.level; 
        const xpReward = 25; 

        let newXp = profile.xp + xpReward;
        let newCoins = profile.coins + coinReward;
        let newLevel = profile.level;

        if (newXp >= 150) {
          const levelGain = Math.floor(newXp / 150)
          newLevel += levelGain
          newXp = newXp % 150
        }

        const today = new Date().toLocaleDateString('en-CA');
        let newStreak = profile.current_streak || 0;
        
        if (profile.last_journal_date !== today) {
          if (profile.last_journal_date) {
            const lastDate = new Date(profile.last_journal_date);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) newStreak += 1;
            else newStreak = 1;
          } else {
            newStreak = 1;
          }
        }

        // 3. Update Profil
        const { error: updateError } = await supabase.from('profiles').update({
          xp: newXp, coins: newCoins, level: newLevel, current_streak: newStreak, last_journal_date: today
        }).eq('id', userId)
        
        if (updateError) throw updateError

// --- SISTEM DETEKSI MEDALI (CLEAN VERSION) ---
        const { data: ownedBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        const ownedBadgeIds = ownedBadges ? ownedBadges.map(b => b.badge_id) : []
        const newAchievements = []

        // Contoh: Cek Langkah Pertama
        if (!ownedBadgeIds.includes(1)) {
             const { error: insertError } = await supabase.from('user_badges').insert([
               { user_id: userId, badge_id: 1 }
             ])
             
             if (!insertError) {
               newAchievements.push({ id: 1, name: "Langkah Pertama", img: "badge_1.jpg" })
             }
        }
        
        // 2. Cek Si Paling Bebas (ID 2)
        if (!ownedBadgeIds.includes(2)) {
             // Hitung jurnal yang isinya bebas (nggak ada huruf Q: dari template)
             const { data: freeJournals } = await supabase.from('journals').select('id').eq('user_id', userId).not('content', 'ilike', 'Q:%')
             if (freeJournals && freeJournals.length >= 4) { // 4 lama + 1 yang barusan = 5
                 await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 2 }])
                 newAchievements.push({ id: 2, name: "Si Paling Bebas", img: "badge_2.jpg" })
             }
        }

        // 3. Cek Streak 7 Hari (ID 5)
        if (!ownedBadgeIds.includes(5) && newStreak >= 7) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 5 }])
            newAchievements.push({ id: 5, name: "Si Paling Konsisten", img: "badge_5.jpg" })
        }

        // 4. Cek Sultan (ID 8)
        if (!ownedBadgeIds.includes(8) && newCoins >= 1000) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 8 }])
            newAchievements.push({ id: 8, name: "Sultan Musang King", img: "badge_8.jpg" })
        }

        if (newAchievements.length > 0) {
           setUnlockedBadges(newAchievements)
           setIsSaving(false)
           return 
        }
      }

      router.push("/result")
    } catch (error: any) {
      alert("Waduh, gagal simpan: " + error.message)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 relative">
      <div className="max-w-3xl mx-auto pt-[100px] px-5 relative z-10">
        
        <div className="mb-8">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition">
            &larr; Kembali
          </button>
          <div className="flex items-center gap-4 mb-2">
             <img src={`/mood/${initialMood}.jpg`} alt={initialMood} className="w-10 h-10" />
             <h1 className="text-3xl font-bold">Refleksi Hari Ini</h1>
          </div>
          <p className="text-gray-400">Luangkan waktu sejenak untuk memahami perasaan <span className="capitalize font-semibold text-white">{initialMood}</span>-mu.</p>
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

          <h3 className="text-xl font-bold text-left mb-4">Bagaimana perasaanmu sekarang?</h3>
          
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
                isSaving ? 'bg-gray-800 text-gray-500' : 'bg-primary hover:bg-purple-500 text-white'
              }`}
              onClick={saveJournal}
              disabled={isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan & Selesai"}
            </button>
          </div>
        </div>

      </div>

      {/* --- UI GACHA / ACHIEVEMENT UNLOCKED --- */}
      {unlockedBadges.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in px-4">
          <div className="text-center animate-bounce-in max-w-lg w-full">
            
            {/* Animasi Cahaya Belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>

            <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] uppercase">
              Achievement Unlocked!
            </h2>
            <p className="text-gray-300 mb-10 text-lg">Luar biasa! Kamu mendapatkan {unlockedBadges.length} pencapaian baru.</p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {unlockedBadges.map((badge, idx) => (
                <div key={idx} className="bg-gradient-to-b from-yellow-500/20 to-orange-600/20 border-2 border-yellow-500 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(234,179,8,0.4)] flex flex-col items-center transform transition hover:scale-105">
                  <div className="w-28 h-28 md:w-32 md:h-32 mb-6 rounded-full border-4 border-yellow-400 shadow-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                     <img src={`/badges/${badge.img}`} alt={badge.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{badge.name}</h3>
                  <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">Medali Tersimpan</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push("/result")}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-lg px-12 py-4 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] transition hover:scale-105"
            >
              Lanjut Lihat Hasil &rarr;
            </button>
          </div>
        </div>
      )}

    </div>
  )
}