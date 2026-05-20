'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import {
  coverLeftVariants,
  coverRightVariants,
  rightPageFlipVariants,
  leftPageFlipVariants,
  chevronVariants,
} from './memory-modal-animations';
import { MemoryNotebookPageContent } from './MemoryNotebookPageContent';

const BOOK_WIDTH = 968;
const BOOK_HEIGHT = 650;
const PAGE_WIDTH = 472;
const BOOK_INNER_PADDING = 8;
const NOTEBOOK_BORDER_COLOR = '#2d2d2d';
const NOTEBOOK_COVER_COLOR = '#91a8ec';
const NOTEBOOK_SPRING_COLOR = '#d9d9d9';
const NOTEBOOK_SPRING_BORDER_COLOR = '#2b2b2b';
const NOTEBOOK_SPINE_RING_WIDTH = 26;
const NOTEBOOK_SPINE_RING_HEIGHT = 14;
const NOTEBOOK_SPINE_CONNECTOR_WIDTH = 18;

const PAGE_BASE_STYLES =
  'flex flex-col gap-3.5 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const PAGE_FACE_STYLES =
  'absolute top-0 left-0 flex h-full w-full flex-col gap-3.5 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const NotebookSpineConnectors = () => (
  <div
    className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 flex-col justify-around py-[18px]"
    style={{ width: `${NOTEBOOK_SPINE_CONNECTOR_WIDTH}px` }}
    aria-hidden="true"
  >
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center justify-center">
        <div
          className="w-full border-y-2"
          style={{
            height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
            borderColor: NOTEBOOK_BORDER_COLOR,
            backgroundColor: NOTEBOOK_SPRING_COLOR,
          }}
        />
      </div>
    ))}
  </div>
);

interface CoverLayersProps {
  showCovers: boolean;
  animationPhase: string;
}

