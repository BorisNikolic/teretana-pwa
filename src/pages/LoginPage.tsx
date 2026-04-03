import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, resetPassword } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<'signup' | 'reset' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'signup') { await signUp(email, password, fullName); setDone('signup') }
      else if (mode === 'reset') { await resetPassword(email); setDone('reset') }
      else { await signIn(email, password); navigate('/') }
    } catch (err: any) { setError(err.message ?? 'Greška') }
    finally { setLoading(false) }
  }

  if (done === 'signup') return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <svg className="w-16 h-16 text-green-400 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <h2 className="text-xl font-bold mb-2">Nalog kreiran!</h2>
      <p className="text-gray-400 mb-6">Proveri email za potvrdu, pa se uloguj.</p>
      <button className="py-3 px-8 rounded-xl bg-blue-600 font-semibold" onClick={() => { setMode('login'); setDone(null) }}>Uloguj se</button>
    </div>
  )

  if (done === 'reset') return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <svg className="w-16 h-16 text-blue-400 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
      <h2 className="text-xl font-bold mb-2">Email poslat!</h2>
      <p className="text-gray-400 mb-6">Proveri inbox za link za resetovanje lozinke.</p>
      <button className="py-3 px-8 rounded-xl bg-blue-600 font-semibold" onClick={() => { setMode('login'); setDone(null) }}>Nazad na login</button>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-3xl font-bold mb-2">Teretana</h1>
      <p className="text-gray-500 mb-8">{mode === 'signup' ? 'Kreiraj nalog' : mode === 'reset' ? 'Resetuj lozinku' : 'Uloguj se'}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {mode === 'signup' && (
          <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Ime i prezime" value={fullName} onChange={e => setFullName(e.target.value)} />
        )}
        <input type="email" className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input type="password" className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Lozinka" value={password} onChange={e => setPassword(e.target.value)} />
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40" disabled={loading || !email || (mode !== 'reset' && !password) || (mode === 'signup' && !fullName)}>
          {loading ? 'Čekaj...' : mode === 'signup' ? 'Registruj se' : mode === 'reset' ? 'Pošalji reset link' : 'Uloguj se'}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2">
        {mode === 'login' && <button className="text-sm text-gray-500" onClick={() => { setMode('reset'); setError('') }}>Zaboravljena lozinka?</button>}
        <button className="text-sm text-gray-400" onClick={() => { setMode(mode === 'signup' ? 'login' : mode === 'reset' ? 'login' : 'signup'); setError('') }}>
          {mode === 'signup' ? 'Već imaš nalog? Uloguj se' : mode === 'reset' ? 'Nazad na login' : 'Nemaš nalog? Registruj se'}
        </button>
      </div>
    </div>
  )
}
