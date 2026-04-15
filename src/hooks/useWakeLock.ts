import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const lock = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    const request = async () => {
      try { lock.current = await navigator.wakeLock.request('screen') }
      catch { /* user denied or not supported */ }
    }

    const onVisibility = () => { if (document.visibilityState === 'visible') request() }

    request()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      lock.current?.release()
      lock.current = null
    }
  }, [])
}
