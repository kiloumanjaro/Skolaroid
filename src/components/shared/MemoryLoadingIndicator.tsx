'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const MAX_SIMULATED_PROGRESS = 85;
const PROGRESS_TICK_MS = 250;
const STATUS_TICK_MS = 1600;
const MIN_PROGRESS_STEP = 3;
const MAX_PROGRESS_STEP = 12;

const STATUS_MESSAGES = [
  'Mapping your campus...',
  'Fetching memories...',
  'Loading photos...',
  'Building your timeline...',
  'Connecting to archive...',
] as const;

function getNextProgress(previousValue: number): number {
  if (previousValue >= MAX_SIMULATED_PROGRESS) {
    return previousValue;
  }

  const randomStep =
    Math.random() * (MAX_PROGRESS_STEP - MIN_PROGRESS_STEP) + MIN_PROGRESS_STEP;

  return Math.min(MAX_SIMULATED_PROGRESS, previousValue + randomStep);
}

export function MemoryLoadingIndicator() {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => getNextProgress(prev));
    }, PROGRESS_TICK_MS);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_TICK_MS);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const displayProgress = Math.round(progress);

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] flex items-center justify-center">
      <div className="w-80 border-2 border-black bg-[#fffdf8] p-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold tracking-wide text-skolaroid-blue">
            Fetching Memories
          </h2>
          <span className="font-mono text-sm font-bold text-black">
            {displayProgress}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-8 w-full border-2 border-black bg-[#e8e8e8]">
          <div
            className="h-full bg-[#f6cb48] transition-all duration-200 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Status row */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
            <span className="text-xs font-semibold tracking-[0.12em]">
              {STATUS_MESSAGES[statusIndex]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
