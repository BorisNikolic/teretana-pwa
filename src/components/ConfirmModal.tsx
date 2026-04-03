import { useEscapeKey } from '../hooks/useEscapeKey'

interface Props {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ message, confirmLabel = 'Obriši', onConfirm, onCancel }: Props) {
  useEscapeKey(onCancel)
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={onCancel}>
      <div className="bg-gray-900 w-full rounded-t-2xl p-6 pb-10 overscroll-contain" onClick={e => e.stopPropagation()}>
        <p className="text-center text-white mb-6">{message}</p>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300" onClick={onCancel}>Otkaži</button>
          <button className="flex-1 py-3 rounded-xl bg-red-600 font-semibold" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
