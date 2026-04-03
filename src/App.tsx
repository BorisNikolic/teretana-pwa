import { HashRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import AuthGuard from './components/AuthGuard'
import AdminGuard from './components/AdminGuard'
import LoginPage from './pages/LoginPage'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ProgressReportPage from './pages/ProgressReportPage'
import WorkoutLogPage from './pages/WorkoutLogPage'
import SettingsPage from './pages/SettingsPage'
import { initSyncQueue } from './lib/sync-queue'

const NutritionPage = lazy(() => import('./pages/NutritionPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminWorkoutsPage = lazy(() => import('./pages/admin/AdminWorkoutsPage'))
const AdminWorkoutDetailPage = lazy(() => import('./pages/admin/AdminWorkoutDetailPage'))
const AdminClientsPage = lazy(() => import('./pages/admin/AdminClientsPage'))
const AdminClientDetailPage = lazy(() => import('./pages/admin/AdminClientDetailPage'))
const AdminExerciseLibraryPage = lazy(() => import('./pages/admin/AdminExerciseLibraryPage'))

const Loading = () => <div className="flex items-center justify-center min-h-screen text-gray-500">Učitavanje...</div>

function RootRedirect() {
  const { isAdmin } = useAuth()
  return isAdmin
    ? <Suspense fallback={<Loading />}><AdminDashboard /></Suspense>
    : <WorkoutListPage />
}

function SyncInit() {
  useEffect(() => { initSyncQueue() }, [])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <SyncInit />
          <div className="min-h-screen bg-gray-950 text-white max-w-lg mx-auto">
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
                <Route path="/workout/:workoutId" element={<AuthGuard><WorkoutDetailPage /></AuthGuard>} />
                <Route path="/workout/:workoutId/exercise/:exerciseId" element={<AuthGuard><ExerciseDetailPage /></AuthGuard>} />
                <Route path="/progress" element={<AuthGuard><ProgressReportPage /></AuthGuard>} />
                <Route path="/log" element={<AuthGuard><WorkoutLogPage /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                <Route path="/ishrana" element={<AuthGuard><NutritionPage /></AuthGuard>} />
                <Route path="/admin" element={<AuthGuard><AdminGuard><AdminDashboard /></AdminGuard></AuthGuard>} />
                <Route path="/admin/exercises" element={<AuthGuard><AdminGuard><AdminExerciseLibraryPage /></AdminGuard></AuthGuard>} />
                <Route path="/admin/workouts" element={<AuthGuard><AdminGuard><AdminWorkoutsPage /></AdminGuard></AuthGuard>} />
                <Route path="/admin/workouts/:workoutId" element={<AuthGuard><AdminGuard><AdminWorkoutDetailPage /></AdminGuard></AuthGuard>} />
                <Route path="/admin/clients" element={<AuthGuard><AdminGuard><AdminClientsPage /></AdminGuard></AuthGuard>} />
                <Route path="/admin/clients/:clientId" element={<AuthGuard><AdminGuard><AdminClientDetailPage /></AdminGuard></AuthGuard>} />
              </Routes>
            </Suspense>
          </div>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
