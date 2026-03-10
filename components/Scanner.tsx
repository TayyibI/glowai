import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getRecommendations } from "@/logic/recommendationLogic";
import { RecommendationList } from "@/components/RecommendationList";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AlertCircle, X, ChevronRight, Sparkles, Camera, Upload } from "lucide-react";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
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
type ScanStep = "start" | "capture-face" | "hair-prompt" | "capture-hair" | "analyzing" | "results" | "error";
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
  const [step, setStep] = useState<ScanStep>("start");
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
      return true;
    } catch {
      setErrorMessage("Camera access denied or unavailable. Please use image upload.");
      setMode("upload");
      return false;
    }
  }, []);
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
    if (!q.hasFace || q.position !== 'good' || q.lighting !== 'good' || q.frontal !== 'good') {
      setQualityWarning("Please move closer, improve lighting, and face the camera directly for accurate results");
      setIsQualityBad(true);
    } else {
      setQualityWarning(null);
      setIsQualityBad(false);
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
  useEffect(() => {
    if (mode === "camera") {
      if (step === "capture-face") initYMKSkin();
      if (step === "capture-hair") initYMKHair();
    }
    return () => {
      if (typeof window !== "undefined" && window.YMK) {
        window.YMK.removeEventListener('faceQualityChanged', handleFaceQuality);
      }
    };
  }, [step, mode, initYMKSkin, initYMKHair, handleFaceQuality]);
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
    if (isQualityBad) {
      alert("Please move closer, improve lighting, and face the camera directly for accurate results.");
      return;
    }
    const base64 = typeof window !== "undefined" && window.YMK?.capture
      ? await window.YMK.capture()
      : captureFromVideo();
    if (!base64) {
      setErrorMessage("Could not capture image from camera.");
      setStep("error");
      return;
    }
    setSkinBase64(base64);
    setStep("hair-prompt");
    stopCamera();
  }, [captureFromVideo, isQualityBad, stopCamera]);
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

  // --- UPLOAD HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "face" | "hair") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
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
    setStep("start");
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
    const shouldUseCamera =
      mode === "camera" && (step === "capture-face" || step === "capture-hair");

    if (!shouldUseCamera) {
      return;
    }

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [step, mode, startCamera, stopCamera]);
  const routine = analysis ? getRecommendations(analysis) : null;
  const targetTags = analysis ?
    [...(analysis.face.concerns || []), analysis.face.skinType, analysis.face.hydrationScore < 60 ? 'hydration' : ''].filter(Boolean) as string[]
    : [];
  const isCapturingFace = step === "capture-face";
  const isCapturingHair = step === "capture-hair";
  const isCapturing = isCapturingFace || isCapturingHair;
  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] overflow-hidden rounded-none bg-champagne/10 border border-charcoal/20">
      <AnimatePresence mode="wait">

        {step === "start" && (
          <motion.div key="start" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center">
            <Sparkles className="w-12 h-12 text-charcoal mb-6" />
            <h1 className="font-serif text-5xl uppercase tracking-widest text-charcoal mb-6">Skin & Hair Analysis</h1>
            <p className="text-sm text-charcoal/80 uppercase tracking-widest max-w-md mx-auto mb-12">
              Advanced AI analysis personalized to your unique profile.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setMode("camera"); setStep("capture-face"); }}
                className="bg-bordeaux text-white font-bold uppercase tracking-widest py-5 px-8 rounded-none border border-charcoal/20 hover:bg-alabaster hover:text-charcoal transition-colors text-sm flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5" />
                Start Camera Scan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode("upload"); setStep("capture-face"); }}
                className="bg-transparent border border-charcoal/20 text-charcoal font-bold uppercase tracking-widest py-5 px-8 rounded-none hover:bg-alabaster transition-colors text-sm flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                Upload Image Instead
              </motion.button>
            </div>
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
            <div className="p-6 flex justify-between items-center bg-gradient-to-b from-charcoal/90 to-transparent z-10 absolute top-0 left-0 right-0">
              <button onClick={() => isCapturingHair ? setStep("hair-prompt") : setStep("start")} className="text-white/80 hover:text-white p-3 backdrop-blur-md bg-alabaster/10 rounded-none border border-white/20 transition-colors">
                <X className="w-6 h-6" />
              </button>
              <span className="text-white font-bold uppercase tracking-widest text-xs">
                {step === "capture-face" ? "Skin Scan" : `Hair Scan: ${hairPhase}`}
              </span>
              <div className="w-10"></div>
            </div>
            <div className="relative flex-1 bg-charcoal flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="min-h-full min-w-full object-cover opacity-90"
              />
              {/* Overlay guides for user */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[65%] sm:w-[50%] md:w-[40%] lg:w-[35%] aspect-[3/4] border border-white/40 rounded-none shadow-[0_0_0_9999px_rgba(26,28,25,0.7)] transition-all"></div>
              </div>
              <AnimatePresence>
                {qualityWarning && step === "capture-face" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 bg-alabaster/95 backdrop-blur-md text-charcoal px-6 py-3 rounded-none text-xs uppercase tracking-widest font-bold flex items-center gap-3 w-[80%] max-w-sm text-center border border-charcoal/20"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="leading-snug">{qualityWarning}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-transparent flex flex-col items-center justify-end pb-12">
              <p className="text-white/80 text-xs uppercase tracking-widest mb-6 text-center max-w-xs font-bold leading-relaxed">
                {step === "capture-face"
                  ? "Center your face in good lighting for the best results."
                  : `Please capture the ${hairPhase} of your hair.`}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={step === "capture-face" ? handleCaptureFaceCamera : handleCaptureHairCamera}
                className={`w-20 h-20 rounded-none relative flex items-center justify-center ${isQualityBad && step === "capture-face" ? "bg-champagne/10" : "bg-alabaster"}`}
              >
                <div className="w-16 h-16 rounded-none border-[3px] border-charcoal/20"></div>
              </motion.button>
            </div>
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

