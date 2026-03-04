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
  }, [step, mode, startCamera, stopCamera]);
  const routine = analysis ? getRecommendations(analysis) : null;
  const targetTags = analysis ?
    [...(analysis.face.concerns || []), analysis.face.skinType, analysis.face.hydrationScore < 60 ? 'hydration' : ''].filter(Boolean) as string[]
    : [];
  const isCapturingFace = step === "capture-face";
  const isCapturingHair = step === "capture-hair";
  const isCapturing = isCapturingFace || isCapturingHair;
  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] overflow-hidden rounded-3xl bg-dash-bg-primary shadow-2xl border border-dash-border">
      <AnimatePresence mode="wait">

        {step === "start" && (
          <motion.div key="start" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center">
            <Sparkles className="w-12 h-12 text-dash-brand-blue mb-6" />
            <h1 className="text-4xl font-extrabold tracking-tight text-dash-text-primary mb-3">Skin & Hair Analysis</h1>
            <p className="text-lg text-dash-text-secondary max-w-md mx-auto mb-10">
              Advanced AI analysis personalized to your unique skin and hair profile.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setMode("camera"); setStep("capture-face"); }}
                className="bg-dash-text-primary text-white font-semibold py-4 px-8 rounded-full shadow-lg hover:bg-black/90 transition-colors text-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Camera Scan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode("upload"); setStep("capture-face"); }}
                className="bg-white border-2 border-dash-border/60 text-dash-text-primary font-semibold py-4 px-8 rounded-full shadow-sm hover:bg-gray-50 transition-colors text-base flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Image Instead
              </motion.button>
            </div>
          </motion.div>
        )}
        {isCapturingFace && mode === "upload" && (
          <motion.div key="upload-face" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-gray-50/50">
            <div className="flex justify-between items-center w-full mb-8 absolute top-0 left-0 p-4">
              <button onClick={handleRetry} className="text-dash-text-secondary hover:text-dash-text-primary p-2 bg-white rounded-full shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-dash-text-primary mb-2">Upload Face Image</h2>
            <p className="text-dash-text-secondary mb-8">Please upload a clear selfie showing your face and hair.</p>

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
              className="w-full max-w-md rounded-2xl border-2 border-dashed border-dash-border hover:border-dash-brand-blue bg-white py-16 flex flex-col items-center justify-center gap-4 transition-colors"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-dash-brand-blue" />
              </div>
              <span className="text-dash-text-primary font-semibold">Click to browse your device</span>
              <span className="text-sm text-dash-text-tertiary">PNG, JPG up to 10MB</span>
            </motion.button>
          </motion.div>
        )}
        {step === "hair-prompt" && (
          <motion.div key="hair-prompt" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-gray-50/95 backdrop-blur-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-dash-text-primary mb-3">Face Captured!</h2>
            <p className="text-lg text-dash-text-secondary max-w-md mx-auto mb-10">
              Would you also like an AI hair analysis for a complete routine, or skip to your skin results?
              {mode === "upload" && <span className="block mt-2 text-sm text-dash-text-tertiary">(Requires 3 photos: front, left, right)</span>}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setStep("capture-hair"); setHairPhase("front"); setHairCollected([]); }}
                className="flex-1 py-4 px-6 rounded-2xl bg-dash-text-primary text-white font-semibold hover:bg-black/90 transition-all shadow-md flex justify-center items-center gap-2"
              >
                {mode === "camera" ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {mode === "camera" ? "Scan Hair" : "Upload Hair Photos"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnalyze(skinBase64, [])}
                className="flex-1 py-4 px-6 rounded-2xl border-2 border-dash-border bg-white text-dash-text-primary font-semibold hover:bg-gray-50 transition-all"
              >
                Skip Hair
              </motion.button>
            </div>
          </motion.div>
        )}
        {isCapturingHair && mode === "upload" && (
          <motion.div key="upload-hair" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-gray-50/50">
            <div className="flex justify-between items-center w-full mb-8 absolute top-0 left-0 p-4">
              <button onClick={() => setStep("hair-prompt")} className="text-dash-text-secondary hover:text-dash-text-primary p-2 bg-white rounded-full shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-dash-text-primary mb-2">Upload Hair Photos</h2>
            <p className="text-dash-text-secondary mb-8">Please select exactly 3 photos of your hair (Front, Left, Right).</p>

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
              className="w-full max-w-md rounded-2xl border-2 border-dashed border-dash-border hover:border-dash-brand-blue bg-white py-16 flex flex-col items-center justify-center gap-4 transition-colors"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-dash-brand-blue" />
              </div>
              <span className="text-dash-text-primary font-semibold">Select 3 Photos</span>
              <span className="text-sm text-dash-text-tertiary">Hold Ctrl/Cmd to select multiple</span>
            </motion.button>
          </motion.div>
        )}
        {isCapturing && mode === "camera" && (
          <motion.div key="capture-camera" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 bg-black flex flex-col z-10">
            <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 absolute top-0 left-0 right-0">
              <button onClick={() => isCapturingHair ? setStep("hair-prompt") : setStep("start")} className="text-white/80 hover:text-white p-2 backdrop-blur-md bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
              <span className="text-white font-medium tracking-wide">
                {step === "capture-face" ? "Skin Scan" : `Hair Scan: ${hairPhase}`}
              </span>
              <div className="w-10"></div>
            </div>
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="min-h-full min-w-full object-cover opacity-90"
              />
              {/* Overlay guides for user */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[65%] sm:w-[50%] md:w-[40%] lg:w-[35%] aspect-[3/4] border-2 border-white/40 rounded-[100px] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all"></div>
              </div>
              <AnimatePresence>
                {qualityWarning && step === "capture-face" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg w-[80%] max-w-sm text-center"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {qualityWarning}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end pb-12">
              <p className="text-white/80 text-sm mb-6 text-center max-w-xs font-medium">
                {step === "capture-face"
                  ? "Center your face in good lighting for the best results."
                  : `Please capture the ${hairPhase} of your hair.`}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={step === "capture-face" ? handleCaptureFaceCamera : handleCaptureHairCamera}
                className={`w-20 h-20 rounded-full relative flex items-center justify-center shadow-xl ${isQualityBad && step === "capture-face" ? 'bg-amber-500' : 'bg-white'}`}
              >
                <div className="w-16 h-16 rounded-full border-[3px] border-black/10"></div>
              </motion.button>
            </div>
          </motion.div>
        )}
        {step === "analyzing" && (
          <motion.div key="analyzing" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center bg-gradient-to-b from-dash-bg-primary to-dash-brand-blue/5">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-dashed border-dash-brand-blue/30"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-dash-brand-blue/10 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-dash-brand-blue" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-dash-text-primary mb-2">Analyzing your profile</h2>
            <motion.p
              key={loadingLabel}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-dash-text-secondary font-medium mb-10 h-6"
            >
              {loadingLabel}
            </motion.p>
            <div className="w-full max-w-sm bg-dash-border/50 rounded-full h-3 overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-dash-brand-blue to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
        {step === "results" && analysis && routine && (
          <motion.div key="results" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-6 md:p-10 min-h-[600px] bg-gray-50/50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-dash-text-primary mb-1">Your Personal Routine</h1>
                <p className="text-dash-text-secondary">Based on our detailed AI analysis</p>
              </div>
              <Button variant="secondary" onClick={handleRetry} className="hidden sm:flex rounded-full">
                New Scan
              </Button>
            </div>
            <div className="mb-10 max-w-4xl mx-auto w-full">
              <AnalysisDisplay result={analysis} />
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-dash-border/60">
              <RecommendationList routine={routine} showBuyNow userTags={targetTags} />
            </div>
            <Button variant="secondary" onClick={handleRetry} className="w-full mt-8 sm:hidden py-4 rounded-xl text-lg">
              New Scan
            </Button>
          </motion.div>
        )}
        {step === "error" && (
          <motion.div key="error" variants={fadeVariants} initial="hidden" animate="show" exit="exit" className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[600px] text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-dash-text-primary mb-3">Analysis Interrupted</h2>
            <p className="text-dash-text-secondary max-w-sm mb-8">{errorMessage ?? "Something went wrong during analysis."}</p>
            <Button variant="primary" onClick={handleRetry} className="px-8 py-3 rounded-xl shadow-lg shadow-dash-brand-blue/20">
              Try again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

