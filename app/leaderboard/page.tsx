"use client"

import Navbar from "@/components/Navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link" // <-- INI YANG TADI KELUPAAN

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
      
      let incomingProfilesData = []
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

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat Peringkat...</div>

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto pt-[100px] px-5">
        
        <div className="bg-[#111827] border border-gray-800 p-6 rounded-2xl mb-8 shadow-lg">
           <h2 className="text-xl font-bold mb-2">Cari Teman 🔍</h2>
           <p className="text-sm text-gray-400 mb-4">Tambahkan teman untuk saling adu Streak konsistensi!</p>
           
           <form onSubmit={handleSearchUser} className="flex gap-3 mb-4">
             <input 
               type="text" 
               placeholder="Masukkan username..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="flex-grow bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
             />
             <button 
               type="submit" 
               disabled={searchLoading || !searchQuery.trim()}
               className="bg-primary hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
             >
               {searchLoading ? "Mencari..." : "Cari"}
             </button>
           </form>

           {searchResult && (
             <div className="mt-4 p-4 bg-[#0f172a] border border-primary/50 rounded-xl flex items-center justify-between animate-fade-in-down">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600 overflow-hidden">
                    {searchResult.petName ? (
                      <img src={`/pets/${searchResult.petName}.png`} alt="pet" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                 </div>
                 <div>
                   <h3 className="font-bold text-white">{searchResult.username}</h3>
                   <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-md font-semibold">Lv. {searchResult.level}</span>
                 </div>
               </div>
               <button 
                 onClick={handleAddFriend}
                 className="bg-green-500 hover:bg-green-600 text-slate-900 font-bold px-4 py-2 rounded-lg transition shadow-md"
               >
                 + Add Friend
               </button>
             </div>
           )}
        </div>

        {incomingRequests.length > 0 && (
          <div className="bg-[#111827] border border-yellow-500/30 p-6 rounded-2xl mb-8 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <h2 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
              <span className="animate-pulse">🔔</span> Permintaan Pertemanan ({incomingRequests.length})
            </h2>
            <div className="flex flex-col gap-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="bg-[#0f172a] border border-gray-700 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">{req.username}</h3>
                    <p className="text-xs text-gray-400">Lv. {req.level} ingin berteman denganmu</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptRequest(req.id, req.username)}
                      className="bg-green-500 hover:bg-green-600 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition"
                    >
                      Terima
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(req.id)}
                      className="bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-300 font-bold px-4 py-2 rounded-lg text-sm transition"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Papan Peringkat 🏆</h1>
          <p className="text-gray-400">Peringkat berdasarkan Konsistensi (Streak) tertinggi.</p>
        </div>

        <div className="flex flex-col gap-4">
          {users.map((u, index) => {
            const isMe = u.id === currentUserId
            let rankColor = "bg-gray-800 text-gray-400"
            if (index === 0) rankColor = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
            if (index === 1) rankColor = "bg-gray-400/20 text-gray-300 border border-gray-400/50"
            if (index === 2) rankColor = "bg-orange-600/20 text-orange-400 border border-orange-600/50"

            return (
              <div 
                key={u.id} 
                className={`bg-[#111827] border ${isMe ? 'border-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-gray-800'} p-4 sm:p-5 rounded-2xl flex items-center gap-4 transition-all hover:bg-[#0f172a] group`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${rankColor}`}>
                  {index + 1}
                </div>

                <div className="relative shrink-0">
                  <div className={`w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center border-2 overflow-hidden ${u.isActiveToday ? 'border-orange-500' : 'border-gray-700'}`}>
                    {u.petName ? (
                      <img src={`/pets/${u.petName}.png`} alt="pet" className={`w-10 h-10 object-contain drop-shadow-md ${!u.isActiveToday ? 'grayscale opacity-60' : ''}`} />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  {/* --- BAGIAN INI YANG DIUBAH JADI LINK --- */}
                  <h2 className="text-lg font-bold truncate flex items-center gap-2">
                    <Link href={`/profile/${u.username}`} className="hover:text-primary transition">
                        {u.username || "User"} 
                    </Link>
                    {isMe && <span className="text-xs font-normal text-primary ml-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Kamu</span>}
                  </h2>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="font-semibold text-white bg-gray-800 px-2 py-0.5 rounded-md">Lv. {u.level}</span>
                    <span className="font-bold text-orange-400 flex items-center gap-1">
                      🔥 {u.current_streak || 0} Hari
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4 text-right">
                   <div className="hidden sm:block">
                     {u.isActiveToday ? (
                       <div className="text-green-400 text-sm font-medium bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">Selesai Hari Ini</div>
                     ) : (
                       <div className="text-gray-500 text-xs italic">{u.offlineText}</div>
                     )}
                   </div>

                   {!isMe && (
                     <button 
                       onClick={() => confirmRemoveFriend(u.id, u.username)}
                       title="Hapus Teman"
                       className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-400 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
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

      {notification.show && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-transform">
            
            <div className="mb-4">
               {notification.type === 'success' && <span className="text-5xl">✅</span>}
               {notification.type === 'error' && <span className="text-5xl">⚠️</span>}
               {notification.type === 'confirm' && <span className="text-5xl">🤔</span>}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {notification.type === 'success' ? 'Berhasil!' : notification.type === 'error' ? 'Oops!' : 'Konfirmasi'}
            </h3>
            
            <p className="text-gray-300 mb-8">{notification.message}</p>
            
            <div className={`flex gap-3 ${notification.type === 'confirm' ? 'justify-between' : 'justify-center'}`}>
              
              {notification.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setNotification({ ...notification, show: false })}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={notification.onConfirm}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl transition"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setNotification({ ...notification, show: false })}
                  className="w-full bg-primary hover:bg-purple-500 text-white font-medium py-2.5 rounded-xl transition"
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