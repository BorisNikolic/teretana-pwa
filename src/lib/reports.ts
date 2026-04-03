import type { Workout, Exercise, SetLog, CardioLog, BodyWeight } from '../types'

export interface SessionEntry { date: string; workoutId: string; workoutName: string; lines: string[] }

function fmtDate(s: string) { const [y, m, d] = s.split('-'); return `${+d}. ${+m}. ${y}.` }
function fmtDur(sec: number) { const m = Math.floor(sec / 60), s = sec % 60; return s > 0 ? `${m}min ${s}s` : `${m}min` }

const DAYS_SR = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']
const MONTHS_SR = ['', 'januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

export function formatSessionSummary(workoutName: string, exercises: Exercise[], setLogs: SetLog[], cardioLogs: CardioLog[], date: string): string {
  const lines: string[] = [`Trening: ${workoutName}`, fmtDate(date), '']
  for (const ex of exercises) {
    if ((ex.type ?? 'strength') === 'cardio') {
      const log = cardioLogs.find(l => l.exerciseId === ex.id && l.date === date)
      lines.push(log ? `${ex.name}: ${fmtDur(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%` : `${ex.name}: —`)
    } else {
      const logs = setLogs.filter(l => l.exerciseId === ex.id && l.date === date).sort((a, b) => a.setIndex - b.setIndex)
      lines.push(logs.length ? `${ex.name}: ${ex.setsCount}×${ex.reps} — ${logs.map(l => `${l.weight}`).join('/')} kg` : `${ex.name}: —`)
    }
  }
  return lines.join('\n')
}

export function formatWeeklySummary(workouts: Workout[], allExercises: Exercise[], setLogs: SetLog[], cardioLogs: CardioLog[], bodyWeights: BodyWeight[]): string {
  const now = new Date(); const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const startDate = weekAgo.toISOString().slice(0, 10); const endDate = new Date().toISOString().slice(0, 10)
  const lines: string[] = [`Nedeljni pregled (${fmtDate(startDate)} — ${fmtDate(endDate)})`, '']
  const latestBw = bodyWeights[0]
  if (latestBw) lines.push(`Telesna težina: ${latestBw.weight} kg`, '')
  for (const w of workouts) {
    const exs = allExercises.filter(e => e.workoutId === w.id).sort((a, b) => a.order - b.order)
    let hasData = false
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const logs = cardioLogs.filter(l => l.exerciseId === ex.id && l.date >= startDate && l.date <= endDate)
        if (logs.length) {
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          for (const log of logs) { const day = DAYS_SR[new Date(log.date).getDay()]; lines.push(`  ${day} ${fmtDate(log.date)}: ${ex.name} — ${fmtDur(log.duration)}, ${log.speed} km/h, nagib ${log.incline}%`) }
        }
      } else {
        const logs = setLogs.filter(l => l.exerciseId === ex.id && l.date >= startDate && l.date <= endDate)
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

export function formatMonthlyReport(yearMonth: string, workouts: Workout[], allExercises: Exercise[], setLogs: SetLog[], cardioLogs: CardioLog[], bodyWeights: BodyWeight[]): string {
  const [y, m] = yearMonth.split('-')
  const lines: string[] = [`Mesečni izveštaj — ${MONTHS_SR[+m]} ${y}`, '']
  const bw = bodyWeights.filter(b => b.date.startsWith(yearMonth))
  if (bw.length) { const first = bw[bw.length - 1], last = bw[0]; lines.push(`Telesna težina: ${first.weight} → ${last.weight} kg`, '') }
  for (const w of workouts) {
    const exs = allExercises.filter(e => e.workoutId === w.id).sort((a, b) => a.order - b.order)
    let hasData = false
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') {
        const logs = cardioLogs.filter(l => l.exerciseId === ex.id && l.date.startsWith(yearMonth))
        if (logs.length) {
          const first = logs[logs.length - 1], last = logs[0]
          if (!hasData) { lines.push(`${w.name}:`); hasData = true }
          lines.push(`  ${ex.name}: ${fmtDur(first.duration)}/${first.speed}km/h → ${fmtDur(last.duration)}/${last.speed}km/h`)
        }
      } else {
        const logs = setLogs.filter(l => l.exerciseId === ex.id && l.date.startsWith(yearMonth))
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

export function formatWorkoutLog(workouts: Workout[], allExercises: Exercise[], allSets: SetLog[], allCardio: CardioLog[]): SessionEntry[] {
  const exMap = new Map(allExercises.map(e => [e.id, e])), wMap = new Map(workouts.map(w => [w.id, w]))
  const sessions = new Map<string, { date: string; workoutId: string; sets: SetLog[]; cardio: CardioLog[] }>()
  for (const log of allSets) { const ex = exMap.get(log.exerciseId); if (!ex) continue; const k = `${log.date}::${ex.workoutId}`; if (!sessions.has(k)) sessions.set(k, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] }); sessions.get(k)!.sets.push(log) }
  for (const log of allCardio) { const ex = exMap.get(log.exerciseId); if (!ex) continue; const k = `${log.date}::${ex.workoutId}`; if (!sessions.has(k)) sessions.set(k, { date: log.date, workoutId: ex.workoutId, sets: [], cardio: [] }); sessions.get(k)!.cardio.push(log) }
  const entries: SessionEntry[] = []
  for (const s of sessions.values()) {
    const exs = allExercises.filter(e => e.workoutId === s.workoutId).sort((a, b) => a.order - b.order); const lines: string[] = []
    for (const ex of exs) {
      if ((ex.type ?? 'strength') === 'cardio') { const l = s.cardio.find(c => c.exerciseId === ex.id); if (l) lines.push(`${ex.name}: ${fmtDur(l.duration)}, ${l.speed} km/h, nagib ${l.incline}%`) }
      else { const ls = s.sets.filter(l => l.exerciseId === ex.id).sort((a, b) => a.setIndex - b.setIndex); if (ls.length) lines.push(`${ex.name}: ${ls.map(l => `${l.weight}`).join('/')} kg`) }
    }
    if (lines.length) entries.push({ date: s.date, workoutId: s.workoutId, workoutName: wMap.get(s.workoutId)?.name ?? '', lines })
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
