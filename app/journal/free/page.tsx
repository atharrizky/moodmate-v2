"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { moods } from "@/lib/moods"
import { supabase } from "@/lib/supabase"

export default function FreeJournalPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [finalMood, setFinalMood] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // State Khusus buat nampung Medali Baru yang didapat hari ini
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])

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
        
        // 2. Cek Si Paling Joy (ID 3)
        if (finalMood === 'joy' && !ownedBadgeIds.includes(3)) {
            const { data: joyJournals } = await supabase.from('journals').select('id').eq('user_id', userId).eq('mood', 'joy')
            if (joyJournals && joyJournals.length >= 4) { 
                await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 3 }])
                newAchievements.push({ id: 3, name: "Si Paling Joy", img: "badge_3.jpg" })
            }
        }

        // 3. Cek Pawang Emosi (ID 4) - Sudah nyobain ke-8 mood
        if (!ownedBadgeIds.includes(4)) {
            const { data: allMoods } = await supabase.from('journals').select('mood').eq('user_id', userId)
            if (allMoods) {
                const uniqueMoods = new Set(allMoods.map(j => j.mood))
                uniqueMoods.add(finalMood) // Tambahkan mood hari ini
                if (uniqueMoods.size >= 8) {
                    await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 4 }])
                    newAchievements.push({ id: 4, name: "Pawang Emosi", img: "badge_4.jpg" })
                }
            }
        }

        // 4. Cek Streak 7 Hari (ID 5)
        if (!ownedBadgeIds.includes(5) && newStreak >= 7) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 5 }])
            newAchievements.push({ id: 5, name: "Si Paling Konsisten", img: "badge_5.jpg" })
        }

        // 5. Cek Sultan (ID 8)
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


      // Kalau nggak dapat medali apa-apa, langsung lari ke halaman Result biasa
      router.push("/result") 
    } catch (error: any) {
      alert("Gagal menyimpan: " + error.message)
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
             <span className="text-4xl">💭</span>
             <h1 className="text-3xl font-bold">Jurnal Bebas</h1>
          </div>
          <p className="text-gray-400">Tuliskan apa saja yang sedang membebani pikiranmu.</p>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-sm mb-12">
          <textarea
            className="w-full bg-[#0b1220] border border-gray-700 p-5 rounded-xl text-white focus:outline-none focus:border-primary transition resize-none text-base leading-relaxed"
            rows={10}
            placeholder="Hari ini aku merasa..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <h3 className="text-xl font-bold text-left mb-6">Emosi apa yang paling mewakili perasaanmu sekarang?</h3>
          
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
                content.trim() && finalMood && !isSaving
                ? 'bg-primary hover:bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              onClick={saveJournal}
              disabled={!content.trim() || !finalMood || isSaving}
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