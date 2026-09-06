'use client'

/**
 * Shared browser-side access to the YouTube IFrame API — the loader is used
 * both by the course player and by the CMS's duration detection, so there is
 * one script tag and one source of truth for "is the API ready".
 */

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null

export function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}

/**
 * Reads a video's real length via the official IFrame API — the same source
 * the player itself uses for playback, so if this can answer, playback works
 * too. Preferred over scraping the watch page: no HTML to parse, no risk of
 * silently breaking when YouTube's markup changes.
 *
 * Mounts a 1x1 off-screen player just long enough to read `getDuration()`,
 * then tears it down. Resolves 0 (never rejects) on error or timeout, so
 * callers can fall back to another method.
 */
export function getYouTubeDuration(videoId: string, timeoutMs = 8000): Promise<number> {
  return new Promise((resolve) => {
    let settled = false
    let player: any = null
    let host: HTMLDivElement | null = null

    const finish = (value: number) => {
      if (settled) return
      settled = true
      resolve(value)
      try {
        player?.destroy?.()
      } catch {
        // best-effort cleanup only
      }
      host?.remove()
    }

    const timer = setTimeout(() => finish(0), timeoutMs)

    loadYouTubeApi().then(() => {
      if (settled) return
      host = document.createElement('div')
      host.style.position = 'fixed'
      host.style.left = '-9999px'
      host.style.width = '1px'
      host.style.height = '1px'
      document.body.appendChild(host)

      player = new window.YT.Player(host, {
        videoId,
        events: {
          onReady: (e: any) => {
            clearTimeout(timer)
            finish(Math.round(e.target.getDuration() || 0))
          },
          onError: () => {
            clearTimeout(timer)
            finish(0)
          },
        },
      })
    })
  })
}
