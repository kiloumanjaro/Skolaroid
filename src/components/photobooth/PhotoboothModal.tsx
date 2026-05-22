'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, RefreshCw, Upload, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { TagInput } from '@/components/shared/forms/TagInput';
import { QRGateModal } from './QRGateModal';

type Step = 'camera' | 'metadata' | 'uploading' | 'qr_gate' | 'done';

interface PhotoboothEvent {
  id: string;
  name: string;
  location: { latitude: number; longitude: number; buildingName: string };
}

interface PhotoboothModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: PhotoboothEvent;
}

export function PhotoboothModal({
  open,
  onOpenChange,
  event,
}: PhotoboothModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>('camera');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraFallback, setCameraFallback] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // QR gate state
  const [qrUrl, setQrUrl] = useState('');
  const [qrExpiresAt, setQrExpiresAt] = useState<Date>(new Date());
  const [draftToken, setDraftToken] = useState('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera when modal opens on camera step
  useEffect(() => {
    if (!open || step !== 'camera' || cameraFallback) return;

    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraFallback(true);
      return;
    }

    const startStream = (constraints: MediaStreamConstraints) =>
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

    // Try rear camera first; fall back to any camera on OverconstrainedError
    startStream({ video: { facingMode: 'environment' }, audio: false })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : '';
        if (
          name === 'OverconstrainedError' ||
          name === 'ConstraintNotSatisfiedError'
        ) {
          return startStream({ video: true, audio: false });
        }
        throw err;
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn(
            '[Photobooth] camera error:',
            err instanceof Error ? err.name : err
          );
          setCameraFallback(true);
        }
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, step, cameraFallback, stopStream]);

  // Stop stream when modal closes or step changes away from camera
  useEffect(() => {
    if (!open || step !== 'camera') stopStream();
  }, [open, step, stopStream]);

  // Revoke preview URL on cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleReset = () => {
    stopStream();
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption('');
    setTags([]);
    setError(null);
    setStep('camera');
    setCameraFallback(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleDirectUploadComplete = () => {
    setStep('done');
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStep('metadata');
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('metadata');
  };

  const handleUpload = async () => {
    if (!capturedBlob) return;
    setError(null);
    setStep('uploading');

    try {
      const formData = new FormData();
      formData.append('file', capturedBlob, 'photo.jpg');
      formData.append('eventId', event.id);
      if (caption.trim()) formData.append('caption', caption.trim());
      formData.append('tags', JSON.stringify(tags));

      const draftRes = await fetch('/api/photobooth-draft/create', {
        method: 'POST',
        body: formData,
      });
      const draftData = await draftRes.json();

      if (!draftRes.ok || !draftData.success) {
        throw new Error(draftData.message ?? 'Failed to create draft');
      }

      // Always show the QR gate — the visitor scans on their own phone
      // so the memory is credited to them, not the device operator
      const resumeUrl = `${window.location.origin}/photobooth/resume?token=${draftData.token}`;
      setQrUrl(resumeUrl);
      setDraftToken(draftData.token);
      setQrExpiresAt(new Date(draftData.expiresAt));
      setStep('qr_gate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('metadata');
    }
  };

  return (
    <>
      <Dialog
        open={open && step !== 'qr_gate'}
        onOpenChange={(o) => {
          if (!o) handleClose();
        }}
      >
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-sm !rounded-none !shadow-none sm:w-[calc(100vw-4rem)]"
          showCloseButton={step !== 'uploading'}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-0">
            <DialogTitle className="font-dancing text-3xl font-semibold">
              {step === 'camera' && (
                <>
                  Take a <span className="text-skolaroid-blue">Skolaroid</span>
                </>
              )}
              {step === 'metadata' && (
                <>
                  Add <span className="text-skolaroid-blue">Details</span>
                </>
              )}
              {step === 'uploading' && (
                <span className="text-skolaroid-blue">Uploading…</span>
              )}
              {step === 'done' && (
                <>
                  Memory <span className="text-skolaroid-blue">Saved!</span>
                </>
              )}
            </DialogTitle>
          </div>

          <AnimatePresence mode="wait">
            {step === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {cameraFallback ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <Camera className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Camera access is unavailable. Choose a photo from your
                      device instead.
                    </p>
                    <label className="cursor-pointer border-2 border-black px-4 py-2 text-sm font-bold uppercase tracking-wide transition">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden border-2 border-black bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <button
                      onClick={handleCapture}
                      className="flex w-full items-center justify-center gap-2 border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-95"
                      style={{ backgroundColor: '#4384dc' }}
                    >
                      <Camera className="h-5 w-5" />
                      Capture
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {step === 'metadata' && (
              <motion.div
                key="metadata"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {previewUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="aspect-[4/3] w-full border-2 border-black object-cover"
                    />
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Caption
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="What's the story? (optional)"
                    maxLength={500}
                    rows={2}
                    className="w-full resize-none border-2 border-black bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Tags
                  </label>
                  <TagInput tags={tags} onTagsChange={setTags} />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 border-2 border-black px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex flex-1 items-center justify-center gap-2 border-2 border-black px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition active:scale-95"
                    style={{ backgroundColor: '#4384dc' }}
                  >
                    <Upload className="h-4 w-4" />
                    Upload QR
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <Loader2 className="h-8 w-8 animate-spin text-skolaroid-blue" />
                <p className="text-sm text-muted-foreground">
                  Uploading your memory…
                </p>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Memory saved!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your photo will appear on the map after review.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-1 border-2 border-black px-6 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-95"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <QRGateModal
        open={step === 'qr_gate'}
        onOpenChange={(o) => {
          if (!o) handleClose();
        }}
        qrUrl={qrUrl}
        expiresAt={qrExpiresAt}
        onCancel={handleClose}
        draftToken={draftToken}
        onDirectUploadComplete={handleDirectUploadComplete}
      />
    </>
  );
}
