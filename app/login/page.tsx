"use client"
import { useState, useEffect } from "react"
import { loginUser, getActiveUserEmail } from "@/lib/storage"
import { useRouter } from "next/navigation"

export default function Login() {
  const [name, setName] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (getActiveUserEmail()) {
      router.push("/dashboard")
    }
  }, [router])

  function handleLogin() {
    if(!name.trim()) {
        alert("Masukkan nama panggilanmu dulu ya!"); 
        return;
    }
    
    // Gunakan fungsi loginUser yang baru (tidak akan menghapus data lama jika nama sama)
    loginUser(name)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="bg-[#111827] border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-2">MoodMate 🌙</h1>
        <p className="text-gray-400 mb-8">Kenali emosimu, sayangi dirimu.</p>

        <div className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Nama Panggilan</label>
            <input 
              className="w-full bg-[#0f172a] border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition" 
              placeholder="Masukkan namamu (cth: Athar)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <button 
            className="mt-4 bg-primary hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-md w-full" 
            onClick={handleLogin}
          >
            Mulai Perjalanan
          </button>
        </div>
      </div>
    </div>
  )
}