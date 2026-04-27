"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

// --- DAFTAR MEDALI RESILIEN (KEBAL) DI DALAM KODINGAN ---
// Kita hardcode detail medalinya agar tidak perlu narik tabel `badges` lagi.
// `req_id` di sini harus cocok dengan ID yang diberikan oleh Jurnal/Toko Pet ke user_badges.
const RESILIENT_BADGES = [
  { req_id: 1, name: "Langkah Pertama", desc: "Mengisi jurnal untuk pertama kalinya.", img: "badge_1.jpg" },
  { req_id: 2, name: "Si Paling Bebas", desc: "Membuat 5 Jurnal Bebas.", img: "badge_2.jpg" },
  { req_id: 3, name: "Si Paling Joy", desc: "Memilih emosi 'Joy' sebanyak 5 kali.", img: "badge_3.jpg" },
  { req_id: 4, name: "Pawang Emosi", desc: "Pernah mengisi jurnal dengan ke-8 jenis emosi minimal 1 kali.", img: "badge_4.jpg" },
  { req_id: 5, name: "Si Paling Konsisten", desc: "Berhasil mempertahankan Streak selama 7 hari berturut-turut.", img: "badge_5.jpg" },
  { req_id: 6, name: "Kolektor Satwa", desc: "Berhasil membeli 3 pet berbeda di Toko.", img: "badge_6.jpg" },
  { req_id: 7, name: "Pemancing Ulung", desc: "Berhasil membeli pet eksklusif 'Pufferfish'.", img: "badge_7.jpg" },
  { req_id: 8, name: "Sultan Musang King", desc: "Berhasil mengumpulkan 1.000 Koin.", img: "badge_8.jpg" }
]

