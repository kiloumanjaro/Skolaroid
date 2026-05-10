'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type StatusValue = 'STUDENT' | 'ALUMNI';

interface StudentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (studentId: string, status: StatusValue) => void;
  initialStudentId?: string;
  initialStatus?: StatusValue;
}

export function StudentInfoModal({
  open,
  onOpenChange,
  onSubmit,
  initialStudentId = '',
  initialStatus = 'STUDENT',
}: StudentInfoModalProps) {
  const [studentId, setStudentId] = useState(initialStudentId);
  const [status, setStatus] = useState<StatusValue>(initialStatus);

  const canSubmit = studentId.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(studentId.trim(), status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[425px]">
        <DialogTitle className="sr-only">Student Information</DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Student Information
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter your student ID and current status
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="studentId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                placeholder="e.g. 2020-12345"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-skolaroid-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('STUDENT')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                    status === 'STUDENT'
                      ? 'border-skolaroid-blue bg-blue-50 text-skolaroid-blue'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('ALUMNI')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition ${
                    status === 'ALUMNI'
                      ? 'border-skolaroid-blue bg-blue-50 text-skolaroid-blue'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏛️ Alumni
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              canSubmit
                ? 'bg-skolaroid-blue hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300 opacity-50'
            }`}
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
