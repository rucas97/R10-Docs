'use client';

import { useEffect, useState } from 'react';

export type Prefs = {
  sendSide: 'left' | 'right';
};

const DEFAULTS: Prefs = {
  sendSide: 'left', // RTL default — send on the left
};

const KEY = 'r10_prefs';
const EVT = 'r10_prefs_changed';

export function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function savePrefs(p: Partial<Prefs>) {
  const current = loadPrefs();
  const next = { ...current, ...p };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new CustomEvent(EVT));
}

export function usePrefs(): Prefs {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(loadPrefs());
    const onChange = () => setPrefs(loadPrefs());
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return prefs;
}
