import supabase from './supabase'
import type { Exercise, Workout, WorkoutExercise, SetLog, CardioLog, BodyWeight } from '../types'
import type { Profile } from '../contexts/AuthContext'
import { formatWorkoutLog, formatWeeklySummary, formatMonthlyReport, type SessionEntry } from './reports'

// ── Exercise Library (global exercises) ──

export async function getAllExerciseLibrary(): Promise<Exercise[]> {
  const { data } = await supabase.from('exercises').select('*').order('name')
  return (data ?? []).map(mapExercise)
}

export async function createLibraryExercise(ex: Omit<Exercise, 'id' | 'videoUrl' | 'order' | 'workoutId'>): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').insert({
    name: ex.name, type: ex.type, sets_count: ex.setsCount, reps: ex.reps,
    rest_seconds: ex.restSeconds, notes: ex.notes
  }).select().single()
  if (error) throw error
  return mapExercise(data)
}

export async function updateLibraryExercise(ex: Exercise) {
  await supabase.from('exercises').update({
    name: ex.name, type: ex.type, sets_count: ex.setsCount,
    reps: ex.reps, rest_seconds: ex.restSeconds, notes: ex.notes
  }).eq('id', ex.id)
}

export async function deleteLibraryExercise(id: string) {
  // Delete video from storage if exists
  const { data } = await supabase.from('exercises').select('video_url').eq('id', id).single()
  if (data?.video_url) {
    const path = data.video_url.split('/exercise-videos/')[1]
    if (path) await supabase.storage.from('exercise-videos').remove([path])
  }
  await supabase.from('exercises').delete().eq('id', id)
}

export async function uploadExerciseVideo(exerciseId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'mp4'
  const path = `${exerciseId}.${ext}`
  // Remove old file if exists
  await supabase.storage.from('exercise-videos').remove([path])
  const { error: uploadError } = await supabase.storage.from('exercise-videos').upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data: { publicUrl } } = supabase.storage.from('exercise-videos').getPublicUrl(path)
  await supabase.from('exercises').update({ video_url: publicUrl }).eq('id', exerciseId)
  return publicUrl
}

export async function deleteExerciseVideo(exerciseId: string) {
  const { data } = await supabase.from('exercises').select('video_url').eq('id', exerciseId).single()
  if (data?.video_url) {
    const path = data.video_url.split('/exercise-videos/')[1]
    if (path) await supabase.storage.from('exercise-videos').remove([path])
  }
  await supabase.from('exercises').update({ video_url: null }).eq('id', exerciseId)
}

// ── Workout CRUD ──

export async function getAllWorkouts(): Promise<Workout[]> {
  const { data } = await supabase.from('workouts').select('*').order('order')
  return (data ?? []).map(mapWorkout)
}

export async function getAssignedWorkouts(): Promise<Workout[]> {
  const { data } = await supabase.from('workouts').select('*').order('order')
  return (data ?? []).map(mapWorkout)
}

export async function createWorkout(name: string, order: number): Promise<Workout> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('workouts').insert({ name, order, created_by: user!.id }).select().single()
  if (error) throw error
  return mapWorkout(data)
}

export async function updateWorkout(id: string, updates: { name?: string; order?: number }) {
  await supabase.from('workouts').update(updates).eq('id', id)
}

export async function deleteWorkout(id: string) {
  await supabase.from('workouts').delete().eq('id', id)
}

// ── Workout Exercises (junction table) ──

export async function getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const { data } = await supabase.from('workout_exercises').select('*, exercises(*)').eq('workout_id', workoutId).order('order')
  return (data ?? []).map(mapWorkoutExercise)
}

// Client alias
export async function getExercises(workoutId: string): Promise<Exercise[]> {
  const wes = await getWorkoutExercises(workoutId)
  return wes.map(we => resolveExercise(we))
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string, order: number) {
  const { error } = await supabase.from('workout_exercises').insert({ workout_id: workoutId, exercise_id: exerciseId, order })
  if (error) throw error
}

export async function removeExerciseFromWorkout(workoutExerciseId: string) {
  await supabase.from('workout_exercises').delete().eq('id', workoutExerciseId)
}

export async function updateWorkoutExerciseOrder(items: { id: string; order: number }[]) {
  for (const item of items) {
    await supabase.from('workout_exercises').update({ order: item.order }).eq('id', item.id)
  }
}

