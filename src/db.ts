import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, SetLog, CardioLog, Recording, BodyWeight } from './types'

interface TeretanaDB extends DBSchema {
  workouts: { key: string; value: Workout; indexes: { order: number } }
  exercises: { key: string; value: Exercise; indexes: { workoutId: string; order: number } }
  videos: { key: string; value: { id: string; blob: Blob } }
  setLogs: { key: string; value: SetLog; indexes: { exerciseId: string } }
  cardioLogs: { key: string; value: CardioLog; indexes: { exerciseId: string } }
  recordings: { key: string; value: Recording; indexes: { exerciseId: string } }
  bodyWeights: { key: string; value: BodyWeight; indexes: { date: string } }
}

let db: IDBPDatabase<TeretanaDB>

async function getDB() {
  if (!db) {
    db = await openDB<TeretanaDB>('teretana', 5, {
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
      },
    })
  }
  return db
}

function uuid() { return crypto.randomUUID() }
function today() { return new Date().toISOString().slice(0, 10) }

// ── Workouts ──
export async function getWorkouts(): Promise<Workout[]> {
  return (await (await getDB()).getAll('workouts')).sort((a, b) => a.order - b.order)
}
export async function addWorkout(name: string, order: number): Promise<Workout> {
  const d = await getDB(); const w: Workout = { id: uuid(), name, order, createdAt: Date.now() }; await d.add('workouts', w); return w
}
export async function updateWorkout(workout: Workout) { await (await getDB()).put('workouts', workout) }
export async function deleteWorkout(id: string) {
  const d = await getDB(); const exs = await getExercises(id)
  const tx = d.transaction(['workouts', 'exercises', 'videos', 'setLogs', 'cardioLogs', 'recordings'], 'readwrite')
  await tx.objectStore('workouts').delete(id)
  for (const ex of exs) { await tx.objectStore('exercises').delete(ex.id); await tx.objectStore('videos').delete(ex.id) }
  await tx.done
}

// ── Exercises ──
export async function getExercises(workoutId: string): Promise<Exercise[]> {
  return (await (await getDB()).getAllFromIndex('exercises', 'workoutId', workoutId)).sort((a, b) => a.order - b.order)
}
export async function addExercise(data: Omit<Exercise, 'id'>): Promise<Exercise> {
  const d = await getDB(); const ex: Exercise = { id: uuid(), ...data }; await d.add('exercises', ex); return ex
}
export async function updateExercise(exercise: Exercise) { await (await getDB()).put('exercises', exercise) }
export async function deleteExercise(id: string) {
  const d = await getDB(); const tx = d.transaction(['exercises', 'videos'], 'readwrite')
  await tx.objectStore('exercises').delete(id); await tx.objectStore('videos').delete(id); await tx.done
}

// ── SetLogs ──
export async function saveSetLog(exerciseId: string, setIndex: number, weight: number) {
  const d = await getDB(); const date = today()
  const all = await d.getAllFromIndex('setLogs', 'exerciseId', exerciseId)
  const existing = all.find(l => l.date === date && l.setIndex === setIndex)
  await d.put('setLogs', { id: existing?.id ?? uuid(), exerciseId, setIndex, weight, date, timestamp: Date.now() })
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
  const d = await getDB(); const date = today()
  const all = await d.getAllFromIndex('cardioLogs', 'exerciseId', exerciseId)
  const existing = all.find(l => l.date === date)
  await d.put('cardioLogs', { id: existing?.id ?? uuid(), exerciseId, duration, incline, speed, date, timestamp: Date.now() })
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
  const d = await getDB(); const date = today()
  const all = await d.getAll('bodyWeights')
  const existing = all.find(b => b.date === date)
  await d.put('bodyWeights', { id: existing?.id ?? uuid(), weight, date, timestamp: Date.now() })
}
export async function getBodyWeights(): Promise<BodyWeight[]> {
  return (await (await getDB()).getAll('bodyWeights')).sort((a, b) => b.date.localeCompare(a.date))
}

// ── Videos ──
export async function saveVideo(exerciseId: string, blob: Blob) { await (await getDB()).put('videos', { id: exerciseId, blob }) }
export async function getVideo(exerciseId: string): Promise<Blob | null> {
  return (await (await getDB()).get('videos', exerciseId))?.blob ?? null
}

