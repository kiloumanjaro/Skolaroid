'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import {
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  Clock,
  AlertTriangle,
  Flag,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import {
  useAdminMemories,
  type AdminMemoryItem,
} from '@/lib/hooks/useAdminMemories';
import { useModerateMemory } from '@/lib/hooks/useModerateMemory';
import {
  useAdminReports,
  type AdminReportItem,
} from '@/lib/hooks/useAdminReports';
import { useResolveReport } from '@/lib/hooks/useResolveReport';

type AdminTab = 'published' | 'pending' | 'reports';

const tabLabels: Record<AdminTab, string> = {
  published: 'Published Posts',
  pending: 'Pending Review',
  reports: 'Reports',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <p className="text-sm text-red-500">
        Failed to load data. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 border-2 border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
      >
        <RefreshCw size={12} />
        Retry
      </button>
    </div>
  );
}

function PostCard({
  memory,
  onApprove,
  onReject,
  onRemove,
  isPending,
}: {
  memory: AdminMemoryItem;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  isPending?: boolean;
}) {
  const authorName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`
    : 'Unknown';
  const batchYear = memory.programBatch?.batch?.year;
  const statusLabel =
    memory.moderationStatus === 'APPROVED'
      ? 'Published'
      : memory.moderationStatus === 'PENDING'
        ? 'Awaiting Approval'
        : memory.moderationStatus;

  return (
    <div className="flex items-center gap-4 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_#2d2d2d]">
      {/* Thumbnail */}
      <div className="relative h-28 w-40 shrink-0 overflow-hidden bg-secondary">
        <Image
          src={memory.mediaURL || '/assets/images/temporary_map.png'}
          alt="Post thumbnail"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{memory.title}</p>
        {memory.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {memory.description}
          </p>
        )}

        <div className="flex items-center gap-4">
          {/* Date */}
          <span className="flex items-center gap-1.5 text-xs text-skolaroid-blue">
            <Clock size={12} />
            {formatDate(memory.createdAt)}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isPending}
                className="flex items-center gap-1 text-green-500 transition-colors hover:text-green-700 disabled:opacity-50"
                title="Approve"
              >
                <CheckCircle size={14} />
                <span className="text-xs">Approve</span>
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                disabled={isPending}
                className="flex items-center gap-1 text-yellow-500 transition-colors hover:text-yellow-700 disabled:opacity-50"
                title="Reject"
              >
                <XCircle size={14} />
                <span className="text-xs">Reject</span>
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                disabled={isPending}
                className="flex items-center gap-1 text-red-300 transition-colors hover:text-red-500 disabled:opacity-50"
                title="Remove"
              >
                <Trash2 size={14} />
                <span className="text-xs">Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 pl-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skolaroid-blue text-sm font-medium text-white">
          {authorName.charAt(0)}
        </div>
        <span className="text-xs font-medium text-foreground">
          {authorName}
        </span>
        {batchYear && (
          <span className="text-[10px] text-muted-foreground">
            Batch {batchYear}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock size={10} />
          {statusLabel}
        </span>
        {memory._count.reports > 0 && (
          <span className="text-[10px] text-red-500">
            {memory._count.reports} report{memory._count.reports > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function PublishedPostsContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminMemories('APPROVED');
  const moderateMemory = useModerateMemory();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const memories = data?.data ?? [];
  const filtered = memories.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      m.creator?.firstName.toLowerCase().includes(query) ||
      m.creator?.lastName.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No published posts found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((memory) => (
        <PostCard
          key={memory.id}
          memory={memory}
          onRemove={() =>
            moderateMemory.mutate({ memoryId: memory.id, action: 'REMOVED' })
          }
          isPending={moderateMemory.isPending}
        />
      ))}
    </div>
  );
}

function PendingReviewContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminMemories('PENDING');
  const moderateMemory = useModerateMemory();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const memories = data?.data ?? [];
  const filtered = memories.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      m.creator?.firstName.toLowerCase().includes(query) ||
      m.creator?.lastName.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No posts pending review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((memory) => (
        <PostCard
          key={memory.id}
          memory={memory}
          onApprove={() =>
            moderateMemory.mutate({ memoryId: memory.id, action: 'APPROVED' })
          }
          onReject={() =>
            moderateMemory.mutate({ memoryId: memory.id, action: 'REJECTED' })
          }
          isPending={moderateMemory.isPending}
        />
      ))}
    </div>
  );
}

function ReportsContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminReports();
  const resolveReport = useResolveReport();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const reports = data?.data ?? [];
  const filtered = reports.filter((report) => {
    const query = searchQuery.toLowerCase();
    const reporterName =
      `${report.reporter.firstName} ${report.reporter.lastName}`.toLowerCase();
    return (
      report.reason.toLowerCase().includes(query) ||
      reporterName.includes(query)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No reports found.
      </div>
    );
  }

  const statusStyles: Record<AdminReportItem['state'], string> = {
    OPEN: 'bg-red-50 text-red-600',
    RESOLVED: 'bg-green-50 text-green-600',
    DISMISSED: 'bg-secondary text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {filtered.map((report) => (
        <div
          key={report.id}
          className="flex items-start gap-4 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_#2d2d2d]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            {report.state === 'OPEN' ? (
              <AlertTriangle size={18} className="text-red-500" />
            ) : (
              <Flag size={18} className="text-muted-foreground" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground">
              {report.reason}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Memory: {report.memory.title}</span>
              <span>
                Reported by {report.reporter.firstName}{' '}
                {report.reporter.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatDate(report.createdAt)}
              </span>
            </div>

            {/* Action buttons for open reports */}
            {report.state === 'OPEN' && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() =>
                    resolveReport.mutate({
                      reportId: report.id,
                      action: 'RESOLVED',
                    })
                  }
                  disabled={resolveReport.isPending}
                  className="flex items-center gap-1 text-xs text-green-600 transition-colors hover:text-green-800 disabled:opacity-50"
                >
                  <CheckCircle size={12} />
                  Resolve
                </button>
                <button
                  onClick={() =>
                    resolveReport.mutate({
                      reportId: report.id,
                      action: 'DISMISSED',
                    })
                  }
                  disabled={resolveReport.isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <XCircle size={12} />
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[report.state]}`}
          >
            {report.state.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<AdminTab>('published');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: AdminTab[] = ['published', 'pending', 'reports'];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-8 pb-8 pt-24">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>

            {/* Tabs */}
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`text-sm font-medium transition-colors ${
                    currentTab === tab
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 border-2 border-border bg-card py-2 pl-9 pr-4 text-sm placeholder-muted-foreground focus:border-skolaroid-blue focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary">
              <Filter size={14} />
              Filter Posts
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {currentTab === 'published' && (
          <PublishedPostsContent searchQuery={searchQuery} />
        )}
        {currentTab === 'pending' && (
          <PendingReviewContent searchQuery={searchQuery} />
        )}
        {currentTab === 'reports' && (
          <ReportsContent searchQuery={searchQuery} />
        )}
      </main>
    </div>
  );
}
