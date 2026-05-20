'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getPrimaryMemoryMediaURL } from '@/lib/memory-media';
import { MemoryNotebookPageContent } from './MemoryNotebookPageContent';
import {
  rightPageFlipVariants,
  leftPageFlipVariants,
} from './memory-modal-animations';

const BOOK_WIDTH = 968;
const BOOK_HEIGHT = 650;
const PAGE_WIDTH = 472;
const BOOK_INNER_PADDING = 8;
const NOTEBOOK_BORDER_COLOR = '#2d2d2d';
const NOTEBOOK_COVER_COLOR = '#91a8ec';
const NOTEBOOK_SPRING_COLOR = '#d9d9d9';
const PAGE_BASE_STYLES =
  'flex flex-col gap-3.5 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const PAGE_FACE_STYLES =
  'absolute top-0 left-0 flex h-full w-full flex-col gap-3.5 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const NotebookSpineConnectors = () => (
  <div
    className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 flex-col justify-around py-[18px]"
    style={{ width: '18px' }}
    aria-hidden="true"
  >
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center justify-center">
        <div
          className="w-full border-y-2"
          style={{
            height: '14px',
            borderColor: NOTEBOOK_BORDER_COLOR,
            backgroundColor: NOTEBOOK_SPRING_COLOR,
          }}
        />
      </div>
    ))}
  </div>
);

const RightPageSpineRings = () => (
  <div
    className="pointer-events-none absolute -left-[6px] top-0 flex h-full flex-col items-start justify-around py-[18px]"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-[8px] border-2"
        style={{
          width: '26px',
          height: '14px',
          borderColor: '#2b2b2b',
          backgroundColor: NOTEBOOK_SPRING_COLOR,
        }}
      />
    ))}
  </div>
);

export interface MemoryNotebookMobileProps {
  memory: MemoryWithCoordinates;
  mobileBookStageWidth: number;
  mobileBookScale: number;
  mobileBookOffsetX: number;
  mobileBookStageHeight: number;
  mobileNotebookPage: 'photo' | 'comments';
  isMobilePageTurning: boolean;
  mobileTransitionDirection: 'next' | 'prev' | null;
  mobileTransitionMode: 'page' | 'memory' | null;
  mobileTransitionMemory: MemoryWithCoordinates | null;
  mobileLeftChevronDisabled: boolean;
  mobileRightChevronDisabled: boolean;
  mobileLeftChevronLabel: string;
  mobileRightChevronLabel: string;
  shouldShowMobileCommentsPage: boolean;
  isMobileNextMemoryTransition: boolean;
  isMobilePrevMemoryTransition: boolean;
  previousMemory: MemoryWithCoordinates | null;
  nextMemory: MemoryWithCoordinates | null;
  onMobileLeftChevron: () => void;
  onMobileRightChevron: () => void;
  onCloseClick: () => void;
  children: React.ReactNode;
}

