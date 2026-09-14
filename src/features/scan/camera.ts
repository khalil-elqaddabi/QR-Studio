export type CameraStatus = 'idle' | 'starting' | 'active' | 'denied' | 'unsupported' | 'error'

/** True when the page runs in a secure context (HTTPS or localhost). */
export function isSecureContext(): boolean {
  return typeof window === 'undefined' || window.isSecureContext === true
}

/**
 * Opens a video stream, preferring the rear (environment) camera and falling
 * back to the platform default when the request cannot be satisfied.
 */
export async function acquireVideoStream(
  mediaDevices: MediaDevices | null | undefined,
): Promise<MediaStream> {
  if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
    throw new DOMException('Camera access requires a secure context (HTTPS).', 'SecurityError')
  }
  try {
    return await mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError')
    ) {
      return mediaDevices.getUserMedia({ video: true, audio: false })
    }
    throw error
  }
}

/** Maps a getUserMedia failure to a stable scanner status. */
export function classifyCameraError(error: unknown): CameraStatus {
  if (error instanceof TypeError) return 'unsupported'
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'denied'
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'unsupported'
      case 'NotReadableError':
      case 'TrackStartError':
        return 'error'
      case 'SecurityError':
      case 'TypeError':
        return 'unsupported'
      default:
        return 'error'
    }
  }
  return 'error'
}

/** User-facing message for the scanner's camera status. */
export function cameraStatusMessage(status: CameraStatus, secureContext: boolean): string {
  switch (status) {
    case 'denied':
      return 'Camera permission was denied.'
    case 'unsupported':
      return secureContext
        ? 'Camera isn’t available in this browser.'
        : 'Camera requires HTTPS to work.'
    case 'error':
      return 'Could not start the camera. It may be in use by another app.'
    default:
      return 'Use your camera to scan any QR code instantly.'
  }
}