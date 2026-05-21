'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTags } from '@/lib/hooks/useTags';
import { MAX_TAGS, MAX_TAG_SUGGESTIONS } from '@/lib/schemas';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagInput({ tags, onTagsChange }: TagInputProps) {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: tagsData } = useTags();

  const filteredSuggestions = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    if (!query) return [];
    const allTags = tagsData?.data ?? [];
    return allTags
      .filter(
        (t) => t.name.toLowerCase().includes(query) && !tags.includes(t.name)
      )
      .slice(0, MAX_TAG_SUGGESTIONS);
  }, [tagInput, tagsData?.data, tags]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onTagsChange([...tags, tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleSelectSuggestion = (name: string) => {
    onTagsChange([...tags, name]);
    setTagInput('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            placeholder="Add a tag and press Enter"
            maxLength={50}
            style={{ borderRadius: 0 }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
            className="!shadow-none transition-opacity active:translate-y-0 disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            Add
          </Button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(tag.name);
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1"
              style={{ borderRadius: 0 }}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
