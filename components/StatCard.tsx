export default function StatCard({ 
  title, 
  value, 
  currentXP 
}: { 
  title: string; 
  value: string | number; 
  currentXP?: number; 
}) {
  let bgGradient = "bg-gradient-to-br from-slate-700 to-slate-800"

  if (title.toLowerCase().includes("level")) {
    bgGradient = "bg-gradient-to-br from-blue-500 to-cyan-400"
  } else if (title.toLowerCase().includes("koin")) {
    bgGradient = "bg-gradient-to-br from-amber-400 to-orange-500"
  } else if (title.toLowerCase().includes("jurnal")) {
    bgGradient = "bg-gradient-to-br from-purple-500 to-fuchsia-500"
  } else if (title.toLowerCase().includes("streak")) {
    bgGradient = "bg-gradient-to-br from-rose-500 to-red-500"
  }

  // --- LOGIKA XP BAR ANTI-GAGAL ---
  const isLevelCard = title.toLowerCase().includes("level");
  const validXP = currentXP || 0; // Kalau undefined/null, paksa jadi 0
  const targetXP = isLevelCard ? Number(value) * 100 : 0;
  
  const xpPercentage = isLevelCard && targetXP > 0 
    ? Math.min((validXP / targetXP) * 100, 100) 
    : 0;

  return (
    <div className={`${bgGradient} p-4 sm:p-5 rounded-2xl shadow-lg text-white flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300 w-full`}>
      <p className="text-xs sm:text-sm font-bold opacity-90 mb-1">{title}</p>
      <h3 className="text-2xl sm:text-3xl font-black drop-shadow-md">{value}</h3>
      
      {/* BAR PASTI MUNCUL KALAU JUDULNYA 'LEVEL' */}
      {isLevelCard && (
        <div className="w-full mt-3 px-2">
          <div className="w-full bg-black/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] sm:text-xs font-semibold opacity-90 mt-1">
            {validXP} / {targetXP} XP
          </p>
        </div>
      )}
    </div>
  )
}