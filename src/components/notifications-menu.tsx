'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Trash2,
  FileCheck,
  FileMinus,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationsRead,
} from '@/lib/hooks/useNotifications';

function getIcon(type: string) {
  switch (type) {
    case 'MEMORY_APPROVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'MEMORY_REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'MEMORY_REMOVED':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'REPORT_RESOLVED':
      return <FileCheck className="h-4 w-4 text-blue-500" />;
    case 'REPORT_DISMISSED':
      return <FileMinus className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0, refetch: refetchUnreadCount } =
    useUnreadNotificationCount();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchNotifications,
  } = useNotifications({ enabled: open });
  const markRead = useMarkNotificationsRead();

  const notifications = data?.pages.flatMap((page) => page.data.items) ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      void refetchUnreadCount();
      void refetchNotifications();
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markRead.mutate(unreadIds);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 transition hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-skolaroid-blue hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-3"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!notification.read) {
                        markRead.mutate([notification.id]);
                      }
                    }}
                  >
                    <div className="flex w-full gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`break-words text-sm ${
                            notification.read
                              ? 'text-gray-600'
                              : 'font-medium text-gray-900'
                          }`}
                        >
                          {notification.message}
                        </p>
                        {notification.reason && (
                          <p className="mt-0.5 break-words text-xs italic text-gray-500">
                            Reason: {notification.reason}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-skolaroid-blue" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && (
                    <DropdownMenuSeparator />
                  )}
                </div>
              ))}
              {hasNextPage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer justify-center py-2 text-center text-sm text-gray-500 hover:text-gray-700"
                    onSelect={(e) => {
                      e.preventDefault();
                      fetchNextPage();
                    }}
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Load more'
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
