'use client';

import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogTitle } from '@/components/ui/Dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { DeleteMemoryModal } from '@/components/map/DeleteMemoryModal';
import { EditMemoryModal } from '@/components/map/EditMemoryModal';
import { ReportMemoryModal } from '@/components/map/ReportMemoryModal';
import { MemoryNotebookDisplay } from '@/components/map/MemoryNotebookDisplay';
import { MemoryNotebookMobile } from '@/components/map/MemoryNotebookMobile';
import { MemoryNotebookPageContent } from '@/components/map/MemoryNotebookPageContent';
import { useDeleteMemory } from '@/lib/hooks/useDeleteMemory';
import { useCommentsByMemory } from '@/lib/hooks/useCommentsByMemory';
import { useCreateComment } from '@/lib/hooks/useCreateComment';
import { useDeleteComment } from '@/lib/hooks/useDeleteComment';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import {
  useMemoryDetailState,
  PAGE_TURN_DURATION_MS,
  BOOK_HEIGHT,
} from '@/lib/hooks/useMemoryDetailState';
import { overlayVariants } from './memory-modal-animations';

interface MemoryDetailModalProps {
  memory: MemoryWithCoordinates | null;
  previousMemory?: MemoryWithCoordinates | null;
  nextMemory?: MemoryWithCoordinates | null;
  initialImageIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onMemoryDeleted?: () => void;
  onActiveImageIndexChange?: (memoryId: string, nextIndex: number) => void;
}

