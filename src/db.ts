import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Workout, Exercise } from './types'

interface TeretanaDB extends DBSchema {
  workouts: { key: string; value: Workout; indexes: { order: number } }
  exercises: { key: string; value: Exercise; indexes: { workoutId: string; order: number } }
  videos: { key: string; value: { id: string; blob: Blob } }
}

let db: IDBPDatabase<TeretanaDB>

async function getDB() {
  if (!db) {
    db = await openDB<TeretanaDB>('teretana', 1, {
      upgrade(db) {
        const workouts = db.createObjectStore('workouts', { keyPath: 'id' })
        workouts.createIndex('order', 'order')
        const exercises = db.createObjectStore('exercises', { keyPath: 'id' })
        exercises.createIndex('workoutId', 'workoutId')
        exercises.createIndex('order', 'order')
        db.createObjectStore('videos', { keyPath: 'id' })
      },
    })
  }
  return db
}

function uuid() {
  return crypto.randomUUID()
}

// Workouts
export async function getWorkouts(): Promise<Workout[]> {
  const db = await getDB()
  const all = await db.getAll('workouts')
  return all.sort((a, b) => a.order - b.order)
}

export async function addWorkout(name: string, order: number): Promise<Workout> {
  const db = await getDB()
  const workout: Workout = { id: uuid(), name, order, createdAt: Date.now() }
  await db.add('workouts', workout)
  return workout
}

export async function updateWorkout(workout: Workout): Promise<void> {
  const db = await getDB()
  await db.put('workouts', workout)
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB()
  const exercises = await getExercises(id)
  const tx = db.transaction(['workouts', 'exercises', 'videos'], 'readwrite')
  await tx.objectStore('workouts').delete(id)
  for (const ex of exercises) {
    await tx.objectStore('exercises').delete(ex.id)
    await tx.objectStore('videos').delete(ex.id)
  }
  await tx.done
}

// Exercises
export async function getExercises(workoutId: string): Promise<Exercise[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('exercises', 'workoutId', workoutId)
  return all.sort((a, b) => a.order - b.order)
}

export async function addExercise(data: Omit<Exercise, 'id'>): Promise<Exercise> {
  const db = await getDB()
  const exercise: Exercise = { id: uuid(), ...data }
  await db.add('exercises', exercise)
  return exercise
}

export async function updateExercise(exercise: Exercise): Promise<void> {
  const db = await getDB()
  await db.put('exercises', exercise)
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['exercises', 'videos'], 'readwrite')
  await tx.objectStore('exercises').delete(id)
  await tx.objectStore('videos').delete(id)
  await tx.done
}

// Videos
export async function saveVideo(exerciseId: string, blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put('videos', { id: exerciseId, blob })
}

export async function getVideo(exerciseId: string): Promise<Blob | null> {
  const db = await getDB()
  const record = await db.get('videos', exerciseId)
  return record?.blob ?? null
}
