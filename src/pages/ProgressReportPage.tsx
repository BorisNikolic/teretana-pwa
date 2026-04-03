import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMonthlyReport } from '../db'
import { tid } from '../lib/contact'

function getCurrentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTHS_SR = ['', 'januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

function formatYM(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTHS_SR[parseInt(m)]} ${y}`
}

export default function ProgressReportPage() {
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)
  const [report, setReport] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMonthlyReport(yearMonth).then(setReport)
  }, [yearMonth])

  const sendWhatsApp = () => {
    window.open(`https://wa.me/${tid()}?text=${encodeURIComponent(report)}`, '_blank')
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Napredak</h1>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-between px-4 mb-4">
        <button className="p-2 text-gray-400" onClick={() => setYearMonth(prev => shiftMonth(prev, -1))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold capitalize">{formatYM(yearMonth)}</span>
        <button className="p-2 text-gray-400" onClick={() => setYearMonth(prev => shiftMonth(prev, 1))}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="px-4 flex-1">
        {report.trim() ? (
          <pre className="bg-gray-900 rounded-2xl p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-500">
            <p>Nema podataka za ovaj mesec</p>
          </div>
        )}
      </div>

      {report.trim() && (
        <div className="px-4 py-6 flex flex-col gap-3">
          <button className="w-full py-3 rounded-xl bg-green-700 font-semibold flex items-center justify-center gap-2" onClick={sendWhatsApp}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.253-.15-2.866.852.852-2.866-.15-.253A8 8 0 1112 20z"/>
            </svg>
            Pošalji Marku
          </button>
          <button className={`w-full py-3 rounded-xl font-semibold ${copied ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-300'}`} onClick={copyText}>
            {copied ? 'Kopirano ✓' : 'Kopiraj tekst'}
          </button>
        </div>
      )}
    </div>
  )
}
