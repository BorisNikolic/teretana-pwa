import { useEffect, useRef, useState } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const onTouchStart = (e: TouchEvent) => {
      if (root.scrollTop <= 0) { startY.current = e.touches[0].clientY; pulling.current = true }
    }
    const onTouchEnd = async (e: TouchEvent) => {
      if (!pulling.current) return
      pulling.current = false
      const diff = e.changedTouches[0].clientY - startY.current
      if (diff > 80) { setRefreshing(true); await onRefresh(); setRefreshing(false) }
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchend', onTouchEnd)
    return () => { root.removeEventListener('touchstart', onTouchStart); root.removeEventListener('touchend', onTouchEnd) }
  }, [onRefresh])

  return refreshing
}
