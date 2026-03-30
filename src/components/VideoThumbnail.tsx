import { useEffect, useRef, useState } from 'react'
import { getVideo } from '../db'

interface Props { exerciseId: string; className?: string }

export default function VideoThumbnail({ exerciseId, className = '' }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let objectUrl: string | null = null

    getVideo(exerciseId).then(blob => {
      if (!blob) return
      objectUrl = URL.createObjectURL(blob)
      const video = document.createElement('video')
      video.src = objectUrl
      video.muted = true
      video.playsInline = true
      video.currentTime = 0.1
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas')
        canvas.width = 120
        canvas.height = 80
        canvas.getContext('2d')?.drawImage(video, 0, 0, 120, 80)
        setSrc(canvas.toDataURL())
        URL.revokeObjectURL(objectUrl!)
      }, { once: true })
      video.load()
    })

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [exerciseId])

  if (!src) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </div>
    )
  }

  return <img src={src} className={`object-cover rounded-lg ${className}`} ref={videoRef as never} />
}
