export interface Workout {
  id: string
  name: string
  order: number
  createdAt: number
}

export interface Exercise {
  id: string
  workoutId: string
  name: string
  order: number
  setsCount: number
  reps: string
  restSeconds: number
  notes: string
}

export interface SetLog {
  id: string
  exerciseId: string
  setIndex: number
  weight: number
  date: string      // YYYY-MM-DD
  timestamp: number
}
