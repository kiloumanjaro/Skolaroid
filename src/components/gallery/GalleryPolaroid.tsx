'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const TILT_TABLE = [3.2, -4.8, 5.1, -2.7, 4.3, -6.0, 2.5, -5.4] as const;

interface GalleryPolaroidProps {
  src: string;
  alt: string;
  index?: number;
  offsetX?: string;
  offsetY?: string;
  zIndex?: number;
  interactive?: boolean;
  onClick?: () => void;
  disableTilt?: boolean;
}

export function GalleryPolaroid({
  src,
  alt,
  index = 0,
  offsetX = '0px',
  offsetY = '0px',
  zIndex = 1,
  interactive = true,
  onClick,
  disableTilt = false,
}: GalleryPolaroidProps) {
  const tilt = useMemo(
    () =>
      disableTilt ? '0deg' : `${TILT_TABLE[index % TILT_TABLE.length]}deg`,
    [index, disableTilt]
  );

  return (
    <motion.div
      className={
        interactive ? 'absolute cursor-pointer' : 'absolute cursor-default'
      }
      style={{
        rotate: tilt,
        x: offsetX,
        y: offsetY,
        zIndex,
        width: 'var(--polaroid-base)',
      }}
      whileHover={{
        scale: 1.08,
        rotate: '0deg',
        zIndex: 50,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      }}
      whileTap={{
        scale: 1.05,
        transition: { duration: 0.15 },
      }}
      onClick={onClick}
    >
      <div className="border-2 border-border bg-card p-2 pb-12 shadow-[4px_4px_0px_0px_#2d2d2d]">
        <div
          className="relative overflow-hidden bg-secondary"
          style={{ aspectRatio: '7/10' }}
        >
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      </div>
    </motion.div>
  );
}
