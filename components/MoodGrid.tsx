import { moods } from '@/lib/moods';
import Link from 'next/link';

// Warna spesifik per emosi
const MOOD_COLORS: Record<string, string> = {
  Joy: "#facc15",       // Kuning
  Trust: "#4ade80",     // Hijau
  Fear: "#f97316",      // Orange
  Surprise: "#ec4899",  // Pink
  Sad: "#3b82f6",       // Biru
  Disgust: "#a855f7",   // Ungu
  Anger: "#ef4444",     // Merah
  Anticipation: "#06b6d4" // Cyan
};

export default function MoodGrid() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 mt-4 w-full">
      {moods.map((mood) => {
        const moodKey = mood.label;
        const hexColor = MOOD_COLORS[moodKey] || "#6366f1"; // Default indigo jika tidak ada

        return (
          <Link key={mood.id} href={`/journal/${mood.id}`} className="w-full relative group">
            <div 
              className="aspect-square p-3 sm:p-4 rounded-3xl border-2 transition-all duration-300 transform hover:-translate-y-2 group flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                // Efek Gradient tipis dari bawah (40 = 25% opacity, 05 = transparan)
                background: `linear-gradient(to top, ${hexColor}40 0%, ${hexColor}05 100%)`,
                // Border senada dengan warna emosi
                borderColor: `${hexColor}50`,
                boxShadow: `0 8px 20px -5px ${hexColor}20`
              }}
            >
                {/* Efek Glow saat di-hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 20px ${hexColor}40` }}
                />

                {/* Gambar Diperbesar (w-12 h-12 ke atas) */}
                <img 
                  src={`/mood/${mood.icon}`} 
                  alt={mood.label} 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10" 
                />
                
                {/* Teks Label */}
                <span 
                  className="text-[10px] sm:text-xs font-extrabold mt-2 relative z-10 transition-colors"
                  style={{ color: hexColor }}
                >
                  {mood.label}
                </span>
            </div>
          </Link>
        )
      })}
    </div>
  );
}