const CoverLayers = ({ showCovers, animationPhase }: CoverLayersProps) => {
  if (!showCovers) return null;

  return (
    <>
      <motion.div
        className="absolute left-0 top-0 h-full w-1/2 overflow-hidden"
        style={{
          transformOrigin: 'right center',
          transformStyle: 'preserve-3d',
        }}
        variants={coverLeftVariants}
        initial="closed"
        animate={animationPhase}
      >
        <div
          className="relative flex h-full items-center justify-center"
          style={{
            backgroundColor: NOTEBOOK_COVER_COLOR,
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="relative flex flex-col items-center gap-2">
            <div className="h-24 w-1 rounded-full bg-[#8b6b12]/40" />
          </div>
          <div
            className="pointer-events-none absolute right-[-6px] top-0 flex h-full flex-col items-end justify-around py-[18px]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[8px] border-2"
                style={{
                  width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
                  height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
                  borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
                  backgroundColor: NOTEBOOK_SPRING_COLOR,
                }}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute inset-0 bg-white"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
        />
      </motion.div>

      <motion.div
        className="absolute right-0 top-0 h-full w-1/2 overflow-hidden"
        style={{
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
        }}
        variants={coverRightVariants}
        initial="closed"
        animate={animationPhase}
      >
        <div
          className="relative flex h-full items-center justify-center"
          style={{
            backgroundColor: NOTEBOOK_COVER_COLOR,
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="relative flex flex-col items-center gap-2">
            <div className="h-24 w-1 rounded-full bg-[#8b6b12]/40" />
          </div>
          <div className="pointer-events-none absolute left-[-6px] top-0 flex h-full flex-col items-start justify-around py-[18px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[8px] border-2"
                style={{
                  width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
                  height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
                  borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
                  backgroundColor: NOTEBOOK_SPRING_COLOR,
                }}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute inset-0 bg-white"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
        />
      </motion.div>
    </>
  );
};

export interface MemoryNotebookDisplayProps {
  memory: MemoryWithCoordinates;
  cachedMemory: MemoryWithCoordinates | null;
  isFlipping: boolean;
  isLeftPageFlipped: boolean;
  isRightPageFlipped: boolean;
  flipDirection: 'next' | 'prev' | null;
  animationPhase: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  children: React.ReactNode; // This will be the page content renderer
}

export function MemoryNotebookDisplay({
  memory,
  cachedMemory,
  isFlipping,
  isLeftPageFlipped,
  isRightPageFlipped,
  flipDirection,
  animationPhase,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  children,
}: MemoryNotebookDisplayProps) {
  const showCovers = animationPhase !== 'open';
  const baseLeftMemory = (
    isFlipping && flipDirection === 'next' ? cachedMemory : memory
  )!;

  return (
    <div className="flex items-center gap-6" style={{ perspective: '2000px' }}>
      <motion.button
        onClick={onPrevious}
        disabled={!hasPrevious || isFlipping}
        className="flex h-12 w-12 items-center justify-center border-2 border-border bg-card text-black transition-colors active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30"
        variants={chevronVariants}
        initial="idle"
        whileHover={hasPrevious ? 'hover' : 'disabled'}
        whileTap={hasPrevious ? 'tap' : 'disabled'}
        aria-label="Previous memory"
      >
        <ChevronLeft className="h-6 w-6" />
      </motion.button>

      <div
        className="relative"
        style={{
          width: `${BOOK_WIDTH}px`,
          height: `${BOOK_HEIGHT}px`,
          overflow: 'visible',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute inset-0 p-2"
          style={{
            border: `2px solid ${NOTEBOOK_BORDER_COLOR}`,
            backgroundColor: NOTEBOOK_COVER_COLOR,
            overflow: 'visible',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="relative z-10 flex h-full gap-2"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <NotebookSpineConnectors />

            <div
              className={`${PAGE_BASE_STYLES} relative`}
              style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
            >
              <MemoryNotebookPageContent
                memory={baseLeftMemory}
                side="left"
                isPhotoPage={true}
              />
            </div>

            <div
              className={`${PAGE_BASE_STYLES} relative`}
              style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
            >
              {children}
            </div>

            {cachedMemory && flipDirection === 'prev' && (
              <motion.div
                className="absolute top-0"
                style={{
                  left: `${BOOK_INNER_PADDING}px`,
                  width: `${PAGE_WIDTH}px`,
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transformOrigin: `${PAGE_WIDTH}px 50%`,
                  willChange: 'transform',
                  zIndex: 20,
                }}
                variants={leftPageFlipVariants}
                initial="flat"
                animate={isLeftPageFlipped ? 'flipped' : 'flat'}
              >
                <div
                  className={PAGE_FACE_STYLES}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <MemoryNotebookPageContent
                    memory={cachedMemory}
                    side="left"
                    isPhotoPage={true}
                  />
                </div>

                <div
                  className={PAGE_FACE_STYLES}
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {children}
                </div>
              </motion.div>
            )}

            {cachedMemory && flipDirection === 'next' && (
              <motion.div
                className="absolute top-0"
                style={{
                  right: `${BOOK_INNER_PADDING}px`,
                  width: `${PAGE_WIDTH}px`,
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transformOrigin: '0px 50%',
                  willChange: 'transform',
                  zIndex: 20,
                }}
                variants={rightPageFlipVariants}
                initial="flat"
                animate={isRightPageFlipped ? 'flipped' : 'flat'}
              >
                <div
                  className={PAGE_FACE_STYLES}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {children}
                </div>

                <div
                  className={PAGE_FACE_STYLES}
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <MemoryNotebookPageContent
                    memory={memory}
                    side="left"
                    isPhotoPage={true}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <CoverLayers showCovers={showCovers} animationPhase={animationPhase} />
      </div>

      <motion.button
        onClick={onNext}
        disabled={!hasNext || isFlipping}
        className="flex h-12 w-12 items-center justify-center border-2 border-border bg-card text-black transition-colors active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30"
        variants={chevronVariants}
        initial="idle"
        whileHover={hasNext ? 'hover' : 'disabled'}
        whileTap={hasNext ? 'tap' : 'disabled'}
        aria-label="Next memory"
      >
        <ChevronRight className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
