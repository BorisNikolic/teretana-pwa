import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Exercise, CardioLog } from '../types'
import { getExercises, getVideo, saveSetLog, getLastSessionWeights, saveCardioLog, getLastCardioLog, saveRecording, getTodayRecording, getPersonalRecord } from '../db'
import { useRestTimer } from '../hooks/useRestTimer'
import InfoCard from '../components/InfoCard'
import ExerciseHistory from '../components/ExerciseHistory'

export default function ExerciseDetailPage() {
  const { workoutId, exerciseId } = useParams<{ workoutId: string; exerciseId: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [pr, setPr] = useState(0)
  const [newPr, setNewPr] = useState(false)

  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [weights, setWeights] = useState<Record<number, string>>({})
  const [lastWeights, setLastWeights] = useState<Record<number, number>>({})
  const timer = useRestTimer()

  const [cardioDuration, setCardioDuration] = useState('')
  const [cardioIncline, setCardioIncline] = useState('')
  const [cardioSpeed, setCardioSpeed] = useState('')
  const [cardioSaved, setCardioSaved] = useState(false)
  const [lastCardio, setLastCardio] = useState<CardioLog | null>(null)

  const [recSrc, setRecSrc] = useState<string | null>(null)
  const [recBlob, setRecBlob] = useState<Blob | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!workoutId || !exerciseId) return
    // Reset state for new exercise
    setCompleted(new Set()); setWeights({}); setCardioDuration(''); setCardioSpeed(''); setCardioIncline(''); setCardioSaved(false); setNewPr(false); setRecSrc(null); setRecBlob(null)
    getExercises(workoutId).then(list => { setAllExercises(list); setExercise(list.find(e => e.id === exerciseId) ?? null) })
    getVideo(exerciseId).then(blob => { if (blob) setVideoSrc(URL.createObjectURL(blob)); else setVideoSrc(null) })
    getLastSessionWeights(exerciseId).then(setLastWeights)
    getLastCardioLog(exerciseId).then(setLastCardio)
    getPersonalRecord(exerciseId).then(setPr)
    getTodayRecording(exerciseId).then(rec => { if (rec) { setRecBlob(rec.blob); setRecSrc(URL.createObjectURL(rec.blob)) } })
    return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); if (recSrc) URL.revokeObjectURL(recSrc) }
  }, [exerciseId])

  const isCardio = (exercise?.type ?? 'strength') === 'cardio'
  const curIdx = allExercises.findIndex(e => e.id === exerciseId)
  const prevEx = curIdx > 0 ? allExercises[curIdx - 1] : null
  const nextEx = curIdx < allExercises.length - 1 ? allExercises[curIdx + 1] : null

  const toggleSet = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index); timer.stop() }
      else {
        next.add(index)
        const w = parseFloat(weights[index] ?? '') || 0
        saveSetLog(exerciseId!, index, w)
        if (w > pr) { setPr(w); setNewPr(true); setTimeout(() => setNewPr(false), 3000) }
        timer.start(exercise?.restSeconds ?? 60)
      }
      return next
    })
  }

  const handleRecord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await saveRecording(exerciseId!, file); setRecBlob(file)
    if (recSrc) URL.revokeObjectURL(recSrc); setRecSrc(URL.createObjectURL(file))
  }

  const handleShareRecording = async () => {
    if (!recBlob || !exercise) return
    const file = new File([recBlob], `${exercise.name}.mp4`, { type: recBlob.type || 'video/mp4' })
    try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: exercise.name }); return } } catch {}
    const url = URL.createObjectURL(recBlob); const a = document.createElement('a'); a.href = url; a.download = `${exercise.name}.mp4`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  if (!exercise) return null

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate(-1)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {prevEx && <button className="text-gray-500 p-1" onClick={() => navigate(`/workout/${workoutId}/exercise/${prevEx.id}`, { replace: true })}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>}
        <h1 className="text-lg font-bold flex-1 leading-tight text-center truncate">{exercise.name}</h1>
        {nextEx && <button className="text-gray-500 p-1" onClick={() => navigate(`/workout/${workoutId}/exercise/${nextEx.id}`, { replace: true })}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>}
        <button className="text-gray-400 p-1" onClick={() => setShowHistory(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* Exercise counter */}
      <div className="text-center text-xs text-gray-600 mb-2">{curIdx + 1} / {allExercises.length}</div>

      {/* Video */}
      {videoSrc ? (
        <video ref={videoRef} src={videoSrc} controls playsInline className="w-full aspect-video bg-black" />
      ) : (
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-gray-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </div>
      )}

      {/* PR badge */}
      {newPr && (
        <div className="mx-4 mt-3 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded-xl text-center text-sm font-semibold text-yellow-400">
          Novi lični rekord! {pr} kg
        </div>
      )}

      <div className="px-4 mt-4 space-y-4">
        {isCardio ? (
          <>
            <div className="flex gap-3"><InfoCard title="Tip" value="Kardio" /></div>
            {lastCardio && <p className="text-xs text-gray-600">Prošli put: {Math.round(lastCardio.duration / 60)}min, {lastCardio.speed} km/h, nagib {lastCardio.incline}%</p>}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><input type="number" inputMode="numeric" className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" placeholder={lastCardio ? `${Math.round(lastCardio.duration / 60)}` : '0'} value={cardioDuration} onChange={e => { setCardioDuration(e.target.value); setCardioSaved(false) }} /><span className="text-sm text-gray-400 w-8">min</span></div>
              <div className="flex items-center gap-2"><input type="number" inputMode="decimal" className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" placeholder={lastCardio ? `${lastCardio.speed}` : '0'} value={cardioSpeed} onChange={e => { setCardioSpeed(e.target.value); setCardioSaved(false) }} /><span className="text-sm text-gray-400 w-8">km/h</span></div>
              <div className="flex items-center gap-2"><input type="number" inputMode="decimal" className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" placeholder={lastCardio ? `${lastCardio.incline}` : '0'} value={cardioIncline} onChange={e => { setCardioIncline(e.target.value); setCardioSaved(false) }} /><span className="text-sm text-gray-400 w-8">%</span></div>
            </div>
            <button className={`w-full py-3 rounded-xl font-semibold ${cardioSaved ? 'bg-green-700 text-green-200' : 'bg-blue-600'}`} onClick={() => { saveCardioLog(exerciseId!, parseInt(cardioDuration) * 60 || 0, parseFloat(cardioIncline) || 0, parseFloat(cardioSpeed) || 0); setCardioSaved(true) }}>
              {cardioSaved ? 'Sačuvano ✓' : 'Sačuvaj'}
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <InfoCard title="Serije" value={String(exercise.setsCount)} />
              <InfoCard title="Ponavljanja" value={exercise.reps} />
              <InfoCard title="Pauza" value={`${exercise.restSeconds}s`} />
              {pr > 0 && <InfoCard title="PR" value={`${pr}kg`} />}
            </div>
            {exercise.notes && <p className="text-sm text-gray-400">{exercise.notes}</p>}
            {timer.active && (
              <div className="flex items-center gap-3 bg-blue-950 border border-blue-800 rounded-2xl px-4 py-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-bold tabular-nums">Pauza: {timer.remaining}s</span>
                <button className="ml-auto text-sm text-blue-300" onClick={timer.stop}>Preskoči</button>
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold mb-3">Serije</h2>
              <div className="flex flex-col gap-1">
                {Array.from({ length: exercise.setsCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <button className="shrink-0" onClick={() => toggleSet(i)}>
                      {completed.has(i) ? <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        : <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>}
                    </button>
                    <span className={`flex-1 text-base ${completed.has(i) ? 'text-gray-500' : ''}`}>Serija {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <input type="number" inputMode="decimal" value={weights[i] ?? ''} onChange={e => setWeights(p => ({ ...p, [i]: e.target.value }))} placeholder={lastWeights[i] ? String(lastWeights[i]) : '0'} className="w-16 bg-gray-800 rounded-lg px-2 py-1.5 text-right text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500" />
                      <span className="text-xs text-gray-500 w-5">kg</span>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(lastWeights).length > 0 && <p className="text-xs text-gray-600 mt-3">Prošli put: {Array.from({ length: exercise.setsCount }, (_, i) => lastWeights[i] ? `${lastWeights[i]}kg` : '—').join(' / ')}</p>}
            </div>
          </>
        )}

        {/* Recording */}
        <div className="border-t border-gray-800 pt-4">
          <h2 className="text-base font-semibold mb-3">Moj snimak</h2>
          {recSrc ? (
            <div className="space-y-3">
              <video src={recSrc} controls playsInline className="w-full rounded-2xl bg-black" />
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-green-700 font-semibold flex items-center justify-center gap-2" onClick={handleShareRecording}>Podeli</button>
                <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold" onClick={() => cameraRef.current?.click()}>Snimi ponovo</button>
              </div>
            </div>
          ) : (
            <button className="w-full py-4 rounded-2xl bg-gray-800 border border-gray-700 border-dashed flex items-center justify-center gap-3 text-gray-400" onClick={() => cameraRef.current?.click()}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
              Snimi se
            </button>
          )}
          <input ref={cameraRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleRecord} />
        </div>
      </div>
      {showHistory && <ExerciseHistory exerciseId={exercise.id} exerciseType={exercise.type ?? 'strength'} setsCount={exercise.setsCount} onClose={() => setShowHistory(false)} />}
    </div>
  )
}
