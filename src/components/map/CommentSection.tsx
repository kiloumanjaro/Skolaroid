'use client';

import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeDate } from '@/lib/utils/format-date';
import type { Comment } from '@/services/get-comments-service';

interface CommentSectionProps {
  comments: Comment[];
  commentCount: number;
  currentUserId: string | undefined;
  hasMore: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  onSubmit: (content: string) => void;
  onDelete: (commentId: string) => void;
  onLoadMore: () => void;
  /** Controlled text value — when provided, CommentInput becomes controlled. */
  commentText?: string;
  /** Change handler for controlled text. */
  onCommentTextChange?: (text: string) => void;
  /** Whether the comment list is collapsed/hidden. */
  isCollapsed?: boolean;
  /** Callback when collapse/expand chevron is clicked. */
  onToggleCollapse?: () => void;
}

export function CommentSection({
  comments,
  commentCount,
  currentUserId,
  hasMore,
  isLoadingMore,
  isSubmitting,
  onSubmit,
  onDelete,
  onLoadMore,
  commentText,
  onCommentTextChange,
  isCollapsed = false,
  onToggleCollapse,
}: CommentSectionProps) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {/* Header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center justify-between px-0.5 py-1 hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
            Comments
          </h3>
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-black/60">
            {commentCount}
          </span>
        </div>
        {onToggleCollapse &&
          (isCollapsed ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-black" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-black" />
          ))}
      </button>

      {/* Comment list */}
      {!isCollapsed && (comments.length > 0 || hasMore) && (
        <div className="mt-2 flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar className="h-9 w-9 shrink-0">
                {comment.author.avatarUrl && (
                  <AvatarImage
                    src={comment.author.avatarUrl}
                    alt={`${comment.author.firstName} ${comment.author.lastName}`}
                  />
                )}
                <AvatarFallback className="bg-secondary text-sm text-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {comment.author.firstName} {comment.author.lastName}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                    {currentUserId === comment.author.id && (
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="text-muted-foreground transition-colors hover:text-red-500"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-xs text-skolaroid-blue hover:underline disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Input — only shown when authenticated and not collapsed */}
      {!isCollapsed && currentUserId && (
        <div className="mt-2">
          <CommentInput
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            controlledText={commentText}
            onControlledTextChange={onCommentTextChange}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Isolated input — supports both uncontrolled (base page) and controlled
// (overlay pages, display-only) modes via optional controlledText prop.
// ---------------------------------------------------------------------------

function CommentInput({
  onSubmit,
  isSubmitting,
  controlledText,
  onControlledTextChange,
}: {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
  controlledText?: string;
  onControlledTextChange?: (text: string) => void;
}) {
  const [internalText, setInternalText] = useState('');

  // Use controlled value when provided, otherwise use internal state
  const isControlled = controlledText !== undefined;
  const text = isControlled ? controlledText : internalText;

  function setText(value: string) {
    if (isControlled) {
      onControlledTextChange?.(value);
    } else {
      setInternalText(value);
    }
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Write a comment…"
        maxLength={2000}
        className="flex-1 border-2 border-border px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-skolaroid-blue"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isSubmitting}
        className="border-2 border-black bg-[#f6cb48] px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
        style={{ borderRadius: 0 }}
      >
        {isSubmitting ? 'Posting…' : 'Post'}
      </button>
    </div>
  );
}