export function MemoryNotebookMobile({
  memory,
  mobileBookStageWidth,
  mobileBookScale,
  mobileBookOffsetX,
  mobileBookStageHeight,
  mobileNotebookPage,
  isMobilePageTurning,
  mobileTransitionDirection,
  mobileTransitionMode,
  mobileTransitionMemory,
  mobileLeftChevronDisabled,
  mobileRightChevronDisabled,
  mobileLeftChevronLabel,
  mobileRightChevronLabel,
  shouldShowMobileCommentsPage,
  isMobileNextMemoryTransition,
  isMobilePrevMemoryTransition,
  previousMemory,
  nextMemory,
  onMobileLeftChevron,
  onMobileRightChevron,
  onCloseClick,
  children,
}: MemoryNotebookMobileProps) {
  const mobileVisibleBookWidth = 520 * mobileBookScale;

  const renderMobilePeekPageContent = () => {
    if (mobileNotebookPage === 'comments' && nextMemory) {
      const nextMemoryMediaURL = getPrimaryMemoryMediaURL(nextMemory);

      return (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[1px_2px_3px_0px_rgba(0,0,0,0.12)]">
            <div className="relative aspect-[4/3] bg-slate-100">
              {nextMemoryMediaURL ? (
                <Image
                  src={nextMemoryMediaURL}
                  alt={nextMemory.title}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 to-blue-50 px-6 text-center text-sm font-medium text-slate-500">
                  Next memory
                </div>
              )}
            </div>

            <div className="space-y-2 p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
                Up Next
              </p>
              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                {nextMemory.title || 'Untitled memory'}
              </p>
            </div>
          </div>

          <RightPageSpineRings />
        </>
      );
    }

    if (mobileNotebookPage === 'comments') {
      return (
        <>
          <div className="flex flex-1 flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
                Last Memory
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                You&apos;ve reached the end of this notebook.
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-full border border-slate-200 bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                No More Pages
              </div>
            </div>
          </div>

          <RightPageSpineRings />
        </>
      );
    }

    return (
      <>
        <div className="flex flex-1 flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
              Next Page
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Comments, reactions, and tags wait on the next turn.
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-full border border-slate-200 bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              Flip To Continue
            </div>
          </div>
        </div>

        <RightPageSpineRings />
      </>
    );
  };

  const renderMobilePreviousMemoryDetailsPage = () => {
    if (!previousMemory) {
      return renderMobilePeekPageContent();
    }

    return (
      <MemoryNotebookPageContent
        memory={previousMemory}
        isPhotoPage={false}
        side="right"
        measureCaption={false}
      />
    );
  };

  const renderMobileStaticRightPageContent = () => {
    if (isMobilePrevMemoryTransition) {
      return renderMobilePreviousMemoryDetailsPage();
    }

    return renderMobilePeekPageContent();
  };

  return (
    <div className="flex w-full max-w-[32rem] flex-col items-center gap-4 overflow-visible">
      <div className="flex w-full justify-end">
        <button
          type="button"
          onClick={onCloseClick}
          className="inline-flex h-[42px] w-[42px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc] active:translate-x-[2px] active:translate-y-[2px]"
          style={{ borderColor: NOTEBOOK_BORDER_COLOR }}
          aria-label="Close memory details"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div
        className="relative overflow-visible"
        style={{
          width: mobileBookStageWidth,
          height: mobileBookStageHeight,
          perspective: '2000px',
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${BOOK_WIDTH}px`,
            height: `${BOOK_HEIGHT}px`,
            transform: `translate3d(${mobileBookOffsetX}px, ${24 * mobileBookScale}px, 0) scale(${mobileBookScale})`,
            transformOrigin: 'top left',
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
                {shouldShowMobileCommentsPage ||
                isMobileNextMemoryTransition ? (
                  children
                ) : (
                  <MemoryNotebookPageContent
                    memory={
                      isMobilePrevMemoryTransition && previousMemory
                        ? previousMemory
                        : memory
                    }
                    isPhotoPage={true}
                  />
                )}
              </div>

              <div
                className={`${PAGE_BASE_STYLES} relative`}
                style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
              >
                {renderMobileStaticRightPageContent()}
              </div>

              <AnimatePresence>
                {isMobilePageTurning &&
                  mobileTransitionDirection === 'prev' && (
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
                      animate="flipped"
                    >
                      <div
                        className={PAGE_FACE_STYLES}
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        {isMobilePrevMemoryTransition ? (
                          <MemoryNotebookPageContent
                            memory={mobileTransitionMemory ?? memory}
                            isPhotoPage={true}
                          />
                        ) : (
                          children
                        )}
                      </div>

                      <div
                        className={PAGE_FACE_STYLES}
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        {isMobilePrevMemoryTransition ? (
                          renderMobilePreviousMemoryDetailsPage()
                        ) : (
                          <MemoryNotebookPageContent
                            memory={memory}
                            isPhotoPage={true}
                            side="right"
                            measureCaption={false}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              <AnimatePresence>
                {isMobilePageTurning &&
                  mobileTransitionDirection === 'next' && (
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
                      animate="flipped"
                    >
                      <div
                        className={PAGE_FACE_STYLES}
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        {renderMobilePeekPageContent()}
                      </div>

                      <div
                        className={PAGE_FACE_STYLES}
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        {mobileTransitionMode === 'memory' && nextMemory ? (
                          <MemoryNotebookPageContent
                            memory={nextMemory}
                            isPhotoPage={true}
                          />
                        ) : (
                          children
                        )}
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ width: mobileVisibleBookWidth }}
      >
        <button
          type="button"
          onClick={onMobileLeftChevron}
          disabled={mobileLeftChevronDisabled}
          className="z-30 flex h-10 w-10 items-center justify-center border-2 border-border bg-card text-black transition-colors active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={mobileLeftChevronLabel}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onMobileRightChevron}
          disabled={mobileRightChevronDisabled}
          className="z-30 flex h-10 w-10 items-center justify-center border-2 border-border bg-card text-black transition-colors active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={mobileRightChevronLabel}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
