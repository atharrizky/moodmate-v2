"use client"
import { useRouter } from "next/navigation"

export default function PetCard() {
  const router = useRouter()
  
  return(
    <div 
      onClick={() => router.push("/shop")}
      className="bg-gradient-to-br from-rose-400 to-pink-500 p-6 sm:p-8 rounded-[2rem] shadow-lg hover:shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:-translate-y-2 transition-all cursor-pointer border border-rose-300 dark:border-rose-700/50 flex flex-col items-center justify-center text-center group"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🐾</div>
      <h3 className="text-xl font-black text-white mb-1">Toko Peliharaan</h3>
      <p className="text-rose-100 text-sm font-bold">Beli & Ganti Pet Kamu</p>
    </div>
  )
}