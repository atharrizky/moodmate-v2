export default function QuestionBox({ q, onChange }: { q: string, onChange: (e: any) => void }) {
  return (
    <div className="mt-6 w-full">
      <p className="mb-3 font-bold text-slate-700 dark:text-indigo-100 text-base sm:text-lg ml-1">{q}</p>
      <textarea 
        className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-2 border-slate-200 dark:border-indigo-500/30 p-5 sm:p-6 rounded-3xl text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none shadow-sm" 
        rows={5}
        onChange={onChange}
        placeholder="Tuliskan semua yang kamu rasakan di sini dengan jujur..."
      />
    </div>
  )
}