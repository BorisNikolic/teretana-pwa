import { useEffect, useState } from 'react'
import { getSessionSummary } from '../db'

const MARKO_PHONE = '381644831056'

interface Props {
  workoutId: string
  onClose: () => void
}

export default function SessionSummary({ workoutId, onClose }: Props) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getSessionSummary(workoutId).then(setText)
  }, [workoutId])

  const sendWhatsApp = () => {
    window.open(`https://wa.me/${MARKO_PHONE}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Završen trening</h2>

        <pre className="bg-gray-800 rounded-2xl p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed mb-4">{text}</pre>

        <div className="flex flex-col gap-3">
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

          <button className="w-full py-3 rounded-xl bg-gray-800 text-gray-400" onClick={onClose}>Zatvori</button>
        </div>
      </div>
    </div>
  )
}
