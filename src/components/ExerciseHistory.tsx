import { useEffect, useState } from 'react'
import type { SetLog, CardioLog } from '../types'
import { getSetLogs, getCardioLogs } from '../db'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface Props {
  exerciseId: string
  exerciseType: 'strength' | 'cardio'
  setsCount: number
  onClose: () => void
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)}. ${parseInt(m)}. ${y}.`
}

export default function ExerciseHistory({ exerciseId, exerciseType, setsCount, onClose }: Props) {
  const [strengthByDate, setStrengthByDate] = useState<[string, SetLog[]][]>([])
  const [cardioByDate, setCardioByDate] = useState<[string, CardioLog[]][]>([])
  useEscapeKey(onClose)

  useEffect(() => {
    if (exerciseType === 'cardio') {
      getCardioLogs(exerciseId).then(logs => {
        const map = new Map<string, CardioLog[]>()
        for (const log of logs) {
          if (!map.has(log.date)) map.set(log.date, [])
          map.get(log.date)!.push(log)
        }
        setCardioByDate([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])))
      })
    } else {
      getSetLogs(exerciseId).then(logs => {
        const map = new Map<string, SetLog[]>()
        for (const log of logs) {
          if (!map.has(log.date)) map.set(log.date, [])
          map.get(log.date)!.push(log)
        }
        setStrengthByDate([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])))
      })
    }
  }, [exerciseId, exerciseType])

  const hasData = exerciseType === 'cardio' ? cardioByDate.length > 0 : strengthByDate.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Istorija</h2>
          <button className="text-gray-400 text-sm" onClick={onClose}>Zatvori</button>
        </div>

        {!hasData ? (
          <p className="text-gray-500 text-center py-8">Još nema upisanih podataka</p>
        ) : exerciseType === 'cardio' ? (
          <div className="space-y-3">
            {cardioByDate.map(([date, logs]) => {
              const log = logs[0]
              return (
                <div key={date} className="bg-gray-800 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">{formatDate(date)}</p>
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center bg-gray-700 rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{Math.round(log.duration / 60)}</span>
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-700 rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{log.speed}</span>
                      <span className="text-xs text-gray-400">km/h</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-700 rounded-xl px-3 py-2">
                      <span className="text-sm font-semibold">{log.incline}%</span>
                      <span className="text-xs text-gray-400">nagib</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {strengthByDate.map(([date, logs]) => {
              const bySet = Object.fromEntries(logs.map(l => [l.setIndex, l.weight]))
              const ws = Array.from({ length: setsCount }, (_, i) => bySet[i])
              const valid = ws.filter(w => w != null && w > 0) as number[]
              return (
                <div key={date} className="bg-gray-800 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">{formatDate(date)}</p>
                  <div className="flex gap-2 flex-wrap">
                    {ws.map((w, i) => (
                      <div key={i} className="flex flex-col items-center bg-gray-700 rounded-xl px-3 py-2 min-w-[52px]">
                        <span className="text-sm font-semibold">{w != null && w > 0 ? `${w}` : '—'}</span>
                        <span className="text-xs text-gray-400">kg</span>
                      </div>
                    ))}
                  </div>
                  {valid.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      max {Math.max(...valid)} kg · avg {Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)} kg
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