// ── Last workout date ──
export async function getLastWorkoutDate(workoutId: string): Promise<string | null> {
  const exs = await getExercises(workoutId); const dates: string[] = []
  const d = await getDB()
  for (const ex of exs) {
    const sets = await d.getAllFromIndex('setLogs', 'exerciseId', ex.id)
    const cardio = await d.getAllFromIndex('cardioLogs', 'exerciseId', ex.id)
    sets.forEach(s => dates.push(s.date)); cardio.forEach(c => dates.push(c.date))
  }
  return dates.length ? dates.sort().pop()! : null
}

export async function getAllLastWorkoutDates(): Promise<Record<string, string | null>> {
  const d = await getDB()
  const workouts = await getWorkouts()
  const allExs: Exercise[] = []
  for (const w of workouts) allExs.push(...(await getExercises(w.id)))
  const exToWorkout = new Map(allExs.map(e => [e.id, e.workoutId]))
  const allSets = await d.getAll('setLogs')
  const allCardio = await d.getAll('cardioLogs')
  const dates: Record<string, string[]> = {}
  for (const w of workouts) dates[w.id] = []
  for (const s of allSets) { const wid = exToWorkout.get(s.exerciseId); if (wid) dates[wid].push(s.date) }
  for (const c of allCardio) { const wid = exToWorkout.get(c.exerciseId); if (wid) dates[wid].push(c.date) }
  const result: Record<string, string | null> = {}
  for (const w of workouts) result[w.id] = dates[w.id].length ? dates[w.id].sort().pop()! : null
  return result
}

// ── Session summary ──
function fmtDate(s: string) { const [y, m, d] = s.split('-'); return `${+d}. ${+m}. ${y}.` }
function fmtDur(sec: number) { const m = Math.floor(sec / 60), s = sec % 60; return s > 0 ? `${m}min ${s}s` : `${m}min` }

export async function getSessionSummary(workoutId: string, date?: string): Promise<string> {
  const d = date ?? today()
  const workout = (await getWorkouts()).find(w => w.id === workoutId)
  const exercises = await getExercises(workoutId)
  const lines: string[] = [`Trening: ${workout?.name ?? ''}`, fmtDate(d), '']
  for (const ex of exercises) {
    if ((ex.type ?? 'strength') === 'cardio') {
      const log = (await getCardioLogs(ex.id)).find(l => l.date === d)
      lines.push(log ? `${ex.name}: ${fmtDur(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%` : `${ex.name}: —`)
    } else {
      const logs = (await getSetLogs(ex.id)).filter(l => l.date === d).sort((a, b) => a.setIndex - b.setIndex)
      lines.push(logs.length ? `${ex.name}: ${ex.setsCount}×${ex.reps} — ${logs.map(l => `${l.weight}`).join('/')} kg` : `${ex.name}: —`)
    }
  }
  return lines.join('\n')
}

// ── Weekly summary ──
const DAYS_SR = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']

export async function getWeeklySummary(): Promise<string> {
  const now = new Date(); const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const startDate = weekAgo.toISOString().slice(0, 10); const endDate = today()
  const workouts = await getWorkouts(); const lines: string[] = [`Nedeljni pregled (${fmtDate(startDate)} — ${fmtDate(endDate)})`, '']
  const bw = await getBodyWeights(); const latestBw = bw[0]
  if (latestBw) lines.push(`Telesna težina: ${latestBw.weight} kg`, '')
  for (const w of workouts) {
    const exs = await getExercises(w.id); let hasData = false
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const logs = (await getCardioLogs(ex.id)).filter(l => l.date >= startDate && l.date <= endDate)
        if (logs.length) {
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          for (const log of logs) { const day = DAYS_SR[new Date(log.date).getDay()]; lines.push(`  ${day} ${fmtDate(log.date)}: ${ex.name} — ${fmtDur(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%`) }
        }
      } else {
        const logs = (await getSetLogs(ex.id)).filter(l => l.date >= startDate && l.date <= endDate)
        const dates = [...new Set(logs.map(l => l.date))].sort()
        if (dates.length) {
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          for (const date of dates) {
            const day = DAYS_SR[new Date(date).getDay()]
            const dLogs = logs.filter(l => l.date === date).sort((a, b) => a.setIndex - b.setIndex)
            lines.push(`  ${day} ${fmtDate(date)}: ${ex.name} — ${dLogs.map(l => `${l.weight}`).join('/')} kg`)
          }
        }
      }
    }
    if (hasData) lines.push('')
  }
  return lines.join('\n').trim()
}

