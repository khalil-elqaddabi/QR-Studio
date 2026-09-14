import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeCanvas } from './decode'
import {
  acquireVideoStream,
  classifyCameraError,
  isSecureContext,
  type CameraStatus,
} from './camera'

export type { CameraStatus } from './camera'

const DECODE_INTERVAL_MS = 250

export function useCameraScanner(onResult: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number>(0)
  const lastDecodeRef = useRef(0)
  const disposedRef = useRef(false)
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
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (status === 'starting' || status === 'active') return
    setStatus('starting')

    let stream: MediaStream
    try {
      stream = await acquireVideoStream(navigator.mediaDevices)
    } catch (error) {
      if (!disposedRef.current) setStatus(classifyCameraError(error))
      return
    }
    if (disposedRef.current) {
      for (const track of stream.getTracks()) track.stop()
      return
    }

    streamRef.current = stream
    const el = videoRef.current
    if (!el) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
      setStatus('idle')
      return
    }

    el.srcObject = stream
    el.autoplay = true
    el.muted = true
    try {
      await el.play()
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 0))
      try {
        await el.play()
      } catch (error) {
        for (const track of stream.getTracks()) track.stop()
        streamRef.current = null
        el.srcObject = null
        if (!disposedRef.current) setStatus(classifyCameraError(error))
        return
      }
    }
    if (disposedRef.current) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
      el.srcObject = null
      return
    }
    setStatus('active')

    lastDecodeRef.current = 0
    const loop = (time: number) => {
      frameRef.current = requestAnimationFrame(loop)
      if (time - lastDecodeRef.current < DECODE_INTERVAL_MS) return
      lastDecodeRef.current = time
      const frame = videoRef.current
      if (!frame || frame.readyState < 2 || frame.videoWidth === 0) return
      const canvas = document.createElement('canvas')
      canvas.width = frame.videoWidth
      canvas.height = frame.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(frame, 0, 0)
      const text = decodeCanvas(canvas)
      if (text) resultRef.current(text)
    }
    frameRef.current = requestAnimationFrame(loop)
  }, [status])

  useEffect(() => {
    disposedRef.current = false
    return () => {
      disposedRef.current = true
      cancelAnimationFrame(frameRef.current)
      const stream = streamRef.current
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
      }
      streamRef.current = null
    }
  }, [])

  return { videoRef, status, start, stop, secure: isSecureContext() }
}