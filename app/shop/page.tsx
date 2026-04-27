"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Shop() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [coins, setCoins] = useState(0)
  const [userLevel, setUserLevel] = useState(1) // Tambahan state untuk Level
  const [activePetId, setActivePetId] = useState<number | null>(null)
  const [shopPets, setShopPets] = useState<any[]>([])
  const [ownedPets, setOwnedPets] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

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

      // Ambil Koin, Pet Aktif, dan LEVEL dari Profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, equipped_pet_id, level') // Tambah level di sini
        .eq('id', uId)
        .single()
      
      if (profile) {
        setCoins(profile.coins)
        setUserLevel(profile.level) // Simpan level user
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
    const isLocked = userLevel < pet.required_level // Cek apakah level cukup

    if (isLocked) {
      alert(`Kamu harus mencapai Level ${pet.required_level} dulu untuk membuka peliharaan ini!`)
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
        alert(`Berhasil memakai ${pet.name}!`)

      } else {
        if (coins < pet.price) {
          alert("Koin kamu belum cukup. Yuk isi jurnal lagi! 📝")
          return
        }

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

        setCoins(newCoinBalance)
        setOwnedPets([...ownedPets, pet.id])
        setActivePetId(pet.id)
        alert(`Yeay! Berhasil membeli ${pet.name}!`)

        // --- TAMBAHKAN LOGIKA MEDALI DI SINI ---
        const { data: userBadgesData } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId)
        const myBadgeIds = userBadgesData ? userBadgesData.map(b => b.badge_id) : []

        // Cek Kolektor Satwa (ID 6) -> Beli minimal 3 Pet
        if (!myBadgeIds.includes(6) && (ownedPets.length + 1) >= 3) {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 6 }])
            alert("Achievement Unlocked: Kolektor Satwa! 🐾 Cek di profilmu!")
        }

        // Cek Pemancing Ulung (ID 7) -> Kalau yang dibeli Pufferfish
        if (!myBadgeIds.includes(7) && pet.name.toLowerCase() === 'pufferfish') {
            await supabase.from('user_badges').insert([{ user_id: userId, badge_id: 7 }])
            alert("Achievement Unlocked: Pemancing Ulung! 🐡 Cek di profilmu!")
        }
        // ---------------------------------------
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Membuka Toko Peliharaan...</div>
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-[100px] px-5">
        <button className="text-gray-400 hover:text-white transition mb-6 flex items-center gap-2" onClick={() => router.push("/dashboard")}>
          <span>&larr;</span> Kembali
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Pet Shop 🐾</h1>
          <div className="flex gap-4">
            <div className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-gray-400 text-sm">Level: </span>
              <span className="font-bold text-white">{userLevel}</span>
            </div>
            <div className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-gray-400 text-sm">Koin kamu: </span>
              <span className="font-bold text-yellow-400 flex items-center gap-1">
                 <span className="text-lg">🪙</span> {coins}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shopPets.map((pet) => {
            const isOwned = ownedPets.includes(pet.id)
            const isActive = activePetId === pet.id
            const isLocked = userLevel < pet.required_level // Status Terkunci
            const petImageName = pet.name.toLowerCase()

            return (
              <div key={pet.id} className={`bg-[#111827] border ${isActive ? 'border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-gray-800'} p-6 rounded-2xl flex flex-col items-center shadow-sm relative overflow-hidden transition-all duration-300`}>
                
                {isActive && (
                  <div className="absolute top-2 right-2 bg-primary/20 text-primary text-xs px-2 py-1 rounded-md font-bold">
                    Dipakai
                  </div>
                )}

                {/* Tanda Gembok Kalau Level Kurang */}
                {isLocked && (
                   <div className="absolute top-2 left-2 bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1 z-10">
                     🔒 Lv.{pet.required_level}
                   </div>
                )}
                
                {/* Efek Hitam Putih (Grayscale) kalau belum cukup level */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${isActive ? 'bg-primary/10' : 'bg-gray-800/50'}`}>
                   <img 
                     src={`/pets/${petImageName}.png`} 
                     alt={pet.name} 
                     className={`w-20 h-20 object-contain transition-all ${isLocked ? 'grayscale opacity-50' : 'drop-shadow-xl hover:scale-110 cursor-pointer'}`} 
                   />
                </div>

                <h2 className={`text-lg font-bold capitalize mb-1 ${isLocked ? 'text-gray-500' : 'text-white'}`}>{pet.name}</h2>
                
                <p className={`text-sm font-medium mb-6 ${isOwned ? 'text-gray-400' : isLocked ? 'text-red-400/70' : 'text-yellow-400'}`}>
                  {isOwned ? "Sudah Dimiliki" : `🪙 ${pet.price}`}
                </p>

                <button
                  onClick={() => handlePetAction(pet)}
                  disabled={isActive || (!isOwned && coins < pet.price) || isLocked}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive ? 'bg-primary text-white cursor-default'
                    : isLocked ? 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'
                    : isOwned ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md'
                    : coins < pet.price ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-white text-slate-900 hover:bg-gray-200 shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {isActive ? 'Sedang Dipakai' 
                   : isLocked ? `Buka di Lv.${pet.required_level}` 
                   : isOwned ? 'Pakai Pet Ini' 
                   : 'Beli Pet'}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}