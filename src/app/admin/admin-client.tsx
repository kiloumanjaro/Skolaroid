'use client';

import { AdminAnnouncementStrip } from '@/components/announcement-strips/AdminAnnouncementStrip';
import { ADMIN_ANNOUNCEMENTS } from '@/components/announcement-strips/announcement-config';
import { useAdminToast } from '@/components/groups/GroupToast';
import { ShellInlineSidebarToggle } from '@/components/shared/shell/ShellInlineSidebarToggle';
import { useAdminAnalytics } from '@/lib/hooks/useAdminAnalytics';
import {
  useAdminMemories,
  type AdminMemoryItem,
} from '@/lib/hooks/useAdminMemories';
import {
  useAdminReports,
  type AdminReportItem,
} from '@/lib/hooks/useAdminReports';
import {
  useAuditLog,
  type AuditLogEntry,
  type AuditLogFilters,
} from '@/lib/hooks/useAuditLog';
import { LiveEventsTab } from '@/components/admin/LiveEventsTab';
import { useModerateMemory } from '@/lib/hooks/useModerateMemory';
import { useResolveReport } from '@/lib/hooks/useResolveReport';
import { getPrimaryMemoryMediaURL } from '@/lib/memory-media';
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarRange,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  Flag,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type AdminTab =
  | 'live-events'
  | 'analytics'
  | 'published'
  | 'pending'
  | 'reports'
  | 'audit';
type AnalyticsMemoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';

const tabLabels: Record<AdminTab, string> = {
  'live-events': 'Live Events',
  analytics: 'Analytics',
  published: 'Published Posts',
  pending: 'Pending Review',
  reports: 'Reports',
  audit: 'Audit Log',
};

const statusBadgeStyles: Record<
  AnalyticsMemoryStatus,
  { accent: string; surface: string; text: string }
> = {
  APPROVED: {
    accent: '#e8e8e8',
    surface: '#ffffff',
    text: 'text-foreground',
  },
  PENDING: {
    accent: '#e8e8e8',
    surface: '#ffffff',
    text: 'text-foreground',
  },
  REJECTED: {
    accent: '#e8e8e8',
    surface: '#ffffff',
    text: 'text-foreground',
  },
  REMOVED: {
    accent: '#e8e8e8',
    surface: '#ffffff',
    text: 'text-foreground',
  },
};

const numberFormatter = new Intl.NumberFormat('en-US');

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

