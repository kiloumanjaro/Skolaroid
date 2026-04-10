'use client';

import { useState } from 'react';
import { Plus, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MemoryCard } from '@/components/memory-card';
import { AddMemoryModal } from '@/components/add-memory-modal';
import { useGroupMemories } from '@/lib/hooks/useGroupMemories';
import { Group } from '@/lib/types/group';

interface MediaTabProps {
  group: Group;
}

export function MediaTab({ group }: MediaTabProps) {
  const [addMemoryOpen, setAddMemoryOpen] = useState(false);
  const {
    data: memories,
    isLoading,
    error,
    refetch,
  } = useGroupMemories(group.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error.message || 'Failed to load memories'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const hasMemories = memories && memories.length > 0;

  return (
    <div className="space-y-4 px-5 py-4">
      {/* Header with post count and add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {group.postCount} {group.postCount === 1 ? 'Post' : 'Posts'}
        </h3>
        <Button onClick={() => setAddMemoryOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Post
        </Button>
      </div>

      {/* Memory Grid or Empty State */}
      {hasMemories ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No posts yet</p>
          <Button variant="outline" onClick={() => setAddMemoryOpen(true)}>
            Create First Post
          </Button>
        </div>
      )}

      {/* Add Memory Modal */}
      <AddMemoryModal
        open={addMemoryOpen}
        onOpenChange={setAddMemoryOpen}
        defaultGroupId={group.id}
      />
    </div>
  );
}
