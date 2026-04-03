export interface Workout {
  id: string
  name: string
  order: number
  createdAt: number
}

export interface Exercise {
  id: string
  workoutId?: string
  name: string
  order: number
  type: 'strength' | 'cardio'
  setsCount: number
  reps: string
  restSeconds: number
  notes: string
  videoUrl: string | null
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  exercise: Exercise
  setsCount?: number | null
  reps?: string | null
  restSeconds?: number | null
  notes?: string | null
}

export interface SetLog {
  id: string
  exerciseId: string
  setIndex: number
  weight: number
  date: string
  timestamp: number
}

export interface CardioLog {
  id: string
  exerciseId: string
  duration: number
  incline: number
  speed: number
  date: string
  timestamp: number
}

export interface Recording {
  id: string
  exerciseId: string
  date: string
  blob: Blob
  timestamp: number
}

export interface BodyWeight {
  id: string
  weight: number
  date: string
  timestamp: number
}
