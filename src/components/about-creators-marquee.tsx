'use client';

import { motion } from 'framer-motion';

type AboutCreatorsMarqueeProps = {
  creators: string[];
};

export function AboutCreatorsMarquee({ creators }: AboutCreatorsMarqueeProps) {
  return (
    <div className="overflow-hidden border-y-2 border-black bg-[#e1d94e]">
      <motion.div
        className="flex w-max"
        animate={{ x: ['-50%', '0%'] }}
        transition={{
          duration: 18,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
        aria-label="Creators of this website"
      >
        {[0, 1].map((group) => (
          <div
            key={group}
            className="flex shrink-0 items-center py-5"
            aria-hidden={group > 0}
          >
            {creators.map((creator) => (
              <div
                key={`${group}-${creator}`}
                className="flex shrink-0 items-center gap-6 px-6 text-base font-semibold tracking-[0.16em] text-black sm:text-lg"
              >
                <span>{creator}</span>
                <span className="text-black/70">/</span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
