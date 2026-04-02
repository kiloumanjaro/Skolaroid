'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface GalleryPolaroidProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  rotation?: string;
  offsetX?: string;
  offsetY?: string;
  zIndex?: number;
  onClick?: () => void;
}

export function GalleryPolaroid({
  src,
  alt,
  width,
  height,
  rotation = '0deg',
  offsetX = '0px',
  offsetY = '0px',
  zIndex = 1,
  onClick,
}: GalleryPolaroidProps) {
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        rotate: rotation,
        x: offsetX,
        y: offsetY,
        zIndex,
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
      <div
        className="border-2 border-border bg-card p-2 pb-12 shadow-[4px_4px_0px_0px_#2d2d2d]"
        style={{ width }}
      >
        <div
          className="relative overflow-hidden bg-secondary"
          style={{ height: height - 56 }}
        >
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      </div>
    </motion.div>
  );
}
