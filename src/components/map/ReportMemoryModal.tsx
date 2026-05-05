'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
        className="flex max-w-md gap-0 overflow-hidden border-2 border-[#2d2d2d] p-0 shadow-none"
        showCloseButton={false}
        style={{ borderRadius: 0 }}
      >
        <DialogTitle className="sr-only">Report Memory</DialogTitle>
        <DialogDescription className="sr-only">
          Report this memory for violating community guidelines. Provide a
          reason for your report.
        </DialogDescription>

        <div className="flex w-full flex-col">
          {/* Header band */}
          <div className="flex items-center gap-2.5 border-b-2 border-[#2d2d2d] bg-[#F04248] px-4 py-2">
            <Flag size={13} className="shrink-0 fill-white text-white" />
            <h2 className="flex-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Report Memory
            </h2>
            <button
              onClick={handleClose}
              disabled={reportMemory.isPending}
              aria-label="Close"
              className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#2d2d2d] bg-[#fde8e8] text-[#7f1d1d] transition-colors hover:bg-[#fca5a5] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              <span className="text-xs font-bold leading-none">✕</span>
            </button>
          </div>

          {/* Subtitle */}
          <div className="border-b-2 border-[#2d2d2d] bg-[#fdfbf7] px-5 py-3">
            <p className="text-sm text-muted-foreground">
              Flag{' '}
              <strong className="font-semibold text-[#2d2d2d]">
                &ldquo;{memoryTitle}&rdquo;
              </strong>{' '}
              for review. Please describe why you believe this memory violates
              our community guidelines.
            </p>
          </div>

          {/* Body */}
          <div className="bg-[#fdfbf7] px-5 pt-4">
            {/* Feedback banner */}
            {feedback && (
              <div
                className={`mb-4 flex items-start gap-2 border-2 p-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-[#2d2d2d] bg-green-50 text-green-800'
                    : feedback.type === 'info'
                      ? 'border-[#2d2d2d] bg-blue-50 text-blue-800'
                      : 'border-[#2d2d2d] bg-red-50 text-red-800'
                }`}
                role="status"
                aria-live="polite"
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                ) : feedback.type === 'info' ? (
                  <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
                ) : (
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Form */}
            {showForm && (
              <div>
                <label
                  htmlFor="report-reason"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#2d2d2d]"
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
                  className="w-full resize-none border-2 border-[#2d2d2d] bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2d2d2d]/20 disabled:opacity-50"
                  style={{ borderRadius: 0 }}
                />
                <div className="mt-1 flex items-center justify-between pb-4">
                  {isReasonTooLong && (
                    <span className="text-xs text-red-600">
                      Reason must be {MAX_REPORT_REASON_LENGTH} characters or
                      less
                    </span>
                  )}
                  <span
                    className={`ml-auto text-xs ${
                      isReasonTooLong ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    {trimmedReason.length}/{MAX_REPORT_REASON_LENGTH}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t-2 border-[#2d2d2d] bg-[#fdfbf7] px-4 py-3">
            <button
              onClick={handleClose}
              disabled={reportMemory.isPending}
              className="border border-[#2d2d2d] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#2d2d2d] transition-colors hover:bg-[#e5e0d8] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              {showForm ? 'Cancel' : 'Close'}
            </button>
            {showForm && (
              <button
                onClick={handleSubmit}
                disabled={isInvalid || reportMemory.isPending}
                className="border border-[#2d2d2d] bg-[#F04248] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d6333a] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderRadius: 0 }}
              >
                {reportMemory.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Report'
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
