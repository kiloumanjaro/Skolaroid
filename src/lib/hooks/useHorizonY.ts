'use client';

import { useEffect, useState } from 'react';

function computeHorizonY() {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const scale = Math.min(
    1,
    (window.innerHeight - 2 * rem) / 640,
    (window.innerWidth - 4 * rem) / 380
  );
  return Math.round(460 + 220 * scale);
}

export function useHorizonY(initial = 680) {
  const [horizonY, setHorizonY] = useState(initial);

  useEffect(() => {
    setHorizonY(computeHorizonY());
    const onResize = () => setHorizonY(computeHorizonY());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return horizonY;
}
