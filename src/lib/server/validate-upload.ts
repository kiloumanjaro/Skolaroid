import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export type UploadValidation =
  | { ok: true; mime: string; ext: string }
  | { ok: false; reason: string };

/**
 * Server-side guard that sniffs an upload's magic bytes and rejects anything
 * outside the narrow image/video allowlist. Use the returned `mime` and `ext`
 * (not the client-supplied values) when persisting the file.
 */
export async function validateUploadBuffer(
  buffer: Buffer
): Promise<UploadValidation> {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    return {
      ok: false,
      reason: 'Could not determine file type from content',
    };
  }

  if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
    return {
      ok: false,
      reason: `File type ${detected.mime} is not allowed`,
    };
  }

  return { ok: true, mime: detected.mime, ext: detected.ext };
}
