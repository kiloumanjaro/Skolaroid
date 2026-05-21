'use client';

import { useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getMemoryMediaURLs } from '@/lib/memory-media';
import { PolaroidMediaCarousel } from '@/components/shared/memory/PolaroidMediaCarousel';
import { ActionBar } from '@/components/map/ActionBar';
import { CommentSection } from '@/components/map/CommentSection';
import type { MemoryVisibility } from '@/lib/schemas';
import type { Comment } from '@/services/get-comments-service';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Pencil, Flag, Trash2 } from 'lucide-react';

const NOTEBOOK_BORDER_COLOR = '#2d2d2d';
const NOTEBOOK_SPINE_RING_WIDTH = 26;
const NOTEBOOK_SPINE_RING_HEIGHT = 14;

const isAutoTag = (tagName: string): boolean => {
  return (
    /^\d{4}s$/.test(tagName) ||
    /^\d{4}$/.test(tagName) ||
    tagName.startsWith('Near ')
  );
};

interface MemoryNotebookPageContentProps {
  memory: MemoryWithCoordinates;
  side?: 'left' | 'right';
  isPhotoPage?: boolean;
  showCloseButton?: boolean;
  showMenu?: boolean;
  comments?: Comment[];
  totalComments?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (content: string) => void;
  onDelete?: (commentId: string) => void;
  onLoadMore?: () => void;
  commentValue?: string;
  onCommentValueChange?: (text: string) => void;
  isCaptionExpanded?: boolean;
  onCaptionExpandChange?: (expanded: boolean) => void;
  isCaptionTruncated?: boolean;
  captionRef?: React.RefObject<HTMLParagraphElement>;
  isCommentsCollapsed?: boolean;
  onCommentsCollapsedChange?: (collapsed: boolean) => void;
  currentUserId?: string;
  authUserId?: string;
  userGroups?: Array<{ id: string; name: string }>;
  onEditClick?: () => void;
  onReportClick?: () => void;
  onDeleteClick?: () => void;
  onCloseClick?: () => void;
  onImageIndexChange?: (nextIndex: number) => void;
  activeImageIndex?: number;
  measureCaption?: boolean;
}

const VISIBILITY_META: Record<
  MemoryVisibility,
  { Icon: typeof Image; label: string }
> = {
  PUBLIC: { Icon: Image, label: 'Public' },
  PROGRAM_ONLY: { Icon: Image, label: 'Program Only' },
  BATCH_ONLY: { Icon: Image, label: 'Batch Only' },
  GROUP_ONLY: { Icon: Image, label: 'Private' },
  PRIVATE: { Icon: Image, label: 'Private' },
};

const LeftPageSpineRings = () => (
  <div
    className="pointer-events-none absolute -right-[6px] top-0 flex h-full flex-col items-end justify-around py-[18px]"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-[8px] border-2"
        style={{
          width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
          height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
          borderColor: '#2b2b2b',
          backgroundColor: '#d9d9d9',
        }}
      />
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
          width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
          height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
          borderColor: '#2b2b2b',
          backgroundColor: '#d9d9d9',
        }}
      />
    ))}
  </div>
);

