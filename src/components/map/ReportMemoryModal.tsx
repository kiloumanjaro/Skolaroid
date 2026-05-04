'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flag, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useReportMemory } from '@/lib/hooks/useReportMemory';
import type { ReportMemoryError } from '@/lib/hooks/useReportMemory';
import { MAX_REPORT_REASON_LENGTH } from '@/lib/schemas';

interface ReportMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memoryId: string;
  memoryTitle: string;
}

type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'info'; message: string }
  | { type: 'error'; message: string }
  | null;

export function ReportMemoryModal({
  open,
  onOpenChange,
  memoryId,
  memoryTitle,
}: ReportMemoryModalProps) {
  const reportMemory = useReportMemory();
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedReason = reason.trim();
  const isReasonEmpty = trimmedReason.length === 0;
  const isReasonTooLong = trimmedReason.length > MAX_REPORT_REASON_LENGTH;
  const isInvalid = isReasonEmpty || isReasonTooLong;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setReason('');
      setFeedback(null);
      reportMemory.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus textarea when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      // Small delay to ensure dialog has animated in
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    if (!reportMemory.isPending) {
      onOpenChange(false);
    }
  };

  const handleSubmit = () => {
    if (isInvalid || reportMemory.isPending) return;

    setFeedback(null);

    reportMemory.mutate(
      { memoryId, reason: trimmedReason },
      {
        onSuccess: (data) => {
          if (data.data?.deduped) {
            setFeedback({
              type: 'info',
              message:
                'You have already reported this memory. Your existing report is still open.',
            });
          } else {
            setFeedback({
              type: 'success',
              message: 'Report submitted. Our team will review it shortly.',
            });
          }
        },
        onError: (err) => {
          const reportErr = err as ReportMemoryError;
          const status = reportErr.status;

          if (status === 401) {
            setFeedback({
              type: 'error',
              message: 'You must be signed in to report a memory.',
            });
          } else if (status === 403) {
            setFeedback({
              type: 'error',
              message: 'Complete onboarding before submitting reports.',
            });
          } else if (status === 404) {
            setFeedback({
              type: 'error',
              message:
                'This memory could not be found. It may have been deleted.',
            });
          } else if (status === 400) {
            setFeedback({
              type: 'error',
              message:
                reportErr.serverMessage ||
                'Invalid report. Please check your input.',
            });
          } else if (status === 429) {
            setFeedback({
              type: 'error',
              message: 'Too many reports. Please try again later.',
            });
          } else {
            setFeedback({
              type: 'error',
              message: 'Unable to submit report. Please try again.',
            });
          }
        },
      }
    );
  };

  const showForm = !feedback || feedback.type === 'error';

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={false}
        style={{ borderRadius: 0 }}
      >
        <DialogTitle className="sr-only">Report Memory</DialogTitle>
        <DialogDescription className="sr-only">
          Report this memory for violating community guidelines. Provide a
          reason for your report.
        </DialogDescription>

        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <Flag size={20} className="shrink-0 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Report Memory
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Flag{' '}
              <strong className="font-semibold text-gray-900">
                &ldquo;{memoryTitle}&rdquo;
              </strong>{' '}
              for review. Please describe why you believe this memory violates
              our community guidelines.
            </p>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="px-6 pt-4">
              <div
                className={`flex items-start gap-2 border p-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : feedback.type === 'info'
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                }`}
                role="status"
                aria-live="polite"
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-green-500"
                  />
                ) : feedback.type === 'info' ? (
                  <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
                ) : (
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-500"
                  />
                )}
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* Form (hidden after success/info) */}
          {showForm && (
            <div className="px-6 pt-4">
              <label
                htmlFor="report-reason"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Reason for report
              </label>
              <textarea
                ref={textareaRef}
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                maxLength={MAX_REPORT_REASON_LENGTH + 100}
                disabled={reportMemory.isPending}
                className="w-full resize-none border-2 border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                style={{ borderRadius: 0 }}
              />
              <div className="mt-1 flex items-center justify-between">
                {isReasonTooLong && (
                  <span className="text-xs text-red-500">
                    Reason must be {MAX_REPORT_REASON_LENGTH} characters or less
                  </span>
                )}
                <span
                  className={`ml-auto text-xs ${
                    isReasonTooLong ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                >
                  {trimmedReason.length}/{MAX_REPORT_REASON_LENGTH}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={reportMemory.isPending}
              style={{ borderRadius: 0 }}
            >
              {showForm ? 'Cancel' : 'Close'}
            </Button>
            {showForm && (
              <Button
                onClick={handleSubmit}
                disabled={isInvalid || reportMemory.isPending}
                className="bg-amber-500 text-white hover:bg-amber-600"
                style={{ borderRadius: 0 }}
              >
                {reportMemory.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
