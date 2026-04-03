import { HashRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'
import AdminGuard from './components/AdminGuard'
import LoginPage from './pages/LoginPage'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ProgressReportPage from './pages/ProgressReportPage'
import WorkoutLogPage from './pages/WorkoutLogPage'
import SettingsPage from './pages/SettingsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminWorkoutsPage from './pages/admin/AdminWorkoutsPage'
import AdminWorkoutDetailPage from './pages/admin/AdminWorkoutDetailPage'
import AdminClientsPage from './pages/admin/AdminClientsPage'
import AdminClientDetailPage from './pages/admin/AdminClientDetailPage'
const NutritionPage = lazy(() => import('./pages/NutritionPage'))

function RootRedirect() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <WorkoutListPage />
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-950 text-white max-w-lg mx-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />
            <Route path="/workout/:workoutId" element={<AuthGuard><WorkoutDetailPage /></AuthGuard>} />
            <Route path="/workout/:workoutId/exercise/:exerciseId" element={<AuthGuard><ExerciseDetailPage /></AuthGuard>} />
            <Route path="/progress" element={<AuthGuard><ProgressReportPage /></AuthGuard>} />
            <Route path="/log" element={<AuthGuard><WorkoutLogPage /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
            <Route path="/ishrana" element={<AuthGuard><Suspense><NutritionPage /></Suspense></AuthGuard>} />
            <Route path="/admin" element={<AuthGuard><AdminGuard><AdminDashboard /></AdminGuard></AuthGuard>} />
            <Route path="/admin/workouts" element={<AuthGuard><AdminGuard><AdminWorkoutsPage /></AdminGuard></AuthGuard>} />
            <Route path="/admin/workouts/:workoutId" element={<AuthGuard><AdminGuard><AdminWorkoutDetailPage /></AdminGuard></AuthGuard>} />
            <Route path="/admin/clients" element={<AuthGuard><AdminGuard><AdminClientsPage /></AdminGuard></AuthGuard>} />
            <Route path="/admin/clients/:clientId" element={<AuthGuard><AdminGuard><AdminClientDetailPage /></AdminGuard></AuthGuard>} />
          </Routes>
        </div>
      </AuthProvider>
    </HashRouter>
  )
}
