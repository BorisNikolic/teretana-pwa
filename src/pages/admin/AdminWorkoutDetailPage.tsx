import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Exercise, Workout, WorkoutExercise } from '../../types'
import { getAllWorkouts, getWorkoutExercises, getAllExerciseLibrary, addExerciseToWorkout, removeExerciseFromWorkout, updateWorkoutExerciseOrder } from '../../lib/supabase-db'
import ConfirmModal from '../../components/ConfirmModal'
import { useEscapeKey } from '../../hooks/useEscapeKey'

function ExerciseRow({ we, onDelete }: { we: WorkoutExercise; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: we.id })
  const ex = we.exercise
  const isCardio = ex.type === 'cardio'

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 ${isDragging ? 'opacity-50' : ''}`}>
      <div {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing px-1 touch-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" /></svg>
      </div>
      {ex.videoUrl && (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0">
          <video src={ex.videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{ex.name}</div>
        <div className="text-sm text-gray-400">{isCardio ? 'Kardio' : `${ex.setsCount} × ${ex.reps}`}</div>
      </div>
      <button className="text-gray-600 p-1 shrink-0" onClick={onDelete}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  )
}

function ExercisePickerModal({ workoutExerciseIds, onPick, onClose }: { workoutExerciseIds: Set<string>; onPick: (ex: Exercise) => void; onClose: () => void }) {
  const [library, setLibrary] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  useEscapeKey(onClose)

  useEffect(() => { getAllExerciseLibrary().then(setLibrary) }, [])

  const filtered = search.trim()
    ? library.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : library

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[80vh] flex flex-col overscroll-contain" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-3">Dodaj vežbu</h2>
        <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none mb-3" placeholder="Pretraži..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{library.length === 0 ? 'Biblioteka je prazna. Dodaj vežbe u Biblioteka vežbi.' : 'Nema rezultata'}</p>
          ) : filtered.map(ex => {
            const alreadyAdded = workoutExerciseIds.has(ex.id)
            return (
              <button key={ex.id} className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left ${alreadyAdded ? 'bg-blue-600/20 border border-blue-600/40' : 'bg-gray-800'}`} onClick={() => { if (!alreadyAdded) onPick(ex) }} disabled={alreadyAdded}>
                {ex.videoUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 shrink-0">
                    <video src={ex.videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{ex.name}</div>
                  <div className="text-xs text-gray-400">{ex.type === 'cardio' ? 'Kardio' : `${ex.setsCount} × ${ex.reps}`}</div>
                </div>
                {alreadyAdded && <span className="text-xs text-blue-400">Dodato</span>}
              </button>
            )
          })}
        </div>
        <button className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 mt-3" onClick={onClose}>Zatvori</button>
      </div>
    </div>
  )
}

export default function AdminWorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  const load = async () => {
    if (!workoutId) return
    const ws = await getAllWorkouts()
    setWorkout(ws.find(w => w.id === workoutId) ?? null)
    setWorkoutExercises(await getWorkoutExercises(workoutId))
  }
  useEffect(() => { load() }, [workoutId])

  const handlePick = async (ex: Exercise) => {
    if (!workoutId) return
    await addExerciseToWorkout(workoutId, ex.id, workoutExercises.length)
    load()
  }

  const handleRemove = async (weId: string) => {
    await removeExerciseFromWorkout(weId)
    setRemovingId(null); load()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event; if (!over || active.id === over.id) return
    const oldIdx = workoutExercises.findIndex(e => e.id === active.id)
    const newIdx = workoutExercises.findIndex(e => e.id === over.id)
    const reordered = arrayMove(workoutExercises, oldIdx, newIdx)
    setWorkoutExercises(reordered)
    await updateWorkoutExerciseOrder(reordered.map((we, i) => ({ id: we.id, order: i })))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin/workouts')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">{workout?.name}</h1>
        <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center" onClick={() => setShowPicker(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
      <div className="flex-1 px-4 pb-8">
        {workoutExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500"><p>Dodaj vežbe iz biblioteke</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workoutExercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {workoutExercises.map(we => <ExerciseRow key={we.id} we={we} onDelete={() => setRemovingId(we.id)} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {showPicker && (
        <ExercisePickerModal
          workoutExerciseIds={new Set(workoutExercises.map(we => we.exerciseId))}
          onPick={handlePick}
          onClose={() => setShowPicker(false)}
        />
      )}
      {removingId && <ConfirmModal message="Ukloniti vežbu iz treninga?" confirmLabel="Ukloni" onConfirm={() => handleRemove(removingId)} onCancel={() => setRemovingId(null)} />}
    </div>
  )
}
