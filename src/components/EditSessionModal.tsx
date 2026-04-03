import { useEffect, useState } from 'react'
import type { Exercise } from '../types'
import { getSessionData, updateSetLogWeight, updateCardioLogValues, type SessionLogData } from '../db'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface Props {
  workoutId: string
  date: string
  allExercises: Exercise[]
  onClose: () => void
  onSaved: () => void
}

export default function EditSessionModal({ workoutId, date, allExercises, onClose, onSaved }: Props) {
  const [data, setData] = useState<SessionLogData | null>(null)
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [cardioInputs, setCardioInputs] = useState<Record<string, { duration: string; speed: string; incline: string }>>({})
  const [saving, setSaving] = useState(false)
  useEscapeKey(onClose)

  useEffect(() => {
    const exs = allExercises.filter(e => e.workoutId === workoutId)
    getSessionData(exs, date).then(d => {
      setData(d)
      const w: Record<string, string> = {}
      const c: typeof cardioInputs = {}
      for (const entry of d.exercises) {
        for (const s of entry.sets) w[s.id] = String(s.weight)
        if (entry.cardio) c[entry.cardio.id] = { duration: String(Math.round(entry.cardio.duration / 60)), speed: String(entry.cardio.speed), incline: String(entry.cardio.incline) }
      }
      setWeights(w)
      setCardioInputs(c)
    })
  }, [workoutId, date, allExercises])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    for (const entry of data.exercises) {
      for (const s of entry.sets) await updateSetLogWeight(s.id, parseFloat(weights[s.id] ?? '0') || 0)
      if (entry.cardio) {
        const ci = cardioInputs[entry.cardio.id]
        if (ci) await updateCardioLogValues(entry.cardio.id, (parseInt(ci.duration) || 0) * 60, parseFloat(ci.speed) || 0, parseFloat(ci.incline) || 0)
      }
    }
    onSaved()
  }

  const fmtDate = (s: string) => { const [y, m, d] = s.split('-'); return `${+d}. ${+m}. ${y}.` }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">Izmeni trening</h2>
        <p className="text-sm text-gray-500 mb-4">{fmtDate(date)}</p>
        {!data ? <p className="text-gray-500 text-center py-8">Učitavanje...</p> : (
          <div className="space-y-4">
            {data.exercises.map(({ exercise, sets, cardio }) => (
              <div key={exercise.id} className="bg-gray-800 rounded-2xl p-4">
                <p className="font-semibold mb-3">{exercise.name}</p>
                {sets.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {sets.map(s => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 w-16">Serija {s.setIndex + 1}</span>
                        <input type="number" inputMode="decimal" className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" value={weights[s.id] ?? ''} onChange={e => setWeights(p => ({ ...p, [s.id]: e.target.value }))} />
                        <span className="text-xs text-gray-500 w-5">kg</span>
                      </div>
                    ))}
                  </div>
                )}
                {cardio && cardioInputs[cardio.id] && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="numeric" className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" value={cardioInputs[cardio.id].duration} onChange={e => setCardioInputs(p => ({ ...p, [cardio.id]: { ...p[cardio.id], duration: e.target.value } }))} />
                      <span className="text-xs text-gray-500 w-8">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="decimal" className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" value={cardioInputs[cardio.id].speed} onChange={e => setCardioInputs(p => ({ ...p, [cardio.id]: { ...p[cardio.id], speed: e.target.value } }))} />
                      <span className="text-xs text-gray-500 w-8">km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="decimal" className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none" value={cardioInputs[cardio.id].incline} onChange={e => setCardioInputs(p => ({ ...p, [cardio.id]: { ...p[cardio.id], incline: e.target.value } }))} />
                      <span className="text-xs text-gray-500 w-8">%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300" onClick={onClose}>Otkaži</button>
          <button className="flex-1 py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40" disabled={saving || !data} onClick={handleSave}>
            {saving ? 'Čuvam...' : 'Sačuvaj'}
          </button>
        </div>
      </div>
    </div>
  )
}
