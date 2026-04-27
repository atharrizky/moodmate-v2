"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Mencegah error hydration di Next.js
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-10 h-10"></div> // Placeholder kosong saat loading

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-indigo-500/30 text-xl hover:scale-110 transition-transform shadow-sm"
      title="Ganti Tema"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}