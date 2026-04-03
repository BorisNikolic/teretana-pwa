import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, deleteClient, inviteClient } from '../../lib/supabase-db'
import type { Profile } from '../../contexts/AuthContext'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'

function buildInviteMessage(email: string) {
  const link = `${window.location.origin}${import.meta.env.BASE_URL}#/login?mode=signup&email=${encodeURIComponent(email)}`
  return `Marko te poziva da koristiš app za trening. Registruj se ovde:\n${link}`
}

export default function AdminClientsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<Profile | null>(null)

  const load = () => getClients().then(c => { setClients(c); setLoading(false) }).catch(() => showToast('Greška pri učitavanju vežbača'))

  useEffect(() => { load() }, [])

  const filtered = search.trim()
    ? clients.filter(c => {
        const q = search.toLowerCase()
        return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      })
    : clients

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) return
    setSending(true)
    try {
      await inviteClient(inviteEmail.trim())
      showToast('Pozivnica poslata na ' + inviteEmail.trim(), 'success')
      setInviteEmail('')
    } catch (e: any) { showToast(e.message || 'Greška pri slanju pozivnice') }
    finally { setSending(false) }
  }

  const handleDelete = async (client: Profile) => {
    try {
      await deleteClient(client.id)
      setDeleting(null)
      load()
      showToast('Vežbač obrisan', 'success')
    } catch { showToast('Greška pri brisanju') }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/admin')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Vežbači</h1>
        <button className="text-sm bg-blue-600 px-4 py-2 rounded-xl font-semibold" onClick={() => { setInviteOpen(!inviteOpen); setInviteEmail(''); setCopied(false) }}>
          {inviteOpen ? 'Zatvori' : '+ Pozovi'}
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Invite section */}
        {inviteOpen && (
          <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-gray-400">Unesi email novog vežbača.</p>
            <div className="flex gap-2">
              <input type="email" className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none" placeholder="email@primer.com" value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setCopied(false) }} />
            </div>
            {inviteEmail.trim() && (
              <div className="space-y-2">
                {/* Email invite */}
                <button className="w-full py-3 rounded-xl bg-blue-600 font-semibold disabled:opacity-40 flex items-center justify-center gap-2" disabled={sending} onClick={handleEmailInvite}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  {sending ? 'Šalje se...' : 'Pošalji pozivnicu na email'}
                </button>
                {/* WhatsApp */}
                <button className="w-full py-3 rounded-xl bg-green-700 font-semibold flex items-center justify-center gap-2" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(buildInviteMessage(inviteEmail.trim()))}`, '_blank') }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.253-.15-2.866.852.852-2.866-.15-.253A8 8 0 1112 20z"/></svg>
                  Pošalji preko WhatsApp-a
                </button>
                {/* Copy */}
                <button className={`w-full py-3 rounded-xl font-semibold ${copied ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-300'}`} onClick={async () => { await navigator.clipboard.writeText(buildInviteMessage(inviteEmail.trim())); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                  {copied ? 'Kopirano ✓' : 'Kopiraj pozivnicu'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Search */}
        {clients.length > 0 && (
          <input className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" placeholder="Pretraži vežbače..." value={search} onChange={e => setSearch(e.target.value)} />
        )}

        {/* Client list */}
        {loading ? (
          <p className="text-gray-500 text-center py-16">Učitavanje...</p>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
            <p>Nema registrovanih vežbača</p>
            <p className="text-xs text-gray-600">Pozovi vežbače klikom na "+ Pozovi"</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nema rezultata za "{search}"</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-gray-900 rounded-2xl px-4 py-4 flex items-center gap-3">
                <button className="flex-1 flex items-center gap-3 text-left min-w-0" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400 shrink-0">
                    {(c.full_name || c.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.full_name || 'Bez imena'}</div>
                    <div className="text-sm text-gray-500 truncate">{c.email}</div>
                  </div>
                </button>
                <button className="text-gray-600 p-2 shrink-0" onClick={() => setDeleting(c)}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
                <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleting && <ConfirmModal message={`Obrisati ${deleting.full_name || deleting.email}? Svi treninzi i podaci će biti obrisani.`} onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