// ── Client queries ──

export async function getClientMealPlan(): Promise<{ html: string; fileName: string } | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('meal_plans').select('*').eq('client_id', user.id).order('uploaded_at', { ascending: false }).limit(1).maybeSingle()
  return data ? { html: data.html, fileName: data.file_name } : null
}

// ── Admin: client management ──

export async function getClients(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').eq('role', 'client').order('full_name')
  return (data ?? []) as Profile[]
}

export async function getClientAssignedWorkoutIds(clientId: string): Promise<string[]> {
  const { data } = await supabase.from('client_workouts').select('workout_id').eq('client_id', clientId)
  return (data ?? []).map(r => r.workout_id)
}

export async function assignWorkout(clientId: string, workoutId: string) {
  await supabase.from('client_workouts').insert({ client_id: clientId, workout_id: workoutId })
}

export async function unassignWorkout(clientId: string, workoutId: string) {
  await supabase.from('client_workouts').delete().match({ client_id: clientId, workout_id: workoutId })
}

export async function getClientMealPlanAdmin(clientId: string): Promise<{ html: string; fileName: string } | null> {
  const { data } = await supabase.from('meal_plans').select('*').eq('client_id', clientId).order('uploaded_at', { ascending: false }).limit(1).maybeSingle()
  return data ? { html: data.html, fileName: data.file_name } : null
}

export async function uploadMealPlan(clientId: string, html: string, fileName: string) {
  await supabase.from('meal_plans').delete().eq('client_id', clientId)
  const { error } = await supabase.from('meal_plans').insert({ client_id: clientId, html, file_name: fileName })
  if (error) throw error
}

// ── Admin: invite client ──

export async function inviteClient(email: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
    body: JSON.stringify({ email })
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Greška pri slanju pozivnice')
}

// ── Admin: delete client ──

export async function deleteClient(clientId: string) {
  await supabase.from('body_weights').delete().eq('user_id', clientId)
  await supabase.from('cardio_logs').delete().eq('user_id', clientId)
  await supabase.from('set_logs').delete().eq('user_id', clientId)
  const { error } = await supabase.from('profiles').delete().eq('id', clientId)
  if (error) throw error
}

// ── Sync functions (client → Supabase, with offline queue) ──

import { syncOrQueue, deleteOrQueue } from './sync-queue'

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function syncSetLog(exerciseId: string, setIndex: number, weight: number, date: string, timestamp: number) {
  const uid = await getUserId(); if (!uid) return
  const match = { user_id: uid, exercise_id: exerciseId, date, set_index: setIndex }
  await syncOrQueue('set_logs', match, { ...match, weight, timestamp })
}

export async function syncCardioLog(exerciseId: string, duration: number, incline: number, speed: number, date: string, timestamp: number) {
  const uid = await getUserId(); if (!uid) return
  const match = { user_id: uid, exercise_id: exerciseId, date }
  await syncOrQueue('cardio_logs', match, { ...match, duration, incline, speed, timestamp })
}

export async function syncBodyWeight(weight: number, date: string, timestamp: number) {
  const uid = await getUserId(); if (!uid) return
  const match = { user_id: uid, date }
  await syncOrQueue('body_weights', match, { ...match, weight, timestamp })
}

export async function syncDeleteSessionLogs(exerciseIds: string[], date: string) {
  const uid = await getUserId(); if (!uid) return
  for (const eid of exerciseIds) {
    await deleteOrQueue('set_logs', { user_id: uid, exercise_id: eid, date })
    await deleteOrQueue('cardio_logs', { user_id: uid, exercise_id: eid, date })
  }
}

export async function syncUpdateSetLog(exerciseId: string, setIndex: number, weight: number, date: string, timestamp: number) {
  return syncSetLog(exerciseId, setIndex, weight, date, timestamp)
}

export async function syncUpdateCardioLog(exerciseId: string, duration: number, incline: number, speed: number, date: string, timestamp: number) {
  return syncCardioLog(exerciseId, duration, incline, speed, date, timestamp)
}

// ── Admin: read client logs ──

