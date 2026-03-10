"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface ImageCaptureResult {
  faceImage: string;
  hairImage?: string | null;
}

interface ImageCaptureProps {
  onCapture: (result: ImageCaptureResult) => void;
  onError?: (message: string) => void;
}

export function ImageCapture({ onCapture, onError }: ImageCaptureProps) {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [hairPreview, setHairPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"face" | "hair" | "done">("face");
  const [askHair, setAskHair] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hairFileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      onError?.("Camera not available. Please use file upload.");
      setMode("upload");
    }
  }, [onError]);

  const captureFromVideo = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  const handleCaptureFace = useCallback(() => {
    const data = mode === "camera" ? captureFromVideo() : null;
    if (data) {
      setFacePreview(data);
      setStep("hair");
      setAskHair(true);
    }
  }, [mode, captureFromVideo]);

  const handleSkipHair = useCallback(() => {
    setAskHair(false);
    if (facePreview) {
      onCapture({ faceImage: facePreview, hairImage: null });
    }
  }, [facePreview, onCapture]);

  const handleCaptureHair = useCallback(() => {
    const data = mode === "camera" ? captureFromVideo() : hairPreview ? null : undefined;
    if (facePreview && (data || hairPreview)) {
      onCapture({
        faceImage: facePreview,
        hairImage: data ?? hairPreview ?? null,
      });
    }
  }, [facePreview, hairPreview, mode, captureFromVideo, onCapture]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "face" | "hair") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (type === "face") {
        setFacePreview(data);
        setStep("hair");
        setAskHair(true);
      } else {
        setHairPreview(data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWithFaceOnly = () => {
    if (facePreview) onCapture({ faceImage: facePreview, hairImage: null });
  };

  const handleSubmitWithHair = () => {
    if (facePreview && hairPreview) {
      onCapture({ faceImage: facePreview, hairImage: hairPreview });
    }
  };

  useEffect(() => {
    if (mode === "camera" && (step === "face" || step === "hair")) startCamera();
    return () => stopCamera();
  }, [mode, step, startCamera, stopCamera]);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-none border border-charcoal/20 bg-champagne/10 p-1">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setMode("camera");
            setFacePreview(null);
            setHairPreview(null);
            setStep("face");
          }}
          className={`flex-1 rounded-none py-3 text-sm font-bold uppercase tracking-widest transition-colors ${mode === "camera"
            ? "bg-bordeaux text-white"
            : "text-charcoal/80 hover:text-charcoal"
            }`}
        >
          Camera
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setMode("upload");
            setFacePreview(null);
            setHairPreview(null);
            setStep("face");
          }}
          className={`flex-1 rounded-none py-3 text-sm font-bold uppercase tracking-widest transition-colors ${mode === "upload"
            ? "bg-bordeaux text-white"
            : "text-charcoal/80 hover:text-charcoal"
            }`}
        >
          Upload
        </button>
      </div>

      {/* Face step */}
      {step === "face" && (
        <Card compact>
          <p className="mb-4 text-sm font-medium text-charcoal/80">
            Capture a selfie (face and visible hair) for best results.
          </p>
          {mode === "camera" && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full rounded-none bg-champagne/10 object-cover border border-charcoal/20"
              />
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 text-xs font-bold uppercase tracking-widest text-charcoal hover:underline"
              >
                Start camera
              </button>
              <Button
                variant="primary"
                fullWidth
                className="mt-4 py-3"
                onClick={handleCaptureFace}
              >
                Take photo
              </Button>
            </>
          )}
          {mode === "upload" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "face")}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-none border border-dashed border-charcoal/20 py-12 text-sm font-medium uppercase tracking-widest text-charcoal/60 transition-colors hover:bg-champagne/10 hover:text-charcoal"
              >
                Choose face/selfie image
              </button>
              {facePreview && (
                <img
                  src={facePreview}
                  alt="Face preview"
                  className="mt-4 aspect-square w-24 rounded-none object-cover border border-charcoal/20"
                />
              )}
            </>
          )}
        </Card>
      )}

      {/* Optional hair step */}
      {step === "hair" && askHair && facePreview && (
        <Card compact>
          <p className="mb-4 text-sm font-medium text-charcoal/80">
            Add a hair-focused photo for better hair recommendations (optional).
          </p>
          {mode === "camera" && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full rounded-none bg-champagne/10 object-cover border border-charcoal/20"
              />
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1 py-3" onClick={handleSkipHair}>
                  Skip
                </Button>
                <Button variant="primary" className="flex-1 py-3" onClick={handleCaptureHair}>
                  Capture hair
                </Button>
              </div>
            </>
          )}
          {mode === "upload" && (
            <>
              <input
                ref={hairFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "hair")}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => hairFileInputRef.current?.click()}
                  className="flex-1 rounded-none border border-dashed border-charcoal/20 py-6 text-sm font-medium uppercase tracking-widest text-charcoal/60 transition-colors hover:bg-champagne/10 hover:text-charcoal"
                >
                  Add hair photo
                </button>
                <Button variant="secondary" className="py-3" onClick={handleSubmitWithFaceOnly}>
                  Skip
                </Button>
              </div>
              {hairPreview && (
                <Button
                  variant="primary"
                  fullWidth
                  className="mt-3 py-3"
                  onClick={handleSubmitWithHair}
                >
                  Use both photos
                </Button>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
