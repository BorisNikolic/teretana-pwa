import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Exercise, Workout } from '../types'
import { getWorkouts, getExercises, addExercise, deleteExercise, updateExercise, saveVideo } from '../db'
import AddExerciseModal, { type ExerciseFormData } from '../components/AddExerciseModal'
import SessionSummary from '../components/SessionSummary'
import VideoThumbnail from '../components/VideoThumbnail'

function ExerciseRow({ exercise, onDelete }: { exercise: Exercise; onDelete: () => void }) {
  const navigate = useNavigate()
  const { workoutId } = useParams()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id })
  const isCardio = (exercise.type ?? 'strength') === 'cardio'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-gray-900 rounded-2xl px-4 py-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing px-1 touch-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      </div>

      <VideoThumbnail exerciseId={exercise.id} className="w-14 h-14 shrink-0" />

      <button className="flex-1 text-left min-w-0" onClick={() => navigate(`/workout/${workoutId}/exercise/${exercise.id}`)}>
        <div className="font-semibold truncate">{exercise.name}</div>
        <div className="text-sm text-gray-400">
          {isCardio ? 'Kardio' : `${exercise.setsCount} × ${exercise.reps}`}
        </div>
      </button>

      <button className="text-gray-600 p-1 shrink-0" onClick={onDelete}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  const load = async () => {
    if (!workoutId) return
    const workouts = await getWorkouts()
    setWorkout(workouts.find(w => w.id === workoutId) ?? null)
    setExercises(await getExercises(workoutId))
  }
  useEffect(() => { load() }, [workoutId])

  const handleAdd = async (data: ExerciseFormData) => {
    if (!workoutId) return
    const ex = await addExercise({
      workoutId, name: data.name, order: exercises.length, type: data.type,
      setsCount: data.setsCount, reps: data.reps, restSeconds: data.restSeconds, notes: data.notes,
    })
    if (data.videoBlob) await saveVideo(ex.id, data.videoBlob)
    setShowAdd(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteExercise(id)
    load()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = exercises.findIndex(e => e.id === active.id)
    const newIndex = exercises.findIndex(e => e.id === over.id)
    const reordered = arrayMove(exercises, oldIndex, newIndex)
    setExercises(reordered)
    await Promise.all(reordered.map((e, i) => updateExercise({ ...e, order: i })))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">{workout?.name}</h1>
        <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center" onClick={() => setShowAdd(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-4">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p>Dodaj vežbe u ovaj trening</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {exercises.map(ex => (
                  <ExerciseRow key={ex.id} exercise={ex} onDelete={() => handleDelete(ex.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Finish workout button */}
      {exercises.length > 0 && (
        <div className="px-4 py-6">
          <button
            className="w-full py-4 rounded-2xl bg-green-700 font-semibold text-lg flex items-center justify-center gap-2"
            onClick={() => setShowSummary(true)}
          >
            Završi trening
          </button>
        </div>
      )}

      {showAdd && <AddExerciseModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {showSummary && workoutId && <SessionSummary workoutId={workoutId} onClose={() => setShowSummary(false)} />}
    </div>
  )
}
