import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, SetLog, CardioLog, Recording, BodyWeight } from './types'
import { syncSetLog, syncCardioLog, syncBodyWeight, syncDeleteSessionLogs, syncUpdateSetLog, syncUpdateCardioLog } from './lib/supabase-db'
import { formatSessionSummary, formatWeeklySummary, formatMonthlyReport, formatWorkoutLog, type SessionEntry } from './lib/reports'

interface TeretanaDB extends DBSchema {
  workouts: { key: string; value: Workout; indexes: { order: number } }
  exercises: { key: string; value: Exercise; indexes: { workoutId: string; order: number } }
  videos: { key: string; value: { id: string; blob: Blob } }
  setLogs: { key: string; value: SetLog; indexes: { exerciseId: string } }
  cardioLogs: { key: string; value: CardioLog; indexes: { exerciseId: string } }
  recordings: { key: string; value: Recording; indexes: { exerciseId: string } }
  bodyWeights: { key: string; value: BodyWeight; indexes: { date: string } }
  mealPlans: { key: string; value: { id: string; html: string; fileName: string; uploadedAt: number } }
}

let db: IDBPDatabase<TeretanaDB>

async function getDB() {
  if (!db) {
    db = await openDB<TeretanaDB>('teretana', 6, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const w = db.createObjectStore('workouts', { keyPath: 'id' })
          w.createIndex('order', 'order')
          const e = db.createObjectStore('exercises', { keyPath: 'id' })
          e.createIndex('workoutId', 'workoutId')
          e.createIndex('order', 'order')
          db.createObjectStore('videos', { keyPath: 'id' })
        }
        if (oldVersion < 2) { const s = db.createObjectStore('setLogs', { keyPath: 'id' }); s.createIndex('exerciseId', 'exerciseId') }
        if (oldVersion < 3) { const c = db.createObjectStore('cardioLogs', { keyPath: 'id' }); c.createIndex('exerciseId', 'exerciseId') }
        if (oldVersion < 4) { const r = db.createObjectStore('recordings', { keyPath: 'id' }); r.createIndex('exerciseId', 'exerciseId') }
        if (oldVersion < 5) { const b = db.createObjectStore('bodyWeights', { keyPath: 'id' }); b.createIndex('date', 'date') }
        if (oldVersion < 6) { db.createObjectStore('mealPlans', { keyPath: 'id' }) }
      },
    })
  }
  return db
}

function uuid() { return crypto.randomUUID() }
function today() { return new Date().toISOString().slice(0, 10) }

// ── SetLogs ──
export async function saveSetLog(exerciseId: string, setIndex: number, weight: number) {
  const d = await getDB(); const date = today(); const timestamp = Date.now()
  const all = await d.getAllFromIndex('setLogs', 'exerciseId', exerciseId)
  const existing = all.find(l => l.date === date && l.setIndex === setIndex)
  await d.put('setLogs', { id: existing?.id ?? uuid(), exerciseId, setIndex, weight, date, timestamp })
  syncSetLog(exerciseId, setIndex, weight, date, timestamp).catch(() => {})
}
export async function getSetLogs(exerciseId: string): Promise<SetLog[]> {
  return (await (await getDB()).getAllFromIndex('setLogs', 'exerciseId', exerciseId)).sort((a, b) => b.timestamp - a.timestamp)
}
export async function getLastSessionWeights(exerciseId: string): Promise<Record<number, number>> {
  const logs = await getSetLogs(exerciseId); if (!logs.length) return {}
  const last = logs[0].date; return Object.fromEntries(logs.filter(l => l.date === last).map(l => [l.setIndex, l.weight]))
}
export async function getTodaySetLogs(exerciseId: string): Promise<SetLog[]> {
  return (await getSetLogs(exerciseId)).filter(l => l.date === today())
}
export async function getPersonalRecord(exerciseId: string): Promise<number> {
  const logs = await getSetLogs(exerciseId); return logs.length ? Math.max(...logs.map(l => l.weight)) : 0
}

