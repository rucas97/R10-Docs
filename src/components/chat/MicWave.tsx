'use client';

import { useEffect, useRef } from 'react';

export function MicWave({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!active) {
      // Cleanup
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      streamRef.current = null;
      audioCtxRef.current = null;
      analyserRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const draw = canvas.getContext('2d');
        if (!draw) return;

        const resize = () => {
          const r = canvas.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = r.width * dpr;
          canvas.height = r.height * dpr;
          draw.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const BAR_COUNT = 40;

        const render = () => {
          if (cancelled || !analyserRef.current) return;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          draw.clearRect(0, 0, w, h);

          analyser.getByteFrequencyData(data);
          // Overall loudness
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const level = Math.min(1, sum / data.length / 90);

          // Traveling envelope: a moving hump that sweeps L→R
          phaseRef.current += 0.03;
          const travel = phaseRef.current % 1;

          const barW = w / BAR_COUNT;
          for (let i = 0; i < BAR_COUNT; i++) {
            const x = i * barW;
            // Distance from the traveling peak
            const dist = Math.abs((i / BAR_COUNT) - travel);
            const envelope = Math.max(0, 1 - dist * 3);
            // Combine voice level with sweeping envelope + light noise
            const amp = level * envelope * (0.6 + 0.4 * Math.sin(i * 0.7));
            const barH = Math.max(2, amp * (h - 4));
            const y = (h - barH) / 2;

            const grad = draw.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, 'rgba(244, 63, 94, 0.9)');
            grad.addColorStop(1, 'rgba(244, 63, 94, 0.35)');
            draw.fillStyle = grad;

            const r = barW * 0.25;
            draw.beginPath();
            draw.roundRect(x + barW * 0.15, y, barW * 0.7, barH, r);
            draw.fill();
          }

          rafRef.current = requestAnimationFrame(render);
        };
        render();
      } catch (e) {
        console.warn('[mic] getUserMedia failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-x-0 bottom-0 top-0 w-full h-full rounded-3xl"
      aria-hidden
    />
  );
}
