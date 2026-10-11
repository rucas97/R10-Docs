'use client';

import { useEffect, useRef } from 'react';

export function MicWave({ active, stream }: { active: boolean; stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      return;
    }

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

    const BAR_COUNT = 32;
    const history: number[] = new Array(BAR_COUNT).fill(0);

    // If we have a real stream, wire the analyser.
    if (stream && stream.getAudioTracks().length > 0) {
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
          console.log('[mic-wave] analyser attached');
        } catch (e) {
          console.warn('[mic-wave] analyser failed, using CSS fallback:', e);
        }
      })();
    }

    const timeDomain = new Uint8Array(256);

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
        const rms = Math.sqrt(sumSq / timeDomain.length);
        level = Math.min(1, rms * 6);
      } else {
        // CSS fallback — animated pattern so user sees "recording"
        phaseRef.current += 0.06;
        level = 0.4 + 0.35 * Math.sin(phaseRef.current * 1.3);
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
  }, [active, stream]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full rounded-3xl opacity-70"
      aria-hidden
    />
  );
}
