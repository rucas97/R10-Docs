'use client';

// Two modes:
//   1. Real audio-reactive wave (desktop, when stream is provided)
//   2. CSS-animated fallback (Android or when getUserMedia is unavailable)
//
// We never call getUserMedia inside this component — the parent decides.

export function MicWave({ active, stream }: { active: boolean; stream: MediaStream | null }) {
  if (!active) return null;

  // CSS-animated fallback
  if (!stream || stream.getAudioTracks().length === 0) {
    const bars = Array.from({ length: 24 });
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px] px-6" aria-hidden>
        {bars.map((_, i) => (
          <span
            key={i}
            className="mic-wave-bar w-[3px] rounded-full bg-gradient-to-t from-brand-400/50 via-brand-500 to-brand-600 dark:from-brand-600/50 dark:via-brand-400 dark:to-brand-300"
            style={{ animationDelay: `${(bars.length - i) * 0.05}s` }}
          />
        ))}
      </div>
    );
  }

  // Real audio-reactive wave
  return <ReactiveWave stream={stream} />;
}

// ---- Real audio-reactive wave (unchanged) ----
import { useEffect, useRef } from 'react';

function ReactiveWave({ stream }: { stream: MediaStream }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = canvas.getContext('2d');
    if (!draw) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      draw.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    (async () => {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        analyserRef.current = analyser;
      } catch (e) {
        console.warn('[mic-wave] analyser failed:', e);
      }
    })();

    const timeDomain = new Uint8Array(256);
    const BAR_COUNT = 32;
    const history: number[] = new Array(BAR_COUNT).fill(0);

    const render = () => {
      if (cancelled) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      draw.clearRect(0, 0, w, h);

      let level = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(timeDomain);
        let sumSq = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          const v = (timeDomain[i] - 128) / 128;
          sumSq += v * v;
        }
        level = Math.min(1, Math.sqrt(sumSq / timeDomain.length) * 6);
      }

      history.shift();
      history.push(level);

      const barW = w / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const amp = history[i];
        const barH = Math.max(2, amp * (h - 4));
        const x = i * barW;
        const y = (h - barH) / 2;
        const grad = draw.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.9)');
        grad.addColorStop(1, 'rgba(167, 139, 250, 0.35)');
        draw.fillStyle = grad;
        const r = Math.min(barW * 0.4, barH / 2, 3);
        draw.beginPath();
        draw.roundRect(x + barW * 0.15, y, barW * 0.7, barH, r);
        draw.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full rounded-3xl opacity-70"
      aria-hidden
    />
  );
}
