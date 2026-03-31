import { useState, useEffect, useRef } from 'react'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.3
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
    setTimeout(() => { osc.start; ctx.close() }, 500)
    // Double beep
    setTimeout(() => {
      try {
        const ctx2 = new AudioContext()
        const osc2 = ctx2.createOscillator()
        const gain2 = ctx2.createGain()
        osc2.type = 'sine'; osc2.frequency.value = 880; gain2.gain.value = 0.3
        osc2.connect(gain2).connect(ctx2.destination); osc2.start(); osc2.stop(ctx2.currentTime + 0.15)
        setTimeout(() => ctx2.close(), 500)
      } catch {}
    }, 200)
  } catch {}
  navigator.vibrate?.([200, 100, 200])
}

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
          playBeep()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stop = () => {
    if (taskRef.current) { clearInterval(taskRef.current); taskRef.current = null }
    setRemaining(0)
  }

  useEffect(() => () => { stop() }, [])

  return { remaining, active: remaining > 0, start, stop }
}
