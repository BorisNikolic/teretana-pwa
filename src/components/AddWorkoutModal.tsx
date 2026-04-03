import { useState } from 'react'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface Props {
  onSave: (name: string) => void
  onClose: () => void
}

export default function AddWorkoutModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  useEscapeKey(onClose)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Novi trening</h2>
        <input
          autoFocus
          className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
          placeholder="Naziv treninga"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
        />
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300" onClick={onClose}>Otkaži</button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
          >
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  )
}
