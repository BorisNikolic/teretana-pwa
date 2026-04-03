import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-4 pt-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-gray-500">{profile?.full_name || profile?.email}</p>
        </div>
        <button className="text-sm text-gray-400 px-3 py-1.5 rounded-lg bg-gray-800" onClick={signOut}>Odjavi se</button>
      </div>

      <div className="flex-1 px-4 pb-8 space-y-3">
        <button className="w-full bg-gray-900 rounded-2xl px-4 py-5 text-left flex items-center gap-4" onClick={() => navigate('/admin/workouts')}>
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
          <div>
            <div className="font-semibold text-lg">Treninzi</div>
            <div className="text-sm text-gray-500">Kreiraj i upravljaj programima</div>
          </div>
        </button>

        <button className="w-full bg-gray-900 rounded-2xl px-4 py-5 text-left flex items-center gap-4" onClick={() => navigate('/admin/clients')}>
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          <div>
            <div className="font-semibold text-lg">Vežbači</div>
            <div className="text-sm text-gray-500">Dodeli treninge i ishranu</div>
          </div>
        </button>
      </div>
    </div>
  )
}