// ── CardioLogs ──
export async function saveCardioLog(exerciseId: string, duration: number, incline: number, speed: number) {
  const d = await getDB(); const date = today(); const timestamp = Date.now()
  const all = await d.getAllFromIndex('cardioLogs', 'exerciseId', exerciseId)
  const existing = all.find(l => l.date === date)
  await d.put('cardioLogs', { id: existing?.id ?? uuid(), exerciseId, duration, incline, speed, date, timestamp })
  syncCardioLog(exerciseId, duration, incline, speed, date, timestamp).catch(() => {})
}
export async function getCardioLogs(exerciseId: string): Promise<CardioLog[]> {
  return (await (await getDB()).getAllFromIndex('cardioLogs', 'exerciseId', exerciseId)).sort((a, b) => b.timestamp - a.timestamp)
}
export async function getLastCardioLog(exerciseId: string): Promise<CardioLog | null> {
  return (await getCardioLogs(exerciseId))[0] ?? null
}

// ── Recordings ──
export async function saveRecording(exerciseId: string, blob: Blob) {
  const d = await getDB(); const date = today()
  const all = await d.getAllFromIndex('recordings', 'exerciseId', exerciseId)
  const existing = all.find(r => r.date === date)
  await d.put('recordings', { id: existing?.id ?? uuid(), exerciseId, date, blob, timestamp: Date.now() })
}
export async function getTodayRecording(exerciseId: string): Promise<Recording | null> {
  const all = await (await getDB()).getAllFromIndex('recordings', 'exerciseId', exerciseId)
  return all.find(r => r.date === today()) ?? null
}

// ── Body Weight ──
export async function saveBodyWeight(weight: number) {
  const d = await getDB(); const date = today(); const timestamp = Date.now()
  const all = await d.getAll('bodyWeights')
  const existing = all.find(b => b.date === date)
  await d.put('bodyWeights', { id: existing?.id ?? uuid(), weight, date, timestamp })
  syncBodyWeight(weight, date, timestamp).catch(() => {})
}
export async function getBodyWeights(): Promise<BodyWeight[]> {
  return (await (await getDB()).getAll('bodyWeights')).sort((a, b) => b.date.localeCompare(a.date))
}

// ── Videos ──
export async function saveVideo(exerciseId: string, blob: Blob) { await (await getDB()).put('videos', { id: exerciseId, blob }) }
export async function getVideo(exerciseId: string): Promise<Blob | null> {
  return (await (await getDB()).get('videos', exerciseId))?.blob ?? null
}

// ── Last workout dates ──
export async function getAllLastWorkoutDates(workouts: Workout[], allExercises?: Exercise[]): Promise<Record<string, string | null>> {
  const d = await getDB()
  const exToWorkout = allExercises ? new Map(allExercises.map(e => [e.id, e.workoutId])) : new Map<string, string>()
  const allSets = await d.getAll('setLogs')
  const allCardio = await d.getAll('cardioLogs')
  const dates: Record<string, string[]> = {}
  for (const w of workouts) dates[w.id] = []
  for (const s of allSets) { const wid = exToWorkout.get(s.exerciseId); if (wid && dates[wid]) dates[wid].push(s.date) }
  for (const c of allCardio) { const wid = exToWorkout.get(c.exerciseId); if (wid && dates[wid]) dates[wid].push(c.date) }
  const result: Record<string, string | null> = {}
  for (const w of workouts) result[w.id] = dates[w.id].length ? dates[w.id].sort().pop()! : null
  return result
}

// ── Reports (delegate to pure formatters, read from IDB) ──
export { type SessionEntry } from './lib/reports'

