"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { supabase } from "@/lib/supabase"

// KATALOG MEDALI (URUT 1-8, DESKRIPSI SESUAI PERMINTAAN, GAMBAR 6 & 7 SUDAH DITUKAR AGAR PAS)
const BADGE_CATALOG = [
  { id: 1, name: "Langkah Pertama", desc: "🐣 Mengisi jurnal untuk pertama kalinya.", img: "badge_1.jpg", hint: "Cukup simpan 1 jurnal emosi atau bebas untuk memulai perjalananmu." },
  { id: 2, name: "Si Paling Bebas", desc: "💭 Membuat 5 Jurnal Bebas.", img: "badge_2.jpg", hint: "Tuliskan pikiranmu tanpa batasan di menu Jurnal Bebas sebanyak 5 kali." },
  { id: 3, name: "Si Paling Joy", desc: "✨ Memilih emosi 'Joy' sebanyak 5 kali.", img: "badge_3.jpg", hint: "Rayakan kebahagiaanmu! Simpan jurnal dengan emosi Joy sebanyak 5 kali." },
  { id: 4, name: "Pawang Emosi", desc: "🎭 Mengisi jurnal dengan ke-8 jenis emosi Plutchik (Joy, Sad, Fear, dll) minimal 1 kali.", img: "badge_4.jpg", hint: "Pernah merasakan segalanya? Isi jurnal dengan masing-masing dari 8 emosi dasar minimal 1 kali." },
  { id: 5, name: "Si Paling Konsisten", desc: "🔥 Berhasil mempertahankan Streak selama 7 hari berturut-turut tanpa bolong.", img: "badge_5.jpg", hint: "Disiplin adalah kunci. Login dan isi jurnal selama 7 hari berturut-turut tanpa bolong." },
  { id: 6, name: "Kolektor Satwa", desc: "🐾 Berhasil membeli 3 pet berbeda di Toko.", img: "badge_6.jpg", hint: "Buka menu Toko Pet dan berhasil membeli minimal 3 jenis peliharaan yang berbeda." }, // Gambar jejak kaki (badge_7.jpg)
  { id: 7, name: "Pemancing Ulung", desc: "🎣 Berhasil membeli pet eksklusif 'Pufferfish' di Toko.", img: "badge_7.jpg", hint: "Kumpulkan koin yang cukup dan beli pet ikan buntal (Pufferfish) di Toko Pet." }, // Gambar Pufferfish (badge_6.jpg)
  { id: 8, name: "Sultan Musang King", desc: "👑 Berhasil mengumpulkan 1.000 Koin (Kaya raya di dalam aplikasi).", img: "badge_8.jpg", hint: "Kumpulkan koin dari aktivitas harian hingga total koinmu mencapai angka 1.000." }
]

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profileData, setProfileData] = useState<any>(null)
  const [ownedBadges, setOwnedBadges] = useState<number[]>([])
  const [equippedBadges, setEquippedBadges] = useState<number[]>([]) // Array max 4
  const [petImage, setPetImage] = useState<string | null>(null)
  const [isMyProfile, setIsMyProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // STATE UNTUK MODAL POP-UP DETAIL BADGE
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null)

  // STATE PENGGANTI ALERT JS BAWAAN
  const [customAlert, setCustomAlert] = useState<{title: string, desc: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    fetchProfile()
  }, [username])

  async function fetchProfile() {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    // 1. Ambil data profil berdasarkan username
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (!profile) {
      setCustomAlert({
        title: "Pencarian Gagal 🔍",
        desc: "Profil pengguna tidak ditemukan. Membawamu kembali ke Dashboard...",
        type: "error"
      });
      setTimeout(() => { router.push("/dashboard") }, 3000);
      return
    }

    setProfileData(profile)
    setEquippedBadges(profile.equipped_badges || [])
    if (session && session.user.id === profile.id) {
      setIsMyProfile(true)
    }

    // 2. Ambil gambar pet yang dipakai
    if (profile.equipped_pet_id) {
      const { data: pet } = await supabase.from('pets').select('name').eq('id', profile.equipped_pet_id).single()
      if (pet) setPetImage(pet.name.toLowerCase())
    }

    // 3. Ambil daftar medali yang sudah didapat user ini
    const { data: badges } = await supabase.from('user_badges').select('badge_id').eq('user_id', profile.id)
    if (badges) {
      setOwnedBadges(badges.map(b => b.badge_id))
    }

    setIsLoading(false)
  }

  // FUNGSI PASANG / COPOT MEDALI (MAX 4) - SUDAH DIPERBAIKI
  async function toggleBadge(badgeId: number) {
    if (!isMyProfile) return;

    let newEquipped = [...equippedBadges]

    if (newEquipped.includes(badgeId)) {
      // Jika sudah dipasang, COPOT
      newEquipped = newEquipped.filter(id => id !== badgeId)
    } else {
      // Jika belum dipasang, TAMBAH (cek limit max 4)
      if (newEquipped.length >= 4) {
        setCustomAlert({
          title: "Batas Maksimal! ⚠️",
          desc: "Maksimal hanya bisa memajang 4 medali di Profil, Lur! Copot yang lain dulu ya kalau mau pasang ini.",
          type: "info"
        });
        return
      }
      newEquipped.push(badgeId)
    }

    // Update state biar UI langsung berubah
    setEquippedBadges(newEquipped)

    // Update ke database Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ equipped_badges: newEquipped })
      .eq('id', profileData.id)

    if (error) {
      console.error("Gagal update medali:", error)
      setCustomAlert({
        title: "Koneksi Gagal 🔌",
        desc: "Waduh, gagal menyimpan pengaturan medali ke database. Coba lagi nanti ya.",
        type: "error"
      });
    }
  }

