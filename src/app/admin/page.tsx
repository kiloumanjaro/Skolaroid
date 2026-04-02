'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import {
  ArrowLeft,
  Search,
  Filter,
  Pencil,
  Copy,
  Trash2,
  Upload,
  ChevronDown,
  Clock,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import Image from 'next/image';

type AdminTab = 'published' | 'pending' | 'reports';

interface Post {
  id: string;
  thumbnail: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar: string;
    batch: number;
    verified: boolean;
  };
  status: string;
}

interface Report {
  id: string;
  postId: string;
  reason: string;
  reportedBy: string;
  date: string;
  status: 'open' | 'resolved' | 'dismissed';
}

const mockPublishedPosts: Post[] = [
  {
    id: '1',
    thumbnail: '/assets/images/temporary_map.png',
    description:
      "From freshman orientations to professional milestones, the [School Name] bond stays strong. We're building a digital time capsule on our new Alumni Memory site, and we want your story to be part of it.",
    date: 'January 10, 2026, 12:30 PM',
    author: {
      name: 'Kint Louise',
      avatar: '',
      batch: 27,
      verified: true,
    },
    status: 'Published',
  },
  {
    id: '2',
    thumbnail: '/assets/images/temporary_map.png',
    description:
      "From freshman orientations to professional milestones, the [School Name] bond stays strong. We're building a digital time capsule on our new Alumni Memory site, and we want your story to be part of it.",
    date: 'January 10, 2026, 12:30 PM',
    author: {
      name: 'Kint Louise',
      avatar: '',
      batch: 27,
      verified: true,
    },
    status: 'Published',
  },
];

const mockPendingPosts: Post[] = [
  {
    id: '3',
    thumbnail: '/assets/images/temporary_map.png',
    description:
      "From freshman orientations to professional milestones, the [School Name] bond stays strong. We're building a digital time capsule on our new Alumni Memory site, and we want your story to be part of it.",
    date: 'January 10, 2026, 12:30 PM',
    author: {
      name: 'Kint Louise',
      avatar: '',
      batch: 27,
      verified: true,
    },
    status: 'Awaiting Approval',
  },
  {
    id: '4',
    thumbnail: '/assets/images/temporary_map.png',
    description:
      "From freshman orientations to professional milestones, the [School Name] bond stays strong. We're building a digital time capsule on our new Alumni Memory site, and we want your story to be part of it.",
    date: 'January 10, 2026, 12:30 PM',
    author: {
      name: 'Kint Louise',
      avatar: '',
      batch: 27,
      verified: true,
    },
    status: 'Awaiting Approval',
  },
  {
    id: '5',
    thumbnail: '/assets/images/temporary_map.png',
    description:
      "From freshman orientations to professional milestones, the [School Name] bond stays strong. We're building a digital time capsule on our new Alumni Memory site, and we want your story to be part of it.",
    date: 'January 10, 2026, 12:30 PM',
    author: {
      name: 'Kint Louise',
      avatar: '',
      batch: 27,
      verified: true,
    },
    status: 'Awaiting Approval',
  },
];

const mockReports: Report[] = [
  {
    id: 'r1',
    postId: '1',
    reason: 'Inappropriate content — contains offensive language',
    reportedBy: 'Jane Doe',
    date: 'January 12, 2026, 3:45 PM',
    status: 'open',
  },
  {
    id: 'r2',
    postId: '2',
    reason: 'Spam or misleading information',
    reportedBy: 'John Smith',
    date: 'January 11, 2026, 9:15 AM',
    status: 'open',
  },
  {
    id: 'r3',
    postId: '1',
    reason: 'Copyright violation — image used without permission',
    reportedBy: 'Alex Cruz',
    date: 'January 10, 2026, 5:00 PM',
    status: 'resolved',
  },
];

const tabLabels: Record<AdminTab, string> = {
  published: 'Published Posts',
  pending: 'Pending Review',
  reports: 'Reports',
};

function PostCard({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-4 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_#2d2d2d]">
      {/* Checkbox */}
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-border"
      />

      {/* Thumbnail */}
      <div className="relative h-28 w-40 shrink-0 overflow-hidden bg-secondary">
        <Image
          src={post.thumbnail}
          alt="Post thumbnail"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm leading-relaxed text-foreground">
          {post.description}
        </p>

        <div className="flex items-center gap-4">
          {/* Date */}
          <span className="flex items-center gap-1.5 text-xs text-skolaroid-blue">
            <Clock size={12} />
            {post.date}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground transition-colors hover:text-foreground">
              <Pencil size={14} />
            </button>
            <button className="text-muted-foreground transition-colors hover:text-foreground">
              <Copy size={14} />
            </button>
            <button className="text-red-300 transition-colors hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Send for review button */}
          <button className="flex items-center gap-1.5 border-2 border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary">
            <Upload size={12} />
            Send for client review
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Author Info */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 pl-4">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skolaroid-blue text-sm font-medium text-white">
            {post.author.name.charAt(0)}
          </div>
          {post.author.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-skolaroid-blue text-white">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M6.5 2L3 5.5L1.5 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-foreground">
          {post.author.name}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Posted on Batch {post.author.batch}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock size={10} />
          {post.status}
        </span>
      </div>
    </div>
  );
}

function PublishedPostsContent({ searchQuery }: { searchQuery: string }) {
  const filtered = mockPublishedPosts.filter((post) =>
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No published posts found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function PendingReviewContent({ searchQuery }: { searchQuery: string }) {
  const filtered = mockPendingPosts.filter((post) =>
    post.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No posts pending review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

function ReportsContent({ searchQuery }: { searchQuery: string }) {
  const filtered = mockReports.filter(
    (report) =>
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No reports found.
      </div>
    );
  }

  const statusStyles: Record<Report['status'], string> = {
    open: 'bg-red-50 text-red-600',
    resolved: 'bg-green-50 text-green-600',
    dismissed: 'bg-secondary text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {filtered.map((report) => (
        <div
          key={report.id}
          className="flex items-start gap-4 border-2 border-border bg-card p-4 shadow-[4px_4px_0px_0px_#2d2d2d]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            {report.status === 'open' ? (
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
              <span>Post #{report.postId}</span>
              <span>Reported by {report.reportedBy}</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {report.date}
              </span>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[report.status]}`}
          >
            {report.status}
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