export async function getSessionSummary(workoutName: string, exercises: Exercise[], date?: string): Promise<string> {
  const d = date ?? today()
  const setLogs: SetLog[] = []; const cardioLogs: CardioLog[] = []
  for (const ex of exercises) {
    setLogs.push(...(await getSetLogs(ex.id)).filter(l => l.date === d))
    const cl = (await getCardioLogs(ex.id)).find(l => l.date === d)
    if (cl) cardioLogs.push(cl)
  }
  return formatSessionSummary(workoutName, exercises, setLogs, cardioLogs, d)
}

export async function getWeeklySummary(workouts: Workout[], allExercises: Exercise[]): Promise<string> {
  const setLogs: SetLog[] = []; const cardioLogs: CardioLog[] = []
  for (const ex of allExercises) { setLogs.push(...await getSetLogs(ex.id)); cardioLogs.push(...await getCardioLogs(ex.id)) }
  return formatWeeklySummary(workouts, allExercises, setLogs, cardioLogs, await getBodyWeights())
}

export async function getMonthlyReport(yearMonth: string, workouts: Workout[], allExercises: Exercise[]): Promise<string> {
  const setLogs: SetLog[] = []; const cardioLogs: CardioLog[] = []
  for (const ex of allExercises) { setLogs.push(...await getSetLogs(ex.id)); cardioLogs.push(...await getCardioLogs(ex.id)) }
  return formatMonthlyReport(yearMonth, workouts, allExercises, setLogs, cardioLogs, await getBodyWeights())
}

export async function getWorkoutLog(workouts: Workout[], allExercises: Exercise[]): Promise<SessionEntry[]> {
  const d = await getDB()
  return formatWorkoutLog(workouts, allExercises, await d.getAll('setLogs'), await d.getAll('cardioLogs'))
}

// ── Session manipulation ──
export interface SessionLogData {
  exercises: Array<{ exercise: Exercise; sets: SetLog[]; cardio: CardioLog | null }>
}

export async function getSessionData(exercises: Exercise[], date: string): Promise<SessionLogData> {
  const d = await getDB()
  const result: SessionLogData['exercises'] = []
  for (const ex of exercises) {
    const sets = (await d.getAllFromIndex('setLogs', 'exerciseId', ex.id)).filter(s => s.date === date).sort((a, b) => a.setIndex - b.setIndex)
    const cardio = (await d.getAllFromIndex('cardioLogs', 'exerciseId', ex.id)).find(c => c.date === date) ?? null
    if (sets.length || cardio) result.push({ exercise: ex, sets, cardio })
  }
  return { exercises: result }
}

export async function deleteSessionLogs(exercises: Exercise[], date: string) {
  const d = await getDB()
  const tx = d.transaction(['setLogs', 'cardioLogs'], 'readwrite')
  for (const ex of exercises) {
    for (const s of await tx.objectStore('setLogs').index('exerciseId').getAll(ex.id)) { if (s.date === date) await tx.objectStore('setLogs').delete(s.id) }
    for (const c of await tx.objectStore('cardioLogs').index('exerciseId').getAll(ex.id)) { if (c.date === date) await tx.objectStore('cardioLogs').delete(c.id) }
  }
  await tx.done
  syncDeleteSessionLogs(exercises.map(e => e.id), date).catch(() => {})
}

export async function updateSetLogWeight(id: string, weight: number) {
  const d = await getDB(); const log = await d.get('setLogs', id)
  if (log) {
    await d.put('setLogs', { ...log, weight })
    syncUpdateSetLog(log.exerciseId, log.setIndex, weight, log.date, log.timestamp).catch(() => {})
  }
}

export async function updateCardioLogValues(id: string, duration: number, speed: number, incline: number) {
  const d = await getDB(); const log = await d.get('cardioLogs', id)
  if (log) {
    await d.put('cardioLogs', { ...log, duration, speed, incline })
    syncUpdateCardioLog(log.exerciseId, duration, incline, speed, log.date, log.timestamp).catch(() => {})
  }
}
