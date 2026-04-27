"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const GAME_DURATION = 30 
const MAX_COINS_PER_GAME = 20 
const MAX_DAILY_COINS = 100 

// ALGORITMA ITEM
const GAME_ITEMS = [
  { emoji: "🍎", type: "food", points: 1 },
  { emoji: "🍉", type: "food", points: 1 },
  { emoji: "🍇", type: "food", points: 1 },
  { emoji: "🐟", type: "food", points: 2 },
  { emoji: "🥩", type: "food", points: 2 },
  { emoji: "🍤", type: "food", points: 2 },
  { emoji: "💣", type: "bomb", points: 0 },
  { emoji: "💣", type: "bomb", points: 0 }, 
]

export default function PlayMinigame() {
  const router = useRouter()
  
  const [activePet, setActivePet] = useState<string>("egg") 
  const [isLoadingPet, setIsLoadingPet] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [score, setScore] = useState(0) 
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  
  const [dailyCoinsEarned, setDailyCoinsEarned] = useState(0)
  const [coinsJustAdded, setCoinsJustAdded] = useState(0) 
  
  // REFS UNTUK PERFORMA & ANTI BUG DOUBLE-HIT
  const userIdRef = useRef<string | null>(null)
  const dailyCoinsRef = useRef(0)
  const playerXRef = useRef(50)
  const scoreRef = useRef(0) 
  const livesRef = useRef(3)
  
  const itemsRef = useRef<{id: number, x: number, y: number, emoji: string, type: string, points: number}[]>([])

  const [playerX, setPlayerX] = useState(50) 
  const [items, setItems] = useState<{id: number, x: number, y: number, emoji: string, type: string, points: number}[]>([])
  const [floatingTexts, setFloatingTexts] = useState<{id: number, x: number, y: number, text: string, color: string}[]>([])

  const keysRef = useRef({ left: false, right: false })
  
  // AUDIO REFS
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const catchSfxRef = useRef<HTMLAudioElement | null>(null)
  const bombSfxRef = useRef<HTMLAudioElement | null>(null)

  // 1. SETUP AUDIO
  useEffect(() => {
    bgmRef.current = new Audio('/sounds/bgm.mp3')
    if (bgmRef.current) {
      bgmRef.current.loop = true
      bgmRef.current.volume = 0.3 
    }
    catchSfxRef.current = new Audio('/sounds/catch.mp3')
    if (catchSfxRef.current) catchSfxRef.current.volume = 0.8
    
    bombSfxRef.current = new Audio('/sounds/bomb.mp3')
    if (bombSfxRef.current) bombSfxRef.current.volume = 1.0 
  }, [])

  useEffect(() => {
    if (isPlaying) {
      bgmRef.current?.play().catch(() => {})
    } else {
      bgmRef.current?.pause()
      if (bgmRef.current) bgmRef.current.currentTime = 0
    }
  }, [isPlaying])

  // 2. Load Pet & Kuota Koin Harian
  useEffect(() => {
    async function loadUserPet() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      userIdRef.current = session.user.id

      const today = new Date().toLocaleDateString('en-CA')
      const storedData = localStorage.getItem(`minigame_coins_${userIdRef.current}`)
      if (storedData) {
        const parsed = JSON.parse(storedData)
        if (parsed.date === today) {
          setDailyCoinsEarned(parsed.coins)
          dailyCoinsRef.current = parsed.coins
        }
      }

      const { data: profile } = await supabase.from('profiles').select('equipped_pet_id').eq('id', userIdRef.current).single()
      if (profile?.equipped_pet_id) {
        const { data: pet } = await supabase.from('pets').select('name').eq('id', profile.equipped_pet_id).single()
        if (pet) setActivePet(pet.name.toLowerCase())
      }
      setIsLoadingPet(false)
    }
    loadUserPet()
  }, [router])

  // 3. Kontrol Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = true
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keysRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keysRef.current.right = false
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isPlaying])

  // 4. SIMPAN KOIN (JIKA MENANG) & CEK BATAS HARIAN
  const endGame = useCallback(async () => {
    setIsPlaying(false)
    setIsGameOver(true)
    
    // CEK APAKAH MENANG (Bertahan 30 Detik) ATAU KALAH (Kena Bom)
    const isWin = livesRef.current > 0

    if (isWin) {
      setIsSaving(true)
      const finalScore = Math.min(scoreRef.current, MAX_COINS_PER_GAME)
      
      let coinsToAdd = 0
      if (dailyCoinsRef.current < MAX_DAILY_COINS) {
        const spaceLeft = MAX_DAILY_COINS - dailyCoinsRef.current
        coinsToAdd = Math.min(finalScore, spaceLeft) 
      }

      setCoinsJustAdded(coinsToAdd)

      const today = new Date().toLocaleDateString('en-CA')
      const newDailyTotal = dailyCoinsRef.current + coinsToAdd
      setDailyCoinsEarned(newDailyTotal)
      dailyCoinsRef.current = newDailyTotal

      if (userIdRef.current) {
        localStorage.setItem(`minigame_coins_${userIdRef.current}`, JSON.stringify({ date: today, coins: newDailyTotal }))
        
        if (coinsToAdd > 0) {
          const { data: profile } = await supabase.from('profiles').select('coins').eq('id', userIdRef.current).single()
          if (profile) {
            await supabase.from('profiles').update({ coins: profile.coins + coinsToAdd }).eq('id', userIdRef.current)
          }
        }
      }
      setIsSaving(false)
    } else {
      // KALAU KALAH, KOIN HANGUS 0!
      setCoinsJustAdded(0)
    }
  }, [])

  // 5. WAKTU MUNDUR
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, endGame])

  // FUNGSI ANIMASI Teks Floating
  const showFloatingText = (x: number, text: string, color: string) => {
    const id = Date.now() + Math.random()
    setFloatingTexts(prev => [...prev, { id, x, y: 75, text, color }])
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(c => c.id !== id))
    }, 800)
  }

  // 6. GAME LOOP FISIKA
  useEffect(() => {
    if (!isPlaying) return

    let animationFrameId: number

    const spawner = setInterval(() => {
      const randomItem = GAME_ITEMS[Math.floor(Math.random() * GAME_ITEMS.length)]
      itemsRef.current.push({
        id: Date.now() + Math.random(),
        x: Math.floor(Math.random() * 80) + 10,
        y: -10,
        emoji: randomItem.emoji,
        type: randomItem.type,
        points: randomItem.points
      })
    }, 600)

    const gameLoop = () => {
      if (livesRef.current <= 0) return 

      setPlayerX((prevX) => {
        let newX = prevX
        if (keysRef.current.left) newX = Math.max(newX - 1.5, 5)
        if (keysRef.current.right) newX = Math.min(newX + 1.5, 95)
        playerXRef.current = newX
        return newX
      })

      let newItems: any[] = []
      let hitBomb = false
      let pointsGained = 0

      itemsRef.current.forEach((item) => {
        let newY = item.y + 1.3 

        if (newY > 75 && newY < 90 && Math.abs(item.x - playerXRef.current) < 15) {
          if (item.type === 'bomb') {
             hitBomb = true
             livesRef.current -= 1
             showFloatingText(playerXRef.current, "💥 Ouch!", "text-red-500")
          } else {
             pointsGained += item.points
             showFloatingText(playerXRef.current, `+${item.points} ⭐️`, "text-yellow-400")
          }
        } else if (newY < 110) {
          newItems.push({ ...item, y: newY })
        }
      })

      itemsRef.current = newItems
      setItems(newItems) 

      if (hitBomb) {
        setLives(livesRef.current)
        if (bombSfxRef.current) {
          bombSfxRef.current.currentTime = 0
          bombSfxRef.current.play().catch(() => {})
        }
        if (livesRef.current <= 0) {
          endGame() 
          return
        }
      }

      if (pointsGained > 0) {
        scoreRef.current += pointsGained
        setScore(scoreRef.current)
        if (catchSfxRef.current) {
          catchSfxRef.current.currentTime = 0
          catchSfxRef.current.play().catch(() => {})
        }
      }

      if (livesRef.current > 0) {
        animationFrameId = requestAnimationFrame(gameLoop)
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      clearInterval(spawner)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPlaying, endGame])

  // 7. KONTROL SWIPE (HP)
  const handleTouchMove = (e: React.TouchEvent | React.PointerEvent) => {
    if (!isPlaying) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const screenW = window.innerWidth
    let newX = (clientX / screenW) * 100
    newX = Math.max(5, Math.min(newX, 95))
    playerXRef.current = newX
    setPlayerX(newX)
  }

  const startGame = () => {
    scoreRef.current = 0
    livesRef.current = 3
    itemsRef.current = [] 
    setScore(0)
    setLives(3)
    setTimeLeft(GAME_DURATION)
    setItems([])
    setFloatingTexts([])
    setCoinsJustAdded(0)
    setIsPlaying(true)
    setIsGameOver(false)
    setPlayerX(50)
    playerXRef.current = 50
  }

  if (isLoadingPet) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
         <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="animate-pulse font-bold text-indigo-300">Menyiapkan arena...</p>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-slate-900 overflow-hidden relative touch-none select-none"
      onTouchMove={handleTouchMove}
      onPointerMove={handleTouchMove}
    >
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19] to-indigo-900 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-40 bg-green-800 rounded-t-[100%] scale-150 z-0 pointer-events-none"></div>

      {/* HEADER HUD */}
      <div className="absolute top-0 w-full p-4 sm:p-6 flex justify-between items-start z-50 pointer-events-auto">
        <Link href="/dashboard">
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold transition shadow-md border border-white/20">
            &larr; Kabur
          </button>
        </Link>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <div className="bg-indigo-600 border border-indigo-400 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <span>⏱️</span> {timeLeft}s
            </div>
            <div className="bg-rose-500 border border-rose-300 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black shadow-lg flex items-center gap-1 text-sm sm:text-base">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? "opacity-100" : "opacity-30 grayscale"}>❤️</span>
              ))}
            </div>
          </div>
          <div className="bg-yellow-500 border border-yellow-300 text-yellow-950 px-4 py-1.5 sm:py-2 rounded-xl font-black shadow-lg flex items-center gap-2 transition-transform duration-75 text-sm sm:text-base">
            <span>⭐️</span> Poin: {score}
          </div>
        </div>
      </div>

      {/* AREA GAMEPLAY */}
      {isPlaying && (
        <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
          
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`absolute text-4xl sm:text-5xl z-20 pointer-events-none transition-transform
                ${item.type === 'bomb' 
                  ? 'animate-bomb-strobe animate-insane-spin drop-shadow-[0_0_30px_#ff0000]' 
                  : 'drop-shadow-md'}
              `}
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translateX(-50%)' }}
            >
              {item.emoji}
            </div>
          ))}

          {floatingTexts.map((txt) => (
            <div
              key={txt.id}
              className={`absolute text-2xl sm:text-3xl font-black ${txt.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-40 animate-float-up`}
              style={{ left: `${txt.x}%`, top: `${txt.y}%`, transform: 'translateX(-50%)' }}
            >
              {txt.text}
            </div>
          ))}

          <div 
            className="absolute bottom-[130px] sm:bottom-[150px] z-30 transition-none ease-linear"
            style={{ left: `${playerX}%`, transform: 'translateX(-50%)' }}
          >
            <div 
              key={`pet-${score}-${lives}`} 
              className={`bg-white/20 backdrop-blur-md p-4 rounded-full border-4 shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 
                ${lives < livesRef.current + 1 ? 'border-red-500 bg-red-500/30' : 'border-white/50 animate-chomp'}
              `}
            >
              {activePet === "egg" || !activePet ? (
                <span className="text-6xl drop-shadow-xl animate-bounce-slow">🥚</span>
              ) : (
                <img src={`/pets/${activePet}.png`} alt="pet" className={`w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl ${lives < livesRef.current + 1 ? 'grayscale brightness-50' : ''}`} />
              )}
            </div>
          </div>
          
          <div className="absolute top-1/3 w-full text-center text-white/30 text-lg sm:text-xl font-black uppercase tracking-widest z-10 animate-pulse pointer-events-none">
            <span className="block sm:hidden">👈 Geser Layar 👉</span>
            <span className="hidden sm:block">Tekan A / D / Panah</span>
          </div>
        </div>
      )}

      {/* MENU MULAI / GAME OVER */}
      {!isPlaying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="bg-slate-800 border border-indigo-500/50 p-6 sm:p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl animate-bounce-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {isGameOver ? (
              // TAMPILAN GAME OVER
              <>
                <div className="text-6xl mb-4 animate-bounce">{lives <= 0 ? '😵' : '🏆'}</div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  {lives <= 0 ? 'Kena Bom!' : 'Waktu Habis!'}
                </h2>
                
                <div className="bg-slate-900/50 rounded-full px-4 py-1.5 mb-6 inline-block border border-slate-700">
                  <p className="text-xs font-bold text-slate-300">
                    Batas Koin Harian: <span className={dailyCoinsEarned >= MAX_DAILY_COINS ? "text-rose-400" : "text-yellow-400"}>{dailyCoinsEarned}/{MAX_DAILY_COINS}</span>
                  </p>
                </div>
                
                <div className="bg-indigo-900/50 rounded-2xl p-5 mb-6 border border-indigo-500/30 relative">
                  <p className="text-sm text-indigo-300 font-bold mb-2">Statistik Panen:</p>
                  <p className="text-xl font-bold text-slate-300 mb-2">Skor Poin: <span className="text-yellow-400">{score} ⭐️</span></p>
                  
                  <div className="h-px bg-indigo-500/30 w-full my-3"></div>
                  
                  <p className="text-xs text-indigo-200 font-bold mb-1 uppercase tracking-widest">Dikonversi Menjadi:</p>
                  
                  {/* LOGIKA MENANG / KALAH */}
                  {lives <= 0 ? (
                    <div className="py-2">
                       <p className="text-2xl font-black text-rose-500">KOIN HANGUS! 😭</p>
                       <p className="text-xs text-rose-400 font-bold mt-2 bg-rose-900/20 py-2 rounded-lg">Peliharaanmu pingsan kena bom.</p>
                    </div>
                  ) : coinsJustAdded > 0 ? (
                    <>
                      <p className="text-4xl font-black text-yellow-400 flex items-center justify-center gap-2">
                        +{coinsJustAdded} <span className="text-2xl">🪙</span>
                      </p>
                      {score > MAX_COINS_PER_GAME && (
                        <p className="text-[10px] text-yellow-300 font-bold mt-2 bg-yellow-900/40 py-1 rounded-full w-max mx-auto px-3">
                          Limit Game (Maks 20)
                        </p>
                      )}
                      {dailyCoinsEarned >= MAX_DAILY_COINS && coinsJustAdded < score && (
                        <p className="text-[10px] text-rose-300 font-bold mt-2 bg-rose-900/40 py-1 rounded-full w-max mx-auto px-3">
                          Limit Harian Tercapai
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="py-2">
                       <p className="text-xl font-black text-slate-500 line-through">+{Math.min(score, MAX_COINS_PER_GAME)} 🪙</p>
                       <p className="text-xs text-rose-400 font-bold mt-1 bg-rose-900/20 py-1.5 rounded-lg">Batas harian 100 koin sudah habis!</p>
                    </div>
                  )}
                  
                  {isSaving ? (
                     <p className="text-xs text-yellow-400 mt-4 font-bold bg-yellow-900/30 py-2 rounded-lg animate-pulse flex items-center justify-center gap-2">
                       <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
                       Menyimpan...
                     </p>
                  ) : (
                     coinsJustAdded > 0 && <p className="text-xs text-green-400 mt-4 font-bold bg-green-900/30 py-2 rounded-lg">✓ Berhasil masuk ke dompet!</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={startGame} 
                    disabled={isSaving}
                    className="w-full bg-indigo-500 disabled:opacity-50 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/30"
                  >
                    Main Lagi 🔄
                  </button>
                  <Link href="/dashboard">
                    <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition border border-slate-600">
                      Kembali ke Dashboard
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              // TAMPILAN AWAL SEBELUM MAIN 
              <>
                <div className="w-24 h-24 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 shadow-inner border border-indigo-500/30">
                  {activePet === "egg" || !activePet ? (
                    <span className="text-6xl animate-bounce-slow">🥚</span>
                  ) : (
                    <img src={`/pets/${activePet}.png`} alt="pet" className="w-16 h-16 object-contain animate-bounce-slow" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Food Drop! 🍎</h2>
                
                {/* INFO LIMIT HARIAN DI AWAL */}
                <div className="mb-4">
                   <span className={`text-xs font-bold px-3 py-1 rounded-full border ${dailyCoinsEarned >= MAX_DAILY_COINS ? 'bg-rose-900/30 text-rose-400 border-rose-500/30' : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'}`}>
                     Koin Harian: {dailyCoinsEarned}/100
                   </span>
                </div>
                
                {/* ATURAN MAIN */}
                <div className="bg-slate-900/60 rounded-xl p-4 mb-6 border border-slate-700 text-left">
                  <p className="text-xs text-indigo-400 font-bold uppercase mb-3 text-center tracking-wider">Aturan Main</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🍎 🍉</span>
                    <span className="text-sm font-bold text-slate-300">Buah = <span className="text-yellow-400">+1 Poin</span></span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">🥩 🐟</span>
                    <span className="text-sm font-bold text-slate-300">Daging = <span className="text-yellow-400">+2 Poin</span></span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700 relative">
                    <span className="text-2xl animate-bomb-strobe absolute left-0" style={{position: 'static'}}>💣</span>
                    <span className="text-sm font-bold text-rose-400">Bom Gila = -1 Nyawa!</span>
                  </div>
                  
                  <p className="text-[11px] text-rose-400 text-center leading-relaxed font-bold mt-3">
                    Bertahanlah 30 detik. Mati kena bom = KOIN HANGUS! 😭
                  </p>
                </div>

                <button onClick={startGame} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-950 font-black text-lg py-4 rounded-2xl shadow-[0_10px_20px_rgba(250,204,21,0.3)] hover:scale-105 transition-all animate-pulse">
                  Mulai Main! ▶
                </button>
                
                <div className="mt-4 text-center">
                  <Link href="/dashboard" className="text-xs text-slate-500 hover:text-white transition underline">
                    Batal Main, Kabur Aja
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes floatUpFade {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          100% { transform: translateY(-50px) scale(1.2); opacity: 0; }
        }
        .animate-float-up { animation: floatUpFade 0.8s ease-out forwards; }

        @keyframes chomp {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.15) translateY(-15px); }
        }
        .animate-chomp { animation: chomp 0.2s ease-in-out; }

        @keyframes bombStrobe {
          0%, 100% { scale: 1.25; filter: drop-shadow(0 0 15px #f00) drop-shadow(0 0 5px #ff0); }
          50% { scale: 1.6; filter: drop-shadow(0 0 40px #ff0) invert(1) brightness(1.5); }
        }
        .animate-bomb-strobe { animation: bombStrobe 0.2s ease-in-out infinite; }

        @keyframes insaneSpin {
          0% { rotate: 0deg; }
          100% { rotate: 1080deg; }
        }
        .animate-insane-spin { animation: insaneSpin 0.5s linear infinite; }

        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}