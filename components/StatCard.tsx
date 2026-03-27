export default function StatCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="bg-[#111827] p-5 rounded-xl text-center shadow-sm border border-gray-800">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <h2 className="text-2xl font-semibold text-white">{value}</h2>
    </div>
  )
}