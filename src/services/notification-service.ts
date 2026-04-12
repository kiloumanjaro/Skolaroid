import { prisma } from '@/lib/prisma';
import type { NotificationType as PrismaNotificationType } from '@/generated/prisma/client';

interface NotificationPayload {
  userId: string;
  type: PrismaNotificationType;
  title: string;
  message: string;
  targetMemoryId?: string;
  targetReportId?: string;
  reason?: string | null;
}

/**
 * Create a notification record in the database.
 * Failures are caught and logged — they never propagate to the caller,
 * so moderation transactions are never broken by notification delivery issues.
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        targetMemoryId: payload.targetMemoryId ?? null,
        targetReportId: payload.targetReportId ?? null,
        reason: payload.reason ?? null,
      },
    });
    console.log(
      `[notification-service] Sent ${payload.type} notification to user ${payload.userId}`
    );
  } catch (error) {
    console.error(
      `[notification-service] Failed to send ${payload.type} notification to user ${payload.userId}:`,
      error
    );
  }
}

const MEMORY_NOTIFICATION_TITLES: Record<string, string> = {
  APPROVED: 'Memory Approved',
  REJECTED: 'Memory Rejected',
  REMOVED: 'Memory Removed',
};

const MEMORY_NOTIFICATION_MESSAGES: Record<string, (title: string) => string> =
  {
    APPROVED: (title) =>
      `Your memory "${title}" has been approved and is now visible.`,
    REJECTED: (title) =>
      `Your memory "${title}" has been rejected by a moderator.`,
    REMOVED: (title) =>
      `Your memory "${title}" has been removed by a moderator.`,
  };

const MEMORY_ACTION_TO_TYPE: Record<string, PrismaNotificationType> = {
  APPROVED: 'MEMORY_APPROVED',
  REJECTED: 'MEMORY_REJECTED',
  REMOVED: 'MEMORY_REMOVED',
};

/**
 * Notify the memory creator about a moderation decision.
 * Looks up the memory to find the creator, then fires a notification.
 */
export async function notifyMemoryModeration(
  memoryId: string,
  action: 'APPROVED' | 'REJECTED' | 'REMOVED',
  reason?: string | null
): Promise<void> {
  try {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { creatorId: true, title: true },
    });

    if (!memory?.creatorId) return;

    await sendNotification({
      userId: memory.creatorId,
      type: MEMORY_ACTION_TO_TYPE[action],
      title: MEMORY_NOTIFICATION_TITLES[action],
      message: MEMORY_NOTIFICATION_MESSAGES[action](memory.title),
      targetMemoryId: memoryId,
      reason,
    });
  } catch (error) {
    console.error(
      `[notification-service] Failed to notify memory moderation for ${memoryId}:`,
      error
    );
  }
}

const REPORT_NOTIFICATION_CONFIG: Record<
  string,
  { type: PrismaNotificationType; title: string; message: string }
> = {
  RESOLVED: {
    type: 'REPORT_RESOLVED',
    title: 'Report Resolved',
    message:
      'Your report has been reviewed and resolved. Action has been taken.',
  },
  DISMISSED: {
    type: 'REPORT_DISMISSED',
    title: 'Report Dismissed',
    message:
      'Your report has been reviewed and dismissed. No action was taken.',
  },
};

/**
 * Notify the reporter about a report resolution/dismissal.
 * Looks up the report to find the reporter, then fires a notification.
 */
export async function notifyReportResolution(
  reportId: string,
  action: 'RESOLVED' | 'DISMISSED',
  resolutionNote?: string | null
): Promise<void> {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { reporterId: true },
    });

    if (!report) return;

    const config = REPORT_NOTIFICATION_CONFIG[action];

    await sendNotification({
      userId: report.reporterId,
      type: config.type,
      title: config.title,
      message: config.message,
      targetReportId: reportId,
      reason: resolutionNote,
    });
  } catch (error) {
    console.error(
      `[notification-service] Failed to notify report resolution for ${reportId}:`,
      error
    );
  }
}
