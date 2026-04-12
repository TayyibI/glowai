import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getRecommendations } from "@/logic/recommendationLogic";
import { RecommendationList } from "@/components/RecommendationList";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AlertCircle, X, Sparkles, Camera, Upload, CheckCircle, AlertTriangle, FlipHorizontal } from "lucide-react";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useLang } from "@/contexts/LangContext";
import { PrivacyModal, getPrivacyAccepted } from "@/components/PrivacyModal";

declare global {
  interface Window {
    YMK?: {
      init: (config: { faceDetectionMode: "skincare" | "hairtype" }) => void;
      capture?: () => Promise<string>;
      captureMultiple?: () => Promise<string[]>;
      addEventListener: (evt: string, cb: (data: any) => void) => void;
      removeEventListener: (evt: string, cb: (data: any) => void) => void;
    };
  }
}

type ScanMode = "camera" | "upload" | null;

type ScanStep =
  | "onboarding"
  | "capturing"
  | "upload"
  | "analyzing"
  | "results"
  | "error"
  | "camera-error";

type CapturePhase = "face" | "hair-front" | "hair-right" | "hair-left";

const CAPTURE_PHASES: CapturePhase[] = ["face", "hair-front", "hair-right", "hair-left"];

const PHASE_LABELS: Record<CapturePhase, string> = {
  "face": "Centre your face in the frame",
  "hair-front": "Show the front of your hair",
  "hair-right": "Turn to your right side",
  "hair-left": "Turn to your left side",
};

const PHASE_STEP: Record<CapturePhase, string> = {
  "face": "Step 1 of 4",
  "hair-front": "Step 2 of 4",
  "hair-right": "Step 3 of 4",
  "hair-left": "Step 4 of 4",
};

// ── Gamified diagnostic scan steps ───────────────────────────────────────────
const SCAN_STEPS = [
  { label: "Calibrating ambient light sensors", icon: "◈" },
  { label: "Mapping epidermal surface layers", icon: "◈" },
  { label: "Analyzing hair follicle texture matrix", icon: "◈" },
  { label: "Detecting skin concern markers", icon: "◈" },
  { label: "Cross-referencing hydration index", icon: "◈" },
  { label: "Formulating clinical diagnostic report", icon: "◈" },
];

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, scale: 0.97, filter: "blur(8px)", transition: { duration: 0.4, ease: "easeInOut" } },
};

