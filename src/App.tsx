import { HashRouter, Routes, Route } from 'react-router-dom'
import WorkoutListPage from './pages/WorkoutListPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-950 text-white max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<WorkoutListPage />} />
          <Route path="/workout/:workoutId" element={<WorkoutDetailPage />} />
          <Route path="/workout/:workoutId/exercise/:exerciseId" element={<ExerciseDetailPage />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
