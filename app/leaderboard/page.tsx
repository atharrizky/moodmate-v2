"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link" 

export default function Leaderboard() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<any | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      const uId = session.user.id
      setCurrentUserId(uId)

      const { data: acceptedFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', uId)
        .eq('status', 'accepted')

      const friendIds = acceptedFriends ? acceptedFriends.map(f => f.friend_id) : []
      const allIdsToFetch = [uId, ...friendIds]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, level, xp, equipped_pet_id, current_streak, last_journal_date')
        .in('id', allIdsToFetch)
        .order('current_streak', { ascending: false })

      const { data: pendingRequests } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', uId)
        .eq('status', 'pending')
      
      const pendingIds = pendingRequests ? pendingRequests.map(p => p.user_id) : []
      
        let incomingProfilesData: any[] = []     
        if (pendingIds.length > 0) {
        const { data: pProfiles } = await supabase
          .from('profiles')
          .select('id, username, level')
          .in('id', pendingIds)
        if (pProfiles) incomingProfilesData = pProfiles
      }
      setIncomingRequests(incomingProfilesData)

      const { data: pets } = await supabase.from('pets').select('id, name')

      if (profiles && pets) {
        const today = new Date().toLocaleDateString('en-CA')

        const leaderboardData = profiles.map((p) => {
          const pet = pets.find(pt => pt.id === p.equipped_pet_id)
          let offlineStatus = ""
          let isApi = false

          if (p.last_journal_date === today) {
            isApi = true
          } else if (p.last_journal_date) {
            const lastDate = new Date(p.last_journal_date)
            const currentDate = new Date(today)
            const diffDays = Math.ceil(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays === 1) offlineStatus = "Belum isi hari ini"
            else if (diffDays > 1 && diffDays <= 7) offlineStatus = `Offline ${diffDays} hari`
            else offlineStatus = "Offline > 7 hari"
          } else {
            offlineStatus = "Belum ada riwayat"
          }
          
          return {
            ...p,
            petName: pet ? pet.name.toLowerCase() : null,
            isActiveToday: isApi,
            offlineText: offlineStatus
          }
        })
        setUsers(leaderboardData)
      }
    } catch (err) {
      console.error("Gagal memuat leaderboard:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearchUser(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim() || !currentUserId) return
    setSearchLoading(true)
    setSearchResult(null)

    try {
      const { data: targetUser, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, level, equipped_pet_id')
        .ilike('username', searchQuery.trim())
        .single()

      if (searchError || !targetUser) {
        setNotification({ show: true, message: "User tidak ditemukan. Cek lagi ejaannya ya!", type: 'error' })
      } else if (targetUser.id === currentUserId) {
        setNotification({ show: true, message: "Ini kan akunmu sendiri! Cari username temanmu ya.", type: 'error' })
      } else {
        let pName = null
        if (targetUser.equipped_pet_id) {
          const { data: petData } = await supabase.from('pets').select('name').eq('id', targetUser.equipped_pet_id).single()
          if (petData) pName = petData.name.toLowerCase()
        }
        setSearchResult({ ...targetUser, petName: pName })
      }
    } catch (err: any) {
       setNotification({ show: true, message: "Error pencarian: " + err.message, type: 'error' })
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleAddFriend() {
    if (!searchResult || !currentUserId) return

    try {
      const { error: insertError } = await supabase.from('friendships').insert([
        { user_id: currentUserId, friend_id: searchResult.id, status: 'pending' }
      ])

      if (insertError) {
        if (insertError.code === '23505') {
            setNotification({ show: true, message: "Kamu sudah mengirim permintaan atau kalian sudah berteman!", type: 'error' })
        } else {
            setNotification({ show: true, message: "Gagal mengirim permintaan.", type: 'error' })
        }
      } else {
        setNotification({ show: true, message: `Permintaan pertemanan terkirim ke ${searchResult.username}! ⏳`, type: 'success' })
        setSearchResult(null)
        setSearchQuery("")
      }
    } catch (err: any) {
        setNotification({ show: true, message: "Error: " + err.message, type: 'error' })
    }
  }

  async function handleAcceptRequest(requesterId: string, requesterName: string) {
    if (!currentUserId) return
    try {
      await supabase.from('friendships')
        .update({ status: 'accepted' })
        .match({ user_id: requesterId, friend_id: currentUserId })

      await supabase.from('friendships').insert([
        { user_id: currentUserId, friend_id: requesterId, status: 'accepted' }
      ])

      setNotification({ show: true, message: `Berhasil menerima ${requesterName} sebagai teman! 🎉`, type: 'success' })
      fetchLeaderboard()
    } catch (err: any) {
      setNotification({ show: true, message: "Gagal menerima teman: " + err.message, type: 'error' })
    }
  }

  async function handleRejectRequest(requesterId: string) {
    if (!currentUserId) return
    try {
      await supabase.from('friendships')
        .delete()
        .match({ user_id: requesterId, friend_id: currentUserId })
      
      fetchLeaderboard()
    } catch (err: any) {
      console.error(err)
    }
  }

  function confirmRemoveFriend(friendId: string, friendName: string) {
      setNotification({
          show: true,
          type: 'confirm',
          message: `Yakin ingin menghapus ${friendName} dari daftar teman?`,
          onConfirm: () => executeRemoveFriend(friendId, friendName)
      });
  }

  async function executeRemoveFriend(friendId: string, friendName: string) {
    if (!currentUserId) return
    setNotification({ ...notification, show: false })

    try {
      await supabase.from('friendships').delete().match({ user_id: currentUserId, friend_id: friendId })
      await supabase.from('friendships').delete().match({ user_id: friendId, friend_id: currentUserId })
      
      setNotification({ show: true, message: `${friendName} telah dihapus dari pertemanan.`, type: 'success' })
      fetchLeaderboard() 
    } catch (err: any) {
       setNotification({ show: true, message: "Gagal menghapus teman: " + err.message, type: 'error' })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-slate-800 dark:text-white">
       <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="animate-pulse font-bold text-indigo-600 dark:text-indigo-400">Memuat Peringkat...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white pb-20 transition-colors duration-300">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-[100px] px-5 relative z-10">
        
        {/* CARI TEMAN */}
        <div className="bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border border-slate-200 dark:border-indigo-500/20 p-6 sm:p-8 rounded-[2.5rem] mb-8 shadow-sm">
           <h2 className="text-xl sm:text-2xl font-black mb-2 text-slate-800 dark:text-white">Cari Teman 🔍</h2>
           <p className="text-sm text-slate-500 dark:text-indigo-200/70 mb-6 font-medium">Tambahkan teman untuk saling adu Streak konsistensi!</p>
           
           <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3 mb-4">
             <input 
               type="text" 
               placeholder="Masukkan username..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="flex-grow bg-slate-50 dark:bg-[#0f172a]/80 border border-slate-200 dark:border-indigo-500/30 rounded-2xl px-5 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium"
             />
             <button 
               type="submit" 
               disabled={searchLoading || !searchQuery.trim()}
               className="bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
             >
               {searchLoading ? "Mencari..." : "Cari"}
             </button>
           </form>

           {searchResult && (
             <div className="mt-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-[1.5rem] flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-down">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white dark:bg-[#111827] rounded-full flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-500/50 shadow-sm overflow-hidden">
                    {searchResult.petName ? (
                      <img src={`/pets/${searchResult.petName}.png`} alt="pet" className="w-10 h-10 object-contain drop-shadow-md" />
                    ) : (
                      <span className="text-2xl opacity-50">👤</span>
                    )}
                 </div>
                 <div className="text-center sm:text-left">
                   <h3 className="font-black text-lg text-slate-800 dark:text-white">{searchResult.username}</h3>
                   <span className="text-xs bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg font-bold tracking-wide">Lv. {searchResult.level}</span>
                 </div>
               </div>
               <button 
                 onClick={handleAddFriend}
                 className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-black px-6 py-2.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5"
               >
                 + Add Friend
               </button>
             </div>
           )}
        </div>

        {/* PENDING REQUESTS */}
        {incomingRequests.length > 0 && (
          <div className="bg-amber-50/90 dark:bg-yellow-900/20 backdrop-blur-md border border-amber-200 dark:border-yellow-500/30 p-6 sm:p-8 rounded-[2.5rem] mb-8 shadow-sm">
            <h2 className="text-lg font-black text-amber-600 dark:text-yellow-500 mb-5 flex items-center gap-2">
              <span className="animate-bounce">🔔</span> Permintaan Pertemanan ({incomingRequests.length})
            </h2>
            <div className="flex flex-col gap-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="bg-white/80 dark:bg-[#0f172a]/60 border border-amber-100 dark:border-yellow-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="font-black text-slate-800 dark:text-white text-lg">{req.username}</h3>
                    <p className="text-xs text-slate-500 dark:text-yellow-200/60 font-medium">Lv. {req.level} ingin berteman denganmu</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleAcceptRequest(req.id, req.username)}
                      className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition shadow-sm"
                    >
                      Terima
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex-1 sm:flex-none bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-400 dark:hover:text-red-400 font-bold px-5 py-2 rounded-xl text-sm transition"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 text-slate-900 dark:text-white drop-shadow-sm">Papan Peringkat 🏆</h1>
          <p className="text-slate-500 dark:text-indigo-200/70 font-medium">Peringkat berdasarkan Konsistensi (Streak) tertinggi.</p>
        </div>

        <div className="flex flex-col gap-4">
          {users.map((u, index) => {
            const isMe = u.id === currentUserId
            
            // Warna Ranking Lebih Estetik
            let rankColor = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            if (index === 0) rankColor = "bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md border-2 border-yellow-100 dark:border-yellow-600"
            if (index === 1) rankColor = "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md border-2 border-slate-100 dark:border-slate-500"
            if (index === 2) rankColor = "bg-gradient-to-br from-orange-400 to-rose-400 text-white shadow-md border-2 border-orange-100 dark:border-rose-500"

            return (
              <div 
                key={u.id} 
                className={`bg-white/80 dark:bg-[#13192B]/80 backdrop-blur-md border ${isMe ? 'border-indigo-400 dark:border-indigo-500 shadow-[0_5px_15px_rgba(99,102,241,0.15)] z-10 scale-[1.01]' : 'border-slate-200 dark:border-indigo-500/20 shadow-sm'} p-4 sm:p-5 rounded-[2rem] flex items-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 hover:shadow-md group`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-lg ${rankColor}`}>
                  {index + 1}
                </div>

                <div className="relative shrink-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-[#111827] rounded-full flex items-center justify-center border-2 overflow-hidden shadow-inner ${u.isActiveToday ? 'border-green-400 dark:border-green-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    {u.petName ? (
                      <img src={`/pets/${u.petName}.png`} alt="pet" className={`w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md ${!u.isActiveToday ? 'grayscale opacity-60' : ''}`} />
                    ) : (
                      <span className="text-xl sm:text-2xl opacity-50">👤</span>
                    )}
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <h2 className="text-base sm:text-lg font-black truncate flex items-center gap-2 text-slate-800 dark:text-white">
                    <Link href={`/profile/${u.username}`} className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                        {u.username || "User"} 
                    </Link>
                    {isMe && <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg uppercase tracking-wider">Kamu</span>}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm mt-1.5">
                    <span className="font-bold text-slate-500 dark:text-indigo-200/80 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">Lv. {u.level}</span>
                    <span className="font-black text-orange-500 dark:text-orange-400 flex items-center gap-1">
                      🔥 {u.current_streak || 0} Hari
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 sm:gap-4 text-right">
                   <div className="hidden sm:block">
                     {u.isActiveToday ? (
                       <div className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-500/30">Selesai Hari Ini</div>
                     ) : (
                       <div className="text-slate-400 dark:text-slate-500 text-xs font-medium italic bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">{u.offlineText}</div>
                     )}
                   </div>

                   {!isMe && (
                     <button 
                       onClick={() => confirmRemoveFriend(u.id, u.username)}
                       title="Hapus Teman"
                       className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 border border-transparent dark:hover:border-red-500/30 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                     >
                       ✕
                     </button>
                   )}
                </div>

              </div>
            )
          })}
        </div>

      </div>

      {/* NOTIFICATION MODAL */}
      {notification.show && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-transform">
            
            <div className="mb-4">
               {notification.type === 'success' && <span className="text-6xl drop-shadow-md">✅</span>}
               {notification.type === 'error' && <span className="text-6xl drop-shadow-md">⚠️</span>}
               {notification.type === 'confirm' && <span className="text-6xl drop-shadow-md">🤔</span>}
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
              {notification.type === 'success' ? 'Berhasil!' : notification.type === 'error' ? 'Oops!' : 'Konfirmasi'}
            </h3>
            
            <p className="text-slate-500 dark:text-indigo-200/80 mb-8 font-medium leading-relaxed">{notification.message}</p>
            
            <div className={`flex gap-3 ${notification.type === 'confirm' ? 'justify-between' : 'justify-center'}`}>
              
              {notification.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setNotification({ ...notification, show: false })}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={notification.onConfirm}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-md transition"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition"
                >
                  Tutup
                </button>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}