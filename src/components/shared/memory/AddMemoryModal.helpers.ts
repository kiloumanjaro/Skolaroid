/**
 * Pure helpers extracted from AddMemoryModal.tsx. These are stateless and
 * intentionally framework-agnostic so the modal can keep its render code lean.
 */

/** Backend endpoint that accepts a multipart upload of memory media. */
export const MEMORY_MEDIA_UPLOAD_ENDPOINT = '/api/storage/upload-memory-media';

/** Generate a short random identifier suitable for in-modal client-side keys. */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

/**
 * Format a byte count as a short human-readable string (B / KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a single File to MEMORY_MEDIA_UPLOAD_ENDPOINT via XHR and resolve with
 * the public URL the server returns. Reports incremental progress via
 * `onProgress` so the caller can render a progress bar.
 */
export function uploadFileWithProgress(
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

    xhr.open('POST', MEMORY_MEDIA_UPLOAD_ENDPOINT);
    xhr.send(formData);
  });
}
