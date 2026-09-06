'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { loadYouTubeApi } from '@/lib/youtube-client'

/**
 * Two playback engines, one set of controls and one set of learning rules.
 *
 * Both players hide their engine's native controls and render the shared strip
 * below, because "no skipping ahead until the module is finished" can only be
 * enforced against controls we own. Learners get exactly play/pause, volume,
 * and rewind; seeking forward is capped at the furthest point actually watched
 * until the module completes.
 */

/** How often playback position is reported upward, in seconds of playback. */
const REPORT_EVERY = 10
/** Slack when comparing a seek target against the watched ceiling. */
const SEEK_TOLERANCE = 0.75

const GREEN = 'var(--color-market-green-500)'
const UNPLAYED = 'var(--color-neutral-shade-100)'
/** Visible track thickness (px), painted thinner than the input's own box (h-4, matching
 *  the 16px thumb below) via background-size — so the thumb centers with no margin math. */
const TRACK_THICKNESS = 6

/** Two-tone gradient standing in for the native track, split at the played fraction,
 *  painted as a thin centered band so the input's box can be as tall as the thumb. */
const trackFill = (pct: number): CSSProperties => {
  const clamped = Math.min(Math.max(pct, 0), 100)
  return {
    backgroundImage: `linear-gradient(to right, ${GREEN} ${clamped}%, ${UNPLAYED} ${clamped}%)`,
    backgroundSize: `100% ${TRACK_THICKNESS}px`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}

/**
 * Fully custom range-input thumb via Tailwind arbitrary variants, inlined
 * directly on the element (utilities layer, always wins the cascade) rather
 * than a shared global class — a `.media-slider` class in globals.css was
 * silently losing to the browser's native styling. No margin offset is
 * needed for centering: the input's own box is h-4 (16px), matching the thumb.
 */
const SLIDER_THUMB_CLASSES =
  'appearance-none outline-none [-webkit-appearance:none] ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:[-webkit-appearance:none] [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-market-green-500 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-market-green-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0'

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

interface ControlsProps {
  playing: boolean
  current: number
  duration: number
  volume: number
  muted: boolean
  locked: boolean
  maxWatched: number
  disabled?: boolean
  onTogglePlay: () => void
  onSeek: (seconds: number) => void
  onVolume: (v: number) => void
  onToggleMute: () => void
}

function Controls({
  playing,
  current,
  duration,
  volume,
  muted,
  locked,
  maxWatched,
  disabled,
  onTogglePlay,
  onSeek,
  onVolume,
  onToggleMute,
}: ControlsProps) {
  const watchedPct = duration > 0 ? Math.min((maxWatched / duration) * 100, 100) : 0

  return (
    <>
      <div className="mt-3 flex items-center gap-3 px-1">
        <button
          id="video-toggle-play"
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? 'Jeda' : 'Putar'}
          className="w-9 h-9 shrink-0 rounded-full bg-market-green-500 hover:bg-market-green-600 text-white text-xs flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
        >
          {playing ? '❚❚' : '▶'}
        </button>

        <span className="text-[10px] tabular-nums text-slate-500 shrink-0 w-9">{fmt(current)}</span>

        <div className="relative flex-1 flex items-center h-4">
          {/* Ghost bar: how far ahead seeking is currently permitted. */}
          {locked && (
            <div
              className="absolute left-0 h-1.5 rounded-full bg-market-green-500/25 pointer-events-none"
              style={{ width: `${watchedPct}%` }}
            />
          )}
          <input
            id="video-seek"
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={current}
            disabled={disabled}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Posisi video"
            className={`relative w-full h-4 rounded-full cursor-pointer disabled:opacity-40 ${SLIDER_THUMB_CLASSES}`}
            style={trackFill(duration > 0 ? (current / duration) * 100 : 0)}
          />
        </div>

        <span className="text-[10px] tabular-nums text-slate-500 shrink-0 w-9">{fmt(duration)}</span>

        <button
          type="button"
          onClick={onToggleMute}
          disabled={disabled}
          aria-label={muted ? 'Bunyikan' : 'Bisukan'}
          className="shrink-0 text-slate-500 hover:text-market-green-600 transition-colors disabled:opacity-40 cursor-pointer"
        >
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          disabled={disabled}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label="Volume"
          className={`w-16 h-4 rounded-full cursor-pointer shrink-0 disabled:opacity-40 ${SLIDER_THUMB_CLASSES}`}
          style={trackFill(muted ? 0 : volume)}
        />
      </div>
    </>
  )
}

