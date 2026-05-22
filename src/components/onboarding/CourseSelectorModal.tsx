'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface CollegeGroup {
  college: string;
  programs: string[];
}

// UP Cebu programs grouped by college/department
const COLLEGE_GROUPS: CollegeGroup[] = [
  {
    college: 'College of Science',
    programs: [
      'Bachelor of Science in Biology',
      'Bachelor of Science in Mathematics',
      'Bachelor of Science in Computer Science',
      'Bachelor of Science in Statistics',
    ],
  },
  {
    college: 'College of Social Sciences',
    programs: [
      'Bachelor of Arts in Political Science',
      'Bachelor of Arts in Psychology',
      'Associate in Arts (Sports Studies)',
      'Bachelor of Physical Education',
      'Bachelor of Sports Science',
    ],
  },
  {
    college: 'School of Management',
    programs: [
      'Bachelor of Science in Management',
      'Bachelor of Science in Accountancy',
    ],
  },
  {
    college: 'College of Communication, Arts, and Design',
    programs: [
      'Certificate in Fine Arts (Studio Arts)',
      'Certificate in Fine Arts (Product Design)',
      'Bachelor of Fine Arts (Studio Arts)',
      'Bachelor of Fine Arts (Product Design)',
      'Bachelor of Arts in Communication',
    ],
  },
];

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
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(
    new Set()
  );

  // Filter groups by search query, only showing colleges with matching programs
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COLLEGE_GROUPS;

    return COLLEGE_GROUPS.map((group) => ({
      ...group,
      programs: group.programs.filter(
        (p) =>
          p.toLowerCase().includes(q) || group.college.toLowerCase().includes(q)
      ),
    })).filter((group) => group.programs.length > 0);
  }, [searchQuery]);

  // Auto-expand all groups when searching
  const isSearching = searchQuery.trim().length > 0;

  const toggleCollege = (college: string) => {
    setExpandedColleges((prev) => {
      const next = new Set(prev);
      if (next.has(college)) {
        next.delete(college);
      } else {
        next.add(college);
      }
      return next;
    });
  };

  const isExpanded = (college: string) =>
    isSearching || expandedColleges.has(college);

  const handleSelect = (course: string) => {
    onSelect(course);
    onOpenChange(false);
  };

  const totalFiltered = filteredGroups.reduce(
    (sum, g) => sum + g.programs.length,
    0
  );

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
          {totalFiltered > 0 ? (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const expanded = isExpanded(group.college);
                return (
                  <div
                    key={group.college}
                    className="overflow-hidden rounded-lg border border-gray-200"
                  >
                    {/* College header */}
                    <button
                      onClick={() => toggleCollege(group.college)}
                      className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5 text-left transition hover:bg-gray-100"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {group.college}
                      </span>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      )}
                    </button>

                    {/* Programs list */}
                    {expanded && (
                      <div className="border-t border-gray-100">
                        {group.programs.map((program) => (
                          <button
                            key={program}
                            onClick={() => handleSelect(program)}
                            className="group flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-blue-50"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {program}
                            </span>
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition group-hover:text-skolaroid-blue" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              No courses found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
