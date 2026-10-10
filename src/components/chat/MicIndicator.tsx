'use client';

export function MicIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-0.5 bg-rose-500 rounded-full animate-mic-bar"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