// ── Toast notification types ─────────────────────────────────────────────────
type ToastType = "success" | "warning" | "error" | "info";
interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export function Scanner() {
  const { t, isUrdu } = useLang();
  const [step, setStep] = useState<ScanStep>("onboarding");
  const [mode, setMode] = useState<ScanMode>(null);

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyAccepted, setPrivacyAcceptedState] = useState(true); // true initially to avoid flicker, then checked in effect

  useEffect(() => {
    const accepted = getPrivacyAccepted();
    setPrivacyAcceptedState(accepted);
    if (!accepted) setPrivacyOpen(true);
  }, []);

  const [capturedImages, setCapturedImages] = useState<(string | null)[]>([null, null, null, null]);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("face");

  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Gamified scan state ──────────────────────────────────────────────────
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [currentScanStep, setCurrentScanStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [qualityFeedback, setQualityFeedback] = useState<string>("");
  // Face quality gate: true = face detected, correctly positioned, large enough
  const [faceQualityPassed, setFaceQualityPassed] = useState(false);
  const faceQualityPassedRef = useRef(false);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  type LightingState = "TOO_DARK" | "LOW_LIGHT" | "GOOD" | "BRIGHT" | "TOO_BRIGHT" | "CALCULATING";
  const [lightingState, setLightingState] = useState<LightingState>("CALCULATING");
  const lightingStateRef = useRef<LightingState>("CALCULATING");
  const pendingStateRef = useRef<{ state: LightingState; timestamp: number } | null>(null);

  // ── Toast system ─────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevLightingRef = useRef<LightingState>("CALCULATING");

  // ── Camera device detection ───────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
    }).catch(console.error);
  }, []);

  // ── Camera lifecycle ──────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;

    try {
      const res = await navigator.permissions?.query({ name: "camera" as any });
      if (res?.state === "denied") {
        setErrorMessage("Camera access was denied. You can upload photos instead.");
        setStep("camera-error");
        return false;
      }
    } catch (_) { }

    const attach = async (stream: MediaStream): Promise<boolean> => {
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return false;
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.onloadedmetadata = () => resolve();
      });
      try { await video.play(); } catch (e) { console.error("play() failed:", e); }
      return true;
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      return await attach(stream);
    } catch (err) {
      if ((err as Error).name === "OverconstrainedError") {
        try {
          return await attach(await navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
        } catch (_) { }
      }
      setErrorMessage("Camera permission was denied, or another app is using your camera.");
      setStep("camera-error");
      return false;
    }
  }, [facingMode]);

  useEffect(() => {
    if (step === "capturing" && mode === "camera") {
      void startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Lighting loop (face phase only) ──────────────────────────────────────
  useEffect(() => {
    if (step !== "capturing" || mode !== "camera" || capturePhase !== "face") {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      landmarkerRef.current?.close();
      return;
    }

    let raf: number;
    let lastLightTime = 0;
    let hiddenCanvas: HTMLCanvasElement | null = null;

    const tick = (ts: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        raf = requestAnimationFrame(tick);
        animationFrameRef.current = raf;
        return;
      }

      if (ts - lastLightTime >= 500) {
        lastLightTime = ts;
        if (!hiddenCanvas) {
          hiddenCanvas = document.createElement("canvas");
          hiddenCanvas.style.display = "none";
          document.body.appendChild(hiddenCanvas);
        }
        hiddenCanvas.width = video.videoWidth;
        hiddenCanvas.height = video.videoHeight;
        const ctx = hiddenCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const { data } = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
          let sum = 0;
          for (let i = 0; i < data.length; i += 4)
            sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const avg = sum / (data.length / 4);

          const next: LightingState =
            avg < 30 ? "TOO_DARK" :
              avg < 60 ? "LOW_LIGHT" :
                avg < 180 ? "GOOD" :
                  avg < 220 ? "BRIGHT" : "TOO_BRIGHT";

          if (next !== lightingStateRef.current) {
            const now = Date.now();
            if (!pendingStateRef.current || pendingStateRef.current.state !== next) {
              pendingStateRef.current = { state: next, timestamp: now };
            } else if (now - pendingStateRef.current.timestamp > 800) {
              lightingStateRef.current = next;
              setLightingState(next);
              pendingStateRef.current = null;

              // ── Image Quality Check toast notifications (renamed from “Lighting Stress Test”) ──
              if (next === "GOOD" || next === "BRIGHT") {
                addToast("success", t("toast.light_pass_title"), t("toast.light_pass_msg"));
              } else if (next === "TOO_DARK") {
                addToast("error", t("toast.light_fail_title"), t("toast.light_fail_msg"));
              } else if (next === "LOW_LIGHT") {
                addToast("warning", t("toast.light_warn_title"), t("toast.light_warn_msg"));
              } else if (next === "TOO_BRIGHT") {
                addToast("warning", "Lighting Stress Test", "Very bright — step back slightly to reduce overexposure.");
              }
            }
            pendingStateRef.current = null;
          }

          // ── Real FaceLandmarker quality gate ──────────────────────────────
          const lm = landmarkerRef.current;
          if (lm && video.readyState >= 2) {
            try {
              const result = lm.detectForVideo(video, performance.now());
              const faces = result.faceLandmarks ?? [];

              if (faces.length === 0) {
                // No face detected
                faceQualityPassedRef.current = false;
                setFaceQualityPassed(false);
                setQualityFeedback(t("quality.no_face"));
              } else {
                const landmarks = faces[0];
                // Calculate bounding box in normalised coords (0–1)
                let minX = 1, maxX = 0, minY = 1, maxY = 0;
                for (const lp of landmarks) {
                  if (lp.x < minX) minX = lp.x;
                  if (lp.x > maxX) maxX = lp.x;
                  if (lp.y < minY) minY = lp.y;
                  if (lp.y > maxY) maxY = lp.y;
                }
                const faceW = maxX - minX;
                const faceH = maxY - minY;
                const faceCentreX = minX + faceW / 2;
                const faceCentreY = minY + faceH / 2;
                const faceArea = faceW * faceH;

                const isCentred = faceCentreX > 0.2 && faceCentreX < 0.8 &&
                  faceCentreY > 0.2 && faceCentreY < 0.8;
                const isLargeEnough = faceArea > 0.05; // at least 5% of frame area

                if (!isLargeEnough) {
                  faceQualityPassedRef.current = false;
                  setFaceQualityPassed(false);
                  setQualityFeedback(t("quality.face_small"));
                } else if (!isCentred) {
                  faceQualityPassedRef.current = false;
                  setFaceQualityPassed(false);
                  setQualityFeedback(t("quality.face_off_centre"));
                } else {
                  faceQualityPassedRef.current = true;
                  setFaceQualityPassed(true);
                  setQualityFeedback(t("quality.good"));
                }
              }
            } catch (_) {
              // Landmarker not ready yet; allow capture as fallback
              faceQualityPassedRef.current = true;
              setFaceQualityPassed(true);
            }
          } else {
            // No landmarker yet; optimistically allow capture
            faceQualityPassedRef.current = true;
            setFaceQualityPassed(true);
          }
        }
      }

      raf = requestAnimationFrame(tick);
      animationFrameRef.current = raf;
    };

    raf = requestAnimationFrame(tick);
    animationFrameRef.current = raf;

    (async () => {
      try {
        const fs = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        landmarkerRef.current = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          numFaces: 1,
          runningMode: "VIDEO",
        });
      } catch (e) { console.error("FaceLandmarker:", e); }
    })();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      landmarkerRef.current?.close();
      hiddenCanvas?.remove();
    };
  }, [step, mode, capturePhase, addToast]);

  // ── YMK SDK ───────────────────────────────────────────────────────────────
  const handleFaceQuality = useCallback((q: any) => {
    if (!q) return;
    const issues = [
      !q.hasFace && "No face detected",
      q.position !== "good" && "Move closer to the camera",
      q.lighting !== "good" && "Improve lighting — move to a brighter area",
      q.frontal !== "good" && "Face the camera straight on",
    ].filter(Boolean) as string[];
    setQualityFeedback(issues[0] ?? "Perfect positioning ✓");
  }, []);

  useEffect(() => {
    if (step !== "capturing" || mode !== "camera" || !window.YMK) return;
    if (capturePhase === "face") {
      window.YMK.init({ faceDetectionMode: "skincare" });
      window.YMK.addEventListener("faceQualityChanged", handleFaceQuality);
    } else {
      window.YMK.init({ faceDetectionMode: "hairtype" });
    }
    return () => window.YMK?.removeEventListener("faceQualityChanged", handleFaceQuality);
  }, [step, mode, capturePhase, handleFaceQuality]);

  // ── Bounding box CSS class based on lighting ──────────────────────────────
  const getBoundingBoxClass = (s: LightingState) => {
    if (s === "GOOD" || s === "BRIGHT") return "bounding-box-good";
    if (s === "TOO_DARK") return "bounding-box-bad";
    if (s === "CALCULATING") return ""; // default white
    return "bounding-box-warn";
  };

  const getLightingMsg = (s: LightingState) => {
    if (s === "TOO_DARK") return "Too dark — move to a brighter area";
    if (s === "LOW_LIGHT") return "Lighting could be better";
    if (s === "GOOD") return "Lighting optimal ✓";
    if (s === "BRIGHT") return "Lighting optimal ✓";
    if (s === "TOO_BRIGHT") return "Very bright — step back slightly";
    return "Checking lighting...";
  };

  const getLightingDotColor = (s: LightingState) => {
    if (s === "GOOD" || s === "BRIGHT") return "bg-green-400";
    if (s === "TOO_DARK") return "bg-red-500";
    if (s === "CALCULATING") return "bg-gray-400";
    return "bg-amber-400";
  };

  // ── Gamified scan animation ──────────────────────────────────────────────
  const runScanAnimation = useCallback(() => {
    setScanLog([]);
    setCurrentScanStep(0);
    setLoadingProgress(0);

    let idx = 0;
    const iv = setInterval(() => {
      idx += 1;
      const pct = Math.min((idx / SCAN_STEPS.length) * 100, 100);
      setLoadingProgress(pct);

      if (idx <= SCAN_STEPS.length) {
        setScanLog((prev) => [...prev, SCAN_STEPS[idx - 1].label]);
        setCurrentScanStep(idx);
      } else {
        clearInterval(iv);
      }
    }, 750);

    return () => clearInterval(iv);
  }, []);

  // ── Analysis ──────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (skinImg: string, hairImgs: string[]) => {
    setStep("analyzing");
    const clear = runScanAnimation();
    try {
      const [skinRes, hairRes] = await Promise.all([
        fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: skinImg }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Skin analysis failed");
          return r.json() as Promise<AnalysisResult>;
        }),
        fetch("/api/analyze-hair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: hairImgs }),
        }).then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Hair analysis failed");
          return r.json() as Promise<AnalysisResult>;
        }),
      ]);
      setAnalysis({
        face: skinRes.face,
        hair: hairRes.hair,
        overallConfidence: Math.min(skinRes.overallConfidence, hairRes.overallConfidence),
      });
      setStep("results");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Analysis failed");
      setStep("error");
    } finally {
      clear();
    }
  }, [runScanAnimation]);

  // ── Capture from live video ───────────────────────────────────────────────
  const captureFromVideo = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [facingMode]);

  // ── Main shutter handler ───────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const base64 = captureFromVideo();
    if (!base64) return;

    const idx = CAPTURE_PHASES.indexOf(capturePhase);
    const newImages = [...capturedImages];
    newImages[idx] = base64;

    setPreviewBase64(base64);

    setTimeout(() => {
      setPreviewBase64(null);
      setCapturedImages(newImages);

      const next = CAPTURE_PHASES[idx + 1];
      if (next) {
        setCapturePhase(next);
        if (next !== "face") setQualityFeedback("");
      } else {
        stopCamera();
        const [skin, ...hair] = newImages as string[];
        handleAnalyze(skin, hair);
      }
    }, 900);
  }, [capturePhase, capturedImages, captureFromVideo, stopCamera, handleAnalyze]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length !== 4) {
      setErrorMessage("Please select exactly 4 photos in order: face, hair front, hair right, hair left.");
      setStep("error");
      return;
    }
    if (Array.from(files).some((f) => f.size > 10 * 1024 * 1024)) {
      setErrorMessage("One or more photos exceeds 10MB. Please choose smaller images.");
      setStep("error");
      return;
    }

    Promise.all(
      Array.from(files).map(
        (file) => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      )
    ).then(([skin, ...hair]) => handleAnalyze(skin, hair));
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    stopCamera();
    setStep("onboarding");
    setMode(null);
    setAnalysis(null);
    setErrorMessage(null);
    setCapturedImages([null, null, null, null]);
    setCapturePhase("face");
    setPreviewBase64(null);
    setQualityFeedback("");
    setLightingState("CALCULATING");
    lightingStateRef.current = "CALCULATING";
    setScanLog([]);
    setCurrentScanStep(0);
    setLoadingProgress(0);
  }, [stopCamera]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const routine = analysis ? getRecommendations(analysis) : null;
  const targetTags = analysis
    ? [...(analysis.face.concerns || []), analysis.face.skinType, analysis.face.hydrationScore < 60 ? "hydration" : ""].filter(Boolean) as string[]
    : [];

  const phaseIndex = CAPTURE_PHASES.indexOf(capturePhase);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] overflow-hidden rounded-none bg-champagne/10 border border-charcoal/20" dir={isUrdu ? "rtl" : "ltr"}>
      {privacyOpen && (
        <PrivacyModal 
          accepted={privacyAccepted} 
          onAccept={() => {
            setPrivacyAcceptedState(true);
            setPrivacyOpen(false);
          }} 
          onDecline={() => {
            window.location.href = "/";
          }}
          lang={isUrdu ? "ur" : "en"}
        />
      )}

      {/* ── Global Toast Notification Stack ──────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 border shadow-2xl text-sm ${
                toast.type === "success"
                  ? "bg-[#0d1f19] border-green-700/60 text-green-200"
                  : toast.type === "error"
                  ? "bg-[#1f0d0d] border-red-700/60 text-red-200"
                  : toast.type === "warning"
                  ? "bg-[#1f1706] border-amber-600/60 text-amber-200"
                  : "bg-[#0d0f1f] border-blue-700/60 text-blue-200"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle className="w-4 h-4 text-green-400" />}
                {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {toast.type === "info" && <Sparkles className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[10px] uppercase tracking-widest opacity-90 mb-0.5">{toast.title}</p>
                <p className="text-[11px] opacity-75 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">

        {/* ── ONBOARDING ───────────────────────────────────────────────── */}
        {step === "onboarding" && (
          <motion.div key="onboarding" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="absolute inset-0 z-10 bg-alabaster">
            <OnboardingFlow
              onComplete={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
              onSkipSetup={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
            />
          </motion.div>
        )}

        {/* ── UPLOAD MODE ──────────────────────────────────────────────── */}
        {step === "upload" && (
          <motion.div key="upload" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-champagne/10/80">

            <button onClick={handleRetry}
              aria-label={t("error.try_again")}
              className="absolute top-6 left-6 text-charcoal/80 hover:text-charcoal p-3 bg-alabaster border border-charcoal/20 rounded-none transition-all duration-200 ease-in-out">
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-3">Upload Photos</h2>
            <p className="text-sm font-bold tracking-widest uppercase text-charcoal/60 mb-2 max-w-sm">
              Select exactly 4 photos in this order:
            </p>
            <ol className="text-xs uppercase tracking-widest text-charcoal/80 mb-8 space-y-1 font-bold">
              <li>① Face — straight on</li>
              <li>② Hair — front view</li>
              <li>③ Hair — right side</li>
              <li>④ Hair — left side</li>
            </ol>

            <div className="mb-8">
              <PrivacyBadge variant="default" />
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadFiles} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md rounded-none border border-dashed border-charcoal/20 hover:bg-alabaster bg-transparent py-16 flex flex-col items-center justify-center gap-4 transition-all duration-200 ease-in-out"
            >
              <div className="w-16 h-16 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center">
                <Upload className="w-8 h-8 text-charcoal" />
              </div>
              <span className="text-charcoal font-bold uppercase tracking-widest text-sm">Select 4 photos</span>
              <span className="text-xs text-charcoal/60 uppercase tracking-widest">PNG, JPG · up to 10MB each</span>
            </motion.button>

            <button
              onClick={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
              className="mt-8 text-xs tracking-widest uppercase font-bold text-charcoal/60 hover:text-charcoal underline transition-all duration-200 ease-in-out"
            >
              Use camera instead
            </button>
          </motion.div>
        )}

        {/* ── CAMERA — SINGLE CONTINUOUS SESSION ───────────────────────── */}
        {step === "capturing" && mode === "camera" && (
          <motion.div key="capturing" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="absolute inset-0 bg-charcoal z-10 flex flex-col">

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-6">
              <button onClick={handleRetry}
                aria-label="Close camera"
                className="text-white/80 hover:text-white p-3 backdrop-blur-md bg-black/30 rounded-none border border-white/20 transition-all duration-200 ease-in-out">
                <X className="w-6 h-6" />
              </button>

              {/* Phase progress dots */}
              <div className="flex items-center gap-2">
                {CAPTURE_PHASES.map((p, i) => (
                  <div key={p} className={`rounded-full transition-all duration-300 ${i < phaseIndex ? "w-2 h-2 bg-white/70" :
                    i === phaseIndex ? "w-3 h-3 bg-[#c9a98a]" :
                      "w-2 h-2 bg-white/25"
                    }`} />
                ))}
              </div>

              {/* Lighting chip — face phase only */}
              {capturePhase === "face"
                ? (
                  <div className="bg-black/60 text-white text-xs px-3 py-2 rounded-none flex items-center gap-2 backdrop-blur-md">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${getLightingDotColor(lightingState)}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{getLightingMsg(lightingState)}</span>
                  </div>
                )
                : <div className="w-10" />
              }
            </div>

            {/* Viewfinder */}
            <div className="relative flex-1 bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* Face mesh canvas */}
              {capturePhase === "face" && (
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />
              )}

              {/* Captured-photo flash overlay */}
              <AnimatePresence>
                {previewBase64 && (
                  <motion.img
                    key="preview"
                    src={previewBase64}
                    alt="Captured"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="absolute inset-0 w-full h-full object-cover z-20"
                  />
                )}
              </AnimatePresence>

              {/* ── PREMIUM BOUNDING BOX ─────────────────────────────────── */}
              {!previewBase64 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  {capturePhase === "face" ? (
                    // Face: oval + dynamic glow based on lighting
                    <div className={`relative w-[70%] sm:w-[50%] md:w-[40%] lg:w-[35%] aspect-[3/4] border-2 rounded-[40px] transition-all duration-500 ${getBoundingBoxClass(lightingState) || "border-white/40"}`}>
                      {/* Corner accent markers for premium look */}
                      <div className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-[40px]" />
                      <div className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-[40px]" />
                      <div className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-[40px]" />
                      <div className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-[40px]" />

                      {/* Scan line — visible while lighting is GOOD */}
                      {(lightingState === "GOOD" || lightingState === "BRIGHT") && (
                        <div className="absolute inset-0 overflow-hidden rounded-[40px]">
                          <div
                            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/70 to-transparent scan-line"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Hair phases: rectangular guide
                    <div className="relative w-[80%] sm:w-[65%] aspect-[3/4] border-2 border-[#c9a98a]/60">
                      <div className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-2 border-l-2 border-[#c9a98a]" />
                      <div className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-2 border-r-2 border-[#c9a98a]" />
                      <div className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-2 border-l-2 border-[#c9a98a]" />
                      <div className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-2 border-r-2 border-[#c9a98a]" />
                    </div>
                  )}
                </div>
              )}

              {/* Quality feedback badge */}
              <AnimatePresence>
                {qualityFeedback && capturePhase === "face" && !previewBase64 && (
                  <motion.div
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-none text-xs uppercase tracking-widest font-bold flex items-center gap-3 w-[80%] max-w-sm text-center border bg-alabaster/95 text-charcoal border-charcoal/20 z-40"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{qualityFeedback}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Privacy badge — bottom-left overlay */}
              <div className="absolute bottom-28 left-4 z-40">
                <PrivacyBadge variant="camera" />
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-50">
              {previewBase64 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-white/70 text-xs uppercase tracking-widest font-bold">
                  {capturePhase === "hair-left" ? "Analyzing…" : "Good — next photo…"}
                </motion.p>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.p key={capturePhase}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="text-white/80 text-xs uppercase tracking-widest mb-1 text-center max-w-xs font-bold"
                    >
                      {capturePhase === "face" ? t("scan.centre_face") :
                       capturePhase === "hair-front" ? t("scan.hair_front") :
                       capturePhase === "hair-right" ? t("scan.hair_right") :
                       t("scan.hair_left")}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-white/35 text-xs uppercase tracking-widest mb-6">
                    {t("scan.step_of").replace("{n}", String(phaseIndex + 1)).replace("{total}", "4")}
                  </p>

                  <motion.button
                    id="shutter-btn"
                    whileTap={{ scale: 0.91 }} transition={{ duration: 0.13 }}
                    onClick={handleCapture}
                    disabled={capturePhase === "face" && !faceQualityPassed}
                    aria-label="Capture photo"
                    aria-disabled={capturePhase === "face" && !faceQualityPassed}
                    className={`w-20 h-20 rounded-full relative flex items-center justify-center border-[4px] transition-colors duration-300 ${
                      capturePhase === "face" && !faceQualityPassed
                        ? "border-white/20 bg-black/20 cursor-not-allowed"
                        : "border-[#c9a98a] bg-transparent"
                    }`}
                  >
                    <div className={`w-[66px] h-[66px] rounded-full transition-colors duration-300 ${
                      capturePhase === "face" && !faceQualityPassed
                        ? "bg-white/20"
                        : "bg-[#c9a98a]"
                    }`} />
                  </motion.button>

                  <div className="flex items-center gap-10 mt-8">
                      {hasMultipleCameras && (
                        <button
                          onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
                          aria-label="Flip camera"
                          className="text-white/50 hover:text-white/80 transition-colors p-2"
                        >
                          <FlipHorizontal className="w-5 h-5" />
                        </button>
                      )}
                      
                    <button
                      onClick={() => { stopCamera(); setMode("upload"); setStep("upload"); }}
                      className="text-xs tracking-widest uppercase font-bold text-white/50 hover:text-white/80 underline transition-all duration-200 ease-in-out"
                    >
                      {t("scan.upload_instead")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ANALYZING — GAMIFIED SCAN SEQUENCE ───────────────────────── */}
        {step === "analyzing" && (
          <motion.div key="analyzing" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] bg-[#0d0e0c] relative overflow-hidden">

            {/* Background ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#C2A878]"
              />
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-col items-center mb-10">
              <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-[#C2A878]/30"
                  style={{ borderRadius: "0" }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border border-dashed border-[#C2A878]/20"
                  style={{ borderRadius: "0" }}
                />
                <Sparkles className="w-5 h-5 text-[#C2A878]" />
              </div>
              <h2 className="font-serif text-2xl uppercase tracking-[0.2em] text-[#FAF8F5] mb-1">
                {t("analyze.title")}
              </h2>
              <p className="text-[#888888] font-bold text-[10px] tracking-widest uppercase">
                {t("analyze.engine")}
              </p>
            </div>

            {/* Terminal-style gamified log */}
            <div className="w-full max-w-sm flex flex-col gap-[2px] z-10" dir="ltr">
              <AnimatePresence>
                {scanLog.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-[#f5f2ee] bg-[#1a1b18] px-4 py-2 border border-[#2a2b28]"
                  >
                    <span className="text-[#C2A878] text-[10px]">◈</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {currentScanStep <= SCAN_STEPS.length && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-3 mt-1"
                >
                  <motion.div
                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="w-[1px] h-3 bg-[#c9a98a]"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#888888]">
                    Processing...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a1b18]">
              <motion.div
                className="h-full bg-[#c9a98a]"
                initial={{ width: "0%" }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              />
            </div>
            <div className="absolute bottom-4 left-6 z-10">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888888]">
                {t("analyze.progress")} {Math.round(loadingProgress)}%
              </span>
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────── */}
        {step === "results" && analysis && routine && (
          <motion.div key="results" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-6 md:p-10 min-h-[600px] bg-champagne/10/80">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h1 className="font-serif text-4xl uppercase tracking-widest text-charcoal mb-2">Your Personal Routine</h1>
                <p className="text-sm text-charcoal/80 uppercase tracking-widest">Based on our detailed AI analysis</p>
              </div>
              <Button variant="secondary" onClick={handleRetry} className="hidden sm:flex max-w-[150px] py-3 text-xs uppercase tracking-widest">
                New Scan
              </Button>
            </div>
            <div className="mb-12 max-w-4xl mx-auto w-full">
              <AnalysisDisplay result={analysis} />
            </div>
            <div className="bg-alabaster rounded-none p-8 md:p-12 border border-charcoal/20">
              <RecommendationList routine={routine} showBuyNow userTags={targetTags} />
            </div>
            <Button variant="secondary" onClick={handleRetry} className="w-full mt-10 sm:hidden py-5 text-sm uppercase tracking-widest font-bold">
              New Scan
            </Button>
          </motion.div>
        )}

        {/* ── CAMERA ERROR ─────────────────────────────────────────────── */}
        {step === "camera-error" && (
          <motion.div key="camera-error" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster z-20 absolute inset-0">
            <div className="w-20 h-20 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center mb-8">
              <Camera className="w-10 h-10 text-charcoal" />
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Camera couldn't start</h2>
            <p className="text-sm uppercase tracking-widest text-charcoal/80 font-bold max-w-sm mb-12 leading-relaxed">{errorMessage}</p>
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button variant="primary" onClick={() => { setMode("upload"); setStep("upload"); }}
                className="py-4 text-xs font-bold uppercase tracking-widest">
                Upload photos instead
              </Button>
              <Button variant="secondary"
                onClick={() => { setErrorMessage(null); streamRef.current = null; setStep("capturing"); }}
                className="py-4 text-xs font-bold uppercase tracking-widest bg-transparent border border-charcoal/20 text-charcoal">
                Try again
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────── */}
        {step === "error" && (
          <motion.div key="error" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster border border-charcoal/20">
            <div className="w-20 h-20 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center mb-8">
              <AlertCircle className="w-10 h-10 text-charcoal" />
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Analysis Interrupted</h2>
            <p className="text-sm uppercase tracking-widest text-charcoal/80 font-bold max-w-sm mb-12 leading-relaxed">
              {errorMessage ?? "Something went wrong during analysis."}
            </p>
            <Button variant="primary" onClick={handleRetry} className="py-4 text-xs font-bold uppercase tracking-widest">
              Try again
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}