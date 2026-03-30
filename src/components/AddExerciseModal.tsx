import { useState, useRef } from 'react'

interface Props {
  onSave: (data: { name: string; setsCount: number; reps: string; restSeconds: number; notes: string; videoBlob?: Blob }) => void
  onClose: () => void
}

export default function AddExerciseModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [setsCount, setSetsCount] = useState(3)
  const [reps, setReps] = useState('10')
  const [restSeconds, setRestSeconds] = useState(60)
  const [notes, setNotes] = useState('')
  const [videoBlob, setVideoBlob] = useState<Blob | undefined>()
  const [videoName, setVideoName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoBlob(file)
    setVideoName(file.name)
  }

  const save = () => onSave({ name: name.trim(), setsCount, reps, restSeconds, notes, videoBlob })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Nova vežba</h2>

        <div className="space-y-3">
          <input
            autoFocus
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
            placeholder="Naziv vežbe"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-gray-300">Serije</span>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => setSetsCount(Math.max(1, setsCount - 1))}>−</button>
              <span className="w-6 text-center font-semibold">{setsCount}</span>
              <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => setSetsCount(Math.min(20, setsCount + 1))}>+</button>
            </div>
          </div>

          <input
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
            placeholder="Ponavljanja (npr. 10 ili 8-12)"
            value={reps}
            onChange={e => setReps(e.target.value)}
          />

          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-gray-300">Pauza</span>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => setRestSeconds(Math.max(10, restSeconds - 10))}>−</button>
              <span className="w-12 text-center font-semibold">{restSeconds}s</span>
              <button className="w-8 h-8 rounded-full bg-gray-700 text-lg" onClick={() => setRestSeconds(Math.min(300, restSeconds + 10))}>+</button>
            </div>
          </div>

          <button
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-left flex items-center gap-3"
            onClick={() => fileRef.current?.click()}
          >
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className={videoName ? 'text-green-400 truncate' : 'text-gray-400'}>
              {videoName || 'Izaberi video'}
            </span>
            {videoName && <span className="ml-auto text-green-400">✓</span>}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

          <textarea
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none resize-none"
            placeholder="Napomene (opciono)"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300" onClick={onClose}>Otkaži</button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40"
            disabled={!name.trim()}
            onClick={save}
          >
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  )
}
