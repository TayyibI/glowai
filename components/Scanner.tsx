import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getRecommendations } from "@/logic/recommendationLogic";
import { RecommendationList } from "@/components/RecommendationList";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AlertCircle, X, Sparkles, Camera, Upload } from "lucide-react";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

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

// Simplified step set — camera never restarts mid-flow
type ScanStep =
  | "onboarding"
  | "capturing"   // single camera session: face → hair x3
  | "upload"      // upload mode: pick 4 photos at once
  | "analyzing"
  | "results"
  | "error"
  | "camera-error";

type CapturePhase = "face" | "hair-front" | "hair-right" | "hair-left";

const CAPTURE_PHASES: CapturePhase[] = ["face", "hair-front", "hair-right", "hair-left"];

const PHASE_LABELS: Record<CapturePhase, string> = {
  "face": "Centre your face in the oval",
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

const LOADING_STEPS = [
  "Detecting face...",
  "Analyzing skin...",
  "Analyzing hair...",
  "Generating routine...",
];

const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, scale: 0.97, filter: "blur(8px)", transition: { duration: 0.4, ease: "easeInOut" } },
};

export function Scanner() {
  const [step, setStep] = useState<ScanStep>("onboarding");
  const [mode, setMode] = useState<ScanMode>(null);

  // Index 0=face, 1=hair-front, 2=hair-right, 3=hair-left
  const [capturedImages, setCapturedImages] = useState<(string | null)[]>([null, null, null, null]);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("face");

  // Brief still preview between captures (no step change, camera keeps running)
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loadingLabel, setLoadingLabel] = useState(LOADING_STEPS[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [qualityFeedback, setQualityFeedback] = useState<string>("");

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  type LightingState = "TOO_DARK" | "LOW_LIGHT" | "GOOD" | "BRIGHT" | "TOO_BRIGHT" | "CALCULATING";
  const [lightingState, setLightingState] = useState<LightingState>("CALCULATING");
  const lightingStateRef = useRef<LightingState>("CALCULATING");
  const pendingStateRef = useRef<{ state: LightingState; timestamp: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loadingStepIndexRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ─── Camera device detection ───────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setHasMultipleCameras(devices.filter((d) => d.kind === "videoinput").length > 1);
    }).catch(console.error);
  }, []);

  // ─── Camera lifecycle ──────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    // Don't restart if already live
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

  // Start camera ONCE when entering "capturing". Stop when leaving. Never restart in between.
  useEffect(() => {
    if (step === "capturing" && mode === "camera") {
      void startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode]); // deliberately NOT including startCamera/stopCamera refs

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ─── Lighting loop (face phase only) ──────────────────────────────────────
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
            }
          } else {
            pendingStateRef.current = null;
          }
        }
      }

      raf = requestAnimationFrame(tick);
      animationFrameRef.current = raf;
    };

    raf = requestAnimationFrame(tick);
    animationFrameRef.current = raf;

    // Face mesh
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
  }, [step, mode, capturePhase]);

  // ─── YMK SDK ───────────────────────────────────────────────────────────────
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

  // ─── Lighting UI ───────────────────────────────────────────────────────────
  const getLightingUI = (s: LightingState) => ({
    color: s === "GOOD" || s === "BRIGHT" ? "bg-green-500"
      : s === "TOO_DARK" ? "bg-red-500"
        : s === "CALCULATING" ? "bg-gray-400"
          : "bg-amber-500",
    msg: s === "TOO_DARK" ? "Too dark — move to a brighter area"
      : s === "LOW_LIGHT" ? "Lighting could be better"
        : s === "GOOD" ? "Lighting looks good"
          : s === "BRIGHT" ? "Lighting looks good"
            : s === "TOO_BRIGHT" ? "Very bright — step back slightly"
              : "Checking lighting...",
  });

  // ─── Loading animation ─────────────────────────────────────────────────────
  const runLoadingSteps = useCallback(() => {
    setLoadingProgress(0);
    loadingStepIndexRef.current = 0;
    setLoadingLabel(LOADING_STEPS[0]);
    const iv = setInterval(() => {
      loadingStepIndexRef.current += 1;
      setLoadingProgress((loadingStepIndexRef.current / LOADING_STEPS.length) * 100);
      if (loadingStepIndexRef.current < LOADING_STEPS.length)
        setLoadingLabel(LOADING_STEPS[loadingStepIndexRef.current]);
      else clearInterval(iv);
    }, 800);
    return () => clearInterval(iv);
  }, []);

  // ─── Analysis ─────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (skinImg: string, hairImgs: string[]) => {
    setStep("analyzing");
    const clear = runLoadingSteps();
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
  }, [runLoadingSteps]);

  // ─── Capture from live video ───────────────────────────────────────────────
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

  // ─── Main shutter handler ─────────────────────────────────────────────────
  // Camera keeps running between ALL phases — no stop/start, no step change
  const handleCapture = useCallback(() => {
    const base64 = captureFromVideo();
    if (!base64) return;

    const idx = CAPTURE_PHASES.indexOf(capturePhase);
    const newImages = [...capturedImages];
    newImages[idx] = base64;

    // Show captured frame as preview for ~900ms while camera keeps running
    setPreviewBase64(base64);

    setTimeout(() => {
      setPreviewBase64(null);
      setCapturedImages(newImages);

      const next = CAPTURE_PHASES[idx + 1];
      if (next) {
        setCapturePhase(next);
        if (next !== "face") setQualityFeedback("");
      } else {
        // All 4 captured — stop camera and fire analysis
        stopCamera();
        const [skin, ...hair] = newImages as string[];
        handleAnalyze(skin, hair);
      }
    }, 900);
  }, [capturePhase, capturedImages, captureFromVideo, stopCamera, handleAnalyze]);

  // ─── Upload: 4 files at once (face + 3 hair) ──────────────────────────────
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

  // ─── Reset ────────────────────────────────────────────────────────────────
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
  }, [stopCamera]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const routine = analysis ? getRecommendations(analysis) : null;
  const targetTags = analysis
    ? [...(analysis.face.concerns || []), analysis.face.skinType, analysis.face.hydrationScore < 60 ? "hydration" : ""].filter(Boolean) as string[]
    : [];

  const phaseIndex = CAPTURE_PHASES.indexOf(capturePhase);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] overflow-hidden rounded-none bg-champagne/10 border border-charcoal/20">
      <AnimatePresence mode="wait">

        {/* ── ONBOARDING ─────────────────────────────────────────────────── */}
        {step === "onboarding" && (
          <motion.div key="onboarding" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="absolute inset-0 z-10 bg-alabaster">
            <OnboardingFlow
              onComplete={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
              onSkipSetup={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
            />
          </motion.div>
        )}

        {/* ── UPLOAD MODE ────────────────────────────────────────────────── */}
        {step === "upload" && (
          <motion.div key="upload" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-champagne/10/80">

            <button onClick={handleRetry}
              className="absolute top-6 left-6 text-charcoal/80 hover:text-charcoal p-3 bg-alabaster border border-charcoal/20 rounded-none transition-colors">
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-3">Upload Photos</h2>
            <p className="text-sm font-bold tracking-widest uppercase text-charcoal/60 mb-2 max-w-sm">
              Select exactly 4 photos in this order:
            </p>
            <ol className="text-xs uppercase tracking-widest text-charcoal/80 mb-10 space-y-1 font-bold">
              <li>① Face — straight on</li>
              <li>② Hair — front view</li>
              <li>③ Hair — right side</li>
              <li>④ Hair — left side</li>
            </ol>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadFiles} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md rounded-none border border-dashed border-charcoal/20 hover:bg-alabaster bg-transparent py-16 flex flex-col items-center justify-center gap-4 transition-colors"
            >
              <div className="w-16 h-16 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center">
                <Upload className="w-8 h-8 text-charcoal" />
              </div>
              <span className="text-charcoal font-bold uppercase tracking-widest text-sm">Select 4 photos</span>
              <span className="text-xs text-charcoal/60 uppercase tracking-widest">PNG, JPG · up to 10MB each</span>
            </motion.button>

            <button
              onClick={() => { setMode("camera"); setCapturePhase("face"); setStep("capturing"); }}
              className="mt-8 text-xs tracking-widest uppercase font-bold text-charcoal/60 hover:text-charcoal underline"
            >
              Use camera instead
            </button>
          </motion.div>
        )}

        {/* ── CAMERA — SINGLE CONTINUOUS SESSION ─────────────────────────── */}
        {step === "capturing" && mode === "camera" && (
          <motion.div key="capturing" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="absolute inset-0 bg-charcoal z-10 flex flex-col">

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-6">
              <button onClick={handleRetry}
                className="text-white/80 hover:text-white p-3 backdrop-blur-md bg-black/30 rounded-none border border-white/20">
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
                  <div className="bg-black/60 text-white text-xs px-3 py-2 rounded-none flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getLightingUI(lightingState).color}`} />
                    <span>{getLightingUI(lightingState).msg}</span>
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

              {/* Captured-photo flash overlay — camera video stays behind it */}
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

              {/* Guide outline */}
              {!previewBase64 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  {capturePhase === "face"
                    ? <div className="w-[70%] sm:w-[50%] md:w-[40%] lg:w-[35%] aspect-[3/4] border-2 border-dashed border-white/40 rounded-[40px]" />
                    : <div className="w-[80%] sm:w-[65%] aspect-[3/4] border-2 border-dashed border-[#c9a98a]/50 rounded-lg" />
                  }
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
                      {PHASE_LABELS[capturePhase]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-white/35 text-xs uppercase tracking-widest mb-6">{PHASE_STEP[capturePhase]}</p>

                  <motion.button
                    whileTap={{ scale: 0.91 }} transition={{ duration: 0.13 }}
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full relative flex items-center justify-center bg-transparent border-[4px] border-[#c9a98a]"
                  >
                    <div className="w-[66px] h-[66px] rounded-full bg-[#c9a98a]" />
                  </motion.button>

                  <button
                    onClick={() => { stopCamera(); setMode("upload"); setStep("upload"); }}
                    className="mt-8 text-xs tracking-widest uppercase font-bold text-white/50 hover:text-white/80 underline"
                  >
                    Upload instead
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ANALYZING ──────────────────────────────────────────────────── */}
        {step === "analyzing" && (
          <motion.div key="analyzing" variants={fadeVariants} initial="hidden" animate="show" exit="exit"
            className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-none border border-dashed border-charcoal/20" />
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-none bg-champagne/10 border border-charcoal/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-charcoal" />
              </motion.div>
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Analyzing your profile</h2>
            <motion.p key={loadingLabel} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="text-charcoal/80 text-sm font-bold uppercase tracking-widest mb-10 h-6">
              {loadingLabel}
            </motion.p>
            <div className="w-full max-w-sm bg-champagne/10 rounded-none h-4 overflow-hidden relative border border-charcoal/20">
              <motion.div className="absolute top-0 left-0 bottom-0 bg-bordeaux rounded-none"
                initial={{ width: 0 }} animate={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }} />
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
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

        {/* ── CAMERA ERROR ───────────────────────────────────────────────── */}
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

        {/* ── ERROR ──────────────────────────────────────────────────────── */}
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