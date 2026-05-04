'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CheckCircle2, XCircle } from 'lucide-react';

// ─── TYPES ──────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';

interface ToastState {
  id: string;
  message: string;
  type: ToastType;
}

interface GroupToastHook {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  ToastPortal: React.FC;
}

// ─── TOAST COMPONENTS ───────────────────────────────────────────────

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  const Icon = toast.type === 'success' ? CheckCircle2 : XCircle;
  const iconClass =
    toast.type === 'success' ? 'text-green-500' : 'text-red-500';
  const borderClass =
    toast.type === 'success' ? 'border-green-200' : 'border-red-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl ${borderClass}`}
      role="alert"
    >
      <Icon size={18} className={`shrink-0 ${iconClass}`} />
      <p className="text-sm text-gray-800">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="ml-auto shrink-0 text-gray-400 transition-colors hover:text-gray-600"
        aria-label="Dismiss"
      >
        <XCircle size={14} />
      </button>
    </motion.div>
  );
}

function AdminToastCard({ toast }: { toast: ToastState }) {
  const Icon = toast.type === 'success' ? CheckCircle : XCircle;
  const iconClass =
    toast.type === 'success' ? 'text-emerald-600' : 'text-red-600';
  const bgClass = toast.type === 'success' ? 'bg-emerald-50' : 'bg-red-50';
  const textClass =
    toast.type === 'success' ? 'text-emerald-800' : 'text-red-800';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 rounded-lg border-2 border-black px-4 py-3 shadow-md ${bgClass}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 ${iconClass}`} />
      <p className={`text-sm font-medium ${textClass}`}>{toast.message}</p>
    </motion.div>
  );
}

// ─── HOOK ───────────────────────────────────────────────────────────

export function useGroupToast(): GroupToastHook {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mounted, setMounted] = useState(false);
  const hookId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = `${hookId}-${Date.now()}`;
      setToast({ id, message, type });

      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 3000);
    },
    [hookId]
  );

  const showSuccess = useCallback(
    (message: string) => show(message, 'success'),
    [show]
  );

  const showError = useCallback(
    (message: string) => show(message, 'error'),
    [show]
  );

  const dismiss = useCallback(() => setToast(null), []);

  const ToastPortal: React.FC = useCallback(() => {
    if (!mounted) return null;

    return createPortal(
      <div className="pointer-events-none fixed left-1/2 top-4 z-[300] -translate-x-1/2">
        <AnimatePresence mode="wait">
          {toast && (
            <div className="pointer-events-auto">
              <ToastCard toast={toast} onDismiss={dismiss} />
            </div>
          )}
        </AnimatePresence>
      </div>,
      document.body
    );
  }, [toast, mounted, dismiss]) as React.FC;

  return { showSuccess, showError, ToastPortal };
}

export function useAdminToast(): GroupToastHook {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [mounted, setMounted] = useState(false);
  const hookId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = `${hookId}-${Date.now()}`;
      setToast({ id, message, type });

      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 3000);
    },
    [hookId]
  );

  const showSuccess = useCallback(
    (message: string) => show(message, 'success'),
    [show]
  );

  const showError = useCallback(
    (message: string) => show(message, 'error'),
    [show]
  );

  const ToastPortal: React.FC = useCallback(() => {
    if (!mounted) return null;

    return createPortal(
      <div className="pointer-events-none fixed left-1/2 top-4 z-[300] -translate-x-1/2">
        <AnimatePresence mode="wait">
          {toast && (
            <div className="pointer-events-auto">
              <AdminToastCard toast={toast} />
            </div>
          )}
        </AnimatePresence>
      </div>,
      document.body
    );
  }, [toast, mounted]) as React.FC;

  return { showSuccess, showError, ToastPortal };
}
