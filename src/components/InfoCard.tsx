interface Props { title: string; value: string }

export default function InfoCard({ title, value }: Props) {
  return (
    <div className="flex-1 bg-gray-800 rounded-xl py-3 flex flex-col items-center gap-1">
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-gray-400">{title}</span>
    </div>
  )
}