export async function getClientSetLogs(clientId: string): Promise<SetLog[]> {
  const { data } = await supabase.from('set_logs').select('*').eq('user_id', clientId).order('timestamp', { ascending: false })
  return (data ?? []).map(r => ({ id: r.id, exerciseId: r.exercise_id, setIndex: r.set_index, weight: Number(r.weight), date: r.date, timestamp: r.timestamp }))
}

export async function getClientCardioLogs(clientId: string): Promise<CardioLog[]> {
  const { data } = await supabase.from('cardio_logs').select('*').eq('user_id', clientId).order('timestamp', { ascending: false })
  return (data ?? []).map(r => ({ id: r.id, exerciseId: r.exercise_id, duration: r.duration, incline: Number(r.incline), speed: Number(r.speed), date: r.date, timestamp: r.timestamp }))
}

export async function getClientBodyWeights(clientId: string): Promise<BodyWeight[]> {
  const { data } = await supabase.from('body_weights').select('*').eq('user_id', clientId).order('date', { ascending: false })
  return (data ?? []).map(r => ({ id: r.id, weight: Number(r.weight), date: r.date, timestamp: r.timestamp }))
}

export async function getClientWorkoutLog(clientId: string): Promise<SessionEntry[]> {
  const workoutIds = await getClientAssignedWorkoutIds(clientId)
  const workouts: Workout[] = []; const allExercises: Exercise[] = []
  for (const wid of workoutIds) {
    const ws = await getAllWorkouts(); const w = ws.find(x => x.id === wid)
    if (w && !workouts.find(x => x.id === w.id)) { workouts.push(w); allExercises.push(...(await getExercises(wid))) }
  }
  return formatWorkoutLog(workouts, allExercises, await getClientSetLogs(clientId), await getClientCardioLogs(clientId))
}

export async function getClientWeeklySummary(clientId: string): Promise<string> {
  const workoutIds = await getClientAssignedWorkoutIds(clientId)
  const workouts: Workout[] = []; const allExercises: Exercise[] = []
  for (const wid of workoutIds) {
    const ws = await getAllWorkouts(); const w = ws.find(x => x.id === wid)
    if (w && !workouts.find(x => x.id === w.id)) { workouts.push(w); allExercises.push(...(await getExercises(wid))) }
  }
  return formatWeeklySummary(workouts, allExercises, await getClientSetLogs(clientId), await getClientCardioLogs(clientId), await getClientBodyWeights(clientId))
}

export async function getClientMonthlyReport(clientId: string, yearMonth: string): Promise<string> {
  const workoutIds = await getClientAssignedWorkoutIds(clientId)
  const workouts: Workout[] = []; const allExercises: Exercise[] = []
  for (const wid of workoutIds) {
    const ws = await getAllWorkouts(); const w = ws.find(x => x.id === wid)
    if (w && !workouts.find(x => x.id === w.id)) { workouts.push(w); allExercises.push(...(await getExercises(wid))) }
  }
  return formatMonthlyReport(yearMonth, workouts, allExercises, await getClientSetLogs(clientId), await getClientCardioLogs(clientId), await getClientBodyWeights(clientId))
}

// ── Mappers ──

function mapWorkout(row: any): Workout {
  return { id: row.id, name: row.name, order: row.order, createdAt: new Date(row.created_at).getTime() }
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id, workoutId: row.workout_id ?? undefined, name: row.name, order: row.order ?? 0,
    type: row.type, setsCount: row.sets_count, reps: row.reps, restSeconds: row.rest_seconds,
    notes: row.notes, videoUrl: row.video_url ?? null
  }
}

function mapWorkoutExercise(row: any): WorkoutExercise {
  return {
    id: row.id, workoutId: row.workout_id, exerciseId: row.exercise_id,
    order: row.order, exercise: mapExercise(row.exercises),
    setsCount: row.sets_count, reps: row.reps, restSeconds: row.rest_seconds, notes: row.notes
  }
}

// Resolve effective values (override or exercise default)
function resolveExercise(we: WorkoutExercise): Exercise {
  return {
    ...we.exercise,
    workoutId: we.workoutId,
    order: we.order,
    setsCount: we.setsCount ?? we.exercise.setsCount,
    reps: we.reps ?? we.exercise.reps,
    restSeconds: we.restSeconds ?? we.exercise.restSeconds,
    notes: we.notes ?? we.exercise.notes,
  }
}
