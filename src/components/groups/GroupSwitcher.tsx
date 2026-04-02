'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Globe, Lock, Check } from 'lucide-react';
import { type Group } from '@/lib/types/group';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

interface GroupSwitcherProps {
  groups: Group[];
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  onCreateGroup: () => void;
}

export function GroupSwitcher({
  groups,
  selectedGroup,
  onSelectGroup,
  onCreateGroup,
}: GroupSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-secondary"
      >
        {selectedGroup ? (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue/10 text-xs font-semibold text-skolaroid-blue">
              {selectedGroup.name.charAt(0)}
            </div>
            <span className="max-w-[180px] truncate text-sm font-semibold text-foreground">
              {selectedGroup.name}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            Select a group
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden border-2 border-border bg-card shadow-[3px_3px_0px_0px_#2d2d2d]"
          style={{ borderRadius: WOBBLY_RADIUS_MD }}
        >
          <div className="px-3 pb-1 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Your Groups
            </p>
          </div>

          <div className="scrollbar-hide max-h-52 overflow-y-auto py-1">
            {groups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    onSelectGroup(group);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary ${
                    isSelected ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue/10 text-xs font-semibold text-skolaroid-blue">
                    {group.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {group.name}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      {group.privacy === 'PUBLIC' ? (
                        <Globe size={10} />
                      ) : (
                        <Lock size={10} />
                      )}
                      {group.memberCount} members
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={14} className="shrink-0 text-skolaroid-blue" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-1.5">
            <button
              onClick={() => {
                onCreateGroup();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-skolaroid-blue transition-colors hover:bg-skolaroid-blue/5"
            >
              <Plus size={16} />
              Create New Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