export function MemoryDetailModal({
  memory,
  previousMemory = null,
  nextMemory = null,
  initialImageIndex = 0,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onMemoryDeleted,
  onActiveImageIndexChange,
}: MemoryDetailModalProps) {
  // ALL hooks must be called unconditionally on every render
  // State management
  const state = useMemoryDetailState(memory, open, initialImageIndex);

  // Auth and data hooks
  const { user: authUser } = useUserAuth();
  const { data: userGroups } = useUserGroups();
  const deleteMemory = useDeleteMemory();
  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentsByMemory(memory?.id);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  // Child modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const childModalOpen = deleteModalOpen || reportModalOpen || editModalOpen;

  const liveComments = useMemo(
    () => commentsData?.pages.flatMap((p) => p.data.items) ?? [],
    [commentsData]
  );
  const liveCommentCount = useMemo(
    () => commentsData?.pages[0]?.data.commentCount ?? 0,
    [commentsData]
  );

  // Sync live comments to cache refs
  const cachedCommentsRef = state.cachedCommentsRef;
  const cachedCommentCountRef = state.cachedCommentCountRef;
  const mobileCachedCommentsRef = state.mobileCachedCommentsRef;
  const mobileCachedCommentCountRef = state.mobileCachedCommentCountRef;

  // Handle page transitions
  const handleNext = useCallback(() => {
    if (!memory || !hasNext || state.isFlipping || !onNext) return;

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.setCommentText('');

    state.setCachedMemory(memory);
    state.setFlipDirection('next');
    state.setIsFlipping(true);
    onNext();
    state.setIsRightPageFlipped(true);

    setTimeout(() => {
      state.setCachedMemory(null);
      state.setFlipDirection(null);
      state.setIsRightPageFlipped(false);
      state.setIsFlipping(false);
    }, PAGE_TURN_DURATION_MS);
  }, [
    hasNext,
    state,
    onNext,
    liveComments,
    liveCommentCount,
    memory,
    cachedCommentsRef,
    cachedCommentCountRef,
  ]);

  const handlePrevious = useCallback(() => {
    if (!memory || !hasPrevious || state.isFlipping || !onPrevious) return;

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.setCommentText('');

    state.setCachedMemory(memory);
    state.setFlipDirection('prev');
    state.setIsFlipping(true);
    onPrevious();
    state.setIsLeftPageFlipped(true);

    setTimeout(() => {
      state.setCachedMemory(null);
      state.setFlipDirection(null);
      state.setIsLeftPageFlipped(false);
      state.setIsFlipping(false);
    }, PAGE_TURN_DURATION_MS);
  }, [
    hasPrevious,
    state,
    onPrevious,
    liveComments,
    liveCommentCount,
    memory,
    cachedCommentsRef,
    cachedCommentCountRef,
  ]);

  // Handle mobile page transitions
  const handleMobileShowComments = useCallback(() => {
    if (state.mobileNotebookPage !== 'photo' || state.isMobilePageTurning)
      return;

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.mobileCarriedCommentText.current = state.commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;

    state.setMobileTransitionDirection('next');
    state.setMobileTransitionMode('page');
    state.setIsMobilePageTurning(true);

    setTimeout(() => {
      state.setMobileNotebookPage('comments');
      state.setIsMobilePageTurning(false);
      state.setMobileTransitionDirection(null);
      state.setMobileTransitionMode(null);
    }, PAGE_TURN_DURATION_MS);
  }, [
    state,
    liveComments,
    liveCommentCount,
    cachedCommentsRef,
    cachedCommentCountRef,
    mobileCachedCommentsRef,
    mobileCachedCommentCountRef,
  ]);

  const handleMobileShowPhoto = useCallback(() => {
    if (state.mobileNotebookPage !== 'comments' || state.isMobilePageTurning)
      return;

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.mobileCarriedCommentText.current = state.commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;

    state.setMobileTransitionDirection('prev');
    state.setMobileTransitionMode('page');
    state.setIsMobilePageTurning(true);

    setTimeout(() => {
      state.setMobileNotebookPage('photo');
      state.setIsMobilePageTurning(false);
      state.setMobileTransitionDirection(null);
      state.setMobileTransitionMode(null);
    }, PAGE_TURN_DURATION_MS);
  }, [
    state,
    liveComments,
    liveCommentCount,
    cachedCommentsRef,
    cachedCommentCountRef,
    mobileCachedCommentsRef,
    mobileCachedCommentCountRef,
  ]);

  const handleMobileLeftChevron = useCallback(() => {
    if (state.mobileNotebookPage === 'comments') {
      handleMobileShowPhoto();
      return;
    }

    if (
      !hasPrevious ||
      state.isMobilePageTurning ||
      !onPrevious ||
      !previousMemory
    ) {
      return;
    }

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.mobileCarriedCommentText.current = state.commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;
    state.setMobileTransitionMemory(memory);
    state.setMobileTransitionDirection('prev');
    state.setMobileTransitionMode('memory');
    state.setIsMobilePageTurning(true);

    setTimeout(() => {
      state.setCommentText('');
      onPrevious();
      state.setMobileNotebookPage('photo');
      state.setIsMobilePageTurning(false);
      state.setMobileTransitionDirection(null);
      state.setMobileTransitionMode(null);
      state.setMobileTransitionMemory(null);
    }, PAGE_TURN_DURATION_MS);
  }, [
    state,
    previousMemory,
    hasPrevious,
    onPrevious,
    memory,
    liveComments,
    liveCommentCount,
    handleMobileShowPhoto,
    cachedCommentsRef,
    cachedCommentCountRef,
    mobileCachedCommentsRef,
    mobileCachedCommentCountRef,
  ]);

  const handleMobileRightChevron = useCallback(() => {
    if (state.mobileNotebookPage === 'photo') {
      handleMobileShowComments();
      return;
    }

    if (!hasNext || state.isMobilePageTurning || !onNext || !nextMemory) return;

    state.carriedCommentText.current = state.commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    state.mobileCarriedCommentText.current = state.commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;
    state.setMobileTransitionMemory(memory);
    state.setMobileTransitionDirection('next');
    state.setMobileTransitionMode('memory');
    state.setIsMobilePageTurning(true);

    setTimeout(() => {
      state.setCommentText('');
      onNext();
      state.setMobileNotebookPage('photo');
      state.setIsMobilePageTurning(false);
      state.setMobileTransitionDirection(null);
      state.setMobileTransitionMode(null);
      state.setMobileTransitionMemory(null);
    }, PAGE_TURN_DURATION_MS);
  }, [
    state,
    nextMemory,
    hasNext,
    onNext,
    memory,
    liveComments,
    liveCommentCount,
    handleMobileShowComments,
    cachedCommentsRef,
    cachedCommentCountRef,
    mobileCachedCommentsRef,
    mobileCachedCommentCountRef,
  ]);

  // Comment handlers
  const handleCommentSubmit = useCallback(
    (content: string) => {
      createComment.mutate(
        { memoryId: memory!.id, content },
        {
          onSuccess: () => {
            toast.success('Comment posted');
            state.setCommentText('');
          },
          onError: () => {
            toast.error('Failed to post comment');
          },
        }
      );
    },
    [memory, createComment, state]
  );

  const handleCommentDelete = useCallback(
    (commentId: string) => {
      deleteComment.mutate(
        { commentId, memoryId: memory!.id },
        {
          onSuccess: () => {
            toast.success('Comment deleted');
          },
          onError: () => {
            toast.error('Failed to delete comment');
          },
        }
      );
    },
    [memory, deleteComment]
  );

  // Early return AFTER all hooks have been called (Rules of Hooks compliance)
  if (!memory) return null;

  // Compute display values
  const mobileBookStageHeight =
    BOOK_HEIGHT * state.mobileBookScale + 24 * state.mobileBookScale;
  const mobileBookOffsetX =
    state.mobileBookStageWidth / 2 - (8 + 472 / 2) * state.mobileBookScale;

  const mobileLeftChevronDisabled =
    state.isMobilePageTurning ||
    (state.mobileNotebookPage === 'photo' ? !hasPrevious : false);
  const mobileRightChevronDisabled =
    state.isMobilePageTurning ||
    (state.mobileNotebookPage === 'comments' ? !hasNext : false);
  const mobileLeftChevronLabel =
    state.mobileNotebookPage === 'comments'
      ? 'Show photo page'
      : 'Previous memory';
  const mobileRightChevronLabel =
    state.mobileNotebookPage === 'photo' ? 'Show comments page' : 'Next memory';
  const mobileVisibleMemory = state.mobileTransitionMemory ?? memory;
  const captionRef = state.captionElement
    ? { current: state.captionElement }
    : undefined;
  const isMobileNextMemoryTransition =
    state.mobileTransitionMode === 'memory' &&
    state.mobileTransitionDirection === 'next';
  const isMobilePrevMemoryTransition =
    state.mobileTransitionMode === 'memory' &&
    state.mobileTransitionDirection === 'prev';
  const shouldShowMobileCommentsPage =
    state.mobileNotebookPage === 'comments' &&
    !(
      state.isMobilePageTurning &&
      state.mobileTransitionDirection === 'prev' &&
      state.mobileTransitionMode === 'page'
    );

  // Right page content for desktop
  const rightPageContent = (
    <MemoryNotebookPageContent
      memory={
        state.isFlipping && state.flipDirection === 'prev'
          ? state.cachedMemory!
          : memory
      }
      isPhotoPage={false}
      side="right"
      showCloseButton={true}
      showMenu={true}
      comments={
        state.isFlipping && state.flipDirection === 'prev'
          ? cachedCommentsRef.current
          : liveComments
      }
      totalComments={
        state.isFlipping && state.flipDirection === 'prev'
          ? cachedCommentCountRef.current
          : liveCommentCount
      }
      hasMore={state.isFlipping ? false : (hasNextPage ?? false)}
      isLoadingMore={state.isFlipping ? false : isFetchingNextPage}
      isSubmitting={state.isFlipping ? false : createComment.isPending}
      onSubmit={state.isFlipping ? () => {} : handleCommentSubmit}
      onDelete={state.isFlipping ? () => {} : handleCommentDelete}
      onLoadMore={state.isFlipping ? () => {} : fetchNextPage}
      commentValue={
        state.isFlipping && state.flipDirection === 'prev'
          ? state.carriedCommentText.current
          : state.commentText
      }
      onCommentValueChange={state.isFlipping ? () => {} : state.setCommentText}
      isCaptionExpanded={state.isCaptionExpanded}
      onCaptionExpandChange={state.setIsCaptionExpanded}
      isCaptionTruncated={state.isCaptionTruncated}
      captionRef={captionRef}
      isCommentsCollapsed={state.isCommentsCollapsed}
      onCommentsCollapsedChange={state.setIsCommentsCollapsed}
      currentUserId={authUser?.id}
      authUserId={authUser?.id}
      userGroups={userGroups}
      onEditClick={() => setEditModalOpen(true)}
      onReportClick={() => setReportModalOpen(true)}
      onDeleteClick={() => setDeleteModalOpen(true)}
      onCloseClick={() => onOpenChange(false)}
      onImageIndexChange={(nextIndex) => {
        state.handleImageIndexChange(memory.id, nextIndex);
        onActiveImageIndexChange?.(memory.id, nextIndex);
      }}
      activeImageIndex={state.getActiveImageIndex(memory)}
    />
  );

  // Mobile details page content
  const mobileDetailsPageContent = (
    <MemoryNotebookPageContent
      memory={mobileVisibleMemory}
      isPhotoPage={false}
      comments={
        isMobileNextMemoryTransition
          ? mobileCachedCommentsRef.current
          : liveComments
      }
      totalComments={
        isMobileNextMemoryTransition
          ? mobileCachedCommentCountRef.current
          : liveCommentCount
      }
      hasMore={isMobileNextMemoryTransition ? false : (hasNextPage ?? false)}
      isLoadingMore={isMobileNextMemoryTransition ? false : isFetchingNextPage}
      isSubmitting={
        isMobileNextMemoryTransition ? false : createComment.isPending
      }
      onSubmit={isMobileNextMemoryTransition ? () => {} : handleCommentSubmit}
      onDelete={isMobileNextMemoryTransition ? () => {} : handleCommentDelete}
      onLoadMore={isMobileNextMemoryTransition ? () => {} : fetchNextPage}
      commentValue={
        isMobileNextMemoryTransition
          ? state.mobileCarriedCommentText.current
          : state.commentText
      }
      onCommentValueChange={
        isMobileNextMemoryTransition ? () => {} : state.setCommentText
      }
    />
  );

  return (
    <>
      <Dialog open={open && !childModalOpen} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <motion.div
                className="fixed inset-0 z-[10000] bg-[#2d2d2d]/50"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                onClick={() => onOpenChange(false)}
              />

              <DialogPrimitive.Content asChild forceMount>
                <div
                  className={`fixed inset-0 z-[10000] flex ${
                    state.isMobileViewport
                      ? 'items-start justify-center px-3 pb-6 pt-20'
                      : 'items-center justify-center'
                  }`}
                >
                  <DialogTitle className="sr-only">{memory.title}</DialogTitle>
                  {state.isMobileViewport ? (
                    <MemoryNotebookMobile
                      memory={memory}
                      mobileBookStageWidth={state.mobileBookStageWidth}
                      mobileBookScale={state.mobileBookScale}
                      mobileBookOffsetX={mobileBookOffsetX}
                      mobileBookStageHeight={mobileBookStageHeight}
                      mobileNotebookPage={state.mobileNotebookPage}
                      isMobilePageTurning={state.isMobilePageTurning}
                      mobileTransitionDirection={
                        state.mobileTransitionDirection
                      }
                      mobileTransitionMode={state.mobileTransitionMode}
                      mobileTransitionMemory={state.mobileTransitionMemory}
                      mobileLeftChevronDisabled={mobileLeftChevronDisabled}
                      mobileRightChevronDisabled={mobileRightChevronDisabled}
                      mobileLeftChevronLabel={mobileLeftChevronLabel}
                      mobileRightChevronLabel={mobileRightChevronLabel}
                      shouldShowMobileCommentsPage={
                        shouldShowMobileCommentsPage
                      }
                      isMobileNextMemoryTransition={
                        isMobileNextMemoryTransition
                      }
                      isMobilePrevMemoryTransition={
                        isMobilePrevMemoryTransition
                      }
                      previousMemory={previousMemory}
                      nextMemory={nextMemory}
                      onMobileLeftChevron={handleMobileLeftChevron}
                      onMobileRightChevron={handleMobileRightChevron}
                      onCloseClick={() => onOpenChange(false)}
                    >
                      {mobileDetailsPageContent}
                    </MemoryNotebookMobile>
                  ) : (
                    <MemoryNotebookDisplay
                      memory={memory}
                      cachedMemory={state.cachedMemory}
                      isFlipping={state.isFlipping}
                      isLeftPageFlipped={state.isLeftPageFlipped}
                      isRightPageFlipped={state.isRightPageFlipped}
                      flipDirection={state.flipDirection}
                      animationPhase={state.animationPhase}
                      hasPrevious={hasPrevious}
                      hasNext={hasNext}
                      onPrevious={handlePrevious}
                      onNext={handleNext}
                    >
                      {rightPageContent}
                    </MemoryNotebookDisplay>
                  )}
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </Dialog>

      <DeleteMemoryModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        memoryTitle={memory?.title ?? ''}
        isPending={deleteMemory.isPending}
        onConfirmDelete={() => {
          if (!memory) return;
          deleteMemory.mutate(memory.id, {
            onSuccess: () => {
              setDeleteModalOpen(false);
              onOpenChange(false);
              onMemoryDeleted?.();
            },
          });
        }}
      />

      <ReportMemoryModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        memoryId={memory?.id ?? ''}
        memoryTitle={memory?.title ?? ''}
      />

      {memory && (
        <EditMemoryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          memory={memory}
        />
      )}
    </>
  );
}
