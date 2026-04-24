// composables/useFingerprint.ts

/**
 * Email Attribution Hack: Device Fingerprinting
 *
 * Uses ThumbmarkJS (API version) to generate a unique persistent visitor identifier.
 * When an API key is provided, returns visitorId (server-persisted, high accuracy).
 * Falls back to the thumbmark hash (local, ~90% unique) if the API call fails.
 *
 * FALLBACK: If ThumbmarkJS fails entirely, generates a manual fingerprint using
 * Canvas + WebGL + Hardware signals. Much more stable than IP-based fingerprinting,
 * especially for mobile users with rotating cellular IPs.
 *
 * This fingerprint is used in the "email" field for Everflow
 * to enable cross-browser attribution matching.
 */

import { Thumbmark } from '@thumbmarkjs/thumbmarkjs'

export const useFingerprint = () => {
  /**
   * Fallback: Manual fingerprinting using Canvas + WebGL + Hardware signals
   * Much better than old IP-based approach - stable across network changes
   */
  const getManualFingerprint = async (): Promise<string> => {
    try {
      const signals: string[] = []

      // 1. Canvas Fingerprint (GPU + Font rendering)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = 200
        canvas.height = 50
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(0, 0, 100, 50)
        ctx.fillStyle = '#069'
        ctx.fillText('AltRx Fingerprint 🔒', 2, 2)
        signals.push(`canvas:${canvas.toDataURL().slice(0, 100)}`) // Truncate for length
      }

      // 2. WebGL Fingerprint (GPU vendor/renderer)
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          signals.push(`webgl:${vendor}|${renderer}`)
        }
      }

      // 3. Hardware Properties
      signals.push(`cpu:${navigator.hardwareConcurrency || 'unknown'}`)
      signals.push(`memory:${(navigator as any).deviceMemory || 'unknown'}`)
      signals.push(`touch:${navigator.maxTouchPoints || 0}`)

      // 4. Screen Properties
      signals.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`)
      signals.push(`pixelRatio:${window.devicePixelRatio || 1}`)
      signals.push(`avail:${screen.availWidth}x${screen.availHeight}`)

      // 5. Platform & Browser
      signals.push(`platform:${navigator.platform}`)
      signals.push(`vendor:${navigator.vendor}`)
      signals.push(`ua:${navigator.userAgent.slice(0, 100)}`) // Truncate UA

      // 6. Timezone & Language
      signals.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
      signals.push(`tzOffset:${new Date().getTimezoneOffset()}`)
      signals.push(`lang:${navigator.language}`)
      signals.push(`langs:${navigator.languages?.slice(0, 3).join(',') || ''}`)

      // 7. Audio Context (if available)
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        try {
          const AudioCtx = AudioContext || (window as any).webkitAudioContext
          const audioCtx = new AudioCtx()
          signals.push(`audio:${audioCtx.sampleRate}|${audioCtx.destination.maxChannelCount}`)
          audioCtx.close()
        } catch (e) {
          // Audio fingerprinting failed, skip
        }
      }

      // Combine all signals
      const combined = signals.join('||')
      
      // Create hash using crypto API
      let hash: string
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(combined)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 22)
      } else {
        // Fallback to base64 (truncated for reasonable length)
        hash = btoa(combined).replace(/[^a-zA-Z0-9]/g, '').slice(0, 22)
      }

      return `fp_fallback_${hash}`
    } catch (error) {
      console.error('[Fingerprint] Manual fingerprint error:', error)
      // Last resort fallback - use timestamp + random
      const emergency = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      console.warn('[Fingerprint] Using emergency fallback:', `fp_emergency_${emergency}`)
      return `fp_emergency_${emergency}`
    }
  }

  /**
   * Main fingerprint getter - tries ThumbmarkJS first, falls back to manual
   * ALWAYS returns a string (never null)
   */
  const getFingerprint = async (): Promise<string> => {
    const config = useRuntimeConfig()
    const apiKey = config.public.fingerprintApiKey

    try {
      const options = apiKey ? { api_key: String(apiKey) } : {}
      const t = new Thumbmark(options)

      // 5 second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ThumbmarkJS timeout after 5s')), 5000)
      )

      const result = await Promise.race([t.get(), timeoutPromise])

      // Use visitorId when API key is provided (server-persisted, high accuracy),
      // otherwise fall back to the local thumbmark hash (~90% unique)
      const id = result.visitorId || result.thumbmark

      if (!id) throw new Error('ThumbmarkJS returned no identifier')

      const fingerprint = `fp_${id}`
      console.log('[Fingerprint] Generated:', fingerprint, {
        source: result.visitorId ? 'visitorId (API)' : 'thumbmark (local)',
        visitorId: result.visitorId || null,
        thumbmark: result.thumbmark,
      })
      return fingerprint
    } catch (error) {
      console.warn('[Fingerprint] ThumbmarkJS failed, using manual fallback:', error)
      const fallback = await getManualFingerprint()
      console.log('[Fingerprint] Generated (manual fallback):', fallback)
      return fallback
    }
  }

  return {
    getFingerprint,
  }
}
