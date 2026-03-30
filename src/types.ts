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
  type: 'strength' | 'cardio'
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
  date: string
  timestamp: number
}

export interface CardioLog {
  id: string
  exerciseId: string
  duration: number   // seconds
  incline: number    // percent
  speed: number      // km/h
  date: string
  timestamp: number
}