if (isLoading) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-slate-800 dark:text-white transition-colors duration-300">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-white pb-24 relative overflow-hidden transition-colors duration-300">
      <Navbar />

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/40 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-300/30 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="max-w-5xl mx-auto pt-[120px] px-5 relative z-10">
        
        {/* HEADER PROFIL */}
        <div className="flex flex-col items-center justify-center text-center mb-16 animate-fade-in-down">
          {/* Avatar Pet */}
          <div className="relative mb-6 group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:border-indigo-400 transition-colors">
              {petImage ? (
                <img src={`/pets/${petImage}.png`} alt="pet" className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl" />
              ) : (
                <span className="text-4xl">🥚</span>
              )}
            </div>
            {/* Level Badge ditaruh di pojok */}
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-slate-50 dark:border-[#0B0F19] shadow-lg">
              {profileData.level}
            </div>
          </div>

          {/* Nama & Deretan Medali Aktif */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md capitalize text-slate-900 dark:text-white">
              {profileData.username}
            </h1>
            
            {/* RENDER MAX 4 MEDALI DI SAMPING NAMA */}
            {equippedBadges.length > 0 && (
              <div className="flex bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 gap-1 shadow-inner">
                {equippedBadges.map((badgeId) => {
                  const badgeInfo = BADGE_CATALOG.find(b => b.id === badgeId)
                  if (!badgeInfo) return null
                  return (
                    <img 
                      key={badgeId} 
                      src={badgeInfo.img.startsWith('/') ? badgeInfo.img : `/badges/${badgeInfo.img}`} 
                      alt={badgeInfo.name} 
                      title={badgeInfo.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600 drop-shadow-md cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => setSelectedBadge(badgeInfo)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <p className="text-slate-500 dark:text-indigo-200/70 font-medium text-sm sm:text-base mb-6">
            Pencari Ketenangan Level {profileData.level} di MoodMate.
          </p>

          {/* Stat Mini (Streak & Koin) */}
          <div className="flex gap-4 sm:gap-6 justify-center">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <span className="text-2xl drop-shadow-sm">🔥</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Streak</p>
                <p className="font-black text-slate-800 dark:text-white">{profileData.current_streak} Hari</p>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <span className="text-2xl drop-shadow-sm">🪙</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Koin</p>
                <p className="font-black text-slate-800 dark:text-white">{profileData.coins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ETALASE KOLEKSI PENCAPAIAN */}
        <div className="mb-12 animate-fade-in-up">
          <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Koleksi Pencapaian</h2>
            <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold px-4 py-1.5 rounded-full text-sm border border-indigo-200 dark:border-indigo-500/20">
              {ownedBadges.length} / {BADGE_CATALOG.length} Didapat
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {BADGE_CATALOG.map((badge) => {
              const isOwned = ownedBadges.includes(badge.id)
              const isEquipped = equippedBadges.includes(badge.id)
              const imgSrc = badge.img.startsWith('/') ? badge.img : `/badges/${badge.img}`

              return (
                <div 
                  key={badge.id} 
                  className={`bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-sm p-6 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group
                    ${isOwned ? 'border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]' : 'border-slate-200 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
                  `}
                >
                  {/* Efek Glow di belakang medali jika dipakai */}
                  {isEquipped && <div className="absolute top-10 w-20 h-20 bg-indigo-200/50 dark:bg-indigo-500/40 rounded-full blur-xl"></div>}
                  
                  {/* WADAH GAMBAR - KLIK UNTUK MUNCULKAN POPUP DETAIL */}
                  <div 
                    onClick={() => setSelectedBadge(badge)}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-5 relative z-10 p-1 border-2 transition-all duration-300 cursor-pointer
                    ${isEquipped ? 'border-indigo-500 dark:border-indigo-400 scale-110 shadow-lg' : 'border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50'}
                  `}>
                    <img src={imgSrc} alt={badge.name} className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform" />
                    {/* Hover text "DETAIL" */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-full text-[10px] font-bold text-white transition-opacity">
                      DETAIL
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2 relative z-10 leading-tight">{badge.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 flex-1 relative z-10 leading-relaxed px-2">
                    {badge.desc}
                  </p>

                  {/* TOMBOL AKSI (Hanya muncul jika ini profil sendiri) */}
                  {isMyProfile && (
                    <button
                      disabled={!isOwned}
                      onClick={() => toggleBadge(badge.id)}
                      className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 relative z-10
                        ${!isOwned ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700' : 
                          isEquipped ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400' : 
                          'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'}
                      `}
                    >
                      {!isOwned ? "TERKUNCI" : isEquipped ? "DIPAJANG" : "PASANG"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </main>

      {/* ============================================================== */}
      {/* POP-UP MODAL DETAIL BADGE (SUPPORT LIGHT/DARK MODE)            */}
      {/* ============================================================== */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border-2 border-indigo-200 dark:border-indigo-500/50 p-8 rounded-[3rem] max-w-sm w-full text-center relative shadow-2xl">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition font-bold"
            >
              ✕
            </button>
            
            <div className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-indigo-400 dark:border-indigo-500 p-1 shadow-[0_0_40px_rgba(99,102,241,0.3)] bg-slate-50 dark:bg-[#0B0F19]">
              <img src={selectedBadge.img.startsWith('/') ? selectedBadge.img : `/badges/${selectedBadge.img}`} alt={selectedBadge.name} className="w-full h-full object-cover rounded-full" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{selectedBadge.name}</h2>
            
            <div className={`text-[10px] py-1.5 px-4 rounded-full inline-block font-bold tracking-widest mb-6 
              ${ownedBadges.includes(selectedBadge.id) ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'}`}
            >
              {ownedBadges.includes(selectedBadge.id) ? "TELAH DIMILIKI" : "BELUM TERBUKA"}
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-left border border-slate-200 dark:border-white/5 shadow-inner">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>💡</span> Cara Mendapatkan:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {selectedBadge.hint}
              </p>
            </div>

            <button 
              onClick={() => setSelectedBadge(null)}
              className="mt-8 w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              MENGERTI
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CUSTOM POP-UP ALERT (PENGGANTI ALERT JS)   */}
      {/* ========================================== */}
      {customAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#13192B] border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl transform transition-all animate-bounce-in text-center relative overflow-hidden">
            
            {/* Garis Warna di Atas */}
            <div className={`absolute top-0 left-0 w-full h-2 ${
              customAlert.type === 'success' ? 'bg-green-500' : 
              customAlert.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
            }`}></div>

            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-inner ${
              customAlert.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-500' : 
              customAlert.type === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-500' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500'
            }`}>
              <span className="text-4xl animate-bounce">
                {customAlert.type === 'success' ? '✨' : customAlert.type === 'error' ? '⚠️' : '💡'}
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
                customAlert.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30'
              }`}
            >
              Oke, Mengerti!
            </button>
          </div>
        </div>
      )}

    </div>
  )
}