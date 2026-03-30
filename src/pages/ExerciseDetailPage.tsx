import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Exercise } from '../types'
import { getExercises, getVideo } from '../db'
import { useRestTimer } from '../hooks/useRestTimer'
import InfoCard from '../components/InfoCard'

export default function ExerciseDetailPage() {
  const { workoutId, exerciseId } = useParams<{ workoutId: string; exerciseId: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const timer = useRestTimer()

  useEffect(() => {
    if (!workoutId || !exerciseId) return
    getExercises(workoutId).then(list => {
      setExercise(list.find(e => e.id === exerciseId) ?? null)
    })
    getVideo(exerciseId).then(blob => {
      if (blob) setVideoSrc(URL.createObjectURL(blob))
    })
    return () => { if (videoSrc) URL.revokeObjectURL(videoSrc) }
  }, [exerciseId])

  const toggleSet = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
        timer.stop()
      } else {
        next.add(index)
        timer.start(exercise?.restSeconds ?? 60)
      }
      return next
    })
  }

  if (!exercise) return null

  return (
    <div className="flex flex-col min-h-screen pb-10">
      <div className="flex items-center gap-3 px-4 pt-14 pb-2">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate(-1)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1 leading-tight">{exercise.name}</h1>
      </div>

      {/* Video */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          playsInline
          className="w-full aspect-video bg-black"
        />
      ) : (
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-gray-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="px-4 mt-4 space-y-4">
        {/* Info cards */}
        <div className="flex gap-3">
          <InfoCard title="Serije" value={String(exercise.setsCount)} />
          <InfoCard title="Ponavljanja" value={exercise.reps} />
          <InfoCard title="Pauza" value={`${exercise.restSeconds}s`} />
        </div>

        {/* Notes */}
        {exercise.notes && (
          <p className="text-sm text-gray-400">{exercise.notes}</p>
        )}

        {/* Rest timer */}
        {timer.active && (
          <div className="flex items-center gap-3 bg-blue-950 border border-blue-800 rounded-2xl px-4 py-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold tabular-nums">Pauza: {timer.remaining}s</span>
            <button className="ml-auto text-sm text-blue-300" onClick={timer.stop}>Preskoči</button>
          </div>
        )}

        {/* Sets */}
        <div>
          <h2 className="text-base font-semibold mb-3">Serije</h2>
          <div className="flex flex-col gap-2">
            {Array.from({ length: exercise.setsCount }, (_, i) => (
              <button
                key={i}
                className="flex items-center gap-3 py-3 px-1"
                onClick={() => toggleSet(i)}
              >
                {completed.has(i) ? (
                  <svg className="w-7 h-7 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
                <span className={`text-base ${completed.has(i) ? 'text-gray-400 line-through' : ''}`}>
                  Serija {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
