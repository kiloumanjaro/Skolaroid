'use client';

import { useMemo } from 'react';

const HORIZON_TILE = 200;
const MIN = 1;
const MAX = 5;

export function useHorizonPattern(): number[] {
  return useMemo<number[]>(() => {
    let s = 0xc0ffee;
    const rand = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const pattern: number[] = [];
    let cur = 3;
    for (let i = 0; i < HORIZON_TILE; i++) {
      const r = rand();
      let delta: number;
      if (r < 0.38) delta = -1;
      else if (r < 0.76) delta = 1;
      else if (r < 0.88) delta = -2;
      else delta = 2;
      let next = cur + delta;
      if (next < MIN) next = cur + Math.abs(delta);
      if (next > MAX) next = cur - Math.abs(delta);
      next = Math.max(MIN, Math.min(MAX, next));
      if (next === cur) next = cur === MAX ? cur - 1 : cur + 1;
      pattern.push(next);
      cur = next;
    }

    while (Math.abs(pattern[0] - pattern[pattern.length - 1]) > 2) {
      const last = pattern.length - 1;
      pattern[last] += pattern[last] > pattern[0] ? -1 : 1;
    }

    if (pattern[pattern.length - 1] === pattern[0]) {
      pattern[pattern.length - 1] =
        pattern[pattern.length - 1] === MAX
          ? pattern[pattern.length - 1] - 1
          : pattern[pattern.length - 1] + 1;
    }

    return pattern;
  }, []);
}
