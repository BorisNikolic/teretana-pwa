import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface Toast { id: number; message: string; type: 'success' | 'error' }
interface ToastState { showToast: (message: string, type?: 'success' | 'error') => void }

const ToastContext = createContext<ToastState>({ showToast: () => {} })
export function useToast() { return useContext(ToastContext) }

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pt-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-auto animate-[fadeIn_0.2s] ${t.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
