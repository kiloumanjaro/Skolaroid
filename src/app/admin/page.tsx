'use client';

import { useState } from 'react';
import {
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
  ChevronDown,
  ArrowUpDown,
  Camera,
  Users,
  MapPin,
  BarChart3,
  CalendarRange,
} from 'lucide-react';
import Image from 'next/image';
import {
  useAdminMemories,
  type AdminMemoryItem,
} from '@/lib/hooks/useAdminMemories';
import { useAdminAnalytics } from '@/lib/hooks/useAdminAnalytics';
import { useModerateMemory } from '@/lib/hooks/useModerateMemory';
import {
  useAdminReports,
  type AdminReportItem,
} from '@/lib/hooks/useAdminReports';
import { useResolveReport } from '@/lib/hooks/useResolveReport';
import {
  useAuditLog,
  type AuditLogFilters,
  type AuditLogEntry,
} from '@/lib/hooks/useAuditLog';
import { AdminAnnouncementStrip } from '@/components/announcement-strips/AdminAnnouncementStrip';
import { ShellInlineSidebarToggle } from '@/components/shell-inline-sidebar-toggle';

type AdminTab = 'analytics' | 'published' | 'pending' | 'reports' | 'audit';
type AnalyticsMemoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';

const tabLabels: Record<AdminTab, string> = {
  analytics: 'Analytics',
  published: 'Published Posts',
  pending: 'Pending Review',
  reports: 'Reports',
  audit: 'Audit Log',
};

const statusBadgeStyles: Record<AnalyticsMemoryStatus, string> = {
  APPROVED: 'bg-green-50 text-green-700',
  PENDING: 'bg-yellow-50 text-yellow-700',
  REJECTED: 'bg-orange-50 text-orange-700',
  REMOVED: 'bg-red-50 text-red-700',
};

const numberFormatter = new Intl.NumberFormat('en-US');
const adminAnnouncements = [
  'Review pending memories before they go live',
  'Track reports, moderation actions, and audit history',
  'Keep the archive safe, accurate, and community-ready',
];

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

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

const MIN_ANALYTICS_WINDOW_DAYS = 7;
const MAX_ANALYTICS_WINDOW_DAYS = 365;
const DEFAULT_ANALYTICS_WINDOW_DAYS = 30;
const ANALYTICS_WINDOW_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;
const ANALYTICS_HIGHLIGHT_LIMIT = 5;

