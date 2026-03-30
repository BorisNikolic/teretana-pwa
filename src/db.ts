import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, SetLog } from './types'

interface TeretanaDB extends DBSchema {
  workouts: { key: string; value: Workout; indexes: { order: number } }
  exercises: { key: string; value: Exercise; indexes: { workoutId: string; order: number } }
  videos: { key: string; value: { id: string; blob: Blob } }
  setLogs: { key: string; value: SetLog; indexes: { exerciseId: string } }
}

let db: IDBPDatabase<TeretanaDB>

async function getDB() {
  if (!db) {
    db = await openDB<TeretanaDB>('teretana', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const workouts = db.createObjectStore('workouts', { keyPath: 'id' })
          workouts.createIndex('order', 'order')
          const exercises = db.createObjectStore('exercises', { keyPath: 'id' })
          exercises.createIndex('workoutId', 'workoutId')
          exercises.createIndex('order', 'order')
          db.createObjectStore('videos', { keyPath: 'id' })
        }
        if (oldVersion < 2) {
          const setLogs = db.createObjectStore('setLogs', { keyPath: 'id' })
          setLogs.createIndex('exerciseId', 'exerciseId')
        }
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

// SetLogs
export async function saveSetLog(exerciseId: string, setIndex: number, weight: number): Promise<void> {
  const db = await getDB()
  const date = new Date().toISOString().slice(0, 10)
  const existing = await db.getAllFromIndex('setLogs', 'exerciseId', exerciseId)
  const toReplace = existing.find(l => l.date === date && l.setIndex === setIndex)
  const log: SetLog = { id: toReplace?.id ?? uuid(), exerciseId, setIndex, weight, date, timestamp: Date.now() }
  await db.put('setLogs', log)
}

export async function getSetLogs(exerciseId: string): Promise<SetLog[]> {
  const db = await getDB()
  const logs = await db.getAllFromIndex('setLogs', 'exerciseId', exerciseId)
  return logs.sort((a, b) => b.timestamp - a.timestamp)
}

export async function getLastSessionWeights(exerciseId: string): Promise<Record<number, number>> {
  const logs = await getSetLogs(exerciseId)
  if (!logs.length) return {}
  const lastDate = logs[0].date
  const lastSession = logs.filter(l => l.date === lastDate)
  return Object.fromEntries(lastSession.map(l => [l.setIndex, l.weight]))
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
