import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpDone, setSignUpDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        setSignUpDone(true)
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err: any) { setError(err.message ?? 'Greška') }
    finally { setLoading(false) }
  }

  if (signUpDone) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <svg className="w-16 h-16 text-green-400 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <h2 className="text-xl font-bold mb-2">Nalog kreiran!</h2>
      <p className="text-gray-400 mb-6">Proveri email za potvrdu, pa se uloguj.</p>
      <button className="py-3 px-8 rounded-xl bg-blue-600 font-semibold" onClick={() => { setIsSignUp(false); setSignUpDone(false) }}>Uloguj se</button>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-3xl font-bold mb-2">Teretana</h1>
      <p className="text-gray-500 mb-8">{isSignUp ? 'Kreiraj nalog' : 'Uloguj se'}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {isSignUp && (
          <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Ime i prezime" value={fullName} onChange={e => setFullName(e.target.value)} />
        )}
        <input type="email" className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Lozinka" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40" disabled={loading || !email || !password || (isSignUp && !fullName)}>
          {loading ? 'Čekaj...' : isSignUp ? 'Registruj se' : 'Uloguj se'}
        </button>
      </form>

      <button className="mt-6 text-sm text-gray-400" onClick={() => { setIsSignUp(!isSignUp); setError('') }}>
        {isSignUp ? 'Već imaš nalog? Uloguj se' : 'Nemaš nalog? Registruj se'}
      </button>
    </div>
  )
}