function clampAnalyticsWindowDays(days: number): number {
  return Math.min(
    MAX_ANALYTICS_WINDOW_DAYS,
    Math.max(MIN_ANALYTICS_WINDOW_DAYS, Math.round(days))
  );
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
    <div className="flex items-center gap-4 border-2 border-border bg-card p-4">
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

function AnalyticsContent({ searchQuery }: { searchQuery: string }) {
  const [selectedWindowDays, setSelectedWindowDays] = useState(
    DEFAULT_ANALYTICS_WINDOW_DAYS
  );
  const [customWindowDays, setCustomWindowDays] = useState(
    String(DEFAULT_ANALYTICS_WINDOW_DAYS)
  );

  const { data, isLoading, isError, refetch } =
    useAdminAnalytics(selectedWindowDays);

  const handlePresetClick = (days: number) => {
    setSelectedWindowDays(days);
    setCustomWindowDays(String(days));
  };

  const applyCustomWindowDays = () => {
    const parsedValue = Number(customWindowDays);

    if (!Number.isFinite(parsedValue)) {
      setCustomWindowDays(String(selectedWindowDays));
      return;
    }

    const clampedValue = clampAnalyticsWindowDays(parsedValue);
    setSelectedWindowDays(clampedValue);
    setCustomWindowDays(String(clampedValue));
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const analytics = data?.data;

  if (!analytics) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredLocations =
    normalizedQuery.length === 0
      ? analytics.topLocations
      : analytics.topLocations.filter((location) =>
          location.buildingName.toLowerCase().includes(normalizedQuery)
        );

  const filteredBatches =
    normalizedQuery.length === 0
      ? analytics.batchEngagementRates
      : analytics.batchEngagementRates.filter((batch) =>
          `${batch.programName} ${batch.batchYear}`
            .toLowerCase()
            .includes(normalizedQuery)
        );

  const topLocation = analytics.topLocations[0];
  const topBatch = analytics.batchEngagementRates[0];

  const highlightedLocations = filteredLocations.slice(
    0,
    ANALYTICS_HIGHLIGHT_LIMIT
  );
  const highlightedBatches = filteredBatches.slice(
    0,
    ANALYTICS_HIGHLIGHT_LIMIT
  );

  const topLocationShare =
    topLocation && analytics.totals.memories > 0
      ? Number(
          ((topLocation.memoryCount / analytics.totals.memories) * 100).toFixed(
            1
          )
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="border-2 border-border bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <CalendarRange size={18} className="text-foreground" />
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Analytics Window
              </h2>
            </div>
            <p className="text-sm text-muted-foreground sm:text-base">
              Switch the reporting range to compare activity trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ANALYTICS_WINDOW_PRESETS.map((days) => {
              const isActive = selectedWindowDays === days;

              return (
                <button
                  key={days}
                  onClick={() => handlePresetClick(days)}
                  className={`border-2 border-black px-3 py-1.5 text-sm font-medium text-black transition-colors ${
                    isActive
                      ? 'bg-[#f6cb48]'
                      : 'bg-background hover:bg-secondary'
                  }`}
                >
                  {days}d
                </button>
              );
            })}

            <div className="ml-0 flex items-center gap-2 sm:ml-2">
              <input
                type="number"
                min={MIN_ANALYTICS_WINDOW_DAYS}
                max={MAX_ANALYTICS_WINDOW_DAYS}
                value={customWindowDays}
                onChange={(event) => setCustomWindowDays(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applyCustomWindowDays();
                  }
                }}
                className="w-20 border-2 border-border bg-background px-2 py-1 text-xs focus:border-skolaroid-blue focus:outline-none"
                aria-label="Custom analytics range in days"
              />
              <button
                onClick={applyCustomWindowDays}
                className="border-2 border-black bg-background px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-secondary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="border-2 border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-skolaroid-blue/10 text-skolaroid-blue">
            <Camera size={16} />
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Total Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatCount(analytics.totals.memories)}
          </p>
        </div>

        <div className="border-2 border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Users size={16} />
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Active Users ({analytics.windowDays}d)
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatCount(analytics.totals.activeUsers)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatPercent(analytics.totals.activeUserRate)} of{' '}
            {formatCount(analytics.totals.users)} users
          </p>
        </div>

        <div className="border-2 border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <MapPin size={16} />
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Most Photographed Location
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {topLocation?.buildingName ?? 'No data yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {topLocation
              ? `${formatCount(topLocation.memoryCount)} memories (${formatPercent(topLocationShare)} of all memories)`
              : 'No uploaded memories yet'}
          </p>
        </div>

        <div className="border-2 border-border bg-card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BarChart3 size={16} />
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Top Batch Engagement
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {topBatch ? formatPercent(topBatch.engagementRate) : '0.0%'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {topBatch
              ? `${topBatch.programName} Batch ${topBatch.batchYear}`
              : 'No batch activity yet'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex h-full flex-col border-2 border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-skolaroid-blue" />
            <h2 className="text-sm font-semibold text-foreground">
              Location Highlights
            </h2>
          </div>

          {highlightedLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locations match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {highlightedLocations.map((location) => (
                <div
                  key={location.locationId}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                      {location.rank}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {location.buildingName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatCount(location.memoryCount)} memories
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredLocations.length > ANALYTICS_HIGHLIGHT_LIMIT && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing top {ANALYTICS_HIGHLIGHT_LIMIT} of{' '}
              {formatCount(filteredLocations.length)} matching locations.
            </p>
          )}
        </section>

        <section className="flex h-full flex-col border-2 border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users size={16} className="text-skolaroid-blue" />
            <h2 className="text-sm font-semibold text-foreground">
              Batch Highlights ({analytics.windowDays}d)
            </h2>
          </div>

          {highlightedBatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No batches match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {highlightedBatches.map((batch) => (
                <div
                  key={batch.programBatchId}
                  className="rounded-md border border-border/70 bg-background px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {batch.programName} Batch {batch.batchYear}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-skolaroid-blue">
                      {formatPercent(batch.engagementRate)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCount(batch.activeUsers)} active of{' '}
                    {formatCount(batch.totalUsers)} users
                  </p>
                </div>
              ))}
            </div>
          )}

          {filteredBatches.length > ANALYTICS_HIGHLIGHT_LIMIT && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing top {ANALYTICS_HIGHLIGHT_LIMIT} of{' '}
              {formatCount(filteredBatches.length)} matching batches.
            </p>
          )}
        </section>
      </div>

      <section className="border-2 border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Memory Moderation Breakdown
        </h2>
        <div className="flex flex-wrap gap-2">
          {analytics.memoriesByStatus.map((status) => (
            <span
              key={status.status}
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeStyles[status.status as AnalyticsMemoryStatus]}`}
            >
              {status.status.toLowerCase()}:{' '}
              <span className="font-semibold">{formatCount(status.count)}</span>
            </span>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Active users are calculated from the last {analytics.windowDays} days of
        memory uploads, comments, votes, and reports.
      </p>
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
          className="flex items-start gap-4 border-2 border-border bg-card p-4"
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

const ACTION_LABELS: Record<string, string> = {
  MEMORY_APPROVED: 'Memory Approved',
  MEMORY_REJECTED: 'Memory Rejected',
  MEMORY_REMOVED: 'Memory Removed',
  MEMORY_RESTORED: 'Memory Restored',
  REPORT_OPENED: 'Report Opened',
  REPORT_RESOLVED: 'Report Resolved',
  REPORT_DISMISSED: 'Report Dismissed',
};

const ACTION_COLORS: Record<string, string> = {
  MEMORY_APPROVED: 'bg-green-50 text-green-600',
  MEMORY_REJECTED: 'bg-yellow-50 text-yellow-600',
  MEMORY_REMOVED: 'bg-red-50 text-red-600',
  MEMORY_RESTORED: 'bg-blue-50 text-blue-600',
  REPORT_OPENED: 'bg-red-50 text-red-600',
  REPORT_RESOLVED: 'bg-green-50 text-green-600',
  REPORT_DISMISSED: 'bg-secondary text-muted-foreground',
};

const ALL_ACTIONS = [
  'MEMORY_APPROVED',
  'MEMORY_REJECTED',
  'MEMORY_REMOVED',
  'MEMORY_RESTORED',
  'REPORT_OPENED',
  'REPORT_RESOLVED',
  'REPORT_DISMISSED',
] as const;

function AuditLogContent({ searchQuery }: { searchQuery: string }) {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');

  const filters: AuditLogFilters = {
    action: actionFilter || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo
      ? new Date(dateTo + 'T23:59:59.999Z').toISOString()
      : undefined,
    sort,
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuditLog(filters);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const allEntries = data?.pages.flatMap((page) => page.data.items) ?? [];

  const filtered = allEntries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const adminName =
      `${entry.admin.firstName} ${entry.admin.lastName}`.toLowerCase();
    const targetTitle =
      entry.targetMemory?.title?.toLowerCase() ??
      entry.targetReport?.reason?.toLowerCase() ??
      '';
    return adminName.includes(query) || targetTitle.includes(query);
  });

  function getTargetLabel(entry: AuditLogEntry): string {
    if (entry.targetType === 'MEMORY') {
      return entry.targetMemory?.title ?? 'Deleted memory';
    }
    if (entry.targetType === 'REPORT') {
      return entry.targetReport
        ? `Report: ${entry.targetReport.reason}`
        : 'Deleted report';
    }
    return 'Unknown target';
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 border-2 border-border bg-card p-3">
        {/* Action type filter */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="appearance-none border-2 border-border bg-background py-1.5 pl-3 pr-8 text-xs focus:border-skolaroid-blue focus:outline-none"
          >
            <option value="">All Actions</option>
            {ALL_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action]}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border-2 border-border bg-background px-2 py-1.5 text-xs focus:border-skolaroid-blue focus:outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border-2 border-border bg-background px-2 py-1.5 text-xs focus:border-skolaroid-blue focus:outline-none"
          />
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 border-2 border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowUpDown size={12} />
          {sort === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No moderation actions found.
        </div>
      ) : (
        <>
          {filtered.map((entry) => {
            const adminName = `${entry.admin.firstName} ${entry.admin.lastName}`;
            return (
              <div
                key={entry.id}
                className="flex items-start gap-4 border-2 border-border bg-card p-4"
              >
                {/* Admin avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue text-sm font-medium text-white">
                  {entry.admin.firstName.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {adminName}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${ACTION_COLORS[entry.action] ?? 'bg-secondary text-muted-foreground'}`}
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {getTargetLabel(entry)}
                  </p>

                  {entry.reason && (
                    <p className="text-xs italic text-muted-foreground">
                      Reason: {entry.reason}
                    </p>
                  )}

                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-1.5 border-2 border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('analytics');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: AdminTab[] = [
    'analytics',
    'published',
    'pending',
    'reports',
    'audit',
  ];

  const searchPlaceholder =
    currentTab === 'analytics'
      ? 'Search locations or batches'
      : currentTab === 'reports'
        ? 'Search reports'
        : currentTab === 'audit'
          ? 'Search admins or targets'
          : 'Search posts';

  const showPostFilter = currentTab === 'published' || currentTab === 'pending';

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="relative overflow-hidden">
          <div className="absolute left-4 top-12 z-20 sm:left-6 sm:top-14">
            <div className="flex items-center gap-6">
              <ShellInlineSidebarToggle />
              <div className="font-dancing text-4xl text-black">
                Admin Dashboard
              </div>
            </div>
          </div>

          <AdminAnnouncementStrip announcements={adminAnnouncements} />

          <div className="px-8 pb-8 pt-24">
            {/* Top Bar */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Tabs */}
                <div className="flex flex-wrap gap-4 sm:gap-6">
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
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 border-2 border-border bg-card py-2 pl-9 pr-4 text-sm placeholder-muted-foreground focus:border-skolaroid-blue focus:outline-none sm:w-80"
                  />
                </div>
                {showPostFilter && (
                  <button className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                    <Filter size={14} />
                    Filter Posts
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {currentTab === 'analytics' && (
              <AnalyticsContent searchQuery={searchQuery} />
            )}
            {currentTab === 'published' && (
              <PublishedPostsContent searchQuery={searchQuery} />
            )}
            {currentTab === 'pending' && (
              <PendingReviewContent searchQuery={searchQuery} />
            )}
            {currentTab === 'reports' && (
              <ReportsContent searchQuery={searchQuery} />
            )}
            {currentTab === 'audit' && (
              <AuditLogContent searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
