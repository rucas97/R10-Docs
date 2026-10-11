'use client';

// Pure-CSS animated wave — no microphone access needed.
// getUserMedia + SpeechRecognition conflict over the mic in every browser,
// so we don't touch the audio stream at all. This is decorative but reliable.

export function MicWave({ active }: { active: boolean }) {
  if (!active) return null;

  const bars = Array.from({ length: 28 });

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px] px-4"
      aria-hidden
    >
      {bars.map((_, i) => (
        <span
          key={i}
          className="mic-wave-bar w-[3px] rounded-full bg-gradient-to-t from-brand-400/40 via-brand-500 to-brand-600 dark:from-brand-600/50 dark:via-brand-400 dark:to-brand-300"
          style={{
            // Stagger so the peak travels from right → left (RTL sweep)
            animationDelay: `${(bars.length - i) * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}
