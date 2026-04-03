import type { Page } from '@playwright/test'

const SUPABASE_URL = 'https://fvjtklkcavzdaiivixkn.supabase.co'

const ADMIN_USER = { id: 'admin-uuid-1', email: 'admin@test.com', user_metadata: { full_name: 'Admin Marko' } }
const CLIENT_USER = { id: 'client-uuid-1', email: 'client@test.com', user_metadata: { full_name: 'Boro Klijent' } }

const ADMIN_PROFILE = { id: 'admin-uuid-1', email: 'admin@test.com', full_name: 'Admin Marko', role: 'admin', created_at: '2026-01-01T00:00:00Z' }
const CLIENT_PROFILE = { id: 'client-uuid-1', email: 'client@test.com', full_name: 'Boro Klijent', role: 'client', created_at: '2026-01-01T00:00:00Z' }

const WORKOUTS = [
  { id: 'w1', name: 'Push Day', order: 0, created_by: 'admin-uuid-1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'w2', name: 'Pull Day', order: 1, created_by: 'admin-uuid-1', created_at: '2026-01-01T00:00:00Z' },
]

const EXERCISES = [
  { id: 'e1', workout_id: 'w1', name: 'Bench Press', order: 0, type: 'strength', sets_count: 3, reps: '10', rest_seconds: 60, notes: 'Kontrolisano spuštanje', video_url: null },
  { id: 'e2', workout_id: 'w1', name: 'Trčanje', order: 1, type: 'cardio', sets_count: 1, reps: '1', rest_seconds: 0, notes: '', video_url: null },
  { id: 'e3', workout_id: 'w2', name: 'Lat Pulldown', order: 0, type: 'strength', sets_count: 4, reps: '12', rest_seconds: 90, notes: '', video_url: null },
]

const CLIENT_WORKOUTS = [
  { id: 'cw1', client_id: 'client-uuid-1', workout_id: 'w1', assigned_at: '2026-01-01T00:00:00Z' },
]

const MEAL_PLAN = { id: 'mp1', client_id: 'client-uuid-1', html: '<h2>Dan 1</h2><p>Doručak: Ovsena kaša</p><p>Ručak: Piletina sa rižom</p>', file_name: 'jelovnik.docx', uploaded_at: '2026-01-01T00:00:00Z' }

const SET_LOGS = [
  { id: 'sl1', user_id: 'client-uuid-1', exercise_id: 'e1', set_index: 0, weight: 80, date: '2026-04-01', timestamp: 1743500000000, created_at: '2026-04-01T10:00:00Z' },
  { id: 'sl2', user_id: 'client-uuid-1', exercise_id: 'e1', set_index: 1, weight: 85, date: '2026-04-01', timestamp: 1743500100000, created_at: '2026-04-01T10:01:00Z' },
  { id: 'sl3', user_id: 'client-uuid-1', exercise_id: 'e1', set_index: 2, weight: 90, date: '2026-04-01', timestamp: 1743500200000, created_at: '2026-04-01T10:02:00Z' },
]

const CARDIO_LOGS = [
  { id: 'cl1', user_id: 'client-uuid-1', exercise_id: 'e2', duration: 1200, incline: 3, speed: 8.5, date: '2026-04-01', timestamp: 1743501000000, created_at: '2026-04-01T10:10:00Z' },
]

const BODY_WEIGHTS = [
  { id: 'bw1', user_id: 'client-uuid-1', weight: 82, date: '2026-04-01', timestamp: 1743500000000, created_at: '2026-04-01T08:00:00Z' },
  { id: 'bw2', user_id: 'client-uuid-1', weight: 81.5, date: '2026-04-02', timestamp: 1743586400000, created_at: '2026-04-02T08:00:00Z' },
]

let currentUser: typeof ADMIN_USER | typeof CLIENT_USER | null = null

function matchUrl(url: string, table: string) { return url.includes(`/rest/v1/${table}`) }
function getParams(url: string) { return new URL(url).searchParams }

export async function setupMocks(page: Page, role: 'admin' | 'client') {
  currentUser = role === 'admin' ? ADMIN_USER : CLIENT_USER
  const profile = role === 'admin' ? ADMIN_PROFILE : CLIENT_PROFILE

  // Mock auth endpoints
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route, req) => {
    const url = req.url()

    if (url.includes('/token') || url.includes('/session')) {
      return route.fulfill({ json: { access_token: 'mock-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'mock-refresh', user: currentUser } })
    }
    if (url.includes('/user')) {
      return route.fulfill({ json: currentUser ? { ...currentUser, aud: 'authenticated', role: 'authenticated' } : null })
    }
    if (url.includes('/signup')) {
      return route.fulfill({ json: { id: 'new-user-uuid', email: 'new@test.com', user_metadata: {} } })
    }
    if (url.includes('/logout') || url.includes('/signout')) {
      currentUser = null
      return route.fulfill({ json: {} })
    }
    return route.fulfill({ json: {} })
  })

  // Mock REST API
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route, req) => {
    const url = req.url()
    const method = req.method()

    // Profiles
    if (matchUrl(url, 'profiles')) {
      if (url.includes('role=eq.client')) return route.fulfill({ json: [CLIENT_PROFILE] })
      if (url.includes(`id=eq.${currentUser?.id}`)) return route.fulfill({ json: profile })
      return route.fulfill({ json: [ADMIN_PROFILE, CLIENT_PROFILE] })
    }

    // Workouts
    if (matchUrl(url, 'workouts') && !matchUrl(url, 'client_workouts')) {
      if (method === 'POST') {
        const body = await req.postDataJSON?.() ?? {}
        return route.fulfill({ json: { id: 'w-new-' + Date.now(), ...body, created_at: new Date().toISOString() } })
      }
      if (method === 'DELETE') return route.fulfill({ json: {} })
      if (method === 'PATCH') return route.fulfill({ json: {} })
      return route.fulfill({ json: WORKOUTS })
    }

    // Exercises
    if (matchUrl(url, 'exercises')) {
      if (method === 'POST') {
        const body = await req.postDataJSON?.() ?? {}
        return route.fulfill({ json: { id: 'e-new-' + Date.now(), ...body } })
      }
      if (method === 'DELETE') return route.fulfill({ json: {} })
      if (method === 'PATCH') return route.fulfill({ json: {} })
      const wid = getParams(url).get('workout_id')
      if (wid) return route.fulfill({ json: EXERCISES.filter(e => e.workout_id === wid.replace('eq.', '')) })
      return route.fulfill({ json: EXERCISES })
    }

    // Client workouts
    if (matchUrl(url, 'client_workouts')) {
      if (method === 'POST') return route.fulfill({ json: { id: 'cw-new' } })
      if (method === 'DELETE') return route.fulfill({ json: {} })
      const cid = getParams(url).get('client_id')
      if (cid) return route.fulfill({ json: CLIENT_WORKOUTS.filter(cw => cw.client_id === cid.replace('eq.', '')) })
      return route.fulfill({ json: CLIENT_WORKOUTS })
    }

    // Meal plans
    if (matchUrl(url, 'meal_plans')) {
      if (method === 'POST') return route.fulfill({ json: {} })
      if (method === 'DELETE') return route.fulfill({ json: {} })
      return route.fulfill({ json: MEAL_PLAN })
    }

    // Set logs
    if (matchUrl(url, 'set_logs')) {
      if (method === 'POST') return route.fulfill({ json: {} })
      if (method === 'DELETE') return route.fulfill({ json: {} })
      return route.fulfill({ json: SET_LOGS })
    }

    // Cardio logs
    if (matchUrl(url, 'cardio_logs')) {
      if (method === 'POST') return route.fulfill({ json: {} })
      if (method === 'DELETE') return route.fulfill({ json: {} })
      return route.fulfill({ json: CARDIO_LOGS })
    }

    // Body weights
    if (matchUrl(url, 'body_weights')) {
      if (method === 'POST') return route.fulfill({ json: {} })
      if (method === 'DELETE') return route.fulfill({ json: {} })
      return route.fulfill({ json: BODY_WEIGHTS })
    }

    return route.fulfill({ json: [] })
  })

  // Inject mock auth session into localStorage before page loads
  await page.addInitScript((args) => {
    const { supabaseUrl, user, token } = args
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
    const session = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh',
      user: { ...user, aud: 'authenticated', role: 'authenticated' }
    }
    localStorage.setItem(storageKey, JSON.stringify(session))
  }, { supabaseUrl: SUPABASE_URL, user: currentUser, token: 'mock-token' })
}
