import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Workout } from '../types'
import { getWorkouts, addWorkout, deleteWorkout, updateWorkout, getAllLastWorkoutDates } from '../db'
import AddWorkoutModal from '../components/AddWorkoutModal'
import ConfirmModal from '../components/ConfirmModal'
import { getActiveSession } from '../lib/session'

function daysAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'danas'
  if (diff === 1) return 'juče'
  return `pre ${diff} dana`
}

function WorkoutRow({ workout, lastDate, onDelete }: { workout: Workout; lastDate: string | null; onDelete: () => void }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: workout.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-4 ${isDragging ? 'opacity-50 z-50' : ''}`}>
      <div {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing px-1 touch-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" /></svg>
      </div>
      <button className="flex-1 text-left" onClick={() => navigate(`/workout/${workout.id}`)}>
        <div className="font-semibold">{workout.name}</div>
        {lastDate && <div className="text-xs text-gray-500">{daysAgo(lastDate)}</div>}
      </button>
      <button className="text-gray-600 p-1" onClick={onDelete}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      </button>
    </div>
  )
}

export default function WorkoutListPage() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [lastDates, setLastDates] = useState<Record<string, string | null>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const activeSession = getActiveSession()
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  const load = async () => {
    const ws = await getWorkouts(); setWorkouts(ws)
    setLastDates(await getAllLastWorkoutDates())
  }
  useEffect(() => { load() }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event; if (!over || active.id === over.id) return
    const reordered = arrayMove(workouts, workouts.findIndex(w => w.id === active.id), workouts.findIndex(w => w.id === over.id))
    setWorkouts(reordered); await Promise.all(reordered.map((w, i) => updateWorkout({ ...w, order: i })))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-4 pt-4 pb-4">
        <h1 className="text-2xl font-bold">Treninzi</h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400" onClick={() => navigate('/log')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400" onClick={() => navigate('/progress')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400" onClick={() => navigate('/settings')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center" onClick={() => setShowAdd(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 px-4 pb-8">
        {activeSession && workouts.find(w => w.id === activeSession.workoutId) && (
          <button className="w-full mb-4 py-3 rounded-2xl bg-blue-600/20 border border-blue-600/40 text-blue-400 font-semibold text-left px-4 flex items-center justify-between" onClick={() => navigate(`/workout/${activeSession.workoutId}`)}>
            <span>Nastavi: {workouts.find(w => w.id === activeSession.workoutId)!.name}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500"><p>Dodaj svoj prvi trening</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workouts.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">{workouts.map(w => <WorkoutRow key={w.id} workout={w} lastDate={lastDates[w.id]} onDelete={() => setDeletingId(w.id)} />)}</div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {showAdd && <AddWorkoutModal onSave={async name => { await addWorkout(name, workouts.length); setShowAdd(false); load() }} onClose={() => setShowAdd(false)} />}
      {deletingId && <ConfirmModal message="Obrisati ovaj trening?" onConfirm={async () => { await deleteWorkout(deletingId); setDeletingId(null); load() }} onCancel={() => setDeletingId(null)} />}
    </div>
  )
}
