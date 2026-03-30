import { useState, useEffect, useRef } from 'react'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const taskRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = (seconds: number) => {
    stop()
    setRemaining(seconds)
    taskRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          stop()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stop = () => {
    if (taskRef.current) {
      clearInterval(taskRef.current)
      taskRef.current = null
    }
    setRemaining(0)
  }

  useEffect(() => () => { stop() }, [])

  return { remaining, active: remaining > 0, start, stop }
}
