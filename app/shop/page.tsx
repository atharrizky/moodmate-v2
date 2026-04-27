"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Shop() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [coins, setCoins] = useState(0)
  const [userLevel, setUserLevel] = useState(1) 
  const [activePetId, setActivePetId] = useState<number | null>(null)
  const [shopPets, setShopPets] = useState<any[]>([])
  const [ownedPets, setOwnedPets] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  // STATE UNTUK CUSTOM ALERT (INFO & ERROR)
  const [customAlert, setCustomAlert] = useState<{title: string, desc: string, type: 'success' | 'error' | 'info'} | null>(null);

  // STATE BARU UNTUK POP-UP ACHIEVEMENT (MEDALI) DI SHOP
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([])

  useEffect(() => {
    fetchShopData()
  }, [])

  async function fetchShopData() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      const uId = session.user.id
      setUserId(uId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, equipped_pet_id, level') 
        .eq('id', uId)
        .single()
      
      if (profile) {
        setCoins(profile.coins)
        setUserLevel(profile.level) 
        setActivePetId(profile.equipped_pet_id)
      }

      const { data: petsList } = await supabase
        .from('pets')
        .select('*')
        .order('id', { ascending: true })
      
      if (petsList) setShopPets(petsList)

      const { data: myPets } = await supabase
        .from('user_pets')
        .select('pet_id')
        .eq('user_id', uId)
      
      if (myPets) {
        const myPetIds = myPets.map(p => p.pet_id)
        setOwnedPets(myPetIds)
      }

    } catch (err) {
      console.error("Gagal memuat toko:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePetAction(pet: any) {
    if (!userId) return
    const isOwned = ownedPets.includes(pet.id)
    const isLocked = userLevel < pet.required_level

    if (isLocked) {
      setCustomAlert({
        title: "Level Belum Cukup! 🔒",
        desc: `Kamu harus mencapai Level ${pet.required_level} dulu untuk membuka ${pet.name}.`,
        type: "error"
      })
      return
    }

    try {
      if (isOwned) {
        const { error } = await supabase
          .from('profiles')
          .update({ equipped_pet_id: pet.id })
          .eq('id', userId)

        if (error) throw error
        setActivePetId(pet.id)
        
        setCustomAlert({
          title: "Berhasil Dipakai!",
          desc: `${pet.name} sekarang menemanimu di Dashboard!`,
          type: "success"
        })

      } else {
        if (coins < pet.price) {
          setCustomAlert({
            title: "Koin Kurang! 🪙",
            desc: "Koin kamu belum cukup. Yuk isi jurnal lagi biar dapet koin!",
            type: "info"
          })
          return
        }

        // 1. PROSES PEMBELIAN PET
        const newCoinBalance = coins - pet.price
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            coins: newCoinBalance,
            equipped_pet_id: pet.id 
          })
          .eq('id', userId)
        
        if (profileError) throw profileError

        const { error: myPetError } = await supabase
          .from('user_pets')
          .insert([{ user_id: userId, pet_id: pet.id }])
        
        if (myPetError) throw myPetError

        // Update State Visual
        setCoins(newCoinBalance)
        setOwnedPets(prev => [...prev, pet.id])
        setActivePetId(pet.id)

        // ==========================================
        // 2. PENGECEKAN MEDALI (PERBAIKAN BUG)
        // ==========================================
        const newAchievements = []
        
        // Ambil data badge yang udah dipunya
        const { data: userBadgesData } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        const myBadgeIds = userBadgesData ? userBadgesData.map(b => b.badge_id) : []

        // AMBIL TOTAL PET LANGSUNG DARI DATABASE BIAR AKURAT 100%
        const { data: currentMyPets } = await supabase.from('user_pets').select('pet_id').eq('user_id', userId)
        const totalMyPets = currentMyPets ? currentMyPets.length : 0

        // Badge 6: Kolektor Satwa (Punya 3 Pet)
        if (!myBadgeIds.includes(6) && totalMyPets >= 3) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 6 }])
            newAchievements.push({ id: 6, name: "Kolektor Satwa", img: "badge_6.jpg" })
        }

        // Badge 7: Pemancing Ulung (Beli Pufferfish)
        if (!myBadgeIds.includes(7) && pet.name.toLowerCase() === 'pufferfish') {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 7 }])
            newAchievements.push({ id: 7, name: "Pemancing Ulung", img: "badge_7.jpg" })
        }

        // 3. LOGIKA PENAMPILAN POP-UP
        if (newAchievements.length > 0) {
          // Kalau dapet medali, tampilkan pop-up Medali Mewah
          setUnlockedBadges(newAchievements)
        } else {
          // Kalau ga dapet medali, tampilkan pop-up sukses beli biasa
          setCustomAlert({
            title: "Pembelian Sukses! 🎉",
            desc: `Yeay! Kamu berhasil membeli dan memakai ${pet.name}!`,
            type: "success"
          })
        }
      }
    } catch (err: any) {
      setCustomAlert({
        title: "Terjadi Kesalahan",
        desc: err.message,
        type: "error"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-slate-800 dark:text-white">
         <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="animate-pulse font-bold text-rose-500 dark:text-rose-400">Membuka Toko Peliharaan...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-20 transition-colors duration-300 relative">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-[100px] px-5 relative z-10">
        
        <button 
          className="text-slate-500 hover:text-purple-600 dark:text-indigo-200/70 dark:hover:text-white font-bold transition mb-6 flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-sm" 
          onClick={() => router.push("/dashboard")}
        >
          <span>&larr;</span> Kembali
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 drop-shadow-sm">Pet Shop 🐾</h1>
          
          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-auto">
              <span className="text-slate-500 dark:text-indigo-200/70 text-sm font-bold">Level</span>
              <span className="font-black text-blue-600 dark:text-blue-400 text-lg">{userLevel}</span>
            </div>
            <div className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-auto">
              <span className="text-slate-500 dark:text-indigo-200/70 text-sm font-bold">Koin</span>
              <span className="font-black text-yellow-500 dark:text-yellow-400 flex items-center gap-1.5 text-lg">
                <span>🪙</span> {coins}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {shopPets.map((pet) => {
            const isOwned = ownedPets.includes(pet.id)
            const isActive = activePetId === pet.id
            const isLocked = userLevel < pet.required_level 
            const petImageName = pet.name.toLowerCase()

            return (
              <div 
                key={pet.id} 
                className={`
                  bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] flex flex-col items-center relative overflow-hidden transition-all duration-300
                  ${isActive ? 'border-2 border-rose-400 dark:border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] scale-105 z-10' : 'border border-slate-200 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:-translate-y-1'}
                `}
              >
                
                {isActive && (
                  <div className="absolute top-3 right-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-black tracking-wide uppercase">
                    Dipakai
                  </div>
                )}

                {isLocked && (
                   <div className="absolute top-3 left-3 bg-slate-200 dark:bg-red-500/20 text-slate-500 dark:text-red-400 text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-black flex items-center gap-1 z-10">
                      🔒 Lv.{pet.required_level}
                   </div>
                )}
                
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 mt-4 
                  ${isActive ? 'bg-rose-50 dark:bg-rose-900/30 shadow-inner' : 'bg-slate-50 dark:bg-slate-800/50'}
                `}>
                   <img 
                     src={`/pets/${petImageName}.png`} 
                     alt={pet.name} 
                     className={`w-16 h-16 sm:w-20 sm:h-20 object-contain transition-all duration-300 ${isLocked ? 'grayscale opacity-40' : 'drop-shadow-lg hover:scale-110 cursor-pointer'}`} 
                   />
                </div>

                <h2 className={`text-base sm:text-lg font-black capitalize mb-1 text-center ${isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>{pet.name}</h2>
                
                <p className={`text-xs sm:text-sm font-bold mb-5 ${isOwned ? 'text-slate-400 dark:text-slate-500' : isLocked ? 'text-red-500 dark:text-red-400/70' : 'text-yellow-500 dark:text-yellow-400'}`}>
                  {isOwned ? "Sudah Dimiliki" : `🪙 ${pet.price}`}
                </p>

                <button
                  onClick={() => handlePetAction(pet)}
                  disabled={isActive || (!isOwned && coins < pet.price) || isLocked}
                  className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 uppercase tracking-wide
                    ${isActive ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-md'
                    : isLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : isOwned ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white'
                    : coins < pet.price ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500 border border-indigo-100 dark:border-transparent shadow-sm hover:shadow-md'
                  }`}
                >
                  {isActive ? 'Dipakai' 
                   : isLocked ? `Lv.${pet.required_level}` 
                   : isOwned ? 'Pakai' 
                   : 'Beli'}
                </button>
              </div>
            )
          })}
        </div>

      </div>

      {/* ========================================== */}
      {/* CUSTOM POP-UP ALERT (INFO / ERROR BIASA)   */}
      {/* ========================================== */}
      {customAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl transform transition-all animate-bounce-in text-center relative overflow-hidden">
            
            <div className={`absolute top-0 left-0 w-full h-2 ${
              customAlert.type === 'success' ? 'bg-green-500' : 
              customAlert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>

            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-inner ${
              customAlert.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-500' : 
              customAlert.type === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-500' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-500'
            }`}>
              <span className="text-4xl animate-bounce">
                {customAlert.type === 'success' ? '✨' : customAlert.type === 'error' ? '🔒' : '💡'}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">{customAlert.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed whitespace-pre-wrap">
              {customAlert.desc}
            </p>

            <button 
              onClick={() => setCustomAlert(null)} 
              className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-transform hover:-translate-y-1 ${
                customAlert.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30' : 
                customAlert.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
              }`}
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POP-UP ACHIEVEMENT MEWAH (KHUSUS DAPET MEDALI) */}
      {/* ========================================== */}
      {unlockedBadges.length > 0 && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md animate-fade-in px-4">
          <div className="text-center animate-bounce-in max-w-lg w-full relative">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            
            <h2 className="text-4xl md:text-5xl font-black text-yellow-500 dark:text-yellow-400 mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] uppercase">
              Achievement Unlocked!
            </h2>
            <p className="text-white mb-10 text-lg font-medium">Luar biasa! Kamu mendapatkan pencapaian baru dari Toko.</p>
            
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {unlockedBadges.map((badge, idx) => (
                <div key={idx} className="bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-500/20 dark:to-orange-600/20 border-2 border-yellow-400 p-6 md:p-8 rounded-[2.5rem] shadow-[0_0_40px_rgba(250,204,21,0.4)] flex flex-col items-center transform transition hover:scale-105 relative overflow-hidden">
                  <div className="w-28 h-28 md:w-32 md:h-32 mb-6 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center relative z-10">
                     <img src={`/badges/${badge.img}`} alt={badge.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-2 relative z-10">{badge.name}</h3>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest relative z-10 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-lg">Cek di Profilmu</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setUnlockedBadges([])} // Menutup pop-up
              className="bg-yellow-400 hover:bg-yellow-500 dark:bg-gradient-to-r dark:from-yellow-400 dark:to-orange-500 text-yellow-950 font-black text-lg px-12 py-4 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.5)] transition-all hover:scale-105"
            >
              Lanjut Belanja &rarr;
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
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