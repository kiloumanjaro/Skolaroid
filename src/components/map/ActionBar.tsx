'use client';

import { Copy, Heart, Share, Flag } from 'lucide-react';
import { useState } from 'react';
import type { MemoryWithRelations } from '@/lib/schemas';
import { useVoteStatus } from '@/lib/hooks/useVoteStatus';
import { useToggleVote } from '@/lib/hooks/useToggleVote';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { formatVoteCount } from '@/lib/utils';

interface ActionBarProps {
  memory: MemoryWithRelations;
  onReport?: () => void;
}

/**
 * Engagement bar rendered beneath the caption card on every memory page.
 *
 * Layout (two rows):
 *   ♥ 42          ← vote count strip (left-aligned)
 *   📋  ♥  ↗       ← Copy | Like | Share (centred)
 */
export function ActionBar({ memory, onReport }: ActionBarProps) {
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

  return (
    <div className="flex flex-col gap-1.5">
      {/* ── Vote count strip ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-1">
        <Heart
          className={`h-4 w-4 shrink-0 transition-colors ${
            hasVoted ? 'fill-red-500 text-red-500' : 'text-slate-400'
          }`}
        />
        <span className="text-sm font-medium text-slate-500">
          {formatVoteCount(voteCount)}
        </span>

        {showOnboardPrompt && (
          <span className="ml-1 text-xs text-amber-500">
            Complete onboarding to vote
          </span>
        )}
      </div>

      {/* ── Action icons ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4">
        <button
          className="text-slate-600 hover:text-slate-800"
          aria-label="Copy"
        >
          <Copy className="h-5 w-5" />
        </button>

        <button
          onClick={handleLike}
          disabled={!isAuthenticated || toggleVote.isPending}
          className={`transition-colors ${
            !isAuthenticated
              ? 'cursor-default text-slate-300'
              : hasVoted
                ? 'text-red-500 hover:text-red-400'
                : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label={hasVoted ? 'Unlike' : 'Like'}
          aria-pressed={hasVoted}
        >
          <Heart
            className={`h-5 w-5 transition-all ${hasVoted ? 'fill-current' : ''}`}
          />
        </button>

        <button
          className="text-slate-600 hover:text-slate-800"
          aria-label="Share"
        >
          <Share className="h-5 w-5" />
        </button>

        <button
          onClick={onReport}
          disabled={!isAuthenticated}
          className={`transition-colors ${
            !isAuthenticated
              ? 'cursor-default text-slate-300'
              : 'text-slate-600 hover:text-amber-500'
          }`}
          aria-label="Report memory"
        >
          <Flag className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
