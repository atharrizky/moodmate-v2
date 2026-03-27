"use client"
import { moods } from "@/lib/moods"
import Link from "next/link"

export default function MoodGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 mt-6">
      {moods.map((mood) => (
        <Link key={mood.id} href={`/journal/${mood.id}`}>
          <div className="bg-[#0f172a] border border-gray-800 p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary cursor-pointer shadow-sm">
            <img
              src={`/mood/${mood.icon}`}
              alt={mood.label}
              className="w-10 h-10 object-contain drop-shadow-md"
            />
            <span className="text-sm font-medium text-gray-200">{mood.label}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}