// ── Monthly report ──
const MONTHS_SR = ['', 'januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

export async function getMonthlyReport(yearMonth: string): Promise<string> {
  const [y, m] = yearMonth.split('-'); const workouts = await getWorkouts()
  const lines: string[] = [`Mesečni izveštaj — ${MONTHS_SR[+m]} ${y}`, '']
  const bw = (await getBodyWeights()).filter(b => b.date.startsWith(yearMonth))
  if (bw.length) { const first = bw[bw.length - 1], last = bw[0]; lines.push(`Telesna težina: ${first.weight} → ${last.weight} kg`, '') }
  for (const w of workouts) {
    const exs = await getExercises(w.id); let hasData = false
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const logs = (await getCardioLogs(ex.id)).filter(l => l.date.startsWith(yearMonth))
        if (logs.length) {
          const first = logs[logs.length - 1], last = logs[0]
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          lines.push(`  ${ex.name}: ${fmtDur(first.duration)}/${first.speed}km/h → ${fmtDur(last.duration)}/${last.speed}km/h`)
        }
      } else {
        const logs = (await getSetLogs(ex.id)).filter(l => l.date.startsWith(yearMonth))
        if (logs.length) {
          const dates = [...new Set(logs.map(l => l.date))].sort()
          const firstMax = Math.max(...logs.filter(l => l.date === dates[0]).map(l => l.weight))
          const lastMax = Math.max(...logs.filter(l => l.date === dates[dates.length - 1]).map(l => l.weight))
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          lines.push(`  ${ex.name}: ${firstMax} → ${lastMax} kg`)
        }
      }
    }
    if (hasData) lines.push('')
  }
  return lines.join('\n').trim()
}

// ── Workout log ──
export interface SessionEntry { date: string; workoutId: string; workoutName: string; lines: string[] }

export async function getWorkoutLog(): Promise<SessionEntry[]> {
  const d = await getDB()
  const allSets = await d.getAll('setLogs'), allCardio = await d.getAll('cardioLogs')
  const workouts = await getWorkouts(); const allExs: Exercise[] = []
  for (const w of workouts) allExs.push(...(await getExercises(w.id)))
  const exMap = new Map(allExs.map(e => [e.id, e])), wMap = new Map(workouts.map(w => [w.id, w]))
  const sessions = new Map<string, { date: string; workoutId: string; sets: SetLog[]; cardio: CardioLog[] }>()
  for (const log of allSets) { const ex = exMap.get(log.exerciseId); if (!ex) continue; const k = `${log.date}::${ex.workoutId}`; if (!sessions.has(k)) sessions.set(k, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] }); sessions.get(k)!.sets.push(log) }
  for (const log of allCardio) { const ex = exMap.get(log.exerciseId); if (!ex) continue; const k = `${log.date}::${ex.workoutId}`; if (!sessions.has(k)) sessions.set(k, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] }); sessions.get(k)!.cardio.push(log) }
  const entries: SessionEntry[] = []
  for (const s of sessions.values()) {
    const exs = allExs.filter(e => e.workoutId === s.workoutId).sort((a, b) => a.order - b.order); const lines: string[] = []
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') { const l = s.cardio.find(c => c.exerciseId === ex.id); if (l) lines.push(`${ex.name}: ${fmtDur(l.duration)}, ${l.speed} km/h, nagib ${l.incline}%`) }
      else { const ls = s.sets.filter(l => l.exerciseId === ex.id).sort((a, b) => a.setIndex - b.setIndex); if (ls.length) lines.push(`${ex.name}: ${ls.map(l => `${l.weight}`).join('/')} kg`) }
    }
    if (lines.length) entries.push({ date: s.date, workoutId: s.workoutId, workoutName: wMap.get(s.workoutId)?.name ?? '', lines })
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

// ── Backup / Restore ──
export async function exportBackup(): Promise<string> {
  const d = await getDB()
  return JSON.stringify({
    workouts: await d.getAll('workouts'), exercises: await d.getAll('exercises'),
    setLogs: await d.getAll('setLogs'), cardioLogs: await d.getAll('cardioLogs'), bodyWeights: await d.getAll('bodyWeights'),
  })
}

export async function importBackup(json: string) {
  const data = JSON.parse(json); const d = await getDB()
  const stores = ['workouts', 'exercises', 'setLogs', 'cardioLogs', 'bodyWeights'] as const
  for (const name of stores) {
    const tx = d.transaction(name, 'readwrite'); await tx.objectStore(name).clear()
    for (const item of (data[name] ?? [])) await tx.objectStore(name).add(item)
    await tx.done
  }
}
