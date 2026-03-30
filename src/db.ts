import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, SetLog, CardioLog, Recording } from './types'

interface TeretanaDB extends DBSchema {
  workouts: { key: string; value: Workout; indexes: { order: number } }
  exercises: { key: string; value: Exercise; indexes: { workoutId: string; order: number } }
  videos: { key: string; value: { id: string; blob: Blob } }
  setLogs: { key: string; value: SetLog; indexes: { exerciseId: string } }
  cardioLogs: { key: string; value: CardioLog; indexes: { exerciseId: string } }
  recordings: { key: string; value: Recording; indexes: { exerciseId: string } }
}

let db: IDBPDatabase<TeretanaDB>

async function getDB() {
  if (!db) {
    db = await openDB<TeretanaDB>('teretana', 4, {
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
        if (oldVersion < 3) {
          const cardioLogs = db.createObjectStore('cardioLogs', { keyPath: 'id' })
          cardioLogs.createIndex('exerciseId', 'exerciseId')
        }
        if (oldVersion < 4) {
          const recordings = db.createObjectStore('recordings', { keyPath: 'id' })
          recordings.createIndex('exerciseId', 'exerciseId')
        }
      },
    })
  }
  return db
}

function uuid() {
  return crypto.randomUUID()
}

function today() {
  return new Date().toISOString().slice(0, 10)
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
  const tx = db.transaction(['workouts', 'exercises', 'videos', 'setLogs', 'cardioLogs'], 'readwrite')
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

// SetLogs (strength)
export async function saveSetLog(exerciseId: string, setIndex: number, weight: number): Promise<void> {
  const db = await getDB()
  const date = today()
  const existing = await db.getAllFromIndex('setLogs', 'exerciseId', exerciseId)
  const toReplace = existing.find(l => l.date === date && l.setIndex === setIndex)
  await db.put('setLogs', { id: toReplace?.id ?? uuid(), exerciseId, setIndex, weight, date, timestamp: Date.now() })
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
  return Object.fromEntries(logs.filter(l => l.date === lastDate).map(l => [l.setIndex, l.weight]))
}

export async function getTodaySetLogs(exerciseId: string): Promise<SetLog[]> {
  const logs = await getSetLogs(exerciseId)
  return logs.filter(l => l.date === today())
}

// CardioLogs
export async function saveCardioLog(exerciseId: string, duration: number, incline: number, speed: number): Promise<void> {
  const db = await getDB()
  const date = today()
  const existing = await db.getAllFromIndex('cardioLogs', 'exerciseId', exerciseId)
  const toReplace = existing.find(l => l.date === date)
  await db.put('cardioLogs', { id: toReplace?.id ?? uuid(), exerciseId, duration, incline, speed, date, timestamp: Date.now() })
}

export async function getCardioLogs(exerciseId: string): Promise<CardioLog[]> {
  const db = await getDB()
  const logs = await db.getAllFromIndex('cardioLogs', 'exerciseId', exerciseId)
  return logs.sort((a, b) => b.timestamp - a.timestamp)
}

export async function getLastCardioLog(exerciseId: string): Promise<CardioLog | null> {
  const logs = await getCardioLogs(exerciseId)
  return logs[0] ?? null
}

// Workout Log — all sessions across all workouts
export interface SessionEntry {
  date: string
  workoutId: string
  workoutName: string
  lines: string[]
}

export async function getWorkoutLog(): Promise<SessionEntry[]> {
  const db = await getDB()
  const allSetLogs = await db.getAll('setLogs')
  const allCardioLogs = await db.getAll('cardioLogs')
  const workouts = await getWorkouts()
  const allExercises: Exercise[] = []
  for (const w of workouts) allExercises.push(...(await getExercises(w.id)))

  const exMap = new Map(allExercises.map(e => [e.id, e]))
  const wMap = new Map(workouts.map(w => [w.id, w]))

  // Collect all (date, workoutId) pairs
  const sessions = new Map<string, { date: string; workoutId: string; sets: typeof allSetLogs; cardio: typeof allCardioLogs }>()

  for (const log of allSetLogs) {
    const ex = exMap.get(log.exerciseId)
    if (!ex) continue
    const key = `${log.date}::${ex.workoutId}`
    if (!sessions.has(key)) sessions.set(key, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] })
    sessions.get(key)!.sets.push(log)
  }
  for (const log of allCardioLogs) {
    const ex = exMap.get(log.exerciseId)
    if (!ex) continue
    const key = `${log.date}::${ex.workoutId}`
    if (!sessions.has(key)) sessions.set(key, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] })
    sessions.get(key)!.cardio.push(log)
  }

  const entries: SessionEntry[] = []
  for (const s of sessions.values()) {
    const workout = wMap.get(s.workoutId)
    const exercises = allExercises.filter(e => e.workoutId === s.workoutId).sort((a, b) => a.order - b.order)
    const lines: string[] = []

    for (const ex of exercises) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const log = s.cardio.find(l => l.exerciseId === ex.id)
        if (log) lines.push(`${ex.name}: ${fmtDur(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%`)
      } else {
        const logs = s.sets.filter(l => l.exerciseId === ex.id).sort((a, b) => a.setIndex - b.setIndex)
        if (logs.length) lines.push(`${ex.name}: ${logs.map(l => `${l.weight}`).join('/')} kg`)
      }
    }
    if (lines.length) {
      entries.push({ date: s.date, workoutId: s.workoutId, workoutName: workout?.name ?? '', lines })
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

// Session Summary
function formatDateSr(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)}. ${parseInt(m)}. ${y}.`
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}min ${s}s` : `${m}min`
}

