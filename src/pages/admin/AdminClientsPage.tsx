import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients } from '../../lib/supabase-db'
import type { Profile } from '../../contexts/AuthContext'

export default function AdminClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getClients().then(c => { setClients(c); setLoading(false) }) }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Vežbači</h1>
      </div>
      <div className="flex-1 px-4 pb-8">
        {loading ? (
          <p className="text-gray-500 text-center py-16">Učitavanje...</p>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
            <p>Nema registrovanih vežbača</p>
            <p className="text-xs text-gray-600">Vežbači se registruju sami kroz app</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {clients.map(c => (
              <button key={c.id} className="bg-gray-900 rounded-2xl px-4 py-4 text-left flex items-center gap-3" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400">
                  {(c.full_name || c.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.full_name || 'Bez imena'}</div>
                  <div className="text-sm text-gray-500 truncate">{c.email}</div>
                </div>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
