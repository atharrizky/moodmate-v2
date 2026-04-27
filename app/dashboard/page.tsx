"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import MoodGrid from "@/components/MoodGrid"
import StatCard from "@/components/StatCard"
import QuoteCarousel from "@/components/QuoteCarousel"
import Link from "next/link"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from "@/lib/supabase" // <-- Import Supabase baru kita!

const MOOD_COLORS: Record<string, string> = {
  Joy: "#facc15", Trust: "#4ade80", Fear: "#f97316", Surprise: "#ec4899",
  Sad: "#3b82f6", Disgust: "#a855f7", Anger: "#ef4444", Anticipation: "#06b6d4"
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [showIntroModal, setShowIntroModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Cek apakah ada user yang sedang login di Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const userId = session.user.id

      // 2. Ambil Profil Gamifikasi (Level, Koin, Username) dari Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      // 3. Ambil Semua Jurnal milik user ini
      const { data: journals } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // 4. Ambil Info Peliharaan yang sedang dipakai (jika ada)
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
      
      // Tampilkan Intro Modal jika belum ada jurnal sama sekali
      if (entries.length === 0) {
        setShowIntroModal(true)
      }
      
      // --- LOGIKA CHART MOOD ---
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

      // --- LOGIKA 7 HARI TERAKHIR ---
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
        
        const entryToday = entries.find((e: any) => {
          const entryDate = new Date(e.created_at)
          return formatLocal(entryDate) === dateString
        })
        
        last7Days.push({
          dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          dateNum: d.getDate(),
          mood: entryToday ? entryToday.mood.toLowerCase() : null
        })
      }
      setWeeklyData(last7Days)

      // --- LOGIKA STREAK ---
      let currentStreak = 0;
      const uniqueDates = Array.from(new Set(entries.map((e: any) => formatLocal(new Date(e.created_at)))));
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = formatLocal(today);
      const yesterdayStr = formatLocal(yesterday);

      if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
          let checkDate = new Date(uniqueDates.includes(todayStr) ? todayStr : yesterdayStr);
          while (true) {
              if (uniqueDates.includes(formatLocal(checkDate))) {
                  currentStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
              } else {
                  break;
              }
          }
      }

      // 5. Masukkan data asli ke State UI kita
      setUser({
        name: profile?.username || "User",
        level: profile?.level || 1,
        points: profile?.coins || 0,
        entries: entries,
        streak: currentStreak,
        activePet: petName
      })
    }

    fetchData()
  }, [router])

  // Tampilkan layar kosong sementara agar tidak error saat menunggu data
  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat Data...</div>

  const activePet = user.activePet

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main className="max-w-5xl mx-auto pt-[100px] px-4 sm:px-6 pb-24 w-full overflow-hidden">
        
        {/* HEADER GREETING */}
        <div className="mb-6 sm:mb-8 mt-4 md:mt-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Halo, {user.name} 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Selamat datang kembali di ruang amanmu.</p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard title="Level" value={user.level} />
          <StatCard title="Koin" value={user.points} />
          <StatCard title="Total Jurnal" value={user.entries.length} />
          <StatCard title="Streak 🔥" value={`${user.streak} Hari`} />
        </div>

        {/* MOOD CHECK-IN SECTION */}
        <div className="bg-[#111827] border border-gray-800 p-5 sm:p-8 rounded-2xl shadow-sm w-full mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Bagaimana perasaanmu hari ini?</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Pilih emosi yang paling menggambarkan kondisimu untuk memulai jurnal.</p>
            </div>
            <Link href="/journal/free" className="w-full md:w-auto">
              <button className="w-full md:w-auto bg-[#0f172a] hover:bg-gray-800 text-white px-5 py-3 md:py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap border border-gray-700">
                + Jurnal Bebas
              </button>
            </Link>
          </div>
          
          <div className="w-full mt-4">
            <MoodGrid />
          </div>
        </div>

        {/* CHART & PET SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* ANALITIK BAR CHART */}
          <div className="lg:col-span-2 bg-[#111827] border border-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Analitik Mood</h2>
            {chartData.length > 0 ? (
              <div className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} />
                    <Tooltip cursor={{ fill: '#1f2937' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#ffffff' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || "#7c3aed"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm text-center px-4">
                Belum ada data mood untuk dibuatkan grafik. Mulai jurnal pertamamu!
              </div>
            )}
          </div>

          {/* ACTIVE PET COMPANION */}
          <div className="bg-[#111827] border border-gray-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center w-full">
            <h2 className="text-lg font-semibold text-white mb-4 w-full text-left">Peliharaanku</h2>
            {activePet ? (
              <>
                <div className="bg-[#0f172a] p-4 rounded-full mb-3 border border-primary/30">
                   <img src={`/pets/${activePet}.png`} alt="pet" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl" />
                </div>
                <p className="text-primary font-medium capitalize text-lg">{activePet}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Menemanimu hari ini</p>
                <Link href="/shop" className="mt-3 text-xs text-gray-500 hover:text-white underline transition">Ganti Pet</Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0f172a] rounded-full mb-3 flex items-center justify-center border border-dashed border-gray-700">
                  <span className="text-2xl sm:text-3xl">🥚</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">Kamu belum memiliki pet.</p>
                <Link href="/shop">
                  <button className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    Ke Toko Pet
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* TIMELINE 7 HARI TERAKHIR */}
        <div className="bg-[#111827] border border-gray-800 p-5 sm:p-8 rounded-2xl shadow-sm w-full mb-6 sm:mb-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-semibold text-white">Jejak Emosi 7 Hari Terakhir</h2>
            </div>
            <div className="flex justify-between items-end gap-2 w-full overflow-x-auto scrollbar-hide pb-2">
              <div className="flex justify-between w-full min-w-[400px]">
                {weeklyData.map((day, idx) => {
                  const isFilled = day.mood !== null;
                  const bgColor = isFilled ? MOOD_COLORS[day.mood.charAt(0).toUpperCase() + day.mood.slice(1)] || "#7c3aed" : "#1f2937";
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-transform ${isFilled ? 'shadow-lg hover:-translate-y-1' : 'opacity-40'}`} style={{ backgroundColor: bgColor }}>
                        {isFilled ? <img src={`/mood/${day.mood}.png`} alt={day.mood} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" /> : <span className="text-gray-500">-</span>}
                      </div>
                      <p className={`text-xs sm:text-sm font-medium ${idx === 6 ? 'text-white' : 'text-gray-400'}`}>{day.dayName}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{day.dateNum}</p>
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

      {/* MODAL PENJELASAN 8 EMOSI PLUTCHIK */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Selamat Datang di MoodMate! 🌙</h2>
            <p className="text-gray-400 text-center mb-6 text-sm">Mari kenali 8 emosi dasar berdasarkan teori psikologi Robert Plutchik sebelum kamu memulai.</p>
            
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
              onClick={() => setShowIntroModal(false)}
              className="w-full bg-primary hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition duration-200"
            >
              Saya Mengerti, Mulai Jurnal!
            </button>
          </div>
        </div>
      )}

    </div>
  )
}