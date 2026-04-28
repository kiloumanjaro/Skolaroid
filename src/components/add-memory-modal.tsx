'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TagInput } from '@/components/tag-input';
import { useCreateMemory } from '@/lib/hooks/useCreateMemory';
import { useCreateCustomLocation } from '@/lib/hooks/useCreateCustomLocation';
import { useLocations } from '@/lib/hooks/useLocations';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import {
  MAX_TAGS,
  VISIBILITY_LABELS,
  type MemoryVisibility,
} from '@/lib/schemas';
import { LANDMARKS, type Landmark } from '@/lib/constants/landmarks';
import {
  LANDMARK_TYPE_COLORS,
  LANDMARK_TYPE_LABELS,
} from '@/lib/constants/landmarks';
import type { MapLocationSelection } from '@/lib/types/map';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  FileText,
  Globe,
  Grid3X3,
  Info,
  List,
  Loader2,
  Lock,
  MapPin,
  MapPinned,
  Search,
  Shield,
  Type,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

type Tab = 'upload' | 'location' | 'caption' | 'privacy';

type ViewMode = 'grid' | 'list';

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  previewUrl: string;
  uploadedUrl?: string;
}

interface PlaceholderStates {
  addToStory: boolean;
  shareToFeed: boolean;
  enableComments: boolean;
}

interface AddMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEra?: number | null;
  defaultGroupId?: string;
  /** Callback to request map selection mode from the parent map component. */
  onRequestMapSelection?: (
    mode: 'landmark' | 'custom',
    onSelect: (selection: MapLocationSelection) => void
  ) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TABS: Tab[] = ['upload', 'location', 'caption', 'privacy'];

const TAB_META: Record<Tab, { label: string; icon: typeof Upload }> = {
  upload: { label: 'Upload media', icon: Upload },
  location: { label: 'Location', icon: MapPin },
  caption: { label: 'Add caption', icon: Type },
  privacy: { label: 'Privacy', icon: Shield },
};

