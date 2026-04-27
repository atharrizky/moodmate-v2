"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import MoodGrid from "@/components/MoodGrid"
import StatCard from "@/components/StatCard"
import QuoteCarousel from "@/components/QuoteCarousel"
import Link from "next/link"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, YAxis } from 'recharts'
import { supabase } from "@/lib/supabase" 

const MOOD_COLORS: Record<string, string> = {
  Joy: "#facc15", Trust: "#4ade80", Fear: "#f97316", Surprise: "#ec4899",
  Sad: "#3b82f6", Disgust: "#a855f7", Anger: "#ef4444", Anticipation: "#06b6d4"
}

const MOOD_SCORES: Record<string, number> = {
  Joy: 8, Trust: 7, Anticipation: 6, Surprise: 5,
  Sad: 4, Fear: 3, Disgust: 2, Anger: 1
}

const DAILY_REWARDS: Record<number, number> = {
  1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 40, 7: 50
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.mood) return null;
  return (
    <svg x={cx - 16} y={cy - 16} width={32} height={32} className="overflow-visible hover:scale-125 transition-transform cursor-pointer">
      <circle cx="16" cy="16" r="16" fill={MOOD_COLORS[payload.mood.charAt(0).toUpperCase() + payload.mood.slice(1)] || "#6366f1"} opacity="0.3" />
      <image href={`/mood/${payload.mood}.png`} width="32" height="32" />
    </svg>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [fullTimelineData, setFullTimelineData] = useState<any[]>([]) 
  
  // ALUR ANTREAN MODAL ONBOARDING (Berurutan)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [showDailyReward, setShowDailyReward] = useState(false)
  
  // MODAL BIASA
  const [showChartDetail, setShowChartDetail] = useState(false) 
  const [showFullTimeline, setShowFullTimeline] = useState(false) 
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null)
  
  const [dailyCoins, setDailyCoins] = useState(0) 
  const [loginDay, setLoginDay] = useState(1)
  const [gotDailyBadge, setGotDailyBadge] = useState(false)

  // STATE UNTUK DIALOG KUCING (EPIC MEANING)
  const [dialogueStep, setDialogueStep] = useState(0)

  // NASKAH DIALOG EPIC MEANING (VERSI LUCU & HANGAT)
  const introDialogues = [
    `Meow~ Halo, ${user?.name || 'Pencari ketenangan'}... Akhirnya kamu datang juga.`,
    "Dunia di luar sana pasti kadang terasa terlalu berisik dan bikin lelah, ya?",
    "Nggak apa-apa kok kalau kamu merasa capek. Di sini, kamu boleh jadi dirimu sendiri.",
    "Ini adalah ruang amanmu. Tempat buat kamu mencatat, merenung, dan memeluk semua perasaanmu.",
    "Nanti kamu juga bisa mengumpulkan teman-teman lucu sepertiku di Toko Pet, loh!",
    "Yuk, kita mulai petualangan kecil ini pelan-pelan. Aku akan tunjukkan cara kerjanya!"
  ]

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const userId = session.user.id

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data: journals } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) 

      let petName = null
      if (profile?.equipped_pet_id) {
         const { data: pet } = await supabase
           .from('pets')
           .select('name')
           .eq('id', profile.equipped_pet_id)
           .single()
         if (pet) petName = pet.name.toLowerCase()
      }

      const entries = journals || []
      
      let currentCoins = profile?.coins || 0
      const today = new Date()
      const todayStr = today.toLocaleDateString('en-CA')
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toLocaleDateString('en-CA')

      // PENGECEKAN ALUR MODAL
      if (profile) {
        if (profile.has_seen_onboarding === false) {
          setShowOnboarding(true) // Modal 1: Kucing
        } else if (profile.last_login_date !== todayStr) {
          // Kalau udah pernah onboarding, langsung ke Daily Reward
          checkAndSetDailyReward(profile, todayStr, yesterdayStr, currentCoins, userId)
        }
      }

      const moodCounts: Record<string, number> = {}
      entries.forEach((entry: any) => {
        const m = entry.mood
        if (m) {
          const formattedMood = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
          moodCounts[formattedMood] = (moodCounts[formattedMood] || 0) + 1
        }
      })
      setChartData(Object.keys(moodCounts).map(key => ({
        name: key, count: moodCounts[key]
      })))

      const last7Days = []
      const formatLocal = (d: Date) => {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      }

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateString = formatLocal(d)
        
        const entriesToday = entries.filter((e: any) => formatLocal(new Date(e.created_at)) === dateString);
        
        const rawMood = entriesToday.length > 0 ? entriesToday[0].mood.toLowerCase() : null;
        const formattedMoodName = rawMood ? rawMood.charAt(0).toUpperCase() + rawMood.slice(1) : null;
        const score = formattedMoodName ? MOOD_SCORES[formattedMoodName] : null;

        last7Days.push({
          fullDate: dateString,
          dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          dateNum: d.getDate(),
          monthName: d.toLocaleDateString('id-ID', { month: 'short' }),
          year: d.getFullYear(),
          mood: rawMood,
          score: score,
          entries: entriesToday 
        })
      }
      setWeeklyData(last7Days)

      if (entries.length > 0) {
        const sortedEntries = [...entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const oldestDate = new Date(sortedEntries[0].created_at);
        oldestDate.setHours(0, 0, 0, 0);
        
        const todayDateZero = new Date();
        todayDateZero.setHours(0, 0, 0, 0);

        const allDays = [];
        let currentDate = new Date(oldestDate);
        
        while (currentDate <= todayDateZero) {
            const dateString = formatLocal(currentDate);
            
            const entriesForDay = entries.filter((e: any) => formatLocal(new Date(e.created_at)) === dateString);
            
            const rawMood = entriesForDay.length > 0 ? entriesForDay[0].mood.toLowerCase() : null;
            
            allDays.push({
                fullDate: dateString,
                dayName: currentDate.toLocaleDateString('id-ID', { weekday: 'short' }),
                dateNum: currentDate.getDate(),
                monthName: currentDate.toLocaleDateString('id-ID', { month: 'short' }),
                year: currentDate.getFullYear(),
                mood: rawMood,
                entries: entriesForDay 
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        setFullTimelineData(allDays);
      }

      let currentJournalStreak = 0;
      const uniqueDates = Array.from(new Set(entries.map((e: any) => formatLocal(new Date(e.created_at)))));
      const todayDate = new Date();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      const todayFormatted = formatLocal(todayDate);
      const yesterdayFormatted = formatLocal(yesterdayDate);

      if (uniqueDates.includes(todayFormatted) || uniqueDates.includes(yesterdayFormatted)) {
          let checkDate = new Date(uniqueDates.includes(todayFormatted) ? todayFormatted : yesterdayFormatted);
          while (true) {
              if (uniqueDates.includes(formatLocal(checkDate))) {
                  currentJournalStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
              } else {
                  break;
              }
          }
      }

      setUser({
        id: userId,
        name: profile?.username || "User",
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        points: currentCoins,
        entries: entries,
        streak: currentJournalStreak,
        activePet: petName
      })
    }

    fetchData()
  }, [router])

  // Fungsi Helper Untuk Daily Reward
  const checkAndSetDailyReward = async (profile: any, todayStr: string, yesterdayStr: string, currentCoins: number, userId: string) => {
    let currentLoginStreak = profile.login_streak || 0
          
    if (profile.last_login_date === yesterdayStr) {
      currentLoginStreak += 1
    } else {
      currentLoginStreak = 1
    }

    const cycleDay = currentLoginStreak % 7 === 0 ? 7 : currentLoginStreak % 7
    const rewardCoins = DAILY_REWARDS[cycleDay]
    currentCoins += rewardCoins
    
    let newlyGotBadge = false

    if (cycleDay === 7) {
      const { data: ownedBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId).eq('badge_id', 5)
      const hasBadge = ownedBadges && ownedBadges.length > 0

      if (!hasBadge) {
        await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 5 }])
        newlyGotBadge = true
      }
    }
    
    await supabase.from('profiles').update({
      coins: currentCoins,
      last_login_date: todayStr,
      login_streak: currentLoginStreak
    }).eq('id', userId)

    setDailyCoins(rewardCoins)
    setLoginDay(cycleDay)
    setGotDailyBadge(newlyGotBadge)
    setShowDailyReward(true) // Modal Terakhir
  }

  // ALUR 1: Tutup Dialog Kucing -> Buka Penjelasan Emosi
  const handleCloseOnboarding = async () => {
    setShowOnboarding(false)
    setShowIntroModal(true) // Modal 2
    if (user?.id) {
      await supabase.from('profiles').update({ has_seen_onboarding: true }).eq('id', user.id)
    }
  }

  // ALUR 2: Tutup Penjelasan Emosi -> Buka Daily Reward (Jika Hari Pertama)
  const handleCloseIntro = async () => {
    setShowIntroModal(false)
    
    // Tarik data profil lagi untuk ngecek daily reward
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const todayStr = new Date().toLocaleDateString('en-CA')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA')

    if (profile && profile.last_login_date !== todayStr) {
      checkAndSetDailyReward(profile, todayStr, yesterdayStr, profile.coins, user.id)
    }
  }

  const openDayDetail = (dayData: any) => {
    if (dayData.entries && dayData.entries.length > 0) {
      setSelectedDayDetail(dayData)
    }
  }

  if (!user) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-slate-800 dark:text-white transition-colors duration-300">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="animate-pulse font-medium text-purple-600 dark:text-purple-400">Memuat data emosimu...</p>
    </div>
  )

  const activePet = user.activePet

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 relative text-slate-800 dark:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto pt-[100px] px-4 sm:px-6 pb-24 w-full overflow-hidden">
        
        {/* HEADER */}
        <div className="mb-6 sm:mb-8 mt-4 md:mt-0 animate-fade-in-up flex justify-between items-start">
          <div>
            {user.entries.length === 0 ? (
              // GREETING UNTUK AKUN BARU
              <>
                <h1 className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 dark:from-rose-400 dark:to-orange-300 drop-shadow-sm flex items-center gap-3">
                  Mulai Ceritamu, {user.name} 🐾
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-orange-200/80 font-medium max-w-2xl">
                  Ini adalah ruang amanmu. Yuk, tarik napas panjang, dan luapkan apa pun yang kamu rasakan hari ini.
                </p>
              </>
            ) : (
              // GREETING UNTUK AKUN LAMA 
              <>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-slate-900 dark:text-white">
                  Halo, {user.name} 👋
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-indigo-200/80 font-medium">
                  Selamat datang kembali di ruang amanmu.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard title="Level" value={user.level} currentXP={user.xp} />
          <StatCard title="Koin" value={user.points} />
          <StatCard title="Total Jurnal" value={user.entries.length} />
          <StatCard title="Streak 🔥" value={`${user.streak} Hari`} />
        </div>

        <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-indigo-500/20 p-5 sm:p-8 rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.05)] w-full mb-6 sm:mb-8 relative">
          
          {/* EFEK PANAH PETUNJUK UNTUK USER BARU */}
          {user.entries.length === 0 && !showOnboarding && !showIntroModal && !showDailyReward && (
            <div className="absolute -top-12 left-[15%] hidden sm:flex flex-col items-center animate-bounce-slow z-20">
              <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg mb-1">Mulai di Sini!</div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-indigo-600"></div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg sm:text-xl font-bold">Bagaimana perasaanmu hari ini?</h2>
                <button 
                  onClick={() => setShowIntroModal(true)}
                  className="w-7 h-7 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110"
                  title="Apa arti emosi ini?"
                >
                  ?
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-indigo-200/60 font-medium">Pilih emosi yang paling menggambarkan kondisimu untuk memulai jurnal.</p>
            </div>
            
            <Link href="/journal/free" className="w-full md:w-auto">
              <button className="w-full md:w-auto bg-slate-100 dark:bg-purple-900/40 hover:bg-slate-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 px-6 py-3 rounded-xl text-sm font-bold transition-all border border-slate-300 dark:border-purple-500/30 whitespace-nowrap">
                + Jurnal Bebas
              </button>
            </Link>
          </div>
          
          <div className="w-full relative z-10">
            <MoodGrid />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* ANALITIK CHART */}
          <div className="lg:col-span-2 bg-white dark:bg-[#13192B] border border-slate-200 dark:border-blue-500/20 p-4 sm:p-6 rounded-3xl shadow-sm w-full relative flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold">Analitik Mood</h2>
               {chartData.length > 0 && (
                 <button 
                   onClick={() => setShowChartDetail(true)}
                   className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                 >
                   Detail Tren 📈
                 </button>
               )}
            </div>

            {chartData.length > 0 ? (
              <div className="h-[240px] sm:h-[280px] w-full mt-2"> 
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 45 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={5}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-indigo-300/50 text-sm font-medium text-center px-4 flex-1">
                Belum ada data mood untuk dibuatkan grafik. Mulai jurnal pertamamu!
              </div>
            )}
          </div>

{/* ACTIVE PET */}
          <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-rose-500/20 p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col w-full relative overflow-hidden h-full">
            <h2 className="text-lg font-bold w-full text-left relative z-10">Peliharaanku</h2>
            
            {activePet ? (
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-2">
                <div className="bg-slate-50 dark:bg-rose-950/30 p-5 rounded-full mb-3 border border-slate-200 dark:border-rose-500/30 shadow-inner">
                   <img src={`/pets/${activePet}.png`} alt="pet" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl hover:scale-110 transition-transform cursor-pointer" />
                </div>
                <p className="text-rose-600 dark:text-rose-400 font-extrabold capitalize text-xl">{activePet}</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-rose-200/60 mt-1 font-medium">Menemanimu hari ini</p>
                
                {/* TOMBOL MINI GAME */}
                <Link href="/play" className="mt-4 w-full">
                  <button className="w-full bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white text-xs sm:text-sm font-black py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 uppercase tracking-wide">
                    <span>🎮</span> Ajak Main
                  </button>
                </Link>

                {/* LINK GANTI PET */}
                <Link href="/shop" className="mt-3 text-xs text-slate-400 dark:text-rose-400/60 hover:text-slate-600 dark:hover:text-rose-300 hover:underline transition font-bold">
                  Ganti Peliharaan
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full mt-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-rose-800">
                  <span className="text-2xl sm:text-3xl opacity-40">🥚</span>
                </div>
                <p className="text-slate-500 dark:text-rose-200/60 font-medium text-xs sm:text-sm mb-5">Kamu belum memiliki pet.</p>
                <Link href="/shop">
                  <button className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 px-5 py-2.5 rounded-xl text-sm font-bold transition border border-rose-200 dark:border-rose-700 shadow-sm">
                    Ke Toko Pet
                  </button>
                </Link>
              </div>
            )}
          </div>
          
        </div>

        {/* TIMELINE 7 HARI TERAKHIR & TOMBOL LIHAT SEMUA */}
        <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-teal-500/20 p-5 sm:p-8 rounded-3xl shadow-sm w-full mb-6 sm:mb-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold">Jejak Emosi 7 Hari Terakhir</h2>
               {fullTimelineData.length > 0 && (
                 <button 
                   onClick={() => setShowFullTimeline(true)} 
                   className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-800 transition"
                 >
                   Lihat Semua 📅
                 </button>
               )}
            </div>
            <div className="flex justify-between items-end gap-2 w-full overflow-x-auto scrollbar-hide pb-2">
              <div className="flex justify-between w-full min-w-[400px]">
                {weeklyData.map((day, idx) => {
                  const isFilled = day.mood !== null;
                  const moodColor = isFilled ? (MOOD_COLORS[day.mood.charAt(0).toUpperCase() + day.mood.slice(1)] || "#2dd4bf") : "";
                  
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div 
                        onClick={() => openDayDetail(day)}
                        title={isFilled ? "Klik untuk lihat detail jurnal" : ""}
                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-all border-2 
                           ${isFilled ? 'bg-slate-50 dark:bg-[#0f1423] hover:-translate-y-1 cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 border-transparent'}
                        `} 
                        style={isFilled ? { borderColor: moodColor, boxShadow: `0 0 15px ${moodColor}40` } : {}}
                      >
                        {isFilled ? 
                          <img src={`/mood/${day.mood}.png`} alt={day.mood} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md z-10" /> 
                        : 
                          <span className="text-slate-400 dark:text-slate-600 font-bold">-</span>
                        }
                      </div>
                      <p className={`text-xs sm:text-sm font-bold ${idx === 6 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{day.dayName}</p>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">{day.dateNum}</p>
                    </div>
                  )
                })}
              </div>
            </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <QuoteCarousel />
        </div>

      </main>

      {/* ============================================================== */}
      {/* MODAL POPUP: DETAIL JURNAL DALAM 1 HARI                        */}
      {/* ============================================================== */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-teal-500/50 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setSelectedDayDetail(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">
                Detail Jurnal 📝
              </h2>
              <p className="text-teal-600 dark:text-teal-400 font-bold text-sm">
                {selectedDayDetail.dayName}, {selectedDayDetail.dateNum} {selectedDayDetail.monthName} {selectedDayDetail.year}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {selectedDayDetail.entries.map((entry: any, index: number) => {
                const entryMood = entry.mood ? entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1) : "Unknown";
                const hexColor = MOOD_COLORS[entryMood] || "#6366f1";
                const timeString = new Date(entry.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none" style={{ backgroundColor: hexColor }}></div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: hexColor, backgroundColor: `${hexColor}20` }}>
                        <img src={`/mood/${entry.mood.toLowerCase()}.png`} className="w-5 h-5 drop-shadow-sm" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-white text-sm">{entryMood}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{timeString}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                      {entry.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL POPUP: FULL TIMELINE (SEMUA JEJAK EMOSI)                 */}
      {/* ============================================================== */}
      {showFullTimeline && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-teal-500/50 rounded-[2rem] p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setShowFullTimeline(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Semua Jejak Emosimu 📅</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Perjalanan suasana hatimu sejak hari pertama menggunakan aplikasi ini.</p>
            
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
               <div className="flex flex-wrap gap-4 sm:gap-6 justify-start">
                  {fullTimelineData.map((day, idx) => {
                    const isFilled = day.mood !== null;
                    const moodColor = isFilled ? (MOOD_COLORS[day.mood.charAt(0).toUpperCase() + day.mood.slice(1)] || "#2dd4bf") : "";
                    
                    return (
                      <div key={idx} className="flex flex-col items-center w-12 sm:w-16 mb-2">
                        <div 
                          onClick={() => openDayDetail(day)}
                          title={isFilled ? "Klik untuk lihat detail jurnal" : ""}
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 transition-all border-2 
                             ${isFilled ? 'bg-slate-50 dark:bg-[#0f1423] hover:-translate-y-1 cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 border-transparent'}
                          `} 
                          style={isFilled ? { borderColor: moodColor, boxShadow: `0 0 15px ${moodColor}40` } : {}}
                        >
                          {isFilled ? 
                            <img src={`/mood/${day.mood}.png`} alt={day.mood} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md z-10" /> 
                          : 
                            <span className="text-slate-400 dark:text-slate-600 font-bold">-</span>
                          }
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 text-center">{day.dateNum} {day.monthName}</p>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{day.year}</p>
                      </div>
                    )
                  })}
               </div>
            </div>
            
            <div className="mt-6 bg-teal-50 dark:bg-teal-950/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-sm border border-teal-100 dark:border-teal-900/50">
               <div className="flex-1 text-teal-800 dark:text-teal-200 font-medium">
                  Lingkaran yang memiliki ikon menandakan hari di mana kamu mencatat jurnal. Klik ikonnya untuk melihat seluruh jurnal di hari tersebut!
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP: DETAIL TREN MOOD (LINE CHART) */}
      {showChartDetail && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/50 rounded-[2rem] p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative">
            <button 
              onClick={() => setShowChartDetail(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              ✕
            </button>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Tren Emosimu 📈</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Pergerakan suasana hatimu selama 7 hari terakhir.</p>
            
            <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: -20, bottom: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                   <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={15} />
                   <YAxis domain={[1, 8]} hide={true} />
                   
                   <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      dot={<CustomDot />} 
                      activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      connectNulls={false}
                      animationDuration={1500}
                   />
                 </LineChart>
               </ResponsiveContainer>
            </div>
            
            <div className="mt-8 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-sm">
               <div className="flex-1 text-indigo-800 dark:text-indigo-200 font-medium">
                  Semakin tinggi grafik, semakin positif emosimu (Joy/Trust). Tetap semangat mencatat!
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENJELASAN 8 EMOSI PLUTCHIK */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[310] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in transition-colors">
          <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-indigo-500/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-extrabold text-purple-900 dark:text-white mb-2 text-center">8 Emosi Dasar MoodMate 🌙</h2>
            <p className="text-slate-500 dark:text-indigo-200/70 text-center mb-8 text-sm font-medium">Berdasarkan teori psikologi Robert Plutchik, kenali perasaanmu di bawah ini sebelum mulai menulis.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-yellow-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/joy.png" alt="joy" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-yellow-700 dark:text-yellow-400">Joy (Gembira)</h3>
                </div>
                <p className="text-xs text-yellow-800/70 dark:text-slate-300 font-medium">Perasaan senang, puas, dan bahagia terhadap apa yang terjadi.</p>
              </div>
              <div className="bg-green-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-green-200 dark:border-green-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/trust.png" alt="trust" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-green-700 dark:text-green-400">Trust (Percaya)</h3>
                </div>
                <p className="text-xs text-green-800/70 dark:text-slate-300 font-medium">Rasa aman, penerimaan, dan keyakinan terhadap seseorang atau situasi.</p>
              </div>
              <div className="bg-orange-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-orange-200 dark:border-orange-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/fear.png" alt="fear" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-orange-700 dark:text-orange-400">Fear (Takut)</h3>
                </div>
                <p className="text-xs text-orange-800/70 dark:text-slate-300 font-medium">Respons alamiah saat menghadapi ancaman, bahaya, atau kecemasan.</p>
              </div>
              <div className="bg-pink-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-pink-200 dark:border-pink-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/surprise.png" alt="surprise" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-pink-700 dark:text-pink-400">Surprise (Terkejut)</h3>
                </div>
                <p className="text-xs text-pink-800/70 dark:text-slate-300 font-medium">Reaksi singkat terhadap hal-hal yang tidak terduga atau di luar rencana.</p>
              </div>
              <div className="bg-blue-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/sad.png" alt="sad" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-blue-700 dark:text-blue-400">Sad (Sedih)</h3>
                </div>
                <p className="text-xs text-blue-800/70 dark:text-slate-300 font-medium">Perasaan duka, kehilangan, atau kekecewaan yang butuh waktu untuk pulih.</p>
              </div>
              <div className="bg-purple-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-purple-200 dark:border-purple-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/disgust.png" alt="disgust" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-purple-700 dark:text-purple-400">Disgust (Jijik)</h3>
                </div>
                <p className="text-xs text-purple-800/70 dark:text-slate-300 font-medium">Rasa penolakan kuat terhadap sesuatu yang dianggap tidak pantas.</p>
              </div>
              <div className="bg-red-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-red-200 dark:border-red-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/anger.png" alt="anger" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-red-700 dark:text-red-400">Anger (Marah)</h3>
                </div>
                <p className="text-xs text-red-800/70 dark:text-slate-300 font-medium">Respons terhadap ketidakadilan, hambatan, atau rasa frustrasi.</p>
              </div>
              <div className="bg-cyan-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-500/20 transition">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/mood/anticipation.png" alt="anticipation" className="w-8 h-8 drop-shadow-sm" />
                  <h3 className="font-bold text-cyan-700 dark:text-cyan-400">Anticipation (Antisipasi)</h3>
                </div>
                <p className="text-xs text-cyan-800/70 dark:text-slate-300 font-medium">Perasaan menunggu, berharap, atau merencanakan sesuatu di masa depan.</p>
              </div>
            </div>

            <button 
              onClick={handleCloseIntro}
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 text-white font-bold py-4 rounded-2xl transition duration-200 shadow-md"
            >
              Saya Mengerti!
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REVISI EPIC MEANING: ONBOARDING DIALOG VISUAL NOVEL (KUCING)   */}
      {/* ============================================================== */}
      {showOnboarding && !showIntroModal && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-orange-50/90 dark:bg-[#0B0F19]/90 backdrop-blur-md px-4 transition-colors">
          
          <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-rose-400/20 dark:bg-indigo-600/20 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-orange-400/20 dark:bg-purple-600/20 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none"></div>

          <div className="max-w-2xl w-full relative z-10 flex flex-col items-center">
            
            <div className="w-32 h-32 sm:w-40 sm:h-40 mb-6 relative animate-bounce-slow flex justify-center items-center">
              <div className="absolute inset-0 bg-white/50 dark:bg-white/5 rounded-full blur-xl animate-pulse"></div>
              <div className="text-7xl sm:text-8xl drop-shadow-xl relative z-10">
                {dialogueStep < introDialogues.length - 1 ? '😺' : '😻'}
              </div>
              
              {dialogueStep === 0 && (
                <div className="absolute -top-4 -right-2 flex flex-col gap-1 items-end">
                  <span className="text-xs sm:text-sm font-bold text-orange-500 animate-float opacity-70">Z</span>
                  <span className="text-base sm:text-lg font-bold text-orange-500 animate-float delay-100 opacity-80">Z</span>
                  <span className="text-xl sm:text-2xl font-bold text-orange-500 animate-float delay-200">Z</span>
                </div>
              )}
            </div>

            <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-orange-200 dark:border-indigo-500/40 p-6 sm:p-10 rounded-[2rem] shadow-[0_10px_40px_rgba(251,146,60,0.15)] dark:shadow-[0_10px_40px_rgba(99,102,241,0.15)] relative mt-4">
              
              <div className="absolute -top-4 left-8 bg-orange-500 dark:bg-indigo-600 text-white text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                Kucing Jurnal
              </div>

              <p 
                key={dialogueStep} 
                className="text-slate-700 dark:text-white text-lg sm:text-xl font-medium leading-relaxed min-h-[90px] sm:min-h-[80px] animate-fade-in-up mt-2"
              >
                {introDialogues[dialogueStep]}
              </p>

              <div className="mt-8 flex justify-end">
                {dialogueStep < introDialogues.length - 1 ? (
                  <button
                    onClick={() => setDialogueStep(prev => prev + 1)}
                    className="text-white font-bold bg-orange-400 hover:bg-orange-500 dark:bg-slate-800 dark:hover:bg-indigo-600 border border-orange-300 dark:border-slate-700 dark:hover:border-indigo-500 px-6 py-3 rounded-full flex items-center gap-3 transition-all hover:scale-105 shadow-md"
                  >
                    Lanjut <span className="animate-bounce-x">▶</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCloseOnboarding}
                    className="text-white font-black bg-gradient-to-r from-orange-400 to-rose-400 dark:from-indigo-500 dark:to-purple-500 px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-lg animate-bounce-in"
                  >
                    Pelajari Emosi Dulu 💡
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* POP-UP DAILY LOGIN AWARD */}
      {showDailyReward && !showOnboarding && !showIntroModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm px-4 transition-colors">
          <div className="bg-white dark:bg-slate-900 border-2 border-yellow-400 dark:border-yellow-500/50 p-6 sm:p-8 rounded-[2rem] max-w-sm w-full text-center relative shadow-2xl animate-fade-in">
            <div className="text-7xl mb-4 animate-bounce drop-shadow-md">🎁</div>
            <h2 className="text-2xl font-black text-yellow-500 mb-2 uppercase tracking-wider">Hadiah Harian!</h2>
            
            {gotDailyBadge ? (
               <div className="bg-yellow-50 dark:bg-yellow-500/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-500/30 mb-6 mt-3">
                  <h3 className="text-yellow-600 dark:text-yellow-300 font-bold mb-2">🎉 Wow, 7 Hari Penuh!</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300 mb-3 font-medium">Kamu mendapatkan Medali Spesial + <span className="text-yellow-500 font-black">50 Koin</span></p>
                  <img src="/badges/badge_9.png" alt="Badge Login" className="w-16 h-16 mx-auto drop-shadow-md" />
               </div>
            ) : (
               <div className="mb-6 mt-4">
                  <p className="text-slate-700 dark:text-gray-200 text-lg font-bold mb-2">
                    Berhasil di-claim! <span className="text-yellow-500 text-xl">+{dailyCoins} Koin</span>
                  </p>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                    Jangan lupa login atau menulis jurnal besok agar Streak kamu tidak putus ya!
                  </p>
               </div>
            )}

            <button 
              onClick={() => setShowDailyReward(false)}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-md w-full hover:scale-105"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }

        @keyframes bounceX {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .animate-bounce-x { animation: bounceX 1s infinite; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }

        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}