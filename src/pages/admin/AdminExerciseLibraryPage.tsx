import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Exercise } from '../../types'
import { getAllExerciseLibrary, createLibraryExercise, updateLibraryExercise, deleteLibraryExercise, uploadExerciseVideo, deleteExerciseVideo } from '../../lib/supabase-db'
import AddExerciseModal, { type ExerciseFormData } from '../../components/AddExerciseModal'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'

export default function AdminExerciseLibraryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [deleting, setDeleting] = useState<Exercise | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = () => getAllExerciseLibrary().then(e => { setExercises(e); setLoading(false) }).catch(() => showToast('Greška pri učitavanju vežbi'))
  useEffect(() => { load() }, [])

  const filtered = search.trim()
    ? exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises

  const handleAdd = async (data: ExerciseFormData) => {
    try {
      const ex = await createLibraryExercise({ name: data.name, type: data.type, setsCount: data.setsCount, reps: data.reps, restSeconds: data.restSeconds, notes: data.notes })
      if (data.videoBlob) await uploadExerciseVideo(ex.id, data.videoBlob as File)
      setShowAdd(false); load()
    } catch { showToast('Greška pri kreiranju vežbe') }
  }

  const handleEdit = async (data: ExerciseFormData) => {
    if (!editing) return
    try {
      await updateLibraryExercise({ ...editing, name: data.name, type: data.type, setsCount: data.setsCount, reps: data.reps, restSeconds: data.restSeconds, notes: data.notes })
      setEditing(null); load()
    } catch { showToast('Greška pri izmeni vežbe') }
  }

  const handleDelete = async (ex: Exercise) => {
    try { await deleteLibraryExercise(ex.id); setDeleting(null); load() }
    catch { showToast('Greška pri brisanju vežbe') }
  }

  const handleVideoUpload = async (exerciseId: string, file: File) => {
    setUploadingId(exerciseId)
    try { await uploadExerciseVideo(exerciseId, file); load(); showToast('Video uploadovan', 'success') }
    catch { showToast('Greška pri uploadu videa') }
    finally { setUploadingId(null) }
  }

  const handleVideoDelete = async (exerciseId: string) => {
    try { await deleteExerciseVideo(exerciseId); load() }
    catch { showToast('Greška pri brisanju videa') }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Biblioteka vežbi</h1>
        <button className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center" onClick={() => setShowAdd(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {exercises.length > 0 && (
          <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Pretraži vežbe..." value={search} onChange={e => setSearch(e.target.value)} />
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-16">Učitavanje...</p>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
            <p>Nema vežbi u biblioteci</p>
            <p className="text-xs text-gray-600">Dodaj vežbe klikom na +</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nema rezultata za "{search}"</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(ex => (
              <div key={ex.id} className="bg-gray-900 rounded-2xl px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ex.name}</div>
                    <div className="text-sm text-gray-400">
                      {ex.type === 'cardio' ? 'Kardio' : `${ex.setsCount} × ${ex.reps}`}
                    </div>
                  </div>
                  <button className="text-gray-600 p-1" onClick={() => setEditing(ex)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button className="text-gray-600 p-1" onClick={() => setDeleting(ex)}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                {/* Video section */}
                <div className="mt-3">
                  {ex.videoUrl ? (
                    <div className="space-y-2">
                      <video src={ex.videoUrl} controls playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />
                      <button className="text-xs text-red-400" onClick={() => handleVideoDelete(ex.id)}>Obriši video</button>
                    </div>
                  ) : (
                    <button className="w-full py-2.5 rounded-xl bg-gray-800 text-sm text-gray-400 flex items-center justify-center gap-2" onClick={() => fileRefs.current[ex.id]?.click()} disabled={uploadingId === ex.id}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                      {uploadingId === ex.id ? 'Uploaduje se...' : 'Dodaj video'}
                    </button>
                  )}
                  <input ref={el => { fileRefs.current[ex.id] = el }} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(ex.id, f); e.target.value = '' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddExerciseModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editing && <AddExerciseModal editExercise={editing} onSave={handleEdit} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmModal message={`Obrisati "${deleting.name}"? Biće uklonjena iz svih treninga.`} onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
