import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkoutLog, deleteSessionLogs, type SessionEntry } from '../db'
import ConfirmModal from '../components/ConfirmModal'
import EditSessionModal from '../components/EditSessionModal'

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  const days = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']
  const date = new Date(+y, +m - 1, +d)
  return `${days[date.getDay()]} ${parseInt(d)}. ${parseInt(m)}. ${y}.`
}

export default function WorkoutLogPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<SessionEntry[]>([])
  const [deleting, setDeleting] = useState<SessionEntry | null>(null)
  const [editing, setEditing] = useState<SessionEntry | null>(null)

  const load = () => { getWorkoutLog().then(setEntries) }
  useEffect(load, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
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
              <div key={`${entry.date}-${entry.workoutId}`} className="bg-gray-900 rounded-2xl px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{entry.workoutName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-1">{formatDate(entry.date)}</span>
                    <button className="text-gray-600 p-1" onClick={() => setEditing(entry)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    <button className="text-gray-600 p-1" onClick={() => setDeleting(entry)}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {entry.lines.map((line, i) => (
                    <p key={i} className="text-sm text-gray-400">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleting && <ConfirmModal message={`Obrisati trening od ${formatDate(deleting.date)}?`} onConfirm={async () => { await deleteSessionLogs(deleting.workoutId, deleting.date); setDeleting(null); load() }} onCancel={() => setDeleting(null)} />}
      {editing && <EditSessionModal workoutId={editing.workoutId} date={editing.date} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}
