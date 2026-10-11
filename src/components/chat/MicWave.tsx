'use client';

import { useEffect, useRef } from 'react';

export function MicWave({ active, stream }: { active: boolean; stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active || !stream) {
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      return;
    }

    let cancelled = false;

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

        const timeDomain = new Uint8Array(analyser.fftSize);
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

        const BAR_COUNT = 48;
        // History of levels for a smooth sweeping waveform
        const history: number[] = new Array(BAR_COUNT).fill(0);

        const render = () => {
          if (cancelled || !analyserRef.current) return;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          draw.clearRect(0, 0, w, h);

          analyser.getByteTimeDomainData(timeDomain);

          // Compute RMS (root-mean-square) — a good proxy for loudness
          let sumSq = 0;
          for (let i = 0; i < timeDomain.length; i++) {
            const v = (timeDomain[i] - 128) / 128; // normalize to -1..1
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / timeDomain.length);
          // Amplify a bit — speech RMS is usually 0.02–0.15
          const level = Math.min(1, rms * 6);

          // Shift history and push new level
          history.shift();
          history.push(level);

          const barW = w / BAR_COUNT;
          for (let i = 0; i < BAR_COUNT; i++) {
            // Combine current level with history for a wave that trails
            const amp = history[i];
            const barH = Math.max(2, amp * (h - 4));
            const x = i * barW;
            const y = (h - barH) / 2;

            const grad = draw.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, 'rgba(124, 58, 237, 0.9)');   // brand-600
            grad.addColorStop(1, 'rgba(167, 139, 250, 0.35)'); // brand-400
            draw.fillStyle = grad;

            const r = Math.min(barW * 0.4, barH / 2, 3);
            draw.beginPath();
            draw.roundRect(x + barW * 0.15, y, barW * 0.7, barH, r);
            draw.fill();
          }

          rafRef.current = requestAnimationFrame(render);
        };
        render();
      } catch (e) {
        console.warn('[mic-wave] analyser init failed:', e);
      }
    })();

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
