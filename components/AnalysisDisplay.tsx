"use client";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { Card, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Droplets, Sparkles, AlertCircle } from "lucide-react";
const CONFIDENCE_LOW_THRESHOLD = 0.6;
function formatLabel(s: string): string {
  return s.replace(/_/g, " ");
}
function getHydrationColor(score: number): string {
  if (score >= 80) return "text-champagne stroke-champagne";
  if (score >= 60) return "text-charcoal/80 stroke-charcoal/80";
  if (score >= 40) return "text-charcoal/60 stroke-charcoal/60";
  return "text-charcoal stroke-charcoal";
}
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colorClass = getHydrationColor(percentage);
  return (
    <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-champagne/10"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={colorClass.split(" ")[1]}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-charcoal">{percentage}</span>
      </div>
    </div>
  );
}
export function AnalysisDisplay({ result }: { result: AnalysisResult }) {
  const isLowConfidence = result.overallConfidence < CONFIDENCE_LOW_THRESHOLD;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border-charcoal/20 bg-alabaster sm:p-12 rounded-none">
        <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:mb-8">
          <div className="p-3 border border-charcoal/20 bg-champagne/10 rounded-none">
            <Sparkles className="w-6 h-6 text-charcoal" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl uppercase tracking-widest text-charcoal mb-1">Your AI Profile</CardTitle>
            <p className="text-sm text-charcoal/80 uppercase tracking-widest">Personalized decoding of your attributes</p>
          </div>
        </div>
        {isLowConfidence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex gap-3 rounded-none border border-charcoal/20 bg-champagne/10 p-6 text-sm text-charcoal items-start"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-charcoal" />
            <p>
              Results are less certain. We recommend gentler, general products. For best
              results, use a clear, well-lit selfie next time.
            </p>
          </motion.div>
        )}
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Hydration Score Column */}
          <div className="flex flex-col items-center justify-center bg-champagne/10 p-8 rounded-none border border-charcoal/20 min-w-[0] md:min-w-[220px]">
            <div className="flex items-center gap-2 mb-6 text-charcoal">
              <Droplets className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">Hydration</h3>
            </div>

            <CircularProgress percentage={result.face.hydrationScore} />

            <div className="mt-6 text-center">
              <span className={`inline-block px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest bg-alabaster border border-charcoal/20 ${getHydrationColor(result.face.hydrationScore).split(" ")[0]}`}>
                {result.face.hydrationLevel}
              </span>
            </div>
          </div>
          {/* Details Column */}
          <div className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-alabaster p-6 rounded-none border border-charcoal/20"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none border border-charcoal/20 bg-charcoal"></span>
                  Skin Tone
                </p>
                <p className="font-serif text-2xl text-charcoal capitalize">
                  {formatLabel(result.face.skinTone)}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-alabaster p-6 rounded-none border border-charcoal/20"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none border border-charcoal/20 bg-alabaster"></span>
                  Skin Type
                </p>
                <div className="flex flex-col gap-2 items-start">
                  <span className="font-serif text-2xl text-charcoal capitalize">
                    {formatLabel(result.face.skinType)}
                  </span>
                  {result.face.skinType === 'dry' && <div className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-charcoal/20 bg-champagne/10 text-charcoal">Needs Care</div>}
                  {result.face.skinType === 'oily' && <div className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-charcoal/20 bg-champagne/10 text-charcoal">Prone to Shine</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-alabaster p-8 rounded-none border border-charcoal/20"
              >
                <p className="text-sm font-bold uppercase tracking-widest text-charcoal mb-6 border-b border-charcoal/20 pb-4">
                  Detected Concerns
                </p>
                <div className="flex flex-wrap gap-3">
                  {result.face.concerns.length > 0
                    ? result.face.concerns.map((c, i) => (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                        key={c}
                        className="px-5 py-3 bg-alabaster border border-charcoal/20 text-charcoal text-sm font-bold uppercase tracking-widest rounded-none flex items-center gap-2 hover:bg-champagne/10 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-none bg-charcoal"></span>
                        {formatLabel(c)}
                      </motion.span>
                    ))
                    : <span className="text-sm font-bold uppercase tracking-widest text-charcoal/60 italic">Healthy profile detected</span>}
                </div>
              </motion.div>
            </div>
            {result.hair && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 grid gap-4 sm:grid-cols-2"
              >
                <div className="bg-alabaster p-6 rounded-none border border-charcoal/20 hover:bg-champagne/10 transition-colors">
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-3">
                    Hair Color
                  </p>
                  <p className="font-serif text-2xl text-charcoal capitalize flex items-center gap-3">
                    <span className="w-4 h-4 rounded-none border border-charcoal/20 inline-block" style={{ backgroundColor: result.hair.color.replace('_', '') === 'darkbrown' ? '#0A0A0A' : result.hair.color.includes('blonde') ? '#F4F4F5' : result.hair.color.includes('black') ? '#0A0A0A' : '#0A0A0A' }} />
                    {formatLabel(result.hair.color)}
                  </p>
                </div>
                <div className="bg-alabaster p-6 rounded-none border border-charcoal/20 hover:bg-champagne/10 transition-colors">
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal/60 mb-3">
                    Hair Type
                  </p>
                  <p className="font-serif text-2xl text-charcoal capitalize">
                    {formatLabel(result.hair.type)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-charcoal/20 flex justify-end">
          <p className="text-xs text-charcoal/60 uppercase tracking-widest font-bold">
            AI Confidence: {Math.round(result.overallConfidence * 100)}%
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

