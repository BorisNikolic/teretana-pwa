import { useState, useRef } from 'react'
import type { Exercise } from '../types'

export interface ExerciseFormData {
  name: string; type: 'strength' | 'cardio'; setsCount: number; reps: string; restSeconds: number; notes: string; videoBlob?: Blob
}

interface Props {
  onSave: (data: ExerciseFormData) => void
  onClose: () => void
  editExercise?: Exercise
}

export default function AddExerciseModal({ onSave, onClose, editExercise }: Props) {
  const [type, setType] = useState<'strength' | 'cardio'>(editExercise?.type ?? 'strength')
  const [name, setName] = useState(editExercise?.name ?? '')
  const [setsCount, setSetsCount] = useState(editExercise?.setsCount ?? 3)
  const [reps, setReps] = useState(editExercise?.reps ?? '10')
  const [restSeconds, setRestSeconds] = useState(editExercise?.restSeconds ?? 60)
  const [notes, setNotes] = useState(editExercise?.notes ?? '')
  const [videoBlob, setVideoBlob] = useState<Blob | undefined>()
  const [videoName, setVideoName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{editExercise ? 'Izmeni vežbu' : 'Nova vežba'}</h2>

        <div className="space-y-3">
          {!editExercise && (
            <div className="flex gap-2">
              <button className={`flex-1 py-2.5 rounded-xl font-medium text-sm ${type === 'strength' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`} onClick={() => setType('strength')}>Tegovi</button>
              <button className={`flex-1 py-2.5 rounded-xl font-medium text-sm ${type === 'cardio' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`} onClick={() => setType('cardio')}>Kardio</button>
            </div>
          )}

          <input autoFocus className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder={type === 'cardio' ? 'Naziv (npr. Trčanje)' : 'Naziv vežbe'} value={name} onChange={e => setName(e.target.value)} />

          {type === 'strength' && (
            <>
              <Stepper label="Serije" value={setsCount} min={1} max={20} step={1} format={v => `${v}`} onChange={setSetsCount} />
              <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Ponavljanja (npr. 10 ili 8-12)" value={reps} onChange={e => setReps(e.target.value)} />
              <Stepper label="Pauza" value={restSeconds} min={10} max={300} step={10} format={v => `${v}s`} onChange={setRestSeconds} />
            </>
          )}
          {type === 'cardio' && !editExercise && <p className="text-sm text-gray-500 px-1">Vreme, brzinu i nagib unosiš na samom treningu.</p>}

          {!editExercise && (
            <>
              <button className="w-full bg-gray-800 rounded-xl px-4 py-3 text-left flex items-center gap-3" onClick={() => fileRef.current?.click()}>
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                <span className={videoName ? 'text-green-400 truncate' : 'text-gray-400'}>{videoName || 'Izaberi video'}</span>
                {videoName && <span className="ml-auto text-green-400">✓</span>}
              </button>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setVideoBlob(f); setVideoName(f.name) } }} />
            </>
          )}

          <textarea className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none resize-none" placeholder="Napomene (opciono)" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300" onClick={onClose}>Otkaži</button>
          <button className="flex-1 py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), type, setsCount, reps, restSeconds, notes, videoBlob })}>
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  )
}

function Stepper({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => onChange(Math.max(min, value - step))}>−</button>
        <span className="w-12 text-center font-semibold">{format(value)}</span>
        <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => onChange(Math.min(max, value + step))}>+</button>
      </div>
    </div>
  )
}