interface PlayerProps {
  resumeSeconds: number
  /** True while the module is unfinished — forward seeking is capped. */
  locked: boolean
  /** Reports position and, when known, the real media length. */
  onProgress: (seconds: number, observedDuration?: number) => void
  /** Title of the module after this one, if any — shown in the end-of-video overlay. */
  nextLessonTitle?: string
  /** Advances to the next module, called by the overlay's countdown or its click targets. */
  onNext?: () => void
}

const COUNTDOWN_SECONDS = 5

/** Shown over the video once it ends: counts down to the next module, or lets the
 *  learner jump straight there or stay put. */
function NextUpOverlay({
  nextLessonTitle,
  onNext,
  onCancel,
}: {
  nextLessonTitle: string
  onNext: () => void
  onCancel: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onNext()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  return (
    <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center gap-3 text-center px-6">
      <p className="text-[11px] text-white/60 uppercase tracking-wider font-bold">
        Modul berikutnya dalam {secondsLeft} detik
      </p>
      <button
        type="button"
        onClick={onNext}
        className="text-white font-bold text-sm sm:text-base hover:underline cursor-pointer"
      >
        {nextLessonTitle}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 text-white/60 text-xs hover:underline cursor-pointer"
      >
        Batal
      </button>
    </div>
  )
}

/** Shared playback state and the reporting throttle both engines need. */
function usePlaybackState(
  resumeSeconds: number,
  onProgress: (s: number, observedDuration?: number) => void
) {
  const maxWatchedRef = useRef(resumeSeconds || 0)
  const lastReportedRef = useRef(resumeSeconds || 0)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(resumeSeconds || 0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)

  // The observed length travels with every report so the server can correct a
  // stored duration that drifted from the real media.
  const durationRef = useRef(0)

  const report = (seconds: number, force = false) => {
    if (!force && seconds - lastReportedRef.current < REPORT_EVERY) return
    lastReportedRef.current = seconds
    onProgress(seconds, durationRef.current || undefined)
  }

  const advance = (t: number) => {
    setCurrent(t)
    if (t > maxWatchedRef.current) maxWatchedRef.current = t
    report(t)
  }

  const setDurationBoth = (d: number) => {
    durationRef.current = d
    setDuration(d)
  }

  return {
    maxWatchedRef,
    lastReportedRef,
    durationRef,
    setDurationBoth,
    playing,
    setPlaying,
    current,
    setCurrent,
    duration,
    setDuration,
    volume,
    setVolume,
    muted,
    setMuted,
    report,
    advance,
  }
}

// ─── Self-hosted file (R2 / S3 / Supabase) ───────────────────────────────────

export function FilePlayer({ src, resumeSeconds, locked, onProgress, nextLessonTitle, onNext }: PlayerProps & { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const s = usePlaybackState(resumeSeconds, onProgress)
  const [ready, setReady] = useState(false)
  const [ended, setEnded] = useState(false)

  // Flush on tab hide and unmount so closing mid-module keeps the position.
  useEffect(() => {
    const flush = () => {
      const v = videoRef.current
      if (v && v.currentTime > s.lastReportedRef.current) s.report(v.currentTime, true)
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const seekTo = (target: number) => {
    const v = videoRef.current
    if (!v) return
    const ceiling = locked ? s.maxWatchedRef.current : s.duration
    v.currentTime = Math.max(0, Math.min(target, ceiling))
    s.setCurrent(v.currentTime)
  }

  return (
    <div className="w-full">
      <div className="aspect-video w-full rounded bg-black overflow-hidden relative">
        <video
          id="lesson-video-player"
          ref={videoRef}
          src={src}
          // Native controls are off; the shared strip replaces them.
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          preload="metadata"
          onClick={() => (s.playing ? videoRef.current?.pause() : videoRef.current?.play())}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            s.setDurationBoth(v.duration || 0)
            s.setVolume(Math.round(v.volume * 100))
            if (resumeSeconds > 0 && v.duration && resumeSeconds < v.duration - 1) {
              v.currentTime = resumeSeconds
            }
            setReady(true)
          }}
          onPlay={() => s.setPlaying(true)}
          onPause={() => {
            s.setPlaying(false)
            const v = videoRef.current
            if (v) s.report(v.currentTime, true)
          }}
          onSeeking={(e) => {
            // Defence in depth: keyboard or OS-level seeking bypasses our slider.
            const v = e.currentTarget
            if (locked && v.currentTime > s.maxWatchedRef.current + SEEK_TOLERANCE) {
              v.currentTime = s.maxWatchedRef.current
            }
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            if (v.duration) s.advance(v.currentTime)
          }}
          onEnded={(e) => {
            s.report(e.currentTarget.currentTime, true)
            setEnded(true)
          }}
          className="w-full h-full object-contain cursor-pointer"
        />
        {ended && nextLessonTitle && onNext && (
          <NextUpOverlay nextLessonTitle={nextLessonTitle} onNext={onNext} onCancel={() => setEnded(false)} />
        )}
      </div>

      <Controls
        playing={s.playing}
        current={s.current}
        duration={s.duration}
        volume={s.volume}
        muted={s.muted}
        locked={locked}
        maxWatched={s.maxWatchedRef.current}
        disabled={!ready}
        onTogglePlay={() => (s.playing ? videoRef.current?.pause() : videoRef.current?.play())}
        onSeek={seekTo}
        onVolume={(v) => {
          const el = videoRef.current
          s.setVolume(v)
          if (!el) return
          el.volume = v / 100
          el.muted = v === 0
          s.setMuted(v === 0)
        }}
        onToggleMute={() => {
          const el = videoRef.current
          if (!el) return
          el.muted = !el.muted
          s.setMuted(el.muted)
        }}
      />
    </div>
  )
}

// ─── YouTube ─────────────────────────────────────────────────────────────────

/**
 * ponytail: enforcement here is advisory. Hidden controls stop casual skipping,
 * but a public or unlisted video can still be opened on youtube.com — which is
 * why paid, tier-gated content belongs on R2 instead.
 */
export function YouTubePlayer({
  videoId,
  resumeSeconds,
  locked,
  onProgress,
  nextLessonTitle,
  onNext,
}: PlayerProps & { videoId: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const s = usePlaybackState(resumeSeconds, onProgress)
  const [ready, setReady] = useState(false)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    let cancelled = false
    let poll: ReturnType<typeof setInterval> | null = null

    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          controls: 0, // ours replace these — the whole point
          disablekb: 1, // no arrow-key seeking
          modestbranding: 1,
          rel: 0, // no suggested videos at the end
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: (e: any) => {
            if (cancelled) return
            s.setDurationBoth(e.target.getDuration() || 0)
            s.setVolume(e.target.getVolume?.() ?? 100)
            if (resumeSeconds > 0) e.target.seekTo(resumeSeconds, true)
            setReady(true)
          },
          onStateChange: (e: any) => {
            const YT = window.YT
            s.setPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) {
              const d = playerRef.current?.getDuration?.() || 0
              s.maxWatchedRef.current = Math.max(s.maxWatchedRef.current, d)
              s.report(d, true)
              setEnded(true)
            }
            if (e.data === YT.PlayerState.PAUSED) {
              s.report(playerRef.current?.getCurrentTime?.() || 0, true)
            }
          },
        },
      })

      // The API has no timeupdate event, so position must be sampled.
      poll = setInterval(() => {
        const p = playerRef.current
        if (!p?.getCurrentTime) return
        s.advance(p.getCurrentTime() || 0)
      }, 500)
    })

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
      const p = playerRef.current
      if (p?.getCurrentTime) {
        const t = p.getCurrentTime() || 0
        if (t > s.lastReportedRef.current) onProgress(t, s.durationRef.current || undefined)
      }
      p?.destroy?.()
      playerRef.current = null
    }
    // videoId is keyed by the parent, so this mounts fresh per module.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  return (
    <div className="w-full">
      <div className="aspect-video w-full bg-black relative overflow-hidden rounded">
        {/* The API replaces this node with the iframe. */}
        <div ref={hostRef} className="w-full h-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-white/70 uppercase">Memuat video…</span>
          </div>
        )}
        {ended && nextLessonTitle && onNext && (
          <NextUpOverlay nextLessonTitle={nextLessonTitle} onNext={onNext} onCancel={() => setEnded(false)} />
        )}
      </div>

      <Controls
        playing={s.playing}
        current={s.current}
        duration={s.duration}
        volume={s.volume}
        muted={s.muted}
        locked={locked}
        maxWatched={s.maxWatchedRef.current}
        disabled={!ready}
        onTogglePlay={() => {
          const p = playerRef.current
          if (!p) return
          s.playing ? p.pauseVideo() : p.playVideo()
        }}
        onSeek={(target) => {
          const p = playerRef.current
          if (!p?.seekTo) return
          const ceiling = locked ? s.maxWatchedRef.current : s.duration
          const next = Math.max(0, Math.min(target, ceiling))
          p.seekTo(next, true)
          s.setCurrent(next)
        }}
        onVolume={(v) => {
          const p = playerRef.current
          s.setVolume(v)
          if (!p) return
          p.setVolume(v)
          if (v === 0) {
            p.mute()
            s.setMuted(true)
          } else if (s.muted) {
            p.unMute()
            s.setMuted(false)
          }
        }}
        onToggleMute={() => {
          const p = playerRef.current
          if (!p) return
          if (s.muted) {
            p.unMute()
            s.setMuted(false)
          } else {
            p.mute()
            s.setMuted(true)
          }
        }}
      />
    </div>
  )
}
