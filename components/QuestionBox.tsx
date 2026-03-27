export default function QuestionBox({ q, onChange }: { q: string, onChange: (e: any) => void }) {
  return (
    <div className="mt-5">
      <p className="mb-2 font-medium text-gray-200">{q}</p>
      <textarea 
        className="w-full bg-[#0f172a] border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition resize-none" 
        rows={4}
        onChange={onChange}
        placeholder="Tuliskan perasaanmu di sini..."
      />
    </div>
  )
}