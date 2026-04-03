const KEY = 'activeSession'
export interface ActiveSession { workoutId: string; startedAt: number }

export function getActiveSession(): ActiveSession | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') } catch { return null }
}
export function saveActiveSession(workoutId: string) {
  localStorage.setItem(KEY, JSON.stringify({ workoutId, startedAt: Date.now() }))
}
export function clearActiveSession() { localStorage.removeItem(KEY) }
