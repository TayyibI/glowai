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
  if (score >= 80) return "text-blush stroke-blush";
  if (score >= 60) return "text-nude stroke-nude";
  if (score >= 40) return "text-brown/80 stroke-brown/80";
  return "text-brown stroke-brown";
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
          className="text-nude/40"
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
        <span className="text-3xl font-bold text-brown">{percentage}</span>
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
      <Card className="overflow-hidden border-nude/60 bg-white/95 backdrop-blur-md shadow-card sm:p-8">
        <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:mb-8">
          <div className="p-2 bg-gradient-to-br from-blush/20 to-nude/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-blush" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold m-0 tracking-tight text-brown">Your AI Skin & Hair Profile</CardTitle>
            <p className="text-sm text-brown/80 mt-1">Personalized decoding of your unique attributes</p>
          </div>
        </div>
        {isLowConfidence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex gap-3 rounded-2xl border border-nude bg-nude/30 p-4 text-sm text-brown shadow-card items-start"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Results are less certain. We recommend gentler, general products. For best
              results, use a clear, well-lit selfie next time.
            </p>
          </motion.div>
        )}
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Hydration Score Column */}
          <div className="flex flex-col items-center justify-center bg-ivory/60 p-5 rounded-3xl border border-nude/50 min-w-[0] md:min-w-[220px]">
            <div className="flex items-center gap-2 mb-4 text-brown/60">
              <Droplets className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Hydration</h3>
            </div>

            <CircularProgress percentage={result.face.hydrationScore} />

            <div className="mt-4 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-nude/50 ${getHydrationColor(result.face.hydrationScore).split(" ")[0]}`}>
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
                className="bg-white p-5 rounded-2xl border border-nude/60 shadow-card"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-brown/60 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blush"></span>
                  Skin Tone
                </p>
                <p className="text-lg font-bold text-brown capitalize bg-clip-text">
                  {formatLabel(result.face.skinTone)}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-5 rounded-2xl border border-nude/60 shadow-card"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-brown/60 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-nude"></span>
                  Skin Type
                </p>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-brown capitalize">
                    {formatLabel(result.face.skinType)}
                  </span>
                  {result.face.skinType === 'dry' && <div className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-nude/50 text-brown">Needs Care</div>}
                  {result.face.skinType === 'oily' && <div className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blush/20 text-brown">Prone to Shine</div>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white p-6 rounded-2xl border border-nude/60 shadow-card"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-brown/60 mb-4 border-b border-nude/50 pb-2">
                  Detected Concerns
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {result.face.concerns.length > 0
                    ? result.face.concerns.map((c, i) => (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                        key={c}
                        className="px-4 py-2 bg-blush/15 border border-blush/40 text-brown text-sm font-bold rounded-xl capitalize shadow-card flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blush"></span>
                        {formatLabel(c)}
                      </motion.span>
                    ))
                    : <span className="text-sm font-medium text-brown/60 italic">Healthy profile detected</span>}
                </div>
              </motion.div>
            </div>
            {result.hair && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 grid gap-4 sm:grid-cols-2"
              >
                <div className="bg-white p-5 rounded-2xl border border-nude/60 shadow-card hover:border-blush/40 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brown/60 mb-2">
                    Hair Color
                  </p>
                  <p className="text-lg font-bold text-brown capitalize flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-brown/20 inline-block shadow-sm" style={{ backgroundColor: result.hair.color.replace('_', '') === 'darkbrown' ? '#6B4F4F' : result.hair.color.includes('blonde') ? '#FFD6BA' : result.hair.color.includes('black') ? '#6B4F4F' : '#6B4F4F' }} />
                    {formatLabel(result.hair.color)}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-nude/60 shadow-card hover:border-blush/40 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brown/60 mb-2">
                    Hair Type
                  </p>
                  <p className="text-lg font-bold text-brown capitalize">
                    {formatLabel(result.hair.type)}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <p className="text-[10px] text-brown/60 uppercase tracking-wider font-semibold">
            AI Confidence: {Math.round(result.overallConfidence * 100)}%
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