export async function getSessionSummary(workoutId: string, date?: string): Promise<string> {
  const d = date ?? today()
  const workout = (await getWorkouts()).find(w => w.id === workoutId)
  const exercises = await getExercises(workoutId)
  const lines: string[] = [`Trening: ${workout?.name ?? ''}`, formatDateSr(d), '']

  for (const ex of exercises) {
    if ((ex.type ?? 'strength') === 'cardio') {
      const logs = await getCardioLogs(ex.id)
      const log = logs.find(l => l.date === d)
      if (log) {
        lines.push(`${ex.name}: ${formatDuration(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%`)
      } else {
        lines.push(`${ex.name}: —`)
      }
    } else {
      const allLogs = await getSetLogs(ex.id)
      const todayLogs = allLogs.filter(l => l.date === d).sort((a, b) => a.setIndex - b.setIndex)
      if (todayLogs.length > 0) {
        const weights = todayLogs.map(l => `${l.weight}`).join('/')
        lines.push(`${ex.name}: ${ex.setsCount}×${ex.reps} — ${weights} kg`)
      } else {
        lines.push(`${ex.name}: —`)
      }
    }
  }
  return lines.join('\n')
}

// Monthly Report
const MONTH_NAMES_SR = ['', 'januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

export async function getMonthlyReport(yearMonth: string): Promise<string> {
  const [y, m] = yearMonth.split('-')
  const workouts = await getWorkouts()
  const lines: string[] = [`Mesečni izveštaj — ${MONTH_NAMES_SR[parseInt(m)]} ${y}`, '']

  for (const workout of workouts) {
    const exercises = await getExercises(workout.id)
    let hasData = false

    for (const ex of exercises) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const logs = (await getCardioLogs(ex.id)).filter(l => l.date.startsWith(yearMonth))
        if (logs.length > 0) {
          const first = logs[logs.length - 1]
          const last = logs[0]
          if (!hasData) { lines.push(`${workout.name}:`); hasData = true }
          lines.push(`  ${ex.name}: ${formatDuration(first.duration)}/${first.speed}km/h → ${formatDuration(last.duration)}/${last.speed}km/h`)
        }
      } else {
        const logs = (await getSetLogs(ex.id)).filter(l => l.date.startsWith(yearMonth))
        if (logs.length > 0) {
          const dates = [...new Set(logs.map(l => l.date))].sort()
          const firstDate = dates[0]
          const lastDate = dates[dates.length - 1]
          const firstMax = Math.max(...logs.filter(l => l.date === firstDate).map(l => l.weight))
          const lastMax = Math.max(...logs.filter(l => l.date === lastDate).map(l => l.weight))
          if (!hasData) { lines.push(`${workout.name}:`); hasData = true }
          lines.push(`  ${ex.name}: ${firstMax} → ${lastMax} kg`)
        }
      }
    }
    if (hasData) lines.push('')
  }
  return lines.join('\n').trim()
}

// Recordings (user filming themselves)
export async function saveRecording(exerciseId: string, blob: Blob): Promise<void> {
  const db = await getDB()
  const date = today()
  const existing = await db.getAllFromIndex('recordings', 'exerciseId', exerciseId)
  const toReplace = existing.find(r => r.date === date)
  await db.put('recordings', { id: toReplace?.id ?? uuid(), exerciseId, date, blob, timestamp: Date.now() })
}

export async function getTodayRecording(exerciseId: string): Promise<Recording | null> {
  const db = await getDB()
  const all = await db.getAllFromIndex('recordings', 'exerciseId', exerciseId)
  return all.find(r => r.date === today()) ?? null
}

export async function getRecordings(exerciseId: string): Promise<Recording[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('recordings', 'exerciseId', exerciseId)
  return all.sort((a, b) => b.timestamp - a.timestamp)
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
