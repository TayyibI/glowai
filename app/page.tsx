"use client";
import { useState, useCallback, useEffect } from "react";
import { PrivacyModal, getPrivacyAccepted } from "@/components/PrivacyModal";
import { ImageCapture } from "@/components/ImageCapture";
import { Scanner } from "@/components/Scanner";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { RecommendationList } from "@/components/RecommendationList";
import { FaceDetectionError } from "@/components/FaceDetectionError";
import { Button } from "@/components/ui/Button";
import { analyzeImages } from "@/services/analysisService";
import { getRecommendations } from "@/logic/recommendationLogic";
import type { AnalysisResult } from "@/types/AnalysisResult";
import type { ImageCaptureResult } from "@/components/ImageCapture";
type Step = "capture" | "analyzing" | "results" | "error" | "no_face";
export default function Home() {
  const [privacyAccepted, setAccepted] = useState(false);
  const [step, setStep] = useState<Step>("capture");
  const [useScanner, setUseScanner] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handlePrivacyAccept = useCallback(() => setAccepted(true), []);
  const handleCapture = useCallback(async (result: ImageCaptureResult) => {
    setStep("analyzing");
    setErrorMessage(null);
    try {
      const analysisResult = await analyzeImages({
        faceImage: result.faceImage,
        hairImage: result.hairImage ?? undefined,
      });
      setAnalysis(analysisResult);
      setStep("results");
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "NO_FACE") {
        setStep("no_face");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Analysis failed. Please try again.");
        setStep("error");
      }
    }
  }, []);
  const handleRetry = useCallback(() => {
    setStep("capture");
    setAnalysis(null);
    setErrorMessage(null);
  }, []);
  useEffect(() => {
    if (getPrivacyAccepted()) setAccepted(true);
  }, []);
  return (
    <>
      <PrivacyModal onAccept={handlePrivacyAccept} accepted={privacyAccepted} />
      <main className="mx-auto min-h-full max-w-[1400px] px-4 py-8 pb-12 sm:px-6 lg:px-8">
        {/* Hero / product strip */}
        <header className="mb-8 text-center md:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-dash-text-primary sm:text-4xl">
            Personal Beauty Recommendations
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-base text-dash-text-secondary sm:text-lg">
            Capture your skin and hair—get AI-powered, personalized product insights in seconds.
          </p>
          {/* Trust strip – multinational */}
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-6 border-y border-dash-border/60 py-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-dash-text-tertiary">
              Available globally
            </span>
            <span className="text-xs text-dash-text-tertiary">•</span>
            <span className="text-xs text-dash-text-secondary">
              Trusted by teams in 50+ countries
            </span>
            <span className="text-xs text-dash-text-tertiary">•</span>
            <span className="text-xs text-dash-text-secondary">
              Enterprise-grade privacy
            </span>
          </div>
        </header>
        {step === "capture" && (
          <section className="mx-auto max-w-lg space-y-4">
            <Scanner />
          </section>
        )}
        {step === "analyzing" && (
          <section className="mx-auto max-w-lg">
            <div className="rounded-dash-card bg-dash-surface p-8 text-center shadow-dash-soft">
              <p className="text-dash-text-secondary">Analyzing your skin and hair…</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-dash-border">
                <div
                  className="h-full w-2/3 animate-pulse rounded-full bg-dash-brand-blue"
                  style={{ animationDuration: "1.5s" }}
                />
              </div>
            </div>
          </section>
        )}
        {step === "results" && analysis && (
          <section className="mx-auto max-w-2xl space-y-6">
            <AnalysisDisplay result={analysis} />
            <RecommendationList routine={getRecommendations(analysis)} />
            <Button variant="secondary" fullWidth onClick={handleRetry} className="py-3">
              New analysis
            </Button>
          </section>
        )}
        {step === "error" && (
          <section className="mx-auto max-w-md space-y-4">
            <div className="rounded-dash-card border border-dash-brand-red/30 bg-red-50/80 p-4 text-dash-text-negative">
              <p>{errorMessage ?? "Something went wrong."}</p>
            </div>
            <Button variant="primary" fullWidth onClick={handleRetry} className="py-3">
              Try again
            </Button>
          </section>
        )}
        {step === "no_face" && (
          <section className="mx-auto max-w-md">
            <FaceDetectionError onRetry={handleRetry} />
          </section>
        )}
      </main>
    </>
  );
}