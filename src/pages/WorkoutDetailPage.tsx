import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Exercise, Workout } from '../types'
import { getAssignedWorkouts, getExercises } from '../lib/supabase-db'
import { saveActiveSession, clearActiveSession, getActiveSession } from '../lib/session'
import SessionSummary from '../components/SessionSummary'
import { useToast } from '../contexts/ToastContext'

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasActiveSession = workoutId ? getActiveSession()?.workoutId === workoutId : false

  useEffect(() => {
    if (!workoutId) return
    Promise.all([
      getAssignedWorkouts().then(ws => setWorkout(ws.find(w => w.id === workoutId) ?? null)),
      getExercises(workoutId).then(setExercises),
    ]).catch(() => showToast('Greška pri učitavanju vežbi')).finally(() => setLoading(false))
  }, [workoutId, showToast])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Učitavanje...</div>

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4 shrink-0">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">{workout?.name}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500"><p>Nema vežbi u ovom treningu</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {exercises.map(ex => {
              const isCardio = (ex.type ?? 'strength') === 'cardio'
              return (
                <button key={ex.id} className="flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 text-left" onClick={() => navigate(`/workout/${workoutId}/exercise/${ex.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ex.name}</div>
                    <div className="text-sm text-gray-400">{isCardio ? 'Kardio' : `${ex.setsCount} × ${ex.reps}`}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              )
            })}
          </div>
        )}
      </div>
      {exercises.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-gray-950">
          {hasActiveSession ? (
            <button className="w-full py-3 rounded-2xl bg-gray-800 text-gray-300 font-semibold" onClick={() => { clearActiveSession(); setShowSummary(true) }}>Završi trening</button>
          ) : (
            <button className="w-full py-4 rounded-2xl bg-blue-600 font-semibold text-lg" onClick={() => { saveActiveSession(workoutId!); navigate(`/workout/${workoutId}/exercise/${exercises[0].id}`) }}>
              Započni trening →
            </button>
          )}
        </div>
      )}
      {showSummary && workoutId && <SessionSummary workoutId={workoutId} onClose={() => setShowSummary(false)} />}
    </div>
  )
}