function AnalyticsSummaryCard({
  eyebrow,
  title,
  description,
  bannerColor,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bannerColor: string;
}) {
  return (
    <article className="overflow-hidden border-2 border-border bg-white">
      <div
        className="border-b-2 border-border px-4 py-3"
        style={{ backgroundColor: bannerColor }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
          {eyebrow}
        </p>
      </div>
      <div className="p-4 pb-8 sm:p-5 sm:pb-9">
        <h3 className="max-w-[20ch] text-3xl font-black uppercase leading-none text-foreground sm:text-[2.1rem]">
          {title}
        </h3>
        <p className="mt-4 line-clamp-2 text-base leading-7 text-foreground/80">
          {description}
        </p>
      </div>
    </article>
  );
}

function PostCard({
  memory,
  onApprove,
  onReject,
  onRemove,
  isPending,
  isPublishedStyle = false,
}: {
  memory: AdminMemoryItem;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  isPending?: boolean;
  isPublishedStyle?: boolean;
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
  const StatusIcon =
    memory.moderationStatus === 'APPROVED'
      ? CheckCircle
      : memory.moderationStatus === 'PENDING'
        ? Clock
        : XCircle;
  const primaryMediaURL = getPrimaryMemoryMediaURL(memory);

  return (
    <div
      className={`flex gap-4 border-2 border-border bg-card p-4 ${
        isPublishedStyle ? 'items-center' : 'items-center'
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative h-28 w-40 shrink-0 overflow-hidden bg-secondary ${
          isPublishedStyle ? 'border-2 border-black' : ''
        }`}
      >
        <Image
          src={primaryMediaURL || '/assets/images/temporary_map.png'}
          alt="Post thumbnail"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p
          className={
            isPublishedStyle
              ? 'truncate whitespace-nowrap text-sm font-bold uppercase tracking-[0.04em] text-foreground'
              : 'truncate whitespace-nowrap text-sm font-medium text-foreground'
          }
        >
          {memory.title}
        </p>
        {memory.description &&
          memory.description.trim() !== memory.title.trim() && (
            <p
              className={
                isPublishedStyle
                  ? 'truncate whitespace-nowrap text-base leading-7 text-foreground'
                  : 'truncate whitespace-nowrap text-sm leading-relaxed text-muted-foreground'
              }
            ></p>
          )}

        {isPublishedStyle ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#e8e8e8] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-foreground">
                <StatusIcon size={12} />
                {statusLabel}
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      Approve
                    </span>
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      Reject
                    </span>
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={onRemove}
                    disabled={isPending}
                    className="flex items-center gap-1 text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                      Remove
                    </span>
                  </button>
                )}
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
              <Clock size={12} />
              {formatDate(memory.createdAt)}
            </span>
          </div>
        ) : (
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
        )}
      </div>

      {/* Author Info */}
      <div
        className={`flex shrink-0 flex-col items-center gap-1.5 pl-4 ${
          isPublishedStyle ? 'w-28 self-center' : 'w-24'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skolaroid-blue text-sm font-medium text-white">
          {authorName.charAt(0)}
        </div>
        <span
          className={
            isPublishedStyle
              ? 'line-clamp-2 w-full text-center text-[11px] font-bold uppercase leading-tight tracking-[0.08em] text-foreground'
              : 'line-clamp-2 w-full text-center text-xs font-medium leading-tight text-foreground'
          }
        >
          {authorName}
        </span>
        {batchYear && (
          <span
            className={
              isPublishedStyle
                ? 'w-full text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground'
                : 'w-full text-center text-[10px] text-muted-foreground'
            }
          >
            Batch {batchYear}
          </span>
        )}
        {!isPublishedStyle && (
          <>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              {statusLabel}
            </span>
            {memory._count.reports > 0 && (
              <span className="text-[10px] text-red-500">
                {memory._count.reports} report
                {memory._count.reports > 1 ? 's' : ''}
              </span>
            )}
          </>
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

  const { data, isLoading, isFetching, isError, refetch } =
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

  const analytics = data?.data;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredLocations =
    analytics == null
      ? []
      : normalizedQuery.length === 0
        ? analytics.topLocations
        : analytics.topLocations.filter((location) =>
            location.buildingName.toLowerCase().includes(normalizedQuery)
          );
  const filteredBatches =
    analytics == null
      ? []
      : normalizedQuery.length === 0
        ? analytics.batchEngagementRates
        : analytics.batchEngagementRates.filter((batch) =>
            `${batch.programName} ${batch.batchYear}`
              .toLowerCase()
              .includes(normalizedQuery)
          );
  const topLocation = analytics?.topLocations[0];
  const topBatch = analytics?.batchEngagementRates[0];
  const highlightedLocations = filteredLocations.slice(
    0,
    ANALYTICS_HIGHLIGHT_LIMIT
  );
  const highlightedBatches = filteredBatches.slice(
    0,
    ANALYTICS_HIGHLIGHT_LIMIT
  );
  const topLocationShare =
    topLocation && analytics && analytics.totals.memories > 0
      ? Number(
          ((topLocation.memoryCount / analytics.totals.memories) * 100).toFixed(
            1
          )
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="border-2 border-border bg-card px-5 py-4 sm:px-6">
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
                className="h-[36px] w-20 border-2 border-border bg-background px-3 text-sm focus:border-skolaroid-blue focus:outline-none"
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
      {isError && !analytics ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading && !analytics ? (
        <LoadingState />
      ) : !analytics ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No analytics data available.
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <AnalyticsSummaryCard
                eyebrow="Total Memories"
                title={formatCount(analytics.totals.memories)}
                description="Published and archived memory posts currently tracked across the platform."
                bannerColor="#e8e8e8"
              />

              <AnalyticsSummaryCard
                eyebrow={`Active Users (${analytics.windowDays}d)`}
                title={formatCount(analytics.totals.activeUsers)}
                description={`${formatPercent(analytics.totals.activeUserRate)} of ${formatCount(analytics.totals.users)} users contributed activity in this range.`}
                bannerColor="#e8e8e8"
              />

              <AnalyticsSummaryCard
                eyebrow="Most Photographed Location"
                title={topLocation?.buildingName ?? 'No Data Yet'}
                description={
                  topLocation
                    ? `${formatCount(topLocation.memoryCount)} memories, making up ${formatPercent(topLocationShare)} of all uploads.`
                    : 'No uploaded memories yet.'
                }
                bannerColor="#e8e8e8"
              />

              <AnalyticsSummaryCard
                eyebrow="Top Batch Engagement"
                title={
                  topBatch
                    ? formatPercent(topBatch.engagementRate)
                    : 'No Activity Yet'
                }
                description={
                  topBatch
                    ? `${topBatch.programName} Batch ${topBatch.batchYear} has the strongest engagement.`
                    : 'No batch activity yet.'
                }
                bannerColor="#e8e8e8"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="flex flex-col self-start border-2 border-border bg-white">
                <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-[#e8e8e8] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-foreground" />
                    <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
                      Location Highlights
                    </h2>
                  </div>
                  <span className="border-2 border-border bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
                    Top {highlightedLocations.length}
                  </span>
                </div>

                {highlightedLocations.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No locations match your search.
                  </p>
                ) : (
                  <div className="grid gap-0">
                    {highlightedLocations.map((location) => (
                      <div
                        key={location.locationId}
                        className="grid grid-cols-[auto,1fr] items-center gap-3 border-b-2 border-border px-4 py-3 last:border-b-0 sm:grid-cols-[auto,1fr,auto]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-background text-xs font-black text-foreground">
                          #{location.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold uppercase tracking-[0.04em] text-foreground">
                            {location.buildingName}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:justify-self-end">
                          {formatCount(location.memoryCount)} memories
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {filteredLocations.length > ANALYTICS_HIGHLIGHT_LIMIT && (
                  <p className="border-t-2 border-border px-4 py-3 text-xs text-muted-foreground">
                    Showing top {ANALYTICS_HIGHLIGHT_LIMIT} of{' '}
                    {formatCount(filteredLocations.length)} matching locations.
                  </p>
                )}
              </section>

              <section className="flex h-full flex-col border-2 border-border bg-white">
                <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-[#e8e8e8] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-foreground" />
                    <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
                      Batch Highlights ({analytics.windowDays}d)
                    </h2>
                  </div>
                  <span className="border-2 border-border bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
                    Top {highlightedBatches.length}
                  </span>
                </div>

                {highlightedBatches.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No batches match your search.
                  </p>
                ) : (
                  <div className="grid gap-0">
                    {highlightedBatches.map((batch) => (
                      <div
                        key={batch.programBatchId}
                        className="grid gap-3 border-b-2 border-border px-4 py-3 last:border-b-0"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold uppercase tracking-[0.04em] text-foreground">
                              {batch.programName}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              Batch {batch.batchYear}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
                              {formatCount(batch.activeUsers)} active of{' '}
                              {formatCount(batch.totalUsers)} users
                            </p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {formatPercent(batch.engagementRate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredBatches.length > ANALYTICS_HIGHLIGHT_LIMIT && (
                  <p className="border-t-2 border-border px-4 py-3 text-xs text-muted-foreground">
                    Showing top {ANALYTICS_HIGHLIGHT_LIMIT} of{' '}
                    {formatCount(filteredBatches.length)} matching batches.
                  </p>
                )}
              </section>
            </div>

            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-foreground">
                Memory Moderation Breakdown
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {analytics.memoriesByStatus.map((status) => (
                  <article
                    key={status.status}
                    className={`border-2 border-border ${statusBadgeStyles[status.status as AnalyticsMemoryStatus].text}`}
                    style={{
                      backgroundColor:
                        statusBadgeStyles[
                          status.status as AnalyticsMemoryStatus
                        ].surface,
                    }}
                  >
                    <div
                      className="border-b-2 border-border px-3 py-2"
                      style={{
                        backgroundColor:
                          statusBadgeStyles[
                            status.status as AnalyticsMemoryStatus
                          ].accent,
                      }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                        {status.status.toLowerCase()}
                      </p>
                    </div>
                    <div className="px-3 py-3">
                      <p className="text-2xl font-black leading-none">
                        {formatCount(status.count)}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/65">
                        total memories
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <p className="text-xs text-muted-foreground">
              Active users are calculated from the last {analytics.windowDays}{' '}
              days of memory uploads, comments, votes, and reports.
            </p>
          </div>

          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55">
              <div className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating analytics...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PublishedPostsContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminMemories('APPROVED');
  const moderateMemory = useModerateMemory();
  const { showSuccess, showError, ToastPortal } = useAdminToast();

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
    <>
      <ToastPortal />
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((memory) => (
          <PostCard
            key={memory.id}
            memory={memory}
            isPublishedStyle
            onRemove={() =>
              moderateMemory.mutate(
                { memoryId: memory.id, action: 'REMOVED' },
                {
                  onSuccess: () => showSuccess('Memory removed successfully.'),
                  onError: (err) =>
                    showError(err.message || 'Failed to remove memory.'),
                }
              )
            }
            isPending={moderateMemory.isPending}
          />
        ))}
      </div>
    </>
  );
}

function PendingReviewContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminMemories('PENDING');
  const moderateMemory = useModerateMemory();
  const { showSuccess, showError, ToastPortal } = useAdminToast();

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
    <>
      <ToastPortal />
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((memory) => (
          <PostCard
            key={memory.id}
            memory={memory}
            isPublishedStyle
            onApprove={() =>
              moderateMemory.mutate(
                { memoryId: memory.id, action: 'APPROVED' },
                {
                  onSuccess: () => showSuccess('Memory approved successfully.'),
                  onError: (err) =>
                    showError(err.message || 'Failed to approve memory.'),
                }
              )
            }
            onReject={() =>
              moderateMemory.mutate(
                { memoryId: memory.id, action: 'REJECTED' },
                {
                  onSuccess: () => showSuccess('Memory rejected.'),
                  onError: (err) =>
                    showError(err.message || 'Failed to reject memory.'),
                }
              )
            }
            isPending={moderateMemory.isPending}
          />
        ))}
      </div>
    </>
  );
}

function ReportsContent({ searchQuery }: { searchQuery: string }) {
  const { data, isLoading, isError, refetch } = useAdminReports();
  const resolveReport = useResolveReport();
  const { showSuccess, showError, ToastPortal } = useAdminToast();

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
    <>
      <ToastPortal />
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
                      resolveReport.mutate(
                        { reportId: report.id, action: 'RESOLVED' },
                        {
                          onSuccess: () =>
                            showSuccess('Report resolved successfully.'),
                          onError: (err) =>
                            showError(
                              err.message || 'Failed to resolve report.'
                            ),
                        }
                      )
                    }
                    disabled={resolveReport.isPending}
                    className="flex items-center gap-1 text-xs text-green-600 transition-colors hover:text-green-800 disabled:opacity-50"
                  >
                    <CheckCircle size={12} />
                    Resolve
                  </button>
                  <button
                    onClick={() =>
                      resolveReport.mutate(
                        { reportId: report.id, action: 'DISMISSED' },
                        {
                          onSuccess: () => showSuccess('Report dismissed.'),
                          onError: (err) =>
                            showError(
                              err.message || 'Failed to dismiss report.'
                            ),
                        }
                      )
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
    </>
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
      <section className="border-2 border-border bg-card px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <ArrowUpDown size={18} className="text-foreground" />
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Audit Filters
              </h2>
            </div>
            <p className="text-sm text-muted-foreground sm:text-base">
              Narrow moderation history by action type, date range, and sort
              order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-[36px] appearance-none border-2 border-border bg-background py-1.5 pl-3 pr-8 text-sm focus:border-skolaroid-blue focus:outline-none"
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

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-[36px] border-2 border-border bg-background px-3 text-sm focus:border-skolaroid-blue focus:outline-none"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-[36px] border-2 border-border bg-background px-3 text-sm focus:border-skolaroid-blue focus:outline-none"
              />
            </div>

            <button
              onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1.5 border-2 border-black bg-background px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-secondary"
            >
              <ArrowUpDown size={12} />
              {sort === 'desc' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        </div>
      </section>

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

export function AdminPageClient() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('analytics');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: AdminTab[] = [
    'live-events',
    'analytics',
    'published',
    'pending',
    'reports',
    'audit',
  ];

  const searchPlaceholder =
    currentTab === 'live-events'
      ? 'Search events'
      : currentTab === 'analytics'
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
            <div className="flex items-center gap-3 sm:gap-4">
              <ShellInlineSidebarToggle />
              <div className="truncate text-3xl text-black sm:text-4xl md:text-5xl">
                Admin Center
              </div>
            </div>
          </div>

          <AdminAnnouncementStrip announcements={ADMIN_ANNOUNCEMENTS} />

          <div className="px-8 pb-8 pt-24">
            {/* Top Bar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* Tabs — scrollable on mobile so nothing is clipped */}
              <div className="flex items-center gap-6">
                <div className="scrollbar-hide flex gap-4 overflow-x-auto sm:flex-wrap sm:gap-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCurrentTab(tab)}
                      className={`shrink-0 text-sm font-medium transition-colors ${
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

              {/* Search & Filter — full width on mobile */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-2 border-border bg-card py-2 pl-9 pr-4 text-sm placeholder-muted-foreground focus:border-skolaroid-blue focus:outline-none sm:w-72 md:w-80"
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
            {currentTab === 'live-events' && (
              <LiveEventsTab searchQuery={searchQuery} />
            )}
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