export default function PublicProfile() {
  const params = useParams()
  const router = useRouter()
  const usernameQuery = params.username as string

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [ownedBadgeIds, setOwnedBadgeIds] = useState<number[]>([]) // Hanya simpan ID medalinya saja
  const [equippedBadge, setEquippedBadge] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [usernameQuery])

  async function fetchUserProfile() {
    setLoading(true)
    try {
      // 1. Dapatkan UserID yang sedang login
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setCurrentUserId(session.user.id)

      // 2. Cari data user berdasarkan username di URL
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, level, xp, current_streak, coins, equipped_pet_id, equipped_badge_id')
        .ilike('username', usernameQuery)
        .single()

      if (profileError || !userProfile) {
        setLoading(false)
        return
      }

      // 3. Ambil nama pet yang dipakai
      let petName = null
      if (userProfile.equipped_pet_id) {
        const { data: pet } = await supabase.from('pets').select('name').eq('id', userProfile.equipped_pet_id).single()
        if (pet) petName = pet.name.toLowerCase()
      }

      setProfileData({ ...userProfile, petName })

      // 4. Ambil HANYA DAFTAR ID MEDALI yang dimiliki user ini dari tabel user_badges
      const { data: userBadgesData } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userProfile.id)

      if (userBadgesData && userBadgesData.length > 0) {
        const myBadgeIds = userBadgesData.map(b => b.badge_id)
        setOwnedBadgeIds(myBadgeIds)

        // Cari mana yang sedang dipakai (equipped) dari daftar medal kebal kita
        const activeBadgeDef = RESILIENT_BADGES.find(b => b.req_id === userProfile.equipped_badge_id)
        if (activeBadgeDef) setEquippedBadge(activeBadgeDef)
      }
    } catch (err) {
      console.error("Error loading profile:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- FUNGSI PASANG BADGE (EQUIP) ---
  async function handleEquipBadge(badgeDef: any) {
    if (!profileData || profileData.id !== currentUserId) return 

    try {
      // Update di Supabase tabel profiles kolom equipped_badge_id
      const { error } = await supabase
        .from('profiles')
        .update({ equipped_badge_id: badgeDef.req_id })
        .eq('id', currentUserId)
      
      if (error) throw error

      // Update UI lokal agar responsif
      setEquippedBadge(badgeDef)
      setProfileData({...profileData, equipped_badge_id: badgeDef.req_id})
      alert(`${badgeDef.name} berhasil dipajang di profilmu! ✨`)

    } catch (err: any) {
      alert("Gagal memasang badge: " + err.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat Profil...</div>

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-5 text-center">
        <h1 className="text-4xl mb-4">🕵️‍♂️</h1>
        <h2 className="text-2xl font-bold mb-2">User Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-6">Mungkin dia ganti nama atau akunnya belum dibuat.</p>
        <button onClick={() => router.push('/leaderboard')} className="bg-primary hover:bg-purple-500 px-6 py-3 rounded-xl font-bold transition">
          Kembali ke Komunitas
        </button>
      </div>
    )
  }

  const isMyProfile = profileData.id === currentUserId // Cek kalau ini profil sendiri

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      {/* HEADER PROFIL */}
      <div className="w-full bg-[#0f172a] border-b border-gray-800 pt-[120px] pb-10 px-5 relative overflow-hidden">
         {/* Background Ornamen */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 z-10 relative">
          
          {/* Avatar / Pet */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#111827] rounded-3xl border-4 border-gray-700 flex items-center justify-center overflow-hidden shadow-2xl hover:border-primary transition">
              {profileData.petName ? (
                <img src={`/pets/${profileData.petName}.png`} alt="Avatar" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-xl hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/5736/5736043.png" }} />
              ) : (
                <span className="text-6xl">👤</span>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gray-800 border-2 border-gray-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
              {profileData.level}
            </div>
          </div>

          {/* Info Utama */}
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-4xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
              {profileData.username}
              {/* Badge Pilihan Utama dipajang di sebelah nama (Showcase) */}
              {equippedBadge && (
                <span title={equippedBadge.name} className="inline-block relative">
                   {/* Efek glow di belakang badge emas */}
                   <div className="absolute inset-0 bg-yellow-500/40 rounded-full blur-lg animate-pulse"></div>
                  <img src={`/badges/${equippedBadge.img}`} alt={equippedBadge.name} className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] relative z-10 hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </span>
              )}
            </h1>
            
            <p className="text-gray-400 mb-6 leading-relaxed">Pencari Ketenangan Level {profileData.level} di MoodMate.</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-xl flex items-center gap-3 shadow-inner hover:-translate-y-1 transition hover:border-primary cursor-default">
                <span className="text-2xl">🔥</span>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Streak</p>
                  <p className="font-bold text-orange-400">{profileData.current_streak || 0} Hari</p>
                </div>
              </div>
              
              <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-xl flex items-center gap-3 shadow-inner hover:-translate-y-1 transition hover:border-primary cursor-default">
                <span className="text-2xl">🪙</span>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Koin</p>
                  <p className="font-bold text-yellow-400">{profileData.coins || 0}</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* ETALASE MEDALI */}
      <div className="max-w-4xl mx-auto px-5 mt-10 relative">
        <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4 flex items-center justify-between">
            Koleksi Pencapaian
            <span className="text-sm font-normal text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">{ownedBadgeIds.length} / {RESILIENT_BADGES.length} Didapat</span>
        </h2>
        
        {ownedBadgeIds.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 p-8 rounded-2xl text-center text-gray-400">
            Belum ada medali yang dikumpulkan. Perjalanan baru saja dimulai!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Kita mengulang (looping) dari DAFTAR MEDALI KEBAL kita */}
            {RESILIENT_BADGES.map((badgeDef) => {
              const isOwned = ownedBadgeIds.includes(badgeDef.req_id)
              
              return (
                <div key={badgeDef.req_id} className={`bg-[#111827] border ${isOwned ? 'border-primary' : 'border-gray-800'} p-5 rounded-2xl flex flex-col items-center text-center transition-all shadow-sm ${!isOwned ? 'opacity-40 grayscale' : ''}`}>
                  
                  {/* Gambar Badge */}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition border ${isOwned ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-gray-900 border-gray-700'}`}>
                    <img 
                      src={`/badges/${badgeDef.img}`} 
                      alt={badgeDef.name} 
                      className="w-14 h-14 object-contain drop-shadow-lg"
                      onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/5736/5736043.png" }} 
                    />
                  </div>
                  
                  <h3 className={`font-bold text-sm mb-1 text-white`}>{badgeDef.name}</h3>
                  <p className="text-[10px] text-gray-500 leading-tight flex-grow mb-4">{badgeDef.desc}</p>
                  
                  {/* TOMBOL PASANG (Hanya muncul di profil sendiri untuk medali yang sudah dimiliki) */}
                  {isMyProfile && isOwned && (
                     <button 
                       onClick={() => handleEquipBadge(badgeDef)}
                       disabled={equippedBadge?.req_id === badgeDef.req_id}
                       className={`w-full text-xs font-bold py-2 rounded-lg transition ${
                         equippedBadge?.req_id === badgeDef.req_id ? 'bg-primary text-white cursor-default'
                         : 'bg-gray-700 hover:bg-gray-600 text-white shadow-md'
                       }`}
                     >
                       {equippedBadge?.req_id === badgeDef.req_id ? 'Dipajang' : 'Pasang di Profil'}
                     </button>
                  )}
                  
                  {!isOwned && (
                       <div className="w-full text-[10px] py-1 text-gray-600 font-medium bg-gray-800/50 rounded-lg">Belum Didapat</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}