const VISIBILITY_OPTIONS: {
  value: MemoryVisibility;
  label: string;
  description: string;
  icon: typeof Globe;
  requiresGroup?: boolean;
}[] = [
  {
    value: 'PUBLIC',
    label: VISIBILITY_LABELS.PUBLIC,
    description: 'Visible to everyone',
    icon: Globe,
  },
  {
    value: 'PROGRAM_ONLY',
    label: 'Program Only',
    description: 'Visible to your program',
    icon: Eye,
  },
  {
    value: 'BATCH_ONLY',
    label: 'Batch Only',
    description: 'Visible to your batch',
    icon: Shield,
  },
  {
    value: 'GROUP_ONLY',
    label: 'Private',
    description: 'Visible to selected group only',
    icon: Lock,
    requiresGroup: true,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve(json.url as string);
        } else {
          reject(new Error(json.message ?? 'Upload failed'));
        }
      } catch {
        reject(new Error('Invalid response from server'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', '/api/storage/upload-memory-media');
    xhr.send(formData);
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AddMemoryModal({
  open,
  onOpenChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultEra,
  defaultGroupId,
  onRequestMapSelection,
}: AddMemoryModalProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [highestReachedTab, setHighestReachedTab] = useState<number>(0);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<MemoryVisibility>(
    defaultGroupId ? 'GROUP_ONLY' : 'PUBLIC'
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, setShowVisibilityDropdown] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [placeholderStates, setPlaceholderStates] = useState<PlaceholderStates>(
    {
      addToStory: false,
      shareToFeed: true,
      enableComments: true,
    }
  );

  // Location selection state
  const [selectedLocationName, setSelectedLocationName] = useState<
    string | null
  >(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createMemory, isPending } = useCreateMemory();
  const { data: locationsData } = useLocations();
  const locations = useMemo(
    () => locationsData?.data ?? [],
    [locationsData?.data]
  );

  const { mutateAsync: createCustomLocation } = useCreateCustomLocation();

  const { data: currentUserData, isLoading: isCurrentUserLoading } =
    useCurrentUser();

  const programBatch = currentUserData?.data?.programBatch ?? null;

  const { data: userGroups, isLoading: isLoadingGroups } = useUserGroups();
  const hasGroups = (userGroups?.length ?? 0) > 0;
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    defaultGroupId ?? null
  );
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const batchLabel = useMemo(() => {
    if (!programBatch) return null;
    return `${programBatch.program.name} • Batch ${programBatch.batch.year}`;
  }, [programBatch]);

  const batchOnlyDescription = useMemo(() => {
    if (!programBatch) return 'Visible to your batch';
    return `Visible to ${programBatch.program.name} Batch ${programBatch.batch.year}`;
  }, [programBatch]);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const isDirty = useMemo(() => {
    return uploadingFiles.length > 0 || caption.trim().length > 0;
  }, [uploadingFiles, caption]);

  const activeTabIndex = TABS.indexOf(activeTab);

  const completedFiles = useMemo(
    () => uploadingFiles.filter((f) => f.status === 'complete'),
    [uploadingFiles]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasCompletedUploads = completedFiles.length > 0;

  const currentVisibilityOption = useMemo(
    () =>
      VISIBILITY_OPTIONS.find((o) => o.value === visibility) ??
      VISIBILITY_OPTIONS[0],
    [visibility]
  );

  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return LANDMARKS;
    const query = searchQuery.toLowerCase();
    return LANDMARKS.filter((l) => l.name.toLowerCase().includes(query));
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Cleanup Object URLs on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      uploadingFiles.forEach((f) => {
        URL.revokeObjectURL(f.previewUrl);
      });
    };
    // Only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Reset state when modal closes
  // ---------------------------------------------------------------------------

  const resetState = useCallback(() => {
    setActiveTab('upload');
    setHighestReachedTab(0);
    setUploadingFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return [];
    });
    setViewMode('grid');
    setCaption('');
    setMemoryDate('');
    setTags([]);
    setVisibility(defaultGroupId ? 'GROUP_ONLY' : 'PUBLIC');
    setShowExitConfirm(false);
    setShowSuccess(false);
    setSubmitError(null);
    setShowVisibilityDropdown(false);
    setPlaceholderStates({
      addToStory: false,
      shareToFeed: true,
      enableComments: true,
    });
    setSelectedLocationName(null);
    setSelectedLocationId(null);
    setSearchQuery('');
    setIsCreatingLocation(false);
    setSelectedGroupId(defaultGroupId ?? null);
    setShowGroupDropdown(false);
  }, [defaultGroupId]);

  // ---------------------------------------------------------------------------
  // Close / Exit logic
  // ---------------------------------------------------------------------------

  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      resetState();
      onOpenChange(false);
    }
  }, [isDirty, resetState, onOpenChange]);

  const handleConfirmDiscard = useCallback(() => {
    setShowExitConfirm(false);
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const handleKeepEditing = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------

  const handleFilesSelected = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    const newFiles: UploadingFile[] = fileArray.map((file) => ({
      file,
      id: generateId(),
      progress: 0,
      status: 'uploading' as const,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach((uploadFile) => {
      uploadFileWithProgress(uploadFile.file, (percent) => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: percent } : f
          )
        );
      })
        .then((url) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'complete', progress: 100, uploadedUrl: url }
                : f
            )
          );
        })
        .catch(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'error', progress: 0 }
                : f
            )
          );
        });
    });
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadingFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const handleRetryUpload = useCallback(
    (fileId: string) => {
      const fileToRetry = uploadingFiles.find((f) => f.id === fileId);
      if (!fileToRetry) return;

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      uploadFileWithProgress(fileToRetry.file, (percent) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: percent } : f))
        );
      })
        .then((url) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'complete', progress: 100, uploadedUrl: url }
                : f
            )
          );
        })
        .catch(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
            )
          );
        });
    },
    [uploadingFiles]
  );

  // ---------------------------------------------------------------------------
  // Drag and drop
  // ---------------------------------------------------------------------------

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const mediaFiles = Array.from(files).filter(
          (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
        );
        if (mediaFiles.length > 0) {
          handleFilesSelected(mediaFiles);
        }
      }
    },
    [handleFilesSelected]
  );

  // ---------------------------------------------------------------------------
  // Tab navigation
  // ---------------------------------------------------------------------------

  const handleNext = useCallback(() => {
    // TODO: re-enable upload check once backend is wired up
    // if (activeTab === 'upload' && !hasCompletedUploads) return;

    // Require location selection before advancing past Location tab
    if (activeTab === 'location' && !selectedLocationId) return;

    const nextIndex = activeTabIndex + 1;
    if (nextIndex < TABS.length) {
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab);
      setHighestReachedTab((prev) => Math.max(prev, nextIndex));
    }
  }, [activeTab, activeTabIndex, selectedLocationId]);

  const handleBack = useCallback(() => {
    const prevIndex = activeTabIndex - 1;
    if (prevIndex >= 0) {
      const prevTab = TABS[prevIndex];
      setActiveTab(prevTab);
    }
  }, [activeTabIndex]);

  const handleTabClick = useCallback(
    (tab: Tab) => {
      const tabIndex = TABS.indexOf(tab);
      if (tabIndex <= highestReachedTab) {
        setActiveTab(tab);
      }
    },
    [highestReachedTab]
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(() => {
    setSubmitError(null);

    const firstCompleted = completedFiles[0];
    const uploadedMediaURLs = completedFiles
      .map((file) => file.uploadedUrl?.trim())
      .filter((url): url is string => Boolean(url));
    const primaryMediaURL = uploadedMediaURLs[0];

    const locationId = selectedLocationId ?? locations[0]?.id ?? '';

    if (visibility === 'GROUP_ONLY' && !selectedGroupId) {
      setSubmitError('Please select a group for private visibility');
      return;
    }

    createMemory(
      {
        title: caption.trim() || 'Untitled Memory',
        description: caption.trim() || undefined,
        visibility,
        locationId,
        memoryDate: memoryDate ? new Date(memoryDate) : undefined,
        tags,
        ...(visibility === 'GROUP_ONLY' && selectedGroupId
          ? { privateGroupId: selectedGroupId }
          : {}),
        ...(primaryMediaURL
          ? { mediaURL: primaryMediaURL, mediaURLs: uploadedMediaURLs }
          : firstCompleted?.file
            ? { mediaFile: firstCompleted.file }
            : {}),
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => {
            resetState();
            onOpenChange(false);
          }, 2000);
        },
        onError: (err) => {
          setSubmitError(
            err instanceof Error ? err.message : 'Failed to save memory'
          );
        },
      }
    );
  }, [
    completedFiles,
    caption,
    visibility,
    memoryDate,
    tags,
    locations,
    selectedLocationId,
    createMemory,
    resetState,
    onOpenChange,
    selectedGroupId,
  ]);

  // ---------------------------------------------------------------------------
  // Tab: Location
  // ---------------------------------------------------------------------------

  const renderLocationTab = () => (
    <div className="flex h-full flex-col gap-4">
      {/* Selected location badge */}
      {selectedLocationName && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-emerald-50 px-3 py-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span className="flex-1 text-sm font-medium text-emerald-800">
            {selectedLocationName}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedLocationName(null);
              setSelectedLocationId(null);
            }}
            className="rounded-full p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Creating location loading state */}
      {isCreatingLocation && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-blue-50 px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Creating location...</span>
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleSelectOnMap('landmark')}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-black bg-blue-50/50 px-4 py-5 transition-colors hover:bg-blue-50"
        >
          <MapPin className="h-6 w-6 text-skolaroid-blue" />
          <span className="text-sm font-semibold text-skolaroid-blue">
            Select Landmark on Map
          </span>
          <span className="text-xs text-blue-400">
            Click a landmark directly
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectOnMap('custom')}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-black bg-card px-4 py-5 transition-colors hover:border-black hover:bg-secondary"
        >
          <MapPinned className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Pinpoint Custom Location
          </span>
          <span className="text-xs text-muted-foreground">
            Click anywhere on campus
          </span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search landmarks..."
          className="w-full border-2 border-black bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-skolaroid-blue"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Landmark list */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground"></p>
        </div>
        <div className="-mr-2 max-h-44 overflow-y-auto pr-2">
          {filteredLandmarks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No landmarks found
            </p>
          ) : (
            filteredLandmarks.map((landmark) => {
              const isSelected = selectedLocationName === landmark.name;
              return (
                <button
                  key={landmark.id}
                  type="button"
                  onClick={() => handleSelectLandmarkFromList(landmark)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${LANDMARK_TYPE_COLORS[landmark.type]}`}
                  />
                  <span className="flex-1 truncate">{landmark.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {LANDMARK_TYPE_LABELS[landmark.type]}
                  </span>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Map location selection handlers
  // ---------------------------------------------------------------------------

  const handleMapSelection = useCallback(
    async (selection: MapLocationSelection) => {
      if (selection.mode === 'landmark' && selection.landmark) {
        setSelectedLocationName(selection.landmark.name);
        setSelectedLocationId(selection.locationId ?? selection.landmark.id);
      } else if (selection.mode === 'custom' && selection.customLocation) {
        setIsCreatingLocation(true);
        try {
          const result = await createCustomLocation({
            buildingName: selection.customLocation.buildingName,
            latitude: selection.customLocation.latitude,
            longitude: selection.customLocation.longitude,
          });
          setSelectedLocationName(selection.customLocation.buildingName);
          setSelectedLocationId(result.data.id);
        } catch (err) {
          setSubmitError(
            err instanceof Error
              ? err.message
              : 'Failed to create custom location'
          );
        } finally {
          setIsCreatingLocation(false);
        }
      }
    },
    [createCustomLocation]
  );

  const handleSelectOnMap = useCallback(
    (mode: 'landmark' | 'custom') => {
      onRequestMapSelection?.(mode, handleMapSelection);
    },
    [onRequestMapSelection, handleMapSelection]
  );

  const handleSelectLandmarkFromList = useCallback(
    (landmark: Landmark) => {
      // Find the matching DB location by building name, or fall back to the landmark constant ID
      const dbLocation = locations.find(
        (loc) => loc.buildingName.toLowerCase() === landmark.name.toLowerCase()
      );
      setSelectedLocationName(landmark.name);
      setSelectedLocationId(dbLocation?.id ?? landmark.id);
      setSearchQuery('');
    },
    [locations]
  );

  // ---------------------------------------------------------------------------
  // Placeholder handlers
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updatePlaceholder = useCallback(
    <K extends keyof PlaceholderStates>(
      key: K,
      value: PlaceholderStates[K]
    ) => {
      setPlaceholderStates((prev) => ({ ...prev, [key]: value }));
      // TODO: Implement backend integration for placeholder states
      console.log(
        `[AddMemoryModal] placeholder state changed: ${key} = ${String(value)}`
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Tab: Upload Media
  // ---------------------------------------------------------------------------

  const renderUploadTab = () => (
    <div className="flex h-full flex-col gap-4">
      {/* Upload bin */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-black bg-blue-50/50'
            : 'border-black hover:border-black hover:bg-blue-50/30'
        }`}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Drag and drop or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports images and videos up to 10MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Upload progress for files currently uploading */}
      {uploadingFiles.some((f) => f.status === 'uploading') && (
        <div className="space-y-2">
          {uploadingFiles
            .filter((f) => f.status === 'uploading')
            .map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {f.file.name}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-skolaroid-blue transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {f.progress}%
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Error files */}
      {uploadingFiles.some((f) => f.status === 'error') && (
        <div className="space-y-2">
          {uploadingFiles
            .filter((f) => f.status === 'error')
            .map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-md border-2 border-black bg-red-50 px-3 py-2"
              >
                <p className="truncate text-xs text-red-600">
                  {f.file.name} — upload failed
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRetryUpload(f.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(f.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* View mode toggles + file previews */}
      {completedFiles.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {completedFiles.length} file
              {completedFiles.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded p-1 ${
                  viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary'
                }`}
              >
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded p-1 ${
                  viewMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary'
                }`}
              >
                <List className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {completedFiles.map((f) => (
                <div
                  key={f.id}
                  className="group relative aspect-square overflow-hidden rounded-md"
                >
                  <Image
                    src={f.previewUrl}
                    alt={f.file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle className="h-4 w-4 text-emerald-500 drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {completedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-md border-2 border-black p-2"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    <Image
                      src={f.previewUrl}
                      alt={f.file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {f.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(f.file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            You can upload multiple photos and videos to your memory.
          </p>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: Add Caption
  // ---------------------------------------------------------------------------

  const renderCaptionTab = () => (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="caption"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Caption
        </label>
        <textarea
          id="caption"
          placeholder="Write a caption for your memory..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="min-h-[100px] w-full rounded-md border-2 border-black px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div>
        <label
          htmlFor="memoryDate"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          When did this happen? (optional)
        </label>
        <input
          type="date"
          id="memoryDate"
          max={new Date().toISOString().split('T')[0]}
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          className="w-full rounded-md border-2 border-black bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This helps us automatically tag your memory with the correct year and
          era
        </p>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Tags
        </label>
        <TagInput tags={tags} onTagsChange={setTags} />
        <p className="mt-1 text-xs text-muted-foreground">
          Up to {MAX_TAGS} tags. The system will auto-add location, era, and
          year tags (using up to 3 slots).
        </p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab: Privacy
  // ---------------------------------------------------------------------------

  const renderPrivacyTab = () => {
    const VisibilityIcon = currentVisibilityOption.icon;
    return (
      <div className="flex h-full flex-col gap-6">
        {/* Batch context badge */}
        <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-blue-50 px-3 py-2">
          <Shield className="h-4 w-4 shrink-0 text-skolaroid-blue" />
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Posting as
            </span>
            {isCurrentUserLoading ? (
              <div className="mt-0.5 h-3.5 w-40 animate-pulse rounded bg-blue-200" />
            ) : (
              <span className="truncate text-sm font-semibold text-skolaroid-blue">
                {batchLabel ?? 'Unknown batch'}
              </span>
            )}
          </div>
        </div>

        {/* Live */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Live</p>
              <p className="text-xs text-muted-foreground">
                2 Months Ago by user
              </p>
            </div>
          </div>
        </div>

        {/* Moderation */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Moderation
              </p>
              <p className="text-xs text-muted-foreground">
                Approved 7 days ago by Kint Borbano
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement view details
              console.log('[AddMemoryModal] view details clicked');
            }}
            className="text-sm font-medium text-skolaroid-blue hover:underline"
          >
            View Details
          </button>
        </div>

        {/* English */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Globe className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">English</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement switch locales
              console.log('[AddMemoryModal] switch locales clicked');
            }}
            className="text-sm font-medium text-skolaroid-blue hover:underline"
          >
            Switch locales
          </button>
        </div>

        {/* Current visibility */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <VisibilityIcon className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {currentVisibilityOption.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentVisibilityOption.value === 'BATCH_ONLY'
                  ? batchOnlyDescription
                  : currentVisibilityOption.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              // Cycle through visibility options
              const currentIndex = VISIBILITY_OPTIONS.findIndex(
                (o) => o.value === visibility
              );
              const nextIndex = (currentIndex + 1) % VISIBILITY_OPTIONS.length;
              const nextOption = VISIBILITY_OPTIONS[nextIndex];
              // Skip GROUP_ONLY if user has no groups
              if (nextOption.requiresGroup && !hasGroups) {
                setVisibility(VISIBILITY_OPTIONS[0].value);
              } else {
                setVisibility(nextOption.value);
              }
              if (nextOption.value !== 'GROUP_ONLY') {
                setSelectedGroupId(null);
              }
            }}
            className="text-sm font-medium text-skolaroid-blue hover:underline"
          >
            Set privacy
          </button>
        </div>

        {/* Group selector (shown when Private/GROUP_ONLY is selected) */}
        {visibility === 'GROUP_ONLY' && (
          <div className="flex items-start gap-3 pl-8">
            <div className="relative w-full">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Select Group
              </label>
              <button
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                disabled={isLoadingGroups}
                className="flex w-full items-center justify-between rounded-md border-2 border-black bg-background px-3 py-2 text-sm"
              >
                <span>
                  {isLoadingGroups
                    ? 'Loading groups...'
                    : (userGroups?.find((g) => g.id === selectedGroupId)
                        ?.name ?? 'Choose a group...')}
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </button>
              {showGroupDropdown && userGroups && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-md border-2 border-black bg-card shadow-md">
                  {userGroups.length === 0 ? (
                    <p className="px-3 py-3 text-center text-sm text-muted-foreground">
                      No groups available. Create a group first.
                    </p>
                  ) : (
                    userGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setShowGroupDropdown(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          selectedGroupId === group.id
                            ? 'bg-blue-50 text-skolaroid-blue'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <span className="flex-1 truncate">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group._count.members} member
                          {group._count.members !== 1 ? 's' : ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="rounded-md border-2 border-black bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Tab renderer map
  // ---------------------------------------------------------------------------

  const TAB_RENDERERS: Record<Tab, () => React.ReactNode> = {
    upload: renderUploadTab,
    location: renderLocationTab,
    caption: renderCaptionTab,
    privacy: renderPrivacyTab,
  };

  const footerActionButtonBaseClassName =
    'box-border appearance-none h-full w-14 shrink-0 rounded-none border-0 border-l-2 border-r-0 border-b-0 border-black outline-none transition-colors disabled:opacity-100';
  const footerSecondaryActionClassName = `${footerActionButtonBaseClassName} text-foreground `;
  const footerPrimaryActionClassName = `${footerActionButtonBaseClassName} bg-skolaroid-blue text-white disabled:cursor-not-allowed disabled:text-white/70`;
  const footerLeadingActionClassName = footerSecondaryActionClassName;
  const footerActionIconClassName = 'mx-auto h-6 w-6 stroke-[2]';

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Exit confirmation dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Discard changes?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            You have unsaved changes that will be lost.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleKeepEditing}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={handleConfirmDiscard}>
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main modal */}
      <Dialog
        open={open && !showExitConfirm}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleAttemptClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          className="flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-none border-2 border-[#1f1f1f] p-0 shadow-none sm:max-w-none md:h-[85vh] md:w-[70vw]"
          style={{ borderRadius: 0 }}
          showCloseButton={false}
        >
          {/* Success toast overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 top-0 z-50 flex items-center justify-center p-4"
              >
                <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-emerald-50 px-4 py-3 shadow-md">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">
                    Memory saved successfully!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogTitle className="sr-only">Add Memory</DialogTitle>

          <div className="flex items-center justify-between gap-3 border-b-2 border-b-black bg-[#4384dc] px-3 py-2 text-white">
            <div className="min-w-0">
              <p className="truncate text-base font-medium tracking-[0.01em] sm:text-lg">
                Add Memory Window
              </p>
            </div>

            <button
              type="button"
              aria-label="Close add memory modal"
              onClick={handleAttemptClose}
              className="grid h-6 w-6 shrink-0 place-items-center border-2 border-black bg-[#f7d6d5] text-[#7a1111] shadow-[inset_1px_1px_0_#fff8f7,inset_-1px_-1px_0_#c68787]"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Left Sidebar */}
            <div className="flex w-full shrink-0 flex-col border-b-2 border-black bg-secondary/50 md:w-48 md:border-b-0 md:border-r-2">
              <div className="scrollbar-hide overflow-x-auto overflow-y-hidden px-0 py-0 md:flex-1">
                <div className="flex gap-0 md:block md:space-y-0">
                  {TABS.map((tab, index) => {
                    const meta = TAB_META[tab];
                    const Icon = meta.icon;
                    const isActive = activeTab === tab;
                    const isAccessible = index <= highestReachedTab;
                    const isFirstTab = index === 0;
                    const isLastTab = index === TABS.length - 1;
                    const activeTabBorderClassName = isFirstTab
                      ? 'border-r-2 border-r-black md:border-r-0'
                      : isLastTab
                        ? 'border-l-2 border-l-black md:border-l-0'
                        : 'border-l-2 border-r-2 border-l-black border-r-black md:border-l-0 md:border-r-0';

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        disabled={!isAccessible}
                        className={`flex shrink-0 appearance-none items-center gap-2 whitespace-nowrap border-0 px-4 py-3 text-left text-sm font-medium transition-colors md:w-full ${
                          isActive
                            ? `${activeTabBorderClassName} bg-[#f6cb48] text-black md:border-b-2 md:border-t-2 md:border-black`
                            : isAccessible
                              ? 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                              : 'cursor-not-allowed border-transparent text-muted-foreground/50'
                        }`}
                        style={
                          isFirstTab
                            ? { borderTopColor: 'transparent' }
                            : undefined
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thumbnail info box */}
              {/* <div className="mx-3 mb-4 hidden border border-black bg-[#ffc2fb] p-3 md:block">
                <ImageIcon className="mb-2 h-5 w-5 text-foreground" />
                <p className="text-xs text-foreground">
                  The first image uploaded will be used as thumbnail
                </p>
              </div> */}
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {TAB_RENDERERS[activeTab]()}
              </div>

              {/* Footer */}
              <div className="flex h-14 items-stretch justify-end border-t-2 border-black">
                <div className="min-w-0 flex-1"></div>
                {activeTab === 'upload' && (
                  <>
                    <button
                      type="button"
                      onClick={handleAttemptClose}
                      aria-label="Cancel add memory"
                      className={footerLeadingActionClassName}
                    >
                      <X className={footerActionIconClassName} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Continue to next step"
                      className={footerPrimaryActionClassName}
                    >
                      <Check className={footerActionIconClassName} />
                    </button>
                  </>
                )}

                {activeTab === 'location' && (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      aria-label="Go back to upload step"
                      className={footerLeadingActionClassName}
                    >
                      <ArrowLeft className={footerActionIconClassName} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Continue to caption step"
                      disabled={!selectedLocationId || isCreatingLocation}
                      className={footerPrimaryActionClassName}
                    >
                      {isCreatingLocation ? (
                        <Loader2
                          className={`${footerActionIconClassName} animate-spin`}
                        />
                      ) : (
                        <ArrowRight className={footerActionIconClassName} />
                      )}
                    </button>
                  </>
                )}

                {activeTab === 'caption' && (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      aria-label="Go back to location step"
                      className={footerLeadingActionClassName}
                    >
                      <ArrowLeft className={footerActionIconClassName} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Continue to privacy step"
                      className={footerPrimaryActionClassName}
                    >
                      <ArrowRight className={footerActionIconClassName} />
                    </button>
                  </>
                )}

                {activeTab === 'privacy' && (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      aria-label="Go back to caption step"
                      className={footerLeadingActionClassName}
                    >
                      <ArrowLeft className={footerActionIconClassName} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      aria-label="Save memory"
                      disabled={isPending}
                      className={footerPrimaryActionClassName}
                    >
                      {isPending ? (
                        <Loader2
                          className={`${footerActionIconClassName} animate-spin`}
                        />
                      ) : (
                        <Check className={footerActionIconClassName} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
