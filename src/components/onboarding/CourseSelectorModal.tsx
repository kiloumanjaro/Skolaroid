'use client';

import { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface CourseSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (course: string) => void;
}

export function CourseSelectorModal({
  open,
  onOpenChange,
  onSelect,
}: CourseSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // UP Cebu courses
  const courses = [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Mechanical Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Chemical Engineering',
    'Bachelor of Science in Business Administration',
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Biology',
    'Bachelor of Science in Chemistry',
    'Bachelor of Science in Physics',
    'Bachelor of Science in Mathematics',
    'Bachelor of Arts in English',
    'Bachelor of Arts in Filipino',
    'Bachelor of Arts in Philosophy',
    'Bachelor of Arts in History',
    'Bachelor of Science in Nursing',
    'Bachelor of Science in Public Health',
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Social Work',
    'Bachelor of Music',
    'Bachelor of Fine Arts',
    'Bachelor of Physical Education',
  ].sort();

  const filteredCourses = courses.filter((course) =>
    course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (course: string) => {
    onSelect(course);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[425px]">
        <DialogTitle className="sr-only">Select Your Course</DialogTitle>

        <div className="flex flex-shrink-0 flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Your Course
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose your academic program
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-skolaroid-blue"
            />
          </div>
        </div>

        <div className="min-h-0 flex-grow overflow-y-auto">
          <div className="space-y-2">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <button
                  key={course}
                  onClick={() => handleSelect(course)}
                  className="group flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:border-skolaroid-blue hover:bg-blue-50"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {course}
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition group-hover:text-skolaroid-blue" />
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No courses found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