export const MemoryNotebookPageContent = memo(
  function MemoryNotebookPageContent({
    memory,
    side = 'left',
    isPhotoPage = true,
    showCloseButton = false,
    showMenu = false,
    comments = [],
    totalComments = 0,
    hasMore = false,
    isLoadingMore = false,
    isSubmitting = false,
    onSubmit,
    onDelete,
    onLoadMore,
    commentValue = '',
    onCommentValueChange,
    isCaptionExpanded = false,
    onCaptionExpandChange,
    isCaptionTruncated = false,
    captionRef,
    isCommentsCollapsed = false,
    onCommentsCollapsedChange,
    currentUserId,
    authUserId,
    userGroups = [],
    onEditClick,
    onReportClick,
    onDeleteClick,
    onCloseClick,
    onImageIndexChange,
    activeImageIndex = 0,
    measureCaption = true,
  }: MemoryNotebookPageContentProps) {
    const mediaURLs = getMemoryMediaURLs(memory);
    const mediaCount = mediaURLs.length;
    const hasMultipleImages = mediaCount > 1;

    const isPageOwner = !!(authUserId && memory.creatorId === authUserId);

    const visibilityDisplay = useMemo(() => {
      const meta = VISIBILITY_META[memory.visibility];
      if (memory.visibility === 'GROUP_ONLY' && memory.privateGroupId) {
        const group = userGroups?.find((g) => g.id === memory.privateGroupId);
        return {
          label: group ? `Private · ${group.name}` : 'Private',
        };
      }
      return { label: meta?.label || 'Public' };
    }, [memory.visibility, memory.privateGroupId, userGroups]);

    const authorName = useMemo(
      () =>
        memory.creator
          ? `${memory.creator.firstName} ${memory.creator.lastName}`
          : 'Unknown Author',
      [memory.creator]
    );

    if (isPhotoPage) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
            <PolaroidMediaCarousel
              memory={memory}
              activeIndex={activeImageIndex}
              onIndexChange={onImageIndexChange}
            />
          </div>

          {memory.tags && memory.tags.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderRadius: 0 }}
                  className={
                    isAutoTag(tag.name)
                      ? 'border-black bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-black'
                      : 'border-black bg-[#f6cb48] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black'
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {mediaCount > 0 && (
            <div className="flex shrink-0 items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onImageIndexChange?.(activeImageIndex - 1)}
                disabled={!hasMultipleImages}
                className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-medium uppercase tracking-[0.12em] text-black">
                {activeImageIndex + 1} of {mediaCount}
              </div>

              <button
                type="button"
                onClick={() => onImageIndexChange?.(activeImageIndex + 1)}
                disabled={!hasMultipleImages}
                className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {side === 'left' ? <LeftPageSpineRings /> : <RightPageSpineRings />}
        </div>
      );
    }

    return (
      <>
        {showCloseButton && (
          <div className="absolute right-10 top-7 z-20 flex items-center gap-1">
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-[34px] w-[34px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc]"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  className="min-w-[9.5rem] rounded-none border-2 border-[#2d2d2d] bg-[#fff4fb] p-0.5 shadow-none"
                >
                  {isPageOwner && (
                    <DropdownMenuItem
                      className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#fd91e6] focus:text-black"
                      onClick={onEditClick}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Memory
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-red-600 focus:bg-red-600 focus:text-white"
                    onClick={onReportClick}
                  >
                    <Flag className="mr-1.5 h-3.5 w-3.5" />
                    Report Memory
                  </DropdownMenuItem>
                  {isPageOwner && (
                    <DropdownMenuItem
                      className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#ff9f9f] focus:text-black"
                      onClick={onDeleteClick}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete Memory
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              type="button"
              onClick={onCloseClick}
              className="inline-flex h-[34px] w-[34px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc]"
              style={{ borderColor: NOTEBOOK_BORDER_COLOR }}
              aria-label="Close memory details"
            >
              <X className="h-[14px] w-[14px]" />
            </button>
          </div>
        )}

        <div className="flex items-start gap-3.5">
          <Avatar className="h-11 w-11 bg-white">
            {memory.creator?.avatarUrl && (
              <AvatarImage
                src={memory.creator.avatarUrl}
                alt={authorName}
                className="bg-white object-contain"
              />
            )}
            <AvatarFallback className="bg-secondary text-sm text-black">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-normal text-black">{authorName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{visibilityDisplay.label}</span>
              {memory.memoryDate && (
                <>
                  <span>·</span>
                  <span>
                    {new Date(memory.memoryDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative px-8 py-6">
          <div
            className="pointer-events-none absolute inset-[10px] border-2 border-black"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute left-[4px] top-[4px] h-4 w-4 border-2 border-black bg-white"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute right-[4px] top-[4px] h-4 w-4 border-2 border-black bg-white"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute bottom-[4px] left-[4px] h-4 w-4 border-2 border-black bg-white"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute bottom-[4px] right-[4px] h-4 w-4 border-2 border-black bg-white"
            aria-hidden="true"
          />
          <div
            className={`relative z-10 overflow-hidden transition-all ${
              isCaptionExpanded ? '' : 'max-h-60'
            }`}
          >
            <p
              ref={measureCaption ? captionRef : undefined}
              className={`text-center font-dancing text-2xl leading-relaxed text-black ${
                !isCaptionExpanded ? 'line-clamp-3' : ''
              }`}
            >
              {memory.description || 'A memorable moment...'}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <ActionBar
            memory={memory}
            showReadMore
            readMoreLabel={isCaptionExpanded ? 'Read less' : 'Read more'}
            isReadMoreDisabled={!isCaptionExpanded && !isCaptionTruncated}
            onReadMore={() => onCaptionExpandChange?.(!isCaptionExpanded)}
          />

          {onSubmit && (
            <CommentSection
              comments={comments}
              commentCount={totalComments}
              currentUserId={currentUserId}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onDelete={onDelete ?? (() => {})}
              onLoadMore={onLoadMore ?? (() => {})}
              commentText={commentValue}
              onCommentTextChange={onCommentValueChange}
              isCollapsed={isCommentsCollapsed || isCaptionExpanded}
              onToggleCollapse={() => {
                if (isCaptionExpanded) {
                  onCaptionExpandChange?.(false);
                } else {
                  onCommentsCollapsedChange?.(!isCommentsCollapsed);
                }
              }}
            />
          )}
        </div>

        {side === 'left' ? <LeftPageSpineRings /> : <RightPageSpineRings />}
      </>
    );
  }
);
