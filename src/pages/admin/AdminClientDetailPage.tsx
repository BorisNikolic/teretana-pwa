import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Workout } from '../../types'
import type { Profile } from '../../contexts/AuthContext'
import { getClients, getAllWorkouts, getClientAssignedWorkoutIds, assignWorkout, unassignWorkout, getClientMealPlanAdmin, uploadMealPlan } from '../../lib/supabase-db'

export default function AdminClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Profile | null>(null)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set())
  const [mealPlan, setMealPlan] = useState<{ html: string; fileName: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!clientId) return
    Promise.all([
      getClients().then(cs => setClient(cs.find(c => c.id === clientId) ?? null)),
      getAllWorkouts().then(setWorkouts),
      getClientAssignedWorkoutIds(clientId).then(ids => setAssignedIds(new Set(ids))),
      getClientMealPlanAdmin(clientId).then(setMealPlan),
    ]).finally(() => setLoading(false))
  }, [clientId])

  const toggleWorkout = async (workoutId: string) => {
    if (!clientId) return
    const next = new Set(assignedIds)
    if (next.has(workoutId)) { next.delete(workoutId); await unassignWorkout(clientId, workoutId) }
    else { next.add(workoutId); await assignWorkout(clientId, workoutId) }
    setAssignedIds(next)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !clientId) return
    setUploading(true)
    const buf = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.default.convertToHtml({ arrayBuffer: buf })
    await uploadMealPlan(clientId, result.value, file.name)
    setMealPlan({ html: result.value, fileName: file.name })
    setUploading(false)
    e.target.value = ''
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Učitavanje...</div>

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin/clients')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client?.full_name || 'Vežbač'}</h1>
          <p className="text-sm text-gray-500">{client?.email}</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 space-y-6">
        {/* Workout assignments */}
        <section>
          <h2 className="text-base font-semibold mb-3">Dodeljeni treninzi</h2>
          {workouts.length === 0 ? (
            <p className="text-gray-500 text-sm">Nema kreiranih treninga</p>
          ) : (
            <div className="space-y-2">
              {workouts.map(w => (
                <button key={w.id} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 ${assignedIds.has(w.id) ? 'bg-blue-600/20 border border-blue-600/40' : 'bg-gray-900'}`} onClick={() => toggleWorkout(w.id)}>
                  {assignedIds.has(w.id) ? (
                    <svg className="w-6 h-6 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
                  )}
                  <span className="font-medium">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Meal plan */}
        <section>
          <h2 className="text-base font-semibold mb-3">Plan ishrane</h2>
          {mealPlan ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">{mealPlan.fileName}</p>
              <div className="meal-plan-content bg-gray-900 rounded-2xl p-4 max-h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: mealPlan.html }} />
              <button className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold" onClick={() => fileRef.current?.click()}>
                {uploading ? 'Učitavanje...' : 'Zameni plan'}
              </button>
            </div>
          ) : (
            <button className="w-full py-3 rounded-xl bg-blue-600 font-semibold" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Učitavanje...' : 'Učitaj .docx plan'}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleUpload} />
        </section>
      </div>
    </div>
  )
}
