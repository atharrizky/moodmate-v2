"use client"

import Navbar from "@/components/Navbar"
import { getUser, saveUser } from "@/lib/storage"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const pets = ["cat", "dog", "duck", "pufferfish", "monkey", "bee"]

export default function Shop() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  function handlePetAction(id: string) {
    const data = getUser()
    const isOwned = data.pets.includes(id)

    if (isOwned) {
      // Jika sudah punya, jadikan pet aktif
      data.activePet = id
      saveUser(data)
      setUser({ ...data })
      alert(`Berhasil memakai ${id}!`)
    } else {
      // Jika belum punya, beli pet
      if (data.points < 50) {
        alert("Koin kamu belum cukup. Yuk isi jurnal lagi! 📝")
        return
      }
      data.points -= 50
      data.pets.push(id)
      data.activePet = id // Langsung dipakai saat pertama kali beli
      saveUser(data)
      setUser({ ...data })
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-[100px] px-5">
        <button className="text-gray-400 hover:text-white transition mb-6 flex items-center gap-2" onClick={() => router.push("/dashboard")}>
          <span>&larr;</span> Kembali
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pet Shop 🐾</h1>
          <div className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">Koin kamu: </span>
            <span className="font-bold text-yellow-400">{user.points} pts</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pets.map((pet) => {
            const isOwned = user.pets.includes(pet)
            const isActive = user.activePet === pet

            return (
              <div key={pet} className={`bg-[#111827] border ${isActive ? 'border-primary' : 'border-gray-800'} p-6 rounded-2xl flex flex-col items-center shadow-sm relative overflow-hidden`}>
                {isActive && (
                  <div className="absolute top-2 right-2 bg-primary/20 text-primary text-xs px-2 py-1 rounded-md font-medium">
                    Dipakai
                  </div>
                )}
                
                <img src={`/pets/${pet}.png`} alt={pet} className="w-24 h-24 object-contain drop-shadow-xl mb-4" />
                <h2 className="text-lg font-semibold capitalize mb-1">{pet}</h2>
                <p className="text-gray-400 text-sm mb-4">{isOwned ? "Sudah Dimiliki" : "50 pts"}</p>

                <button
                  onClick={() => handlePetAction(pet)}
                  disabled={!isOwned && user.points < 50}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white cursor-default'
                    : isOwned ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : user.points < 50 ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-purple-500 text-white'
                  }`}
                >
                  {isActive ? 'Sedang Dipakai' : isOwned ? 'Pakai Pet Ini' : 'Beli Pet'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}