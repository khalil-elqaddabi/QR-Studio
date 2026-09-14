import { describe, expect, it } from 'vitest'
import {
  acquireVideoStream,
  cameraStatusMessage,
  classifyCameraError,
  isSecureContext,
} from './camera'

function fakeDevices(getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>): MediaDevices {
  return { getUserMedia } as MediaDevices
}

describe('acquireVideoStream', () => {
  it('requests ONLY the rear-facing camera by default', async () => {
    const calls: MediaStreamConstraints[] = []
    const devices = fakeDevices(async (constraints) => {
      calls.push(constraints)
      return {} as MediaStream
    })
    await acquireVideoStream(devices)
    expect(calls).toEqual([
      {
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      },
    ])
  })

  it('falls back to the platform default camera when the environment constraint is unsatisfiable', async () => {
    const calls: MediaStreamConstraints[] = []
    const devices = fakeDevices(async (constraints) => {
      calls.push(constraints)
      if (calls.length === 1) throw new DOMException('no such mode', 'OverconstrainedError')
      return {} as MediaStream
    })
    await expect(acquireVideoStream(devices)).resolves.toBeDefined()
    expect(calls[1]).toEqual({ video: true, audio: false })
  })

  it('falls back for the legacy ConstraintNotSatisfiedError name', async () => {
    const calls: MediaStreamConstraints[] = []
    const devices = fakeDevices(async (constraints) => {
      calls.push(constraints)
      if (calls.length === 1) throw new DOMException('nope', 'ConstraintNotSatisfiedError')
      return {} as MediaStream
    })
    await expect(acquireVideoStream(devices)).resolves.toBeDefined()
    expect(calls).toHaveLength(2)
  })

  it('rethrows errors that are not constraint errors', async () => {
    const error = new DOMException('blocked', 'NotAllowedError')
    const devices = fakeDevices(async () => {
      throw error
    })
    await expect(acquireVideoStream(devices)).rejects.toBe(error)
  })

  it('throws SecurityError when mediaDevices is unavailable (insecure context)', async () => {
    await expect(acquireVideoStream(undefined)).rejects.toMatchObject({ name: 'SecurityError' })
    await expect(acquireVideoStream(null)).rejects.toMatchObject({ name: 'SecurityError' })
  })
})

describe('classifyCameraError', () => {
  it('maps permission errors to denied', () => {
    expect(classifyCameraError(new DOMException('x', 'NotAllowedError'))).toBe('denied')
    expect(classifyCameraError(new DOMException('x', 'PermissionDeniedError'))).toBe('denied')
  })

  it('maps missing-camera errors to unsupported', () => {
    expect(classifyCameraError(new DOMException('x', 'NotFoundError'))).toBe('unsupported')
    expect(classifyCameraError(new DOMException('x', 'DevicesNotFoundError'))).toBe('unsupported')
    expect(classifyCameraError(new DOMException('x', 'SecurityError'))).toBe('unsupported')
    expect(classifyCameraError(new TypeError('bad constraints'))).toBe('unsupported')
  })

  it('maps in-use / busy cameras to error', () => {
    expect(classifyCameraError(new DOMException('x', 'NotReadableError'))).toBe('error')
    expect(classifyCameraError(new DOMException('x', 'TrackStartError'))).toBe('error')
  })

  it('maps constraint errors to error once the fallback has already failed', () => {
    expect(classifyCameraError(new DOMException('x', 'OverconstrainedError'))).toBe('error')
    expect(classifyCameraError(new DOMException('x', 'AbortError'))).toBe('error')
  })

  it('maps unknown and non-DOM failures to error', () => {
    expect(classifyCameraError(new Error('boom'))).toBe('error')
    expect(classifyCameraError('boom')).toBe('error')
    expect(classifyCameraError(undefined)).toBe('error')
  })
})

describe('cameraStatusMessage', () => {
  it('mentions HTTPS only on an insecure context for unsupported', () => {
    expect(cameraStatusMessage('unsupported', true)).toBe('Camera isn’t available in this browser.')
    expect(cameraStatusMessage('unsupported', false)).toBe('Camera requires HTTPS to work.')
  })

  it('explains the in-use case for a busy camera', () => {
    expect(cameraStatusMessage('error', true)).toContain('in use')
    expect(cameraStatusMessage('error', false)).toContain('in use')
  })

  it('keeps the idle / denied copy', () => {
    expect(cameraStatusMessage('idle', true)).toContain('Use your camera')
    expect(cameraStatusMessage('denied', true)).toBe('Camera permission was denied.')
  })
})

describe('isSecureContext', () => {
  it('defaults to a secure context outside a browser', () => {
    expect(isSecureContext()).toBe(true)
  })
})