'use client';

import { Copy, Heart, Share } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MemoryWithRelations } from '@/lib/schemas';
import { useVoteStatus } from '@/lib/hooks/useVoteStatus';
import { useToggleVote } from '@/lib/hooks/useToggleVote';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { formatVoteCount } from '@/lib/utils';
import { useCallback } from 'react';

interface ActionBarProps {
  memory: MemoryWithRelations;
  showReadMore?: boolean;
  readMoreLabel?: string;
  isReadMoreDisabled?: boolean;
  onReadMore?: () => void;
}

export function ActionBar({
  memory,
  showReadMore = false,
  readMoreLabel = 'Read more',
  isReadMoreDisabled = false,
  onReadMore,
}: ActionBarProps) {
  const { isAuthenticated } = useUserAuth();
  const { data: voteStatusRes, isLoading } = useVoteStatus(memory.id);
  const toggleVote = useToggleVote();

  // Inline nudge shown when the user is authenticated but has no User row (403)
  const [showOnboardPrompt, setShowOnboardPrompt] = useState(false);

  // While loading use the count baked into the memory object so the number
  // never flashes 0 on first render.
  const voteCount = isLoading
    ? (memory._count?.votes ?? 0)
    : (voteStatusRes?.data?.voteCount ?? memory._count?.votes ?? 0);

  const hasVoted = voteStatusRes?.data?.hasVoted ?? false;

  const handleLike = () => {
    if (!isAuthenticated) return; // unauthenticated — silently no-op

    toggleVote.mutate(
      { memoryId: memory.id },
      {
        onSuccess: () => {
          toast.success(
            hasVoted ? 'Removed like from memory' : 'Like a memory'
          );
        },
        onError: (err) => {
          const status = (err as Error & { status?: number }).status;
          if (status === 403) {
            setShowOnboardPrompt(true);
            setTimeout(() => setShowOnboardPrompt(false), 3000);
          } else {
            toast.error('Failed to update favorite');
          }
        },
      }
    );
  };

  const handleCopyCaption = useCallback(async () => {
    if (!memory.description) {
      toast.error('No caption to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(memory.description);
      toast.success('Caption copied');
    } catch (err) {
      console.error('Failed to copy caption:', err);
      toast.error('Failed to copy caption');
    }
  }, [memory.description]);

  const handleShare = useCallback(async () => {
    try {
      const url = `${window.location.origin}/memories/${memory.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  }, [memory.id]);

  const actionButtonBaseClass =
    'flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black transition-colors disabled:opacity-50';
  const textActionButtonBaseClass =
    'flex h-10 items-center justify-center border-2 border-black bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={handleLike}
        disabled={!isAuthenticated || toggleVote.isPending}
        className={`flex h-10 min-w-[4.5rem] items-center justify-center gap-2 border-2 border-black bg-white px-3 text-black transition-colors disabled:opacity-50 ${
          !isAuthenticated ? 'cursor-default' : ''
        }`}
        aria-label={hasVoted ? 'Unlike' : 'Like'}
        aria-pressed={hasVoted}
      >
        <Heart
          className="h-5 w-5 transition-all"
          style={{
            color: hasVoted ? '#d83b36' : 'currentColor',
            fill: hasVoted ? '#d83b36' : 'none',
          }}
        />
        <span className="text-sm font-medium">
          {formatVoteCount(voteCount)}
        </span>
      </button>

      <button
        onClick={handleCopyCaption}
        className={actionButtonBaseClass}
        aria-label="Copy caption"
      >
        <Copy className="h-5 w-5" />
      </button>

      <button
        onClick={handleShare}
        className={actionButtonBaseClass}
        aria-label="Share memory"
      >
        <Share className="h-5 w-5" />
      </button>

      {showReadMore && onReadMore && (
        <button
          type="button"
          onClick={onReadMore}
          disabled={isReadMoreDisabled}
          className={`${textActionButtonBaseClass} ${
            isReadMoreDisabled ? 'cursor-default' : 'hover:bg-[#fff3bf]'
          }`}
          aria-label="Read more caption"
        >
          {readMoreLabel}
        </button>
      )}

      {showOnboardPrompt && (
        <span className="border-2 border-black bg-[#fff3bf] px-2 py-1 text-xs font-medium text-black">
          Complete onboarding to vote
        </span>
      )}
    </div>
  );
}
