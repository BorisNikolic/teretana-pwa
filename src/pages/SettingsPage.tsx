import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveBodyWeight, getBodyWeights, getWeeklySummary } from '../db'
import { getAssignedWorkouts, getExercises } from '../lib/supabase-db'
import type { BodyWeight, Workout, Exercise } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { tid } from '../lib/contact'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { showToast } = useToast()
  const [bw, setBw] = useState('')
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([])
  const [bwSaved, setBwSaved] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])

  useEffect(() => { getBodyWeights().then(setBodyWeights) }, [bwSaved])
  useEffect(() => {
    getAssignedWorkouts().then(async ws => {
      const exs: Exercise[] = []
      for (const w of ws) exs.push(...(await getExercises(w.id)))
      setWorkouts(ws); setAllExercises(exs)
    }).catch(() => showToast('Greška pri učitavanju podataka'))
  }, [showToast])

  const handleSaveBw = async () => {
    const w = parseFloat(bw); if (!w) return
    await saveBodyWeight(w); setBwSaved(true); setBw('')
    setTimeout(() => setBwSaved(false), 2000)
  }

  const handleWeekly = async () => {
    if (weeklySummary) { setWeeklySummary(null); return }
    setWeeklySummary(await getWeeklySummary(workouts, allExercises))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Podešavanja</h1>
      </div>

      <div className="px-4 space-y-6 pb-10">
        {/* User info */}
        <section className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{profile?.full_name || 'Korisnik'}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          <button className="text-sm text-red-400 px-3 py-1.5 rounded-lg bg-gray-800" onClick={signOut}>Odjavi se</button>
        </section>

        {/* Body weight */}
        <section>
          <h2 className="text-base font-semibold mb-3">Telesna težina</h2>
          <div className="flex gap-3">
            <input type="number" inputMode="decimal" className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" placeholder={bodyWeights[0] ? `${bodyWeights[0].weight}` : 'kg'} value={bw} onChange={e => setBw(e.target.value)} />
            <button className={`px-6 rounded-xl font-semibold ${bwSaved ? 'bg-green-700 text-green-200' : 'bg-blue-600'}`} onClick={handleSaveBw}>
              {bwSaved ? '✓' : 'Sačuvaj'}
            </button>
          </div>
          {bodyWeights.length > 0 && (
            <div className="mt-3 space-y-1">
              {bodyWeights.slice(0, 10).map(b => (
                <div key={b.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{fmtDate(b.date)}</span>
                  <span className="font-semibold">{b.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly summary */}
        <section>
          <h2 className="text-base font-semibold mb-3">Nedeljni izveštaj</h2>
          <button className="w-full py-3 rounded-xl bg-gray-800 font-semibold text-gray-300" onClick={handleWeekly}>
            {weeklySummary ? 'Zatvori' : 'Generiši nedeljni pregled'}
          </button>
          {weeklySummary && (
            <div className="mt-3 space-y-3">
              <pre className="bg-gray-900 rounded-2xl p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed">{weeklySummary}</pre>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-green-700 font-semibold" onClick={() => window.open(`https://wa.me/${tid()}?text=${encodeURIComponent(weeklySummary)}`, '_blank')}>
                  Pošalji Marku
                </button>
                <button className={`flex-1 py-3 rounded-xl font-semibold ${copied ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-300'}`} onClick={async () => { await navigator.clipboard.writeText(weeklySummary); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                  {copied ? 'Kopirano ✓' : 'Kopiraj'}
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

function fmtDate(s: string) { const [y, m, d] = s.split('-'); return `${+d}. ${+m}. ${y}.` }
