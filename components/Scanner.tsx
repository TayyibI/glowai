import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getRecommendations } from "@/logic/recommendationLogic";
import { RecommendationList } from "@/components/RecommendationList";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AlertCircle, X, ChevronRight, Sparkles, Camera, Upload, RefreshCcw } from "lucide-react";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { OnboardingFlow } from "@/components/OnboardingFlow";
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
type ScanStep = "onboarding" | "start" | "capture-face" | "hair-prompt" | "capture-hair" | "analyzing" | "results" | "error" | "camera-error" | "confirm-photo";
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

  const [skinBase64, setSkinBase64] = useState<string | null>(null);
  const [hairCollected, setHairCollected] = useState<string[]>([]);
  type HairCapturePhase = "front" | "right" | "left";
  const [hairPhase, setHairPhase] = useState<HairCapturePhase>("front");

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loadingLabel, setLoadingLabel] = useState(LOADING_STEPS[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [isQualityBad, setIsQualityBad] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loadingStepIndexRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hairFileInputRef = useRef<HTMLInputElement>(null);

  const [qualityFeedback, setQualityFeedback] = useState<string>("");
  const [isQualityGood, setIsQualityGood] = useState(false);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(console.error);
    }
  }, []);

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Critical for mobile
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.style.display = "none";
      void videoRef.current.offsetHeight; // force reflow
      videoRef.current.style.display = "block";
    }
  }, []);
  const startCamera = useCallback(async () => {
    stopCamera(); // ensure clean state first

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const res = await navigator.permissions.query({ name: "camera" as any });
        if (res.state === "denied") {
          setErrorMessage("Camera access was denied. You can upload a photo instead, or reset camera permissions in your browser settings.");
          setStep("camera-error");
          return false;
        }
      }
    } catch (e) {
      // Ignore if API not supported
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(console.error);
      }
      return true;
    } catch (err) {
      if ((err as Error).name === "OverconstrainedError") {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          streamRef.current = fallbackStream;

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(console.error);
          }
          return true;
        } catch (fallbackErr) {
          setErrorMessage("This can happen if camera permission was denied, or if another app is using your camera.");
          setStep("camera-error");
          return false;
        }
      }
      setErrorMessage("This can happen if camera permission was denied, or if another app is using your camera.");
      setStep("camera-error");
      return false;
    }
  }, [stopCamera, facingMode]);
  const captureFromVideo = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);
  const handleFaceQuality = useCallback((q: any) => {
    if (!q) return;

    const issues: string[] = [];

    if (!q.hasFace) issues.push("No face detected");
    if (q.position !== "good") issues.push("Move closer to the camera");
    if (q.lighting !== "good") issues.push("Improve lighting – move to a brighter area (avoid shadows)");
    if (q.frontal !== "good") issues.push("Face the camera straight on");

    if (issues.length > 0) {
      setQualityFeedback(issues[0]); // show the most important issue first
      setIsQualityGood(false);
    } else {
      setQualityFeedback("Perfect lighting & positioning ✓");
      setIsQualityGood(true);
    }
  }, []);
  const initYMKSkin = useCallback(() => {
    if (typeof window !== "undefined" && window.YMK) {
      window.YMK.init({ faceDetectionMode: "skincare" });
      window.YMK.addEventListener('faceQualityChanged', handleFaceQuality);
    }
  }, [handleFaceQuality]);
  const initYMKHair = useCallback(() => {
    if (typeof window !== "undefined" && window.YMK) {
      window.YMK.init({ faceDetectionMode: "hairtype" });
    }
  }, []);
  type LightingState = "TOO_DARK" | "LOW_LIGHT" | "GOOD" | "BRIGHT" | "TOO_BRIGHT" | "CALCULATING";
  const [lightingState, setLightingState] = useState<LightingState>("CALCULATING");
  const [isUneven, setIsUneven] = useState(false);
  const lightingStateRef = useRef<LightingState>("CALCULATING");
  const pendingStateRef = useRef<{ state: LightingState, timestamp: number } | null>(null);

  const getLightingUI = (state: LightingState) => {
    switch (state) {
      case "TOO_DARK": return { color: "bg-red-500", msg: "A bit dark — try facing a window or lamp", sub: "You can still take the photo" };
      case "LOW_LIGHT": return { color: "bg-amber-500", msg: "Lighting could be better", sub: "You can still take the photo" };
      case "GOOD": return { color: "bg-green-500", msg: "Lighting looks good", sub: null };
      case "BRIGHT": return { color: "bg-green-500", msg: "Lighting looks good", sub: null };
      case "TOO_BRIGHT": return { color: "bg-amber-500", msg: "Very bright — try stepping back slightly", sub: "You can still take the photo" };
      default: return { color: "bg-gray-400", msg: "Checking lighting...", sub: null };
    }
  };

  useEffect(() => {
    if (step !== "capture-face" || mode !== "camera") return;

    let animationFrameId: number;
    let lastExecTime = 0;

    const analyzeLighting = (timestamp: number) => {
      // 2fps = every 500ms
      if (timestamp - lastExecTime < 500) {
        animationFrameId = requestAnimationFrame(analyzeLighting);
        return;
      }
      lastExecTime = timestamp;

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(analyzeLighting);
        return;
      }

      let canvas = document.getElementById("hidden-lighting-canvas") as HTMLCanvasElement;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "hidden-lighting-canvas";
        canvas.style.display = "none";
        document.body.appendChild(canvas);
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const cropWidth = Math.floor(canvas.width * 0.6);
      const cropHeight = Math.floor(canvas.height * 0.6);
      const startX = Math.floor((canvas.width - cropWidth) / 2);
      const startY = Math.floor((canvas.height - cropHeight) / 2);

      const imageData = ctx.getImageData(startX, startY, cropWidth, cropHeight);
      const data = imageData.data;

      let totalLuminance = 0;
      let sampleCount = 0;

      const halfW = Math.floor(cropWidth / 2);
      const halfH = Math.floor(cropHeight / 2);

      let qTL = 0, qTR = 0, qBL = 0, qBR = 0;
      let countTL = 0, countTR = 0, countBL = 0, countBR = 0;

      for (let i = 0; i < data.length; i += 16) {
        const pIndex = Math.floor(i / 4);
        const px = pIndex % cropWidth;
        const py = Math.floor(pIndex / cropWidth);

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        totalLuminance += luminance;
        sampleCount++;

        if (py < halfH) {
          if (px < halfW) { qTL += luminance; countTL++; }
          else { qTR += luminance; countTR++; }
        } else {
          if (px < halfW) { qBL += luminance; countBL++; }
          else { qBR += luminance; countBR++; }
        }
      }

      const avgLum = totalLuminance / sampleCount;
      const avgTL = qTL / Math.max(1, countTL);
      const avgTR = qTR / Math.max(1, countTR);
      const avgBL = qBL / Math.max(1, countBL);
      const avgBR = qBR / Math.max(1, countBR);

      const maxQ = Math.max(avgTL, avgTR, avgBL, avgBR);
      const minQ = Math.min(avgTL, avgTR, avgBL, avgBR);
      setIsUneven((maxQ - minQ) > 80);

      let newState: LightingState = "GOOD";
      if (avgLum <= 40) newState = "TOO_DARK";
      else if (avgLum <= 80) newState = "LOW_LIGHT";
      else if (avgLum <= 200) newState = "GOOD";
      else if (avgLum <= 240) newState = "BRIGHT";
      else newState = "TOO_BRIGHT";

      if (newState !== lightingStateRef.current) {
        if (!pendingStateRef.current || pendingStateRef.current.state !== newState) {
          pendingStateRef.current = { state: newState, timestamp };
        } else if (timestamp - pendingStateRef.current.timestamp >= 1000) {
          setLightingState(newState);
          lightingStateRef.current = newState;
          pendingStateRef.current = null;
        }
      } else {
        pendingStateRef.current = null;
      }

      animationFrameId = requestAnimationFrame(analyzeLighting);
    };

    animationFrameId = requestAnimationFrame(analyzeLighting);

    return () => cancelAnimationFrame(animationFrameId);
  }, [step, mode]);
  const runLoadingSteps = useCallback(() => {
    setLoadingProgress(0);
    loadingStepIndexRef.current = 0;
    setLoadingLabel(LOADING_STEPS[0]);
    const interval = setInterval(() => {
      loadingStepIndexRef.current += 1;
      const progress = (loadingStepIndexRef.current / LOADING_STEPS.length) * 100;
      setLoadingProgress(progress);
      if (loadingStepIndexRef.current < LOADING_STEPS.length) {
        setLoadingLabel(LOADING_STEPS[loadingStepIndexRef.current]);
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);
  const handleAnalyze = useCallback(async (skinImg: string | null, hairImgs: string[]) => {
    setStep("analyzing");
    const clear = runLoadingSteps();
    try {
      const [skinRes, hairRes] = await Promise.all([
        skinImg ? fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: skinImg }),
        }).then(async r => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data?.error ?? "Skin analysis failed");
          }
          return r.json() as Promise<AnalysisResult>;
        }) : Promise.resolve(null),
        hairImgs.length === 3 ? fetch("/api/analyze-hair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: hairImgs }),
        }).then(async r => {
          if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data?.error ?? "Hair analysis failed");
          }
          return r.json() as Promise<AnalysisResult>;
        }) : Promise.resolve(null)
      ]);
      if (!skinRes && !hairRes) throw new Error("No data to analyze");
      let finalAnalysis: AnalysisResult;
      if (skinRes && hairRes) {
        finalAnalysis = {
          face: skinRes.face,
          hair: hairRes.hair,
          overallConfidence: Math.min(skinRes.overallConfidence, hairRes.overallConfidence)
        };
      } else if (skinRes) {
        finalAnalysis = skinRes;
      } else {
        finalAnalysis = hairRes!;
      }
      setAnalysis(finalAnalysis);
      setStep("results");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Analysis failed");
      setStep("error");
    } finally {
      clear();
    }
  }, [runLoadingSteps]);
  // --- CAMERA HANDLERS ---
  const handleCaptureFaceCamera = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setPendingBase64(base64);

    canvas.toBlob((blob) => {
      if (blob) setPendingBlob(blob);
    }, "image/jpeg", 0.85);

    videoRef.current.pause();
    setStep("confirm-photo");
  }, [facingMode]);

  const handleRetake = () => {
    setPendingBlob(null);
    setPendingBase64(null);
    videoRef.current?.play().catch(console.error);
    setStep("capture-face");
  };

  const handleUsePhoto = () => {
    if (!pendingBase64) return;
    stopCamera();
    setSkinBase64(pendingBase64);
    setStep("hair-prompt");
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Photo is too large. Please choose an image under 10MB.");
      setStep("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSkinBase64(reader.result as string);
      stopCamera();
      setStep("hair-prompt");
    };
    reader.readAsDataURL(file);
  };
  const handleCaptureHairCamera = useCallback(() => {
    const base64 = captureFromVideo();
    if (!base64) return;
    const next: string[] = [...hairCollected, base64];
    setHairCollected(next);
    if (next.length >= 3) {
      stopCamera();
      handleAnalyze(skinBase64, next);
    } else {
      setHairPhase(next.length === 1 ? "right" : "left");
    }
  }, [captureFromVideo, hairCollected, skinBase64, handleAnalyze, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "face" | "hair") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (Array.from(files).some(file => file.size > 10 * 1024 * 1024)) {
      setErrorMessage("Photo is too large. Please choose an image under 10MB.");
      setStep("error");
      return;
    }

    if (type === "face") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSkinBase64(reader.result as string);
        setStep("hair-prompt");
      };
      reader.readAsDataURL(file);
    } else {
      // Need 3 files for hair
      if (files.length !== 3) {
        alert("Please select exactly 3 images (front, left, right) for hair analysis.");
        return;
      }

      const promises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(promises).then(base64Images => {
        setHairCollected(base64Images);
        handleAnalyze(skinBase64, base64Images);
      });
    }
  };
  const handleRetry = useCallback(() => {
    setStep("onboarding");
    setMode(null);
    setAnalysis(null);
    setErrorMessage(null);
    setSkinBase64(null);
    setHairCollected([]);
    setHairPhase("front");
    setIsQualityBad(false);
    setQualityWarning(null);
    stopCamera();
  }, [stopCamera]);
  useEffect(() => {
    const shouldUseCamera = mode === "camera" &&
      (step === "capture-face" || step === "capture-hair" || step === "confirm-photo");

    if (!shouldUseCamera) return;

    const timeout = setTimeout(() => {
      void startCamera();
    }, 100);

    return () => {
      clearTimeout(timeout);
      stopCamera();
    };
  }, [step, mode, startCamera, stopCamera]);
  const routine = analysis ? getRecommendations(analysis) : null;
  const targetTags = analysis ?
    [...(analysis.face.concerns || []), analysis.face.skinType, analysis.face.hydrationScore < 60 ? 'hydration' : ''].filter(Boolean) as string[]
    : [];
  const isCapturingFace = step === "capture-face";
  const isCapturingHair = step === "capture-hair";
  const isCapturing = isCapturingFace || isCapturingHair || step === "confirm-photo";
  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] overflow-hidden rounded-none bg-champagne/10 border border-charcoal/20">
      <AnimatePresence mode="wait">

        {step === "onboarding" && (
          <motion.div key="onboarding" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 z-10 bg-alabaster">
            <OnboardingFlow
              onComplete={() => { setMode("camera"); setStep("capture-face"); }}
              onSkipSetup={() => { setMode("camera"); setStep("capture-face"); }}
            />
          </motion.div>
        )}
        {isCapturingFace && mode === "upload" && (
          <motion.div key="upload-face" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-champagne/10/80">
            <div className="flex justify-between items-center w-full mb-8 absolute top-0 left-0 p-6">
              <button onClick={handleRetry} className="text-charcoal/80 hover:text-charcoal p-3 bg-alabaster border border-charcoal/20 rounded-none transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Upload Face Image</h2>
            <p className="text-sm font-bold tracking-widest uppercase text-charcoal/80 mb-10">Please upload a clear selfie showing your face and hair.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "face")}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md rounded-none border border-dashed border-charcoal/20 hover:bg-alabaster bg-transparent py-16 flex flex-col items-center justify-center gap-4 transition-colors"
            >
              <div className="w-16 h-16 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center">
                <Upload className="w-8 h-8 text-charcoal" />
              </div>
              <span className="text-charcoal font-bold uppercase tracking-widest text-sm">Click to browse your device</span>
              <span className="text-xs text-charcoal/60 uppercase tracking-widest">PNG, JPG up to 10MB</span>
            </motion.button>
          </motion.div>
        )}
        {step === "hair-prompt" && (
          <motion.div key="hair-prompt" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-alabaster/95 backdrop-blur-sm">
            <div className="w-20 h-20 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-charcoal" />
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Face Captured!</h2>
            <p className="text-sm uppercase tracking-widest text-charcoal/80 max-w-md mx-auto mb-10 leading-relaxed">
              Would you also like an AI hair analysis for a complete routine, or skip to your skin results?
              {mode === "upload" && <span className="block mt-4 text-xs font-bold text-charcoal/60">(Requires 3 photos: front, left, right)</span>}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setStep("capture-hair"); setHairPhase("front"); setHairCollected([]); }}
                className="flex-1 py-4 px-6 rounded-none bg-bordeaux text-white border border-charcoal/20 text-xs font-bold uppercase tracking-widest hover:bg-alabaster hover:text-charcoal transition-colors flex justify-center items-center gap-2"
              >
                {mode === "camera" ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {mode === "camera" ? "Scan Hair" : "Upload Hair Photos"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnalyze(skinBase64, [])}
                className="flex-1 py-4 px-6 rounded-none border border-charcoal/20 bg-alabaster text-charcoal text-xs font-bold uppercase tracking-widest hover:bg-champagne/10 transition-colors"
              >
                Skip Hair
              </motion.button>
            </div>
          </motion.div>
        )}
        {isCapturingHair && mode === "upload" && (
          <motion.div key="upload-hair" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-champagne/10/80">
            <div className="flex justify-between items-center w-full mb-8 absolute top-0 left-0 p-6">
              <button onClick={() => setStep("hair-prompt")} className="text-charcoal/80 hover:text-charcoal p-3 bg-alabaster border border-charcoal/20 rounded-none transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Upload Hair Photos</h2>
            <p className="text-sm font-bold tracking-widest uppercase text-charcoal/80 mb-10">Please select exactly 3 photos of your hair (Front, Left, Right).</p>

            <input
              ref={hairFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e, "hair")}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => hairFileInputRef.current?.click()}
              className="w-full max-w-md rounded-none border border-dashed border-charcoal/20 hover:bg-alabaster bg-transparent py-16 flex flex-col items-center justify-center gap-4 transition-colors"
            >
              <div className="w-16 h-16 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center">
                <Upload className="w-8 h-8 text-charcoal" />
              </div>
              <span className="text-charcoal font-bold uppercase tracking-widest text-sm">Select 3 Photos</span>
              <span className="text-xs text-charcoal/60 uppercase tracking-widest">Hold Ctrl/Cmd to select multiple</span>
            </motion.button>
          </motion.div>
        )}
        {isCapturing && mode === "camera" && (
          <motion.div key="capture-camera" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 bg-charcoal flex flex-col z-10">
            <div className="p-4 flex justify-between items-center bg-charcoal z-20 shrink-0 border-b border-white/10">
              <button onClick={() => setStep("onboarding")} className="text-white/80 hover:text-white p-2 backdrop-blur-md bg-alabaster/10 rounded-none border border-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <span className="text-white font-bold uppercase tracking-widest text-xs">
                Skin Scan
              </span>
              <div className="flex items-center gap-2">
                {hasMultipleCameras && step === "capture-face" && (
                  <button onClick={handleFlipCamera} className="text-white/80 hover:text-white p-2 backdrop-blur-md bg-alabaster/10 rounded-none border border-white/20 transition-colors">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                )}
                <div className="w-9"></div>
              </div>
            </div>

            {step === "capture-face" && (
              <div className="bg-charcoal shrink-0 flex flex-col items-center justify-center py-3 px-4 border-b border-white/10 gap-1 z-20">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ease-in-out ${getLightingUI(lightingState).color}`} />
                  <span className="text-sm text-white font-medium">{getLightingUI(lightingState).msg}</span>
                </div>
                {getLightingUI(lightingState).sub && (
                  <span className="text-[11px] text-white/60">{getLightingUI(lightingState).sub}</span>
                )}
              </div>
            )}

            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                key={step}
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`min-h-full min-w-full object-cover ${step === "confirm-photo" ? "opacity-0" : "opacity-100"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {step === "confirm-photo" && pendingBase64 && (
                <img src={pendingBase64} alt="Captured preview" className="absolute inset-0 min-h-full min-w-full object-cover z-10 opacity-100" />
              )}

              {/* Overlay guides for user */}
              {step === "capture-face" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-[65%] sm:w-[50%] md:w-[40%] lg:w-[35%] aspect-[3/4] border border-white/40 rounded-none shadow-[0_0_0_9999px_rgba(26,28,25,0.7)] transition-all"></div>
                </div>
              )}
              <AnimatePresence>
                {qualityFeedback && step === "capture-face" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`absolute top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-none text-xs uppercase tracking-widest font-bold flex items-center gap-3 w-[80%] max-w-sm text-center border ${isQualityGood
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-alabaster/95 text-charcoal border-charcoal/20"
                      }`}
                  >
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isQualityGood ? "text-green-600" : "text-amber-600"}`} />
                    <span className="leading-snug">{qualityFeedback}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              id="directUploadInput"
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={handleDirectUpload}
            />

            {(step as string) === "confirm-photo" ? (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-charcoal/95 via-charcoal/80 to-transparent flex flex-col items-center justify-end pb-8 z-20">
                <button
                  onClick={handleUsePhoto}
                  className="w-full h-[52px] bg-[#c9a98a] text-[#0a0a0a] font-semibold text-[15px] uppercase tracking-widest rounded-xl transition-transform active:scale-[0.97] mb-4"
                >
                  Use this photo
                </button>
                <button
                  onClick={handleRetake}
                  className="w-full h-[52px] bg-transparent border border-white text-white font-semibold text-[15px] uppercase tracking-widest rounded-xl transition-transform active:scale-[0.97]"
                >
                  Retake
                </button>
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-transparent flex flex-col items-center justify-end pb-12 z-20">
                <p className="text-white/80 text-xs uppercase tracking-widest mb-6 text-center max-w-xs font-bold leading-relaxed">
                  {step === "capture-face" ? "Center your face in good lighting" : `Please capture the ${hairPhase} of your hair.`}
                </p>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  onClick={step === "capture-face" ? handleCaptureFaceCamera : handleCaptureHairCamera}
                  className="w-20 h-20 rounded-full relative flex items-center justify-center transition-all bg-transparent border-[3px] border-[#c9a98a]"
                >
                  <div className={`w-[66px] h-[66px] rounded-full bg-[#c9a98a]`} />
                </motion.button>
                <button
                  onClick={() => document.getElementById("directUploadInput")?.click()}
                  className="mt-6 text-xs tracking-widest uppercase font-bold text-white/80 hover:text-white underline underline-offset-4"
                >
                  Upload instead
                </button>
              </div>
            )}
          </motion.div>
        )}
        {step === "analyzing" && (
          <motion.div key="analyzing" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-none border border-dashed border-charcoal/20"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-none bg-champagne/10 border border-charcoal/20 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-charcoal" />
              </motion.div>
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Analyzing your profile</h2>
            <motion.p
              key={loadingLabel}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-charcoal/80 text-sm font-bold uppercase tracking-widest mb-10 h-6"
            >
              {loadingLabel}
            </motion.p>
            <div className="w-full max-w-sm bg-champagne/10 rounded-none h-4 overflow-hidden relative border border-charcoal/20">
              <motion.div
                className="absolute top-0 left-0 bottom-0 bg-bordeaux rounded-none"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
        {step === "results" && analysis && routine && (
          <motion.div key="results" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-6 md:p-10 min-h-[600px] bg-champagne/10/80">
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
        {step === "camera-error" && (
          <motion.div key="camera-error" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster z-20 absolute inset-0">
            <div className="w-20 h-20 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center mb-8">
              <Camera className="w-10 h-10 text-charcoal" />
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">
              {errorMessage?.startsWith("Camera access") ? "Camera couldn't start" : "Camera couldn't start"}
            </h2>
            <p className="text-sm uppercase tracking-widest text-charcoal/80 font-bold max-w-sm mb-12 leading-relaxed">
              {errorMessage}
            </p>
            <input
              id="cameraErrorFileInput"
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={(e) => {
                setMode("upload");
                handleFileUpload(e, "face");
              }}
            />
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button variant="primary" onClick={() => document.getElementById('cameraErrorFileInput')?.click()} className="py-4 text-xs font-bold uppercase tracking-widest">
                Upload a photo instead
              </Button>
              <Button variant="secondary" onClick={() => { setErrorMessage(null); startCamera(); }} className="py-4 text-xs font-bold uppercase tracking-widest bg-transparent border border-charcoal/20 text-charcoal">
                Try again
              </Button>
            </div>
          </motion.div>
        )}
        {step === "error" && (
          <motion.div key="error" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-alabaster border border-charcoal/20">
            <div className="w-20 h-20 bg-champagne/10 border border-charcoal/20 rounded-none flex items-center justify-center mb-8">
              <AlertCircle className="w-10 h-10 text-charcoal" />
            </div>
            <h2 className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-4">Analysis Interrupted</h2>
            <p className="text-sm uppercase tracking-widest text-charcoal/80 font-bold max-w-sm mb-12 leading-relaxed">{errorMessage ?? "Something went wrong during analysis."}</p>
            <Button variant="primary" onClick={handleRetry} className="py-4 text-xs font-bold uppercase tracking-widest">
              Try again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

