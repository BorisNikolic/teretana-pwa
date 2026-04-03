import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Workout } from '../../types'
import { getAllWorkouts, createWorkout, deleteWorkout, updateWorkout } from '../../lib/supabase-db'
import AddWorkoutModal from '../../components/AddWorkoutModal'
import ConfirmModal from '../../components/ConfirmModal'

function WorkoutRow({ workout, onDelete }: { workout: Workout; onDelete: () => void }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: workout.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-4 ${isDragging ? 'opacity-50' : ''}`}>
      <div {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing px-1 touch-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" /></svg>
      </div>
      <button className="flex-1 text-left" onClick={() => navigate(`/admin/workouts/${workout.id}`)}>
        <div className="font-semibold">{workout.name}</div>
      </button>
      <button className="text-gray-600 p-1" onClick={onDelete}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      </button>
    </div>
  )
}

export default function AdminWorkoutsPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  const load = () => { getAllWorkouts().then(setWorkouts) }
  useEffect(load, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event; if (!over || active.id === over.id) return
    const reordered = arrayMove(workouts, workouts.findIndex(w => w.id === active.id), workouts.findIndex(w => w.id === over.id))
    setWorkouts(reordered)
    await Promise.all(reordered.map((w, i) => updateWorkout(w.id, { order: i })))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Treninzi</h1>
        <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center" onClick={() => setShowAdd(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
      <div className="flex-1 px-4 pb-8">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500"><p>Nema treninga</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workouts.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">{workouts.map(w => <WorkoutRow key={w.id} workout={w} onDelete={() => setDeletingId(w.id)} />)}</div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {showAdd && <AddWorkoutModal onSave={async name => { await createWorkout(name, workouts.length); setShowAdd(false); load() }} onClose={() => setShowAdd(false)} />}
      {deletingId && <ConfirmModal message="Obrisati ovaj trening?" onConfirm={async () => { await deleteWorkout(deletingId); setDeletingId(null); load() }} onCancel={() => setDeletingId(null)} />}
    </div>
  )
}
