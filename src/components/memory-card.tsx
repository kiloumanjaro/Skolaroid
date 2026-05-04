'use client';

// TODO: Update next.config.ts images.remotePatterns when real media URLs
// (e.g., Supabase storage) are used instead of local placeholders.

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditTagsDialog } from '@/components/edit-tags-dialog';
import { Pencil } from 'lucide-react';
import { getPrimaryMemoryMediaURL } from '@/lib/memory-media';
import { VISIBILITY_LABELS, type MemoryWithRelations } from '@/lib/schemas';

interface MemoryCardProps {
  memory: MemoryWithRelations;
  isOwner?: boolean;
}

export function MemoryCard({ memory, isOwner = false }: MemoryCardProps) {
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const primaryMediaURL = getPrimaryMemoryMediaURL(memory);

  return (
    <>
      <Card className="overflow-hidden">
        {primaryMediaURL && (
          <div className="relative h-48 w-full">
            <Image
              src={primaryMediaURL}
              alt={memory.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{memory.title}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {VISIBILITY_LABELS[memory.visibility]}
            </Badge>
          </div>
          {memory.location && (
            <CardDescription>{memory.location.buildingName}</CardDescription>
          )}
        </CardHeader>
        {memory.description && (
          <CardContent>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {memory.description}
            </p>
          </CardContent>
        )}
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1">
            {memory.tags?.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditTagsOpen(true)}
                className="ml-1 text-muted-foreground hover:text-skolaroid-blue"
                aria-label="Edit tags"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
          {memory._count != null && <span>{memory._count.votes} votes</span>}
        </CardFooter>
      </Card>

      <EditTagsDialog
        open={editTagsOpen}
        onOpenChange={setEditTagsOpen}
        memory={memory}
      />
    </>
  );
}
