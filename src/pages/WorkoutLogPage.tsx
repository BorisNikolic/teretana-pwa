import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkoutLog, type SessionEntry } from '../db'

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']
  const date = new Date(+y, +m - 1, +d)
  return `${days[date.getDay()]} ${parseInt(d)}. ${parseInt(m)}. ${y}.`
}

export default function WorkoutLogPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<SessionEntry[]>([])

  useEffect(() => { getWorkoutLog().then(setEntries) }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Dnevnik</h1>
      </div>

      <div className="flex-1 px-4 pb-8">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
            <p>Još nema zabeleženih treninga</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map(entry => (
              <button
                key={`${entry.date}-${entry.workoutId}`}
                className="bg-gray-900 rounded-2xl px-4 py-4 text-left"
                onClick={() => navigate(`/workout/${entry.workoutId}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{entry.workoutName}</span>
                  <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
                </div>
                <div className="space-y-1">
                  {entry.lines.map((line, i) => (
                    <p key={i} className="text-sm text-gray-400">{line}</p>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
