'use client';

import { Mic } from 'lucide-react';

export function MicCircle({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <span className="absolute w-12 h-12 rounded-full bg-brand-500/30 animate-ping-slow" />
        <span className="absolute w-12 h-12 rounded-full bg-brand-500/20 animate-ping-slower" />
        {/* Center circle */}
        <span className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/40">
          <Mic className="w-5 h-5" />
        </span>
      </div>
    </div>
  );
}
