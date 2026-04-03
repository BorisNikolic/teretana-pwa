import { HashRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ProgressReportPage from './pages/ProgressReportPage'
import WorkoutLogPage from './pages/WorkoutLogPage'
import SettingsPage from './pages/SettingsPage'
const NutritionPage = lazy(() => import('./pages/NutritionPage'))

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-950 text-white max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<WorkoutListPage />} />
          <Route path="/workout/:workoutId" element={<WorkoutDetailPage />} />
          <Route path="/workout/:workoutId/exercise/:exerciseId" element={<ExerciseDetailPage />} />
          <Route path="/progress" element={<ProgressReportPage />} />
          <Route path="/log" element={<WorkoutLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ishrana" element={<Suspense><NutritionPage /></Suspense>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
