'use client';

import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  Users,
  Calendar,
  Crown,
  MessageSquare,
} from 'lucide-react';
import { type Group } from '@/lib/types/group';

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface AboutTabProps {
  group: Group;
}

export function AboutTab({ group }: AboutTabProps) {
  const ownerMember = group.members.find((m) => m.role === 'OWNER');

  return (
    <div className="space-y-6 px-1">
      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
          About
        </h3>
        {group.description ? (
          <p className="text-sm leading-relaxed text-gray-700">
            {group.description}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400">
            No description provided.
          </p>
        )}
      </div>

      {/* Group Message */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Group Message
        </h3>
        {group.message ? (
          <div className="flex items-start gap-2.5 rounded border border-border/50 bg-postit/30 px-3 py-2.5">
            <MessageSquare
              size={15}
              className="mt-0.5 shrink-0 text-gray-400"
            />
            <p className="text-sm leading-relaxed text-gray-700">
              {group.message}
            </p>
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">No message set.</p>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Details
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            {group.privacy === 'PUBLIC' ? (
              <Globe size={15} className="shrink-0 text-gray-400" />
            ) : (
              <Lock size={15} className="shrink-0 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {group.privacy === 'PUBLIC' ? 'Public' : 'Private'} group
            </span>
          </div>

          <div className="flex items-center gap-3">
            {group.visibility === 'VISIBLE' ? (
              <Eye size={15} className="shrink-0 text-gray-400" />
            ) : (
              <EyeOff size={15} className="shrink-0 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {group.visibility === 'VISIBLE' ? 'Visible' : 'Hidden'} in search
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Users size={15} className="shrink-0 text-gray-400" />
            <span className="text-sm text-gray-600">
              {group.memberCount} members
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={15} className="shrink-0 text-gray-400" />
            <span className="text-sm text-gray-600">
              Created {formatFullDate(group.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Crown size={15} className="shrink-0 text-amber-500" />
            <span className="text-sm text-gray-600">
              Owned by {ownerMember?.name ?? 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
