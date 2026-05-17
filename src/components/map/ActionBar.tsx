'use client';

import { Copy, Heart, Share } from 'lucide-react';
import { useState } from 'react';
import type { MemoryWithRelations } from '@/lib/schemas';
import { useVoteStatus } from '@/lib/hooks/useVoteStatus';
import { useToggleVote } from '@/lib/hooks/useToggleVote';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { formatVoteCount } from '@/lib/utils';

interface ActionBarProps {
  memory: MemoryWithRelations;
  showReadMore?: boolean;
  onReadMore?: () => void;
}

export function ActionBar({
  memory,
  showReadMore = false,
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
        onError: (err) => {
          const status = (err as Error & { status?: number }).status;
          if (status === 403) {
            setShowOnboardPrompt(true);
            setTimeout(() => setShowOnboardPrompt(false), 3000);
          }
        },
      }
    );
  };

  const actionButtonBaseClass =
    'flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black transition-colors disabled:opacity-50';
  const textActionButtonBaseClass =
    'flex h-10 items-center justify-center border-2 border-black bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={handleLike}
        disabled={!isAuthenticated || toggleVote.isPending}
        className={`flex h-10 min-w-[4.5rem] items-center justify-center gap-2 border-2 border-black px-3 transition-colors disabled:opacity-50 ${
          !isAuthenticated
            ? 'cursor-default bg-white text-black'
            : hasVoted
              ? 'bg-[#f7d6d5] text-black hover:bg-[#efc1bf]'
              : 'bg-white text-black hover:bg-[#fff3bf]'
        }`}
        aria-label={hasVoted ? 'Unlike' : 'Like'}
        aria-pressed={hasVoted}
      >
        <Heart
          className={`h-5 w-5 transition-all ${hasVoted ? 'fill-current' : ''}`}
        />
        <span className="text-sm font-medium">
          {formatVoteCount(voteCount)}
        </span>
      </button>

      <button className={actionButtonBaseClass} aria-label="Copy">
        <Copy className="h-5 w-5" />
      </button>

      <button
        className={`${actionButtonBaseClass} text-black hover:bg-[#fff3bf]`}
        aria-label="Share"
      >
        <Share className="h-5 w-5" />
      </button>

      {showReadMore && onReadMore && (
        <button
          type="button"
          onClick={onReadMore}
          className={`${textActionButtonBaseClass} hover:bg-[#fff3bf]`}
          aria-label="Read more caption"
        >
          Read more
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
