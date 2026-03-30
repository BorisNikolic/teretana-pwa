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
