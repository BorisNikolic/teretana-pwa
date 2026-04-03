import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// lazy import to keep main bundle small
import { saveMealPlan, getMealPlan } from '../db'

export default function NutritionPage() {
  const navigate = useNavigate()
  const [html, setHtml] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { getMealPlan().then(p => { if (p) { setHtml(p.html); setFileName(p.fileName) }; setLoading(false) }) }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true)
    const buf = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.default.convertToHtml({ arrayBuffer: buf })
    await saveMealPlan(result.value, file.name)
    setHtml(result.value); setFileName(file.name); setLoading(false)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button className="text-blue-400 p-1 -ml-1" onClick={() => navigate('/')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold flex-1">Ishrana</h1>
        <button className="text-gray-400 p-1" onClick={() => fileRef.current?.click()}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
        </button>
      </div>
      <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleUpload} />

      <div className="flex-1 px-4 pb-8">
        {loading ? (
          <p className="text-gray-500 text-center py-16">Učitavanje...</p>
        ) : !html ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <p>Nema plana ishrane</p>
            <button className="py-3 px-6 rounded-xl bg-blue-600 font-semibold text-white" onClick={() => fileRef.current?.click()}>
              Učitaj .docx
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-4">{fileName}</p>
            <div className="meal-plan-content" dangerouslySetInnerHTML={{ __html: html }} />
          </>
        )}
      </div>
    </div>
  )
}
