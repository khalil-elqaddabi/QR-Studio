import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeCanvas } from './decode'

export type CameraStatus = 'idle' | 'starting' | 'active' | 'denied' | 'unsupported' | 'error'

const DECODE_INTERVAL_MS = 250

export function useCameraScanner(onResult: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number>(0)
  const lastDecodeRef = useRef(0)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const resultRef = useRef(onResult)
  resultRef.current = onResult

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (status === 'starting' || status === 'active') return
    setStatus('starting')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('unsupported')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) {
        for (const track of stream.getTracks()) track.stop()
        setStatus('idle')
        return
      }
      video.srcObject = stream
      await video.play()
      setStatus('active')

      const loop = (time: number) => {
        frameRef.current = requestAnimationFrame(loop)
        if (time - lastDecodeRef.current < DECODE_INTERVAL_MS) return
        lastDecodeRef.current = time
        const el = videoRef.current
        if (!el || el.readyState < 2 || el.videoWidth === 0) return
        const canvas = document.createElement('canvas')
        canvas.width = el.videoWidth
        canvas.height = el.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(el, 0, 0)
        const text = decodeCanvas(canvas)
        if (text) resultRef.current(text)
      }
      frameRef.current = requestAnimationFrame(loop)
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setStatus('denied')
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        setStatus('unsupported')
      } else if (error instanceof DOMException && error.name === 'NotReadableError') {
        setStatus('unsupported')
      } else {
        setStatus('error')
      }
    }
  }, [status])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      const stream = streamRef.current
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
      }
    }
  }, [])

  return { videoRef, status, start, stop }
}