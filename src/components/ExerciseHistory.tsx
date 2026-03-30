import { useEffect, useState } from 'react'
import type { SetLog } from '../types'
import { getSetLogs } from '../db'

interface Props {
  exerciseId: string
  setsCount: number
  onClose: () => void
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}. ${m}. ${y}.`
}

export default function ExerciseHistory({ exerciseId, setsCount, onClose }: Props) {
  const [logsByDate, setLogsByDate] = useState<[string, SetLog[]][]>([])

  useEffect(() => {
    getSetLogs(exerciseId).then(logs => {
      const map = new Map<string, SetLog[]>()
      for (const log of logs) {
        if (!map.has(log.date)) map.set(log.date, [])
        map.get(log.date)!.push(log)
      }
      const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
      setLogsByDate(sorted)
    })
  }, [exerciseId])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[75vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Istorija</h2>
          <button className="text-gray-400 text-sm" onClick={onClose}>Zatvori</button>
        </div>

        {logsByDate.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Još nema upisanih kilaža</p>
        ) : (
          <div className="space-y-4">
            {logsByDate.map(([date, logs]) => {
              const bySet = Object.fromEntries(logs.map(l => [l.setIndex, l.weight]))
              const weights = Array.from({ length: setsCount }, (_, i) => bySet[i])
              const validWeights = weights.filter(w => w != null && w > 0)
              return (
                <div key={date} className="bg-gray-800 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">{formatDate(date)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {weights.map((w, i) => (
                      <div key={i} className="flex flex-col items-center bg-gray-700 rounded-xl px-3 py-2 min-w-[52px]">
                        <span className="text-sm font-semibold">{w != null && w > 0 ? `${w}` : '—'}</span>
                        <span className="text-xs text-gray-400">kg</span>
                      </div>
                    ))}
                  </div>
                  {validWeights.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      max {Math.max(...validWeights)} kg · avg {Math.round(validWeights.reduce((a, b) => a + b, 0) / validWeights.length)} kg
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
