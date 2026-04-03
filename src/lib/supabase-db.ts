import supabase from './supabase'
import type { Exercise, Workout } from '../types'
import type { Profile } from '../contexts/AuthContext'

// ── Client queries ──

export async function getAssignedWorkouts(): Promise<Workout[]> {
  const { data } = await supabase.from('workouts').select('*').order('order')
  return (data ?? []).map(mapWorkout)
}

export async function getExercises(workoutId: string): Promise<Exercise[]> {
  const { data } = await supabase.from('exercises').select('*').eq('workout_id', workoutId).order('order')
  return (data ?? []).map(mapExercise)
}

export async function getClientMealPlan(): Promise<{ html: string; fileName: string } | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('meal_plans').select('*').eq('client_id', user.id).order('uploaded_at', { ascending: false }).limit(1).maybeSingle()
  return data ? { html: data.html, fileName: data.file_name } : null
}

// ── Admin queries ──

export async function getAllWorkouts(): Promise<Workout[]> {
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

export async function createExercise(data: Omit<Exercise, 'id'>): Promise<Exercise> {
  const { data: row, error } = await supabase.from('exercises').insert({
    workout_id: data.workoutId, name: data.name, order: data.order, type: data.type,
    sets_count: data.setsCount, reps: data.reps, rest_seconds: data.restSeconds, notes: data.notes
  }).select().single()
  if (error) throw error
  return mapExercise(row)
}

export async function updateExercise(ex: Exercise) {
  await supabase.from('exercises').update({
    name: ex.name, order: ex.order, type: ex.type, sets_count: ex.setsCount,
    reps: ex.reps, rest_seconds: ex.restSeconds, notes: ex.notes
  }).eq('id', ex.id)
}

export async function deleteExercise(id: string) {
  await supabase.from('exercises').delete().eq('id', id)
}

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
  // Delete old plans for this client, then insert new
  await supabase.from('meal_plans').delete().eq('client_id', clientId)
  const { error } = await supabase.from('meal_plans').insert({ client_id: clientId, html, file_name: fileName })
  if (error) throw error
}

// ── Mappers (snake_case → camelCase) ──

function mapWorkout(row: any): Workout {
  return { id: row.id, name: row.name, order: row.order, createdAt: new Date(row.created_at).getTime() }
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id, workoutId: row.workout_id, name: row.name, order: row.order,
    type: row.type, setsCount: row.sets_count, reps: row.reps, restSeconds: row.rest_seconds, notes: row.notes
  }
}
