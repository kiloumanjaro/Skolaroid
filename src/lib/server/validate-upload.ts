type AllowedFileType =
  | { mime: 'image/jpeg'; ext: 'jpg' }
  | { mime: 'image/png'; ext: 'png' }
  | { mime: 'image/webp'; ext: 'webp' }
  | { mime: 'image/gif'; ext: 'gif' }
  | { mime: 'video/mp4'; ext: 'mp4' }
  | { mime: 'video/webm'; ext: 'webm' }
  | { mime: 'video/quicktime'; ext: 'mov' };

export type UploadValidation =
  | { ok: true; mime: AllowedFileType['mime']; ext: AllowedFileType['ext'] }
  | { ok: false; reason: string };

function matchesSignature(
  buffer: Buffer,
  signature: number[],
  offset = 0
): boolean {
  if (buffer.length < offset + signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[offset + index] === byte);
}

function detectMp4Family(buffer: Buffer): AllowedFileType | null {
  if (
    buffer.length < 12 ||
    !matchesSignature(buffer, [0x66, 0x74, 0x79, 0x70], 4)
  ) {
    return null;
  }

  const brand = buffer.toString('ascii', 8, 12);
  if (brand.startsWith('qt')) {
    return { mime: 'video/quicktime', ext: 'mov' };
  }

  return { mime: 'video/mp4', ext: 'mp4' };
}

function detectWebm(buffer: Buffer): AllowedFileType | null {
  if (
    matchesSignature(buffer, [0x1a, 0x45, 0xdf, 0xa3]) &&
    buffer.includes(Buffer.from('webm', 'ascii'))
  ) {
    return { mime: 'video/webm', ext: 'webm' };
  }

  return null;
}

function detectAllowedFileType(buffer: Buffer): AllowedFileType | null {
  if (matchesSignature(buffer, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  if (
    matchesSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  if (matchesSignature(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { mime: 'image/gif', ext: 'gif' };
  }

  if (
    matchesSignature(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    matchesSignature(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return detectMp4Family(buffer) ?? detectWebm(buffer);
}

/**
 * Server-side guard that sniffs an upload's magic bytes and rejects anything
 * outside the narrow image/video allowlist. Use the returned `mime` and `ext`
 * (not the client-supplied values) when persisting the file.
 */
export async function validateUploadBuffer(
  buffer: Buffer
): Promise<UploadValidation> {
  const detected = detectAllowedFileType(buffer);

  if (!detected) {
    return {
      ok: false,
      reason: 'Could not determine an allowed file type from content',
    };
  }

  return { ok: true, mime: detected.mime, ext: detected.ext };